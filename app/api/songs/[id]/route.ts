import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getSongWithLibrary } from "@/lib/services/songs";
import { normalizeTags, songPatchSchema } from "@/lib/validators";

type Params = { params: { id: string } };

function isTestAdmin(req: Request) {
  return (
    process.env.NODE_ENV === "test" &&
    req.headers.get("x-test-admin") === process.env.TEST_ADMIN_TOKEN
  );
}

function canAccessLibrary(
  library: { ownerId: string; isPublic: boolean; members: { userId: string; role: string }[] },
  userId: string | null,
  requireEdit?: boolean
): boolean {
  if (library.ownerId === userId) return true;
  if (userId) {
    const member = library.members.find((m) => m.userId === userId);
    if (member) return !requireEdit || member.role === "EDITOR";
  }
  return library.isPublic && !requireEdit;
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isTestAdmin(_req) && !isAuthenticatedSession(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const songWithLib = await getSongWithLibrary(params.id);
  if (!songWithLib) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const userId = session?.user?.id ?? null;
  if (!canAccessLibrary(songWithLib.library, userId)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { library, ...song } = songWithLib;
  return NextResponse.json(song);
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isTestAdmin(req) && !isAuthenticatedSession(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const songWithLib = await getSongWithLibrary(params.id);
  if (!songWithLib) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const userId = session?.user?.id ?? null;
  if (!canAccessLibrary(songWithLib.library, userId, true)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = songPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }

  const patch = parsed.data;
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.artist !== undefined) data.artist = patch.artist ?? null;
  if (patch.key !== undefined) data.key = patch.key ?? null;
  if (patch.tempo !== undefined) data.tempo = patch.tempo ?? null;
  if (patch.timeSignature !== undefined) data.timeSignature = patch.timeSignature ?? null;
  if (patch.chordproText !== undefined) data.chordproText = patch.chordproText ?? "";
  if (patch.tags !== undefined) data.tags = normalizeTags(patch.tags ?? []);
  if (patch.audioUrl !== undefined) data.audioUrl = patch.audioUrl ?? null;
  if (patch.referenceUrl !== undefined) data.referenceUrl = patch.referenceUrl?.trim() || null;

  try {
    const updated = await prisma.song.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isTestAdmin(_req) && !isAuthenticatedSession(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const songWithLib = await getSongWithLibrary(params.id);
  if (!songWithLib) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const userId = session?.user?.id ?? null;
  if (!canAccessLibrary(songWithLib.library, userId, true)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    await prisma.song.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

