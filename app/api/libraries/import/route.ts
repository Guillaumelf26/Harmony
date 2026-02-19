import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { normalizeTags } from "@/lib/validators";
import { z } from "zod";

const backupSongSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().max(200).optional().nullable(),
  key: z.string().max(20).optional().nullable(),
  tags: z.array(z.string()).default([]),
  chordproText: z.string().default(""),
  referenceUrl: z.string().url().optional().nullable().or(z.literal("")),
});

const backupSchema = z.object({
  version: z.number().int().positive(),
  libraryName: z.string().min(1).max(100),
  exportedAt: z.string().optional(),
  songs: z.array(backupSongSchema),
});

/** Importer une bibliothèque depuis un backup JSON. */
export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }

  const { libraryName, songs } = parsed.data;
  const userId = session.user!.id!;

  const library = await prisma.library.create({
    data: {
      name: libraryName,
      ownerId: userId,
    },
  });

  if (songs.length > 0) {
    await prisma.song.createMany({
      data: songs.map((s) => ({
        libraryId: library.id,
        title: s.title,
        artist: s.artist ?? null,
        key: s.key ?? null,
        tags: normalizeTags(s.tags),
        chordproText: s.chordproText ?? "",
        referenceUrl: (s.referenceUrl && s.referenceUrl !== "" ? s.referenceUrl : null) as string | null,
      })),
    });
  }

  return NextResponse.json({ libraryId: library.id, songCount: songs.length }, { status: 201 });
}
