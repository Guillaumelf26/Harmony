import { prisma } from "@/lib/prisma";

/** Bibliothèques accessibles par l'utilisateur (propriétaire ou membre) */
export async function getLibrariesForUser(userId: string) {
  const owned = await prisma.library.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      isPublic: true,
      _count: { select: { songs: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const memberships = await prisma.libraryMember.findMany({
    where: { userId },
    include: {
      library: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          isPublic: true,
          owner: { select: { email: true } },
          _count: { select: { songs: true } },
        },
      },
    },
  });

  return {
    owned: owned.map((l) => ({ ...l, isOwner: true })),
    shared: memberships.map((m) => ({
      ...m.library,
      isOwner: false,
      role: m.role,
    })),
  };
}

export async function getLibraryById(id: string) {
  return prisma.library.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true } },
    },
  });
}

/** Vérifie si l'utilisateur peut accéder à la bibliothèque (propriétaire, membre, ou publique) */
export async function canUserAccessLibrary(
  libraryId: string,
  userId: string | null,
  options?: { requireEdit?: boolean }
): Promise<boolean> {
  const library = await prisma.library.findUnique({
    where: { id: libraryId },
    include: { members: true },
  });
  if (!library) return false;

  // Propriétaire : accès total
  if (library.ownerId === userId) return true;

  // Membre : accès selon le rôle
  if (userId) {
    const member = library.members.find((m) => m.userId === userId);
    if (member) {
      if (options?.requireEdit) return member.role === "EDITOR";
      return true;
    }
  }

  // Publique : lecture seule (pas d'édition)
  if (library.isPublic && !options?.requireEdit) return true;

  return false;
}

export async function canUserEditLibrary(libraryId: string, userId: string | null): Promise<boolean> {
  return canUserAccessLibrary(libraryId, userId, { requireEdit: true });
}
