import { listSongs } from "@/features/songs/service";
import { SongCards } from "@/features/songs/song-cards";
import { genres } from "@/domain/music/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Músicas para praticar" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; genre?: string; difficulty?: string }> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const genre = typeof params.genre === "string" ? params.genre : "";
  const difficulty = typeof params.difficulty === "string" ? params.difficulty : "";
  const songs = await listSongs(query, undefined, genre, difficulty);
  return <main id="main"><p className="eyebrow">SEU REPERTÓRIO COMEÇA AQUI</p><h1 className="page-title">Músicas para praticar</h1><p className="lead">Escolha uma música para ouvir e praticar. As faixas com tab estão identificadas no catálogo.</p>
    <form action="/search" className="search-form"><label className="sr-only" htmlFor="query">Buscar música ou artista</label><input id="query" name="q" maxLength={120} defaultValue={query} placeholder="Buscar música ou artista…" /><select aria-label="Gênero musical" name="genre" defaultValue={genre}><option value="">Todos os gêneros</option>{genres.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Dificuldade" name="difficulty" defaultValue={difficulty}><option value="">Todas as dificuldades</option><option value="BEGINNER">Iniciante</option><option value="INTERMEDIATE">Intermediário</option><option value="ADVANCED">Avançado</option></select><button className="button">Buscar</button></form>
    <p className="results-count">{songs.length} {songs.length === 1 ? "música encontrada" : "músicas encontradas"}</p>
    {songs.length ? <SongCards songs={songs} /> : <div className="empty-state"><h2>Nenhuma música encontrada.</h2><p>Tente “Billie Jean”, “Paranoid” ou “The White Stripes”.</p><a className="button" href="/search">Ver todas as músicas</a></div>}
  </main>;
}
