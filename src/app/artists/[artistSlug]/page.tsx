import { notFound } from "next/navigation";
import { listSongs } from "@/features/songs/service";
import { SongCards } from "@/features/songs/song-cards";

export const dynamic = "force-dynamic";
export default async function ArtistPage({ params }: { params: Promise<{ artistSlug: string }> }) {
  const { artistSlug } = await params;
  const songs = await listSongs("", artistSlug);
  if (!songs[0]) notFound();
  return <main id="main"><p className="eyebrow">ARTISTA</p><h1 className="page-title">{songs[0].artist.name}</h1><p className="lead">Composições originais para estudar bateria. Escolha sua próxima sessão.</p><SongCards songs={songs} /></main>;
}
