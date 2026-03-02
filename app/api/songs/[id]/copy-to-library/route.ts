import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getSongWithLibrary } from "@/lib/services/songs";
import { canUserEditLibrary } from "@/lib/services/libraries";
import { z } from "zod";

const bodySchema = z.object({
  targetLibraryId: z.string().min(1),
});

type Params = { params: Promise<{ id: string }> };

function canAccessLibrary(
  library: { ownerId: string; isPublic: boolean; members: { userId: string; role: string }[] },
  userId: string | null
): boolean {
  if (library.ownerId === userId) return true;
  if (userId) {
    const member = library.members.find((m) => m.userId === userId);
    if (member) return true;
  }
  return library.isPublic;
}

export async function POST(req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id: songId } = await params;
  const songWithLib = await getSongWithLibrary(songId);
  if (!songWithLib) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const userId = session.user?.id ?? null;
  if (!canAccessLibrary(songWithLib.library, userId)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "targetLibraryId requis" },
      { status: 400 }
    );
  }

  const { targetLibraryId } = parsed.data;
  if (targetLibraryId === songWithLib.libraryId) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Le chant est déjà dans cette bibliothèque" },
      { status: 400 }
    );
  }

  const canEditTarget = await canUserEditLibrary(targetLibraryId, userId);
  if (!canEditTarget) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { libraryId: _src, id: _id, createdAt, updatedAt, library: _lib, ...songData } = songWithLib;
  const created = await prisma.song.create({
    data: {
      libraryId: targetLibraryId,
      title: songData.title,
      artist: songData.artist,
      key: songData.key,
      tempo: songData.tempo,
      timeSignature: songData.timeSignature,
      tags: songData.tags as Prisma.InputJsonValue,
      chordproText: songData.chordproText,
      referenceUrl: songData.referenceUrl,
      audioUrl: songData.audioUrl,
    },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
