import Link from "next/link";
import { difficultyLabel, type listSongs } from "./service";



export function SongCards({ songs }: { songs: Awaited<ReturnType<typeof listSongs>> }) {
  return <div className="song-grid">{songs.map((song) => (
    <Link className="song-card" key={song.id} href={`/songs/${song.artist.slug}/${song.slug}`}>
      <div className={`song-art${song.coverImage ? " has-cover" : ""}`} style={song.coverImage ? { backgroundImage: `url("${song.coverImage}")` } : undefined} aria-hidden="true"><strong>{song.title}</strong><div className="cover-lines" /></div>
      <div className="song-card-content"><h3>{song.title}</h3><p>{song.artist.name} · {song.genre}</p><div className="badges"><span>{difficultyLabel(song.difficulty)}</span><span>{song.bpm ? `${song.bpm} BPM` : "BPM pendente"}</span><span>{song.timeSignatureNumerator}/{song.timeSignatureDenominator}</span></div><span className="song-open">{song.tabs.length ? "Abrir tab e praticar ↗" : "Ouvir música · Tab em breve ↗"}</span></div>
    </Link>
  ))}</div>;
}
