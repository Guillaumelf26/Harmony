import { prisma } from "@/lib/prisma";

export type SongForRead = {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  chordproText: string;
  audioUrl: string | null;
  referenceUrl: string | null;
};

/**
 * Récupère un chant par ID. Utilisé par l'API admin et la route live.
 * Retourne null si non trouvé.
 */
export async function getSongById(id: string) {
  return prisma.song.findUnique({ where: { id } });
}
