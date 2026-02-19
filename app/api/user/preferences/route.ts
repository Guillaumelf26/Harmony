import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export type UserPreferences = z.infer<typeof preferencesSchema>;

export async function GET() {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const prefs = (user.preferences as UserPreferences | null) ?? {};
  return NextResponse.json(prefs);
}

export async function PUT(req: Request) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = preferencesSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });
  const existing = (current?.preferences as Record<string, unknown> | null) ?? {};
  const merged = { ...existing, ...parsed.data };

  await prisma.user.update({
    where: { id: userId },
    data: { preferences: merged },
  });

  const res = NextResponse.json(merged);
  if (parsed.data.theme) {
    res.cookies.set("harmony-theme", parsed.data.theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  if (parsed.data.accentColor) {
    res.cookies.set("harmony-accent", parsed.data.accentColor, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return res;
}
