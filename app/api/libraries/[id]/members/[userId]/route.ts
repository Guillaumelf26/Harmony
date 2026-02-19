import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; userId: string }> };

/** Révoquer l'accès d'un membre (propriétaire uniquement) */
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id: libraryId, userId } = await params;

  const library = await prisma.library.findUnique({
    where: { id: libraryId },
  });
  if (!library) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (library.ownerId !== session.user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.libraryMember.deleteMany({
    where: { libraryId, userId },
  });

  return new NextResponse(null, { status: 204 });
}
