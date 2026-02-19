import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  role: z.enum(["EDITOR"]).default("EDITOR"),
  expiresInHours: z.number().min(0).max(720).optional(), // 0 = never
  maxUses: z.number().int().min(1).optional(),
});

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]!;
  }
  code += "-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return code;
}

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id: libraryId } = await params;
  const library = await prisma.library.findUnique({
    where: { id: libraryId },
  });
  if (!library) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (library.ownerId !== session.user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(json);
  const role = parsed.success ? parsed.data.role : "EDITOR";
  const expiresInHours = parsed.success ? parsed.data.expiresInHours : undefined;
  const maxUses = parsed.success ? parsed.data.maxUses : undefined;

  let code = generateCode();
  let exists = await prisma.libraryInviteCode.findUnique({ where: { code } });
  let attempts = 0;
  while (exists && attempts < 10) {
    code = generateCode();
    exists = await prisma.libraryInviteCode.findUnique({ where: { code } });
    attempts++;
  }
  if (exists) {
    return NextResponse.json({ error: "GENERATION_FAILED" }, { status: 500 });
  }

  const expiresAt = expiresInHours && expiresInHours > 0
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    : null;

  const invite = await prisma.libraryInviteCode.create({
    data: {
      libraryId,
      code,
      role,
      expiresAt,
      maxUses: maxUses ?? 1,
    },
  });

  return NextResponse.json({
    code: invite.code,
    role: invite.role,
    expiresAt: invite.expiresAt?.toISOString() ?? null,
    maxUses: invite.maxUses,
  });
}
