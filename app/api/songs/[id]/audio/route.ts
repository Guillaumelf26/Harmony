import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { canUserAccessLibrary } from "@/lib/services/libraries";

type Params = { params: { id: string } };

const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/x-wav",
  "audio/mp4",
  "video/mp4", // WhatsApp envoie parfois des mp4 audio-only
];

export async function POST(req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const song = await prisma.song.findUnique({ where: { id: params.id } });
  if (!song) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const canEdit = await canUserAccessLibrary(song.libraryId, session.user?.id ?? null, { requireEdit: true });
  if (!canEdit) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Fichier requis" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: `Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)` },
      { status: 400 }
    );
  }

  const type = file.type.toLowerCase();
  const isAllowed =
    ALLOWED_TYPES.includes(type) ||
    ["mpeg", "mp3", "wav", "ogg", "webm", "mp4"].some((ext) => type.includes(ext));
  if (!isAllowed) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Format non supporté (mp3, wav, ogg, webm, mp4)" },
      { status: 400 }
    );
  }

  try {
    const ext = file.name.split(".").pop() || "mp3";
    const pathname = `songs/${params.id}/audio.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
    });

    await prisma.song.update({
      where: { id: params.id },
      data: { audioUrl: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload audio error:", err);
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const song = await prisma.song.findUnique({ where: { id: params.id } });
  if (!song?.audioUrl) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const canEdit = await canUserAccessLibrary(song.libraryId, session.user?.id ?? null, { requireEdit: true });
  if (!canEdit) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  try {
    await del(song.audioUrl);
    await prisma.song.update({
      where: { id: params.id },
      data: { audioUrl: null },
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Delete audio error:", err);
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
}
