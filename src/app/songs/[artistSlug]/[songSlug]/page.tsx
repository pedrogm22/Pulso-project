import Link from "next/link";
import { notFound } from "next/navigation";
import { getSong, getVideoLinks, difficultyLabel } from "@/features/songs/service";
import { SongPractice } from "@/features/practice/song-practice";
import { Comments } from "@/features/comments/comments";
import { listSongComments } from "@/features/comments/service";
import { tabImagesBySong } from "@/features/songs/tab-images";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const readTabText = (publicPath: string) => readFile(join(process.cwd(), "public", publicPath), "utf8");

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ artistSlug: string; songSlug: string }> };

export async function generateMetadata({ params }: Props) {
  const { artistSlug, songSlug } = await params;
  const song = await getSong(artistSlug, songSlug);
  return { title: song ? `${song.title} — Drum Tab` : "Música não encontrada", description: song ? `Pratique ${song.title}, de ${song.artist.name}, ouvindo a faixa e acompanhando as tabs disponíveis.` : undefined };
}

export default async function SongPage({ params }: Props) {
  const { artistSlug, songSlug } = await params;
  const song = await getSong(artistSlug, songSlug);
  if (!song) notFound();
  const videos = getVideoLinks(artistSlug, songSlug);
  const officialVideoUrl = videos.com ? `https://www.youtube.com/watch?v=${videos.com}` : undefined;
  const drumlessVideoUrl = videos.sem ? `https://www.youtube.com/watch?v=${videos.sem}` : undefined;
  const tabImage = tabImagesBySong[`${artistSlug}/${songSlug}`];
  if (!song.document) return (
    <main id="main" className="song-page">
      <Link href="/search" className="back-link">← Todas as músicas</Link>
      <p className="eyebrow">{tabImage ? "TABULATURA DISPONÍVEL" : "ÁUDIO DISPONÍVEL"}</p>
      <h1 className="page-title">{song.title}</h1>
      <p className="artist">{song.artist.name}</p>
      {officialVideoUrl ? <p><a className="artist-link" href={officialVideoUrl} target="_blank" rel="noopener noreferrer">Assistir no YouTube ↗</a></p> : null}
      <p className="lead">Ouça a música e toque junto.{tabImage ? "" : " A tab desta faixa ainda não está disponível."}</p>
      <SongPractice songKey={`${artistSlug}/${songSlug}`} artistSlug={artistSlug} songSlug={songSlug} title={song.title} artist={song.artist.name} withDrumsUrl={officialVideoUrl} withoutDrumsUrl={drumlessVideoUrl} document={undefined} lyrics={song.lyrics} />
      {tabImage ? (
        <section aria-label={`Tabulatura de ${song.title}`} style={{ marginTop: "2rem" }}>
          <h2>Tabulatura</h2>
          {tabImage.endsWith(".txt") ? (
            <pre style={{ overflowX: "auto", padding: "1rem", background: "#111", color: "#f2f2f2", borderRadius: 8, fontFamily: "ui-monospace, Consolas, monospace", fontSize: 14, lineHeight: 1.35 }}>{await readTabText(tabImage)}</pre>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tabImage} alt={`Tabulatura de bateria de ${song.title}, ${song.artist.name}`} style={{ width: "100%", maxWidth: 1100, height: "auto", background: "#fff", borderRadius: 8 }} />
          )}
        </section>
      ) : null}
    </main>
  );
  const measureCount = song.document.sections.flatMap((section: { measures: Array<{ id: string }> }) => section.measures).length;
  const comments = await listSongComments(song.id);

  return (
    <main id="main" className="song-page">
      <Link href="/search" className="back-link">← Todas as músicas</Link>
      <div className="song-showcase">
        <div className="song-cover-art" style={song.coverImage ? { backgroundImage: `url("${song.coverImage}")` } : undefined} aria-label={`Capa do álbum de ${song.title}`} />
        <div className="song-showcase-copy">
          <div className="song-header">
            <div>
              <p className="eyebrow">TAB V{song.tabs[0]!.version}</p>
              <h1 className="page-title">{song.title}</h1>
              <Link className="artist-link" href={`/artists/${song.artist.slug}`}>{song.artist.name} ↗</Link>
            </div>
            <div className="badges"><span>{difficultyLabel(song.difficulty)}</span><span>{song.bpm ? `${song.bpm} BPM` : "BPM pendente"}</span><span>{song.timeSignatureNumerator}/{song.timeSignatureDenominator}</span><span>{measureCount} compassos</span></div>
          </div>
          {officialVideoUrl ? <p><a className="artist-link" href={officialVideoUrl} target="_blank" rel="noopener noreferrer">Assistir no YouTube ↗</a></p> : null}
        </div>
      </div>
      <SongPractice songKey={`${artistSlug}/${songSlug}`} artistSlug={artistSlug} songSlug={songSlug} title={song.title} artist={song.artist.name} withDrumsUrl={officialVideoUrl} withoutDrumsUrl={drumlessVideoUrl} document={song.document} lyrics={song.lyrics} standardNotation={song.tabs[0]?.notationType === "STANDARD"} />
      <Comments songId={song.id} comments={comments} />
    </main>
  );
}
