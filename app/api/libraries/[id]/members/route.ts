import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { isAuthenticatedSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** Liste des membres d'une bibliothèque (propriétaire uniquement) */
export async function GET(_req: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!isAuthenticatedSession(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id: libraryId } = await params;
  const library = await prisma.library.findUnique({
    where: { id: libraryId },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
    },
  });

  if (!library) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (library.ownerId !== session.user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const members = library.members.map((m) => ({
    userId: m.userId,
    email: m.user.email,
    role: m.role,
    joinedAt: m.createdAt,
  }));

  return NextResponse.json({ members });
}
