import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ songId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }

  const { songId } = parsed.data;

  const existing = await prisma.userFavorite.findUnique({
    where: { userId_songId: { userId, songId } },
  });

  if (existing) {
    await prisma.userFavorite.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ favorited: false });
  } else {
    await prisma.userFavorite.create({
      data: { userId, songId },
    });
    return NextResponse.json({ favorited: true });
  }
}
