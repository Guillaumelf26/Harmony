import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const joinSchema = z.object({
  code: z.string().min(1).max(20),
});

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = joinSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }

  const code = parsed.data.code.trim().toUpperCase().replace(/\s/g, "");

  const invite = await prisma.libraryInviteCode.findUnique({
    where: { code },
    include: { library: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "INVALID_CODE", message: "Code invalide ou expiré." }, { status: 404 });
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "EXPIRED", message: "Ce code a expiré." }, { status: 410 });
  }

  if (invite.maxUses != null && invite.useCount >= invite.maxUses) {
    return NextResponse.json({ error: "MAX_USES", message: "Ce code a atteint sa limite d'utilisation." }, { status: 410 });
  }

  const userId = session.user.id!;
  if (invite.library.ownerId === userId) {
    return NextResponse.json({ error: "ALREADY_OWNER", message: "Vous êtes déjà propriétaire de cette bibliothèque." }, { status: 400 });
  }

  const existing = await prisma.libraryMember.findUnique({
    where: { libraryId_userId: { libraryId: invite.libraryId, userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "ALREADY_MEMBER", message: "Vous avez déjà accès à cette bibliothèque." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.libraryMember.create({
      data: {
        libraryId: invite.libraryId,
        userId,
        role: invite.role,
      },
    }),
    prisma.libraryInviteCode.update({
      where: { id: invite.id },
      data: { useCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({
    libraryId: invite.libraryId,
    name: invite.library.name,
    role: invite.role,
  });
}
