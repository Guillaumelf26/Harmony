import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
});

export async function PUT(req: Request) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(json);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    const message = firstError?.message ?? "Données invalides";
    return NextResponse.json({ error: "BAD_REQUEST", message }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "INVALID_PASSWORD", message: "Mot de passe actuel incorrect" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return NextResponse.json({ success: true });
}
