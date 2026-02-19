import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { getLibrariesForUser } from "@/lib/services/libraries";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const userId = session.user.id!;
  const { owned, shared } = await getLibrariesForUser(userId);

  return NextResponse.json({
    owned,
    shared,
  });
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }

  const { prisma } = await import("@/lib/prisma");
  const library = await prisma.library.create({
    data: {
      name: parsed.data.name,
      ownerId: session.user.id!,
    },
  });

  return NextResponse.json(library, { status: 201 });
}
