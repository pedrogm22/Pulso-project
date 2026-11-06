import { listSongs } from "@/features/songs/service";
import Link from "next/link";
import { SongCards } from "@/features/songs/song-cards";
import { TopMessage } from "@/components/top-message";
import { formatGenreLabel } from "@/domain/music/content";
import { getDailyTopSongs } from "@/features/songs/daily-plays";

export const dynamic = "force-dynamic";

const steps = [
  { number: "01", title: "Encontre seu som", description: "Um catálogo pensado para bateristas, com dificuldade, BPM e versões da tab." },
  { number: "02", title: "Entenda cada compasso", description: "Áudio e notação na mesma timeline. Um guia claro para saber onde você está." },
  { number: "03", title: "Pratique no seu tempo", description: "Velocidade, repetição e metrônomo para transformar um trecho difícil em confiança." },
];

export default async function Home() {
  const [songs, dailyTopSongs] = await Promise.all([listSongs(), getDailyTopSongs()]);
  const songsByGenre = new Map<string, typeof songs>();
  for (const song of songs) {
    const genreName = formatGenreLabel(song.genre);
    const genreSongs = songsByGenre.get(genreName) ?? [];
    genreSongs.push(song);
    songsByGenre.set(genreName, genreSongs);
  }

  const orderedGenres = Array.from(songsByGenre.entries()).sort(([left], [right]) => {
    if (left === "Outras") return 1;
    if (right === "Outras") return -1;
    return left.localeCompare(right);
  });

  return (
    <main id="main">
      <TopMessage />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">MENOS DISTRAÇÃO. MAIS GROOVE.</p>
          <h1 id="hero-title">De Baterista<br /><em>Para Baterista</em></h1>
          <p className="lead">Escolha uma música, abra a tab e toque junto. Encontre o seu ritmo com as músicas do catálogo.</p>
          <p className="lead">A bateria é para todo mundo. O pulso te mostra o caminho.</p>
          <Link className="button" href="/search">Escolher uma música <span aria-hidden="true">↗</span></Link>
          <p className="small-note">Áudio para tocar junto · Tabs nas faixas disponíveis</p>
        </div>
        <div className="rhythm-art" role="img" aria-label="Ilustração abstrata de um prato de bateria com ondas concêntricas">
          <div className="art-top"><span>PULSO STUDIO</span><span>EST. 2026</span></div>
          <div className="cymbal"><div className="cymbal-center" /></div>
          <div className="drumstick stick-one" /><div className="drumstick stick-two" />
          <div className="art-bottom"><span>ENCONTRE<br />SEU RITMO.</span><span className="art-tempo">100 <small>BPM</small></span></div>
        </div>
      </section>
      <section className="project-section daily-top-section" aria-labelledby="daily-top-title">
        <div className="section-heading"><div><p className="eyebrow">ATUALIZADO DIARIAMENTE</p><h2 id="daily-top-title">Top 10 músicas mais tocadas hoje</h2></div><span className="muted">Reproduções iniciadas hoje (UTC)</span></div>
        {dailyTopSongs.length ? <div className="song-grid">{dailyTopSongs.map(({ song, plays }, index) => (
          <Link className="song-card" key={song.id} href={`/songs/${song.artist.slug}/${song.slug}`}>
            <div className={`song-art${song.coverImage ? " has-cover" : ""}`} style={song.coverImage ? { backgroundImage: `url("${song.coverImage}")` } : undefined} aria-hidden="true"><span>#{index + 1} · {plays} {plays === 1 ? "reprodução" : "reproduções"}</span><strong>{song.title}</strong><div className="cover-lines" /></div>
            <div className="song-card-content"><h3>{song.title}</h3><p>{song.artist.name} · {song.genre}</p><div className="badges"><span>{song.difficulty === "INTERMEDIATE" ? "Intermediário" : song.difficulty === "ADVANCED" ? "Avançado" : "Iniciante"}</span><span>{song.bpm ? `${song.bpm} BPM` : "BPM pendente"}</span><span>{song.timeSignatureNumerator}/{song.timeSignatureDenominator}</span></div><span className="song-open">{song.tabs.length ? "Abrir tab e praticar ↗" : "Ouvir música · Tab em breve ↗"}</span></div>
          </Link>
        ))}</div> : <p className="small-note">As reproduções de hoje vão aparecer aqui assim que as músicas começarem a tocar.</p>}
      </section>
      <section id="musicas" className="project-section"><div className="section-heading"><div><p className="eyebrow">APERTE O PLAY. ENCONTRE SEU GROOVE.</p><h2>Músicas para começar</h2></div><Link href="/search" className="catalog-link">Explorar catálogo ↗</Link></div>{orderedGenres.map(([genre, genreSongs]) => <section className="genre-shelf" key={genre} aria-labelledby={`genre-${genre}`}><div className="genre-shelf-heading"><h3 id={`genre-${genre}`}>{genre}</h3><Link className="catalog-link" href={`/search?genre=${encodeURIComponent(genre)}`}>Ver {genre} ↗</Link></div><SongCards songs={genreSongs} /></section>)}</section>
      <section id="projeto" className="project-section" aria-labelledby="project-title">
        <div className="section-heading"><div><p className="eyebrow">DA PRIMEIRA BATIDA AO ÚLTIMO COMPASSO</p><h2 id="project-title">Prática com direção.</h2></div><span className="muted">A experiência que estamos construindo</span></div>
        <div className="steps">{steps.map((step) => <article key={step.number}><span className="step-number">{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
      </section>
    </main>
  );
}
