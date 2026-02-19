import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { canUserAccessLibrary } from "@/lib/services/libraries";
import { prisma } from "@/lib/prisma";
import { tagsFromUnknown } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

/** Export complet d'une bibliothèque pour backup (chants + métadonnées, sans audio). */
export async function GET(_req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id: libraryId } = await params;

  const library = await prisma.library.findUnique({ where: { id: libraryId } });
  if (!library) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const canAccess = await canUserAccessLibrary(libraryId, session.user?.id ?? null);
  if (!canAccess) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const songs = await prisma.song.findMany({
    where: { libraryId },
    orderBy: { title: "asc" },
    select: {
      title: true,
      artist: true,
      key: true,
      tags: true,
      chordproText: true,
      referenceUrl: true,
    },
  });

  const backup = {
    version: 1,
    libraryName: library.name,
    exportedAt: new Date().toISOString(),
    songs: songs.map((s) => ({
      title: s.title,
      artist: s.artist ?? null,
      key: s.key ?? null,
      tags: tagsFromUnknown(s.tags),
      chordproText: s.chordproText ?? "",
      referenceUrl: s.referenceUrl ?? null,
    })),
  };

  return NextResponse.json(backup);
}
