import { notFound } from "next/navigation";
import { getSongWithLibrary } from "@/lib/services/songs";
import { getServerAuthSession } from "@/lib/auth";
import { LiveView } from "@/components/live/LiveView";

function canAccess(library: { ownerId: string; isPublic: boolean; members: { userId: string }[] }, userId: string | null): boolean {
  if (library.ownerId === userId) return true;
  if (userId && library.members.some((m) => m.userId === userId)) return true;
  return library.isPublic;
}

type Props = { params: Promise<{ songId: string }> };

export default async function LiveSongPage({ params }: Props) {
  const { songId } = await params;
  const songWithLib = await getSongWithLibrary(songId);
  if (!songWithLib) notFound();

  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? null;
  if (!canAccess(songWithLib.library, userId)) notFound();

  const { library, ...song } = songWithLib;

  return (
    <LiveView
      songId={songId}
      chordproText={song.chordproText}
      title={song.title}
      artist={song.artist}
      keyDisplay={song.key}
      audioUrl={song.audioUrl}
      referenceUrl={song.referenceUrl}
    />
  );
}
