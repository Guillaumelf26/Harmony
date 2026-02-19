import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { canUserAccessLibrary } from "@/lib/services/libraries";
import { normalizeTags, songUpsertSchema, tagsFromUnknown } from "@/lib/validators";

function getTags(value: unknown): string[] {
  return tagsFromUnknown(value).map((s) => s.toLowerCase());
}

function isTestAdmin(req: Request) {
  return (
    process.env.NODE_ENV === "test" &&
    req.headers.get("x-test-admin") === process.env.TEST_ADMIN_TOKEN
  );
}

export async function GET(req: Request) {
  const session = await getServerAuthSession();
  if (!isTestAdmin(req) && !isAuthenticatedSession(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  let libraryId = searchParams.get("libraryId")?.trim();
  if (!libraryId && isTestAdmin(req)) {
    const first = await prisma.library.findFirst({ select: { id: true } });
    libraryId = first?.id ?? undefined;
  }
  if (!libraryId) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "libraryId requis" }, { status: 400 });
  }

  const userId = session?.user?.id ?? null;
  const canAccess = isTestAdmin(req) || (await canUserAccessLibrary(libraryId, userId));
  if (!canAccess) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const query = (searchParams.get("query") ?? "").trim();
  const tag = (searchParams.get("tag") ?? "").trim().toLowerCase();
  const artist = (searchParams.get("artist") ?? "").trim();
  const sortBy = (searchParams.get("sortBy") ?? "updatedAt") as "title" | "artist" | "updatedAt";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

  const orderBy: Prisma.SongOrderByWithRelationInput =
    sortBy === "title"
      ? { title: sortOrder }
      : sortBy === "artist"
        ? { artist: sortOrder }
        : { updatedAt: sortOrder };

  let items = await prisma.song.findMany({
    where: { libraryId },
    orderBy,
    select: {
      id: true,
      title: true,
      artist: true,
      updatedAt: true,
      createdAt: true,
      tags: true,
    },
    take: 500,
  });

  if (query) {
    const q = query.toLowerCase();
    items = items.filter((s) => {
      const title = s.title.toLowerCase();
      const art = (s.artist ?? "").toLowerCase();
      const tags = getTags(s.tags);
      return title.includes(q) || art.includes(q) || tags.some((t) => t.includes(q));
    });
  }

  if (artist) {
    const a = artist.toLowerCase();
    items = items.filter((s) => (s.artist ?? "").toLowerCase().includes(a));
  }

  if (tag) {
    items = items.filter((s) => {
      return getTags(s.tags).includes(tag);
    });
  }

  return NextResponse.json({
    items: items.map((s) => ({
      ...s,
      tags: getTags(s.tags),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!isTestAdmin(req) && !isAuthenticatedSession(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = songUpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  let libraryId = data.libraryId?.trim();
  if (!libraryId && isTestAdmin(req)) {
    const first = await prisma.library.findFirst({ select: { id: true } });
    libraryId = first?.id ?? undefined;
  }
  if (!libraryId) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "libraryId requis" }, { status: 400 });
  }

  const userId = session?.user?.id ?? null;
  const canEdit = isTestAdmin(req) || (await canUserAccessLibrary(libraryId, userId, { requireEdit: true }));
  if (!canEdit) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const tags = normalizeTags(data.tags ?? []);

  const created = await prisma.song.create({
    data: {
      libraryId,
      title: data.title,
      artist: data.artist ?? null,
      key: data.key ?? null,
      tempo: data.tempo ?? null,
      timeSignature: data.timeSignature ?? null,
      tags,
      chordproText: data.chordproText ?? "",
      audioUrl: data.audioUrl ?? null,
      referenceUrl: data.referenceUrl?.trim() || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

