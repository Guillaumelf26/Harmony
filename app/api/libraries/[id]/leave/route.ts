import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** Quitter une bibliothèque partagée (membre uniquement, pas le propriétaire). */
export async function POST(_req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id: libraryId } = await params;
  const userId = session.user.id!;

  const library = await prisma.library.findUnique({ where: { id: libraryId } });
  if (!library) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (library.ownerId === userId) {
    return NextResponse.json({ error: "FORBIDDEN", message: "Le propriétaire ne peut pas quitter sa bibliothèque" }, { status: 403 });
  }

  await prisma.libraryMember.deleteMany({
    where: { libraryId, userId },
  });

  return new NextResponse(null, { status: 204 });
}
