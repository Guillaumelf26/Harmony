import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** Supprimer une bibliothèque (propriétaire uniquement). Supprime aussi les chants, membres et codes d'invitation. */
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;

  const library = await prisma.library.findUnique({ where: { id } });
  if (!library) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Seul le propriétaire peut supprimer
  if (library.ownerId !== session.user?.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.library.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
