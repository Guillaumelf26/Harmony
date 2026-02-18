import { notFound } from "next/navigation";
import { getSongById } from "@/lib/services/songs";
import { LiveView } from "@/components/live/LiveView";

type Props = { params: Promise<{ songId: string }> };

export default async function LiveSongPage({ params }: Props) {
  const { songId } = await params;
  const song = await getSongById(songId);
  if (!song) notFound();

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
