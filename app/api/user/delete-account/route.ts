import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Mot de passe requis pour confirmer"),
  confirmation: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .refine((s) => s === "SUPPRIMER", { message: "Veuillez taper SUPPRIMER pour confirmer" }),
});

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: "BAD_REQUEST", message: msg }, { status: 400 });
  }

  const { password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "INVALID_PASSWORD", message: "Mot de passe incorrect" }, { status: 400 });
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return NextResponse.json({ success: true });
}
