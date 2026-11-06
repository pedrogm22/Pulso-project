"use client";

import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Measure, TabDocument } from "@/domain/music/document";
import { createTimeline, eventSymbol } from "@/domain/music/timeline";
import { AudioEngine } from "@/lib/audio/audio-engine";
import { Metronome } from "@/lib/audio/metronome";

import { StaffMeasure } from "./staff-measure";
import { clearScoreHighlight, followScore } from "./score-follow";

type YouTubePlayer = {
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlaybackRate(): number;
  pauseVideo(): void;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setPlaybackRate(rate: number): void;
};

type YouTubeStateEvent = { data: number };
type YouTubePlayerEvent = { target: YouTubePlayer };
type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      height: string;
      width: string;
      videoId: string;
      playerVars: { enablejsapi: number; origin: string; playsinline: number; rel: number };
      events: {
        onReady: (event: YouTubePlayerEvent) => void;
        onStateChange: (event: YouTubeStateEvent) => void;
        onError: (event: YouTubeStateEvent) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (window.YT) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<void>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) resolve();
      else reject(new Error("A API do YouTube não foi inicializada."));
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Não foi possível carregar a API do YouTube."));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    youtubeApiPromise = null;
    throw error;
  });

  return youtubeApiPromise;
}

function getYouTubeVideoId(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host !== "youtube.com" && host !== "m.youtube.com") return null;
    const id = url.searchParams.get("v") ?? url.pathname.match(/^\/embed\/([\w-]{11})$/)?.[1];
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const instruments = [
  ["CRASH", "Cr", "Crash"], ["RIDE", "Ri", "Ride"],
  ["CHINA", "Cn", "China"], ["SPLASH", "Sp", "Splash"],
  ["HI_HAT", "Ch", "Chimbal"], ["OPEN_HI_HAT", "Ca", "Chimbal aberto"],
  ["FOOT_HI_HAT", "Cp", "Pedal do chimbal"], ["SNARE", "Cx", "Caixa"], ["TOM_HIGH", "T1", "Tom agudo"],
  ["TOM_MID", "T2", "Tom médio"], ["FLOOR_TOM", "Su", "Surdo"], ["KICK", "Bu", "Bumbo"],
] as const;

type LyricLine = { id: string; startTime: number; endTime: number; text: string; translation: string };

export function TrackedYouTubePlayer({ videoId, title, onPlaybackStart }: { videoId: string; title: string; onPlaybackStart: () => void }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let disposed = false;
    let readyPlayer: YouTubePlayer | null = null;
    void loadYouTubeApi().then(() => {
      const api = window.YT;
      const element = elementRef.current;
      if (disposed || !api || !element) return;
      new api.Player(element, {
        height: "315",
        width: "560",
        videoId,
        playerVars: { enablejsapi: 1, origin: window.location.origin, playsinline: 1, rel: 0 },
        events: {
          onReady: ({ target }) => {
            const iframe = elementRef.current?.querySelector("iframe");
            if (iframe) iframe.title = title;
            if (disposed) target.destroy();
            else readyPlayer = target;
          },
          onStateChange: ({ data }) => {
            if (!disposed && data === api.PlayerState.PLAYING) onPlaybackStart();
          },
          onError: () => {
            if (!disposed) setUseFallback(true);
          },
        },
      });
    }).catch(() => {
      if (!disposed) setUseFallback(true);
    });
    return () => {
      disposed = true;
      readyPlayer?.destroy();
    };
  }, [onPlaybackStart, title, videoId]);

  return <div className="youtube-practice-player">{useFallback ? (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      referrerPolicy="origin"
      allowFullScreen
    />
  ) : <div ref={elementRef} />}</div>;
}

/** Heuristic label for section styling — derived from the section name, not stored separately. */
function sectionKind(name: string): "intro" | "chorus" | "solo" | "interlude" | "outro" | "verse" {
  const lower = name.toLowerCase();
  if (lower.includes("solo")) return "solo";
  if (lower.includes("interl")) return "interlude";
  if (lower.includes("refrão") || lower.includes("refrao") || lower.includes("chorus")) return "chorus";
  if (lower.includes("final")) return "outro";
  if (lower.includes("intro")) return "intro";
  return "verse";
}

const MeasureCard = memo(function MeasureCard({ measure, active, onSeek, sourceNotation, standardNotation }: { measure: Measure; active: boolean; onSeek: (time: number) => void; sourceNotation: boolean; standardNotation: boolean }) {
  return <button type="button" id={`measure-${measure.globalOrder}`} className={`measure-card ${active ? "is-active" : ""}`} onClick={() => onSeek(measure.startTime)} aria-label={`Ir ao compasso ${measure.globalOrder}`} aria-current={active ? "step" : undefined}>
    <span className="measure-heading"><span>Compasso {measure.globalOrder}</span><span>{active ? "▶ Atual" : `${measure.numerator}/${measure.denominator}`}</span></span>
    {standardNotation ? <StaffMeasure measure={measure} /> : <span className="notation" style={{ "--slots": measure.numerator * 4 } as CSSProperties}><span className="notation-row count-row"><span />{Array.from({ length: measure.numerator * 4 }, (_, index) => <span key={index}>{index % 4 === 0 ? index / 4 + 1 : ["", "e", "&", "a"][index % 4]}</span>)}</span>
      {instruments.filter(([instrument]) => (sourceNotation ? ["CRASH", "RIDE", "HI_HAT", "SNARE", "TOM_HIGH", "TOM_MID", "FLOOR_TOM", "KICK"] : ["HI_HAT", "SNARE", "KICK"]).includes(instrument) || measure.events.some((event) => event.instrument === instrument)).map(([instrument, label, name]) => <span className={`notation-row row-${instrument.toLowerCase()}`} key={instrument}><abbr title={name}>{label}</abbr>{Array.from({ length: measure.numerator * 4 }, (_, slot) => <span key={slot} className={slot % 4 === 0 ? "beat-start" : ""}>{sourceNotation ? eventSymbol(measure, instrument, slot).replace("·", "-") : eventSymbol(measure, instrument, slot)}</span>)}</span>)}
      <span className="measure-playhead" aria-hidden="true" />
    </span>}
  </button>;
});

export function PracticePlayer({ document, audioUrl, youtubeUrl, lyrics = [], standardNotation = false, onPlaybackStart }: { document: TabDocument; audioUrl?: string; youtubeUrl?: string; lyrics?: LyricLine[]; standardNotation?: boolean; onPlaybackStart?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeElementRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const engineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<Metronome | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const youtubeVideoId = youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null;
  const [youtubeIframeFallback, setYoutubeIframeFallback] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState(1);
  const [activeSectionId, setActiveSectionId] = useState(document.sections[0]?.id ?? "");
  const [activeLyricId, setActiveLyricId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [readySource, setReadySource] = useState<string | null>(!youtubeUrl ? audioUrl ?? null : null);
  const activeAudioUrl = youtubeUrl ?? audioUrl;
  const playerReady = Boolean(activeAudioUrl) && readySource === activeAudioUrl && !youtubeIframeFallback;
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState(youtubeUrl ? youtubeVideoId ? "Preparando player do YouTube…" : "O link do YouTube desta música é inválido." : "Preparando áudio…");
  const [failed, setFailed] = useState(Boolean(youtubeUrl && !youtubeVideoId));
  const [follow, setFollow] = useState(true);
  const [metronome, setMetronome] = useState(false);
  const timeline = useMemo(() => createTimeline(document), [document]);
  const seek = useMemo(() => (time: number) => {
    engineRef.current?.seek(time);
    metronomeRef.current?.resync();
  }, []);
  const totalMeasures = useMemo(() => document.sections.flatMap((section) => section.measures).length, [document]);
  const sourceNotation = useMemo(() => document.sections.some((section) => section.measures.some((measure) => measure.events.some((event) => event.sourceSymbol))), [document]);
  const activeLyric = lyrics.find((line) => line.id === activeLyricId);
  const setPlaybackState = useMemo(() => (isPlaying: boolean) => {
    setPlaying(isPlaying);
    metronomeRef.current?.setPlaying(isPlaying);
    if (isPlaying) {
      onPlaybackStart?.();
      setFailed(false);
      setStatus("Tocando");
    } else {
      setStatus("Pausado");
    }
  }, [onPlaybackStart]);

  useEffect(() => {
    let disposed = false;
    let click: Metronome | null = null;
    if (youtubeUrl && youtubeVideoId) {
      void loadYouTubeApi().then(() => {
        const api = window.YT;
        const container = youtubeElementRef.current;
        if (disposed || !container || !api) return;
        const host = window.document.createElement("div");
        container.replaceChildren(host);
        new api.Player(host, {
          height: "315",
          width: "640",
          videoId: youtubeVideoId,
          playerVars: { enablejsapi: 1, origin: window.location.origin, playsinline: 1, rel: 0 },
          events: {
            onReady: ({ target }) => {
              if (disposed) {
                target.destroy();
                return;
              }
              youtubePlayerRef.current = target;
              const media = {
                play: () => target.playVideo(),
                pause: () => target.pauseVideo(),
                get currentTime() { return target.getCurrentTime(); },
                set currentTime(time: number) { target.seekTo(time, true); },
                get duration() { return target.getDuration(); },
                get playbackRate() { return target.getPlaybackRate(); },
                set playbackRate(rate: number) { target.setPlaybackRate(rate); },
              };
              engineRef.current = new AudioEngine(media);
              click = new Metronome(media, document);
              metronomeRef.current = click;
              setReadySource(youtubeUrl);
              setFailed(false);
              setStatus("Player pronto");
              const iframe = youtubeElementRef.current?.querySelector("iframe");
              if (iframe) {
                iframe.title = "Player de música com tab sincronizada";
                iframe.referrerPolicy = "origin";
              }
            },
            onStateChange: ({ data }) => {
              if (disposed) return;
              if (data === api.PlayerState.PLAYING) setPlaybackState(true);
              else if (data === api.PlayerState.PAUSED) setPlaybackState(false);
              else if (data === api.PlayerState.ENDED) {
                setPlaybackState(false);
                setStatus("Música concluída. Toque novamente quando quiser.");
              }
            },
            onError: ({ data }) => {
              if (disposed) return;
              setPlaying(false);
              metronomeRef.current?.setPlaying(false);
              setFailed(true);
              setYoutubeIframeFallback(true);
              setStatus(`O player sincronizado não iniciou (erro ${data}). Use os controles do vídeo abaixo para reproduzir.`);
            },
          },
        });
      }).catch(() => {
        if (!disposed) {
          setFailed(true);
          setStatus("Não foi possível carregar o player do YouTube. Verifique sua conexão ou abra o vídeo diretamente no YouTube.");
        }
      });
    } else if (!youtubeUrl && audioRef.current) {
      const media = audioRef.current;
      engineRef.current = new AudioEngine(media);
      click = new Metronome(media, document);
      metronomeRef.current = click;
    }

    let frame = 0;
    let previousMeasure = -1;
    let previousElement: HTMLElement | null | undefined;
    const update = () => {
      const time = engineRef.current?.getCurrentTime() ?? 0;
      const state = timeline(time);
      if (state) {
        if (state.measure.globalOrder !== previousMeasure) {
          clearScoreHighlight(previousElement);
          previousMeasure = state.measure.globalOrder;
          setActiveMeasure(previousMeasure);
          setActiveSectionId(state.section.id);
        }
        const element = viewerRef.current?.querySelector<HTMLElement>(`#measure-${state.measure.globalOrder}`);
        element?.style.setProperty("--progress", String(state.progress));
        if (standardNotation && element) followScore(element, state.measure, time);
        previousElement = element;
      }
      if (!state) clearScoreHighlight(previousElement);
      const lyric = lyrics.find((line) => time >= line.startTime && time < line.endTime);
      setActiveLyricId(lyric?.id ?? null);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      click?.dispose();
      engineRef.current?.pause();
      setPlaying(false);
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
      engineRef.current = null;
      metronomeRef.current = null;
    };
  }, [audioUrl, document, lyrics, onPlaybackStart, setPlaybackState, standardNotation, timeline, youtubeUrl, youtubeVideoId]);

  useEffect(() => {
    if (!follow || !playing) return;
    const element = viewerRef.current?.querySelector(`#measure-${activeMeasure}`);
    const bounds = element?.getBoundingClientRect();
    const top = (controlsRef.current?.getBoundingClientRect().bottom ?? 160) + 20;
    if (bounds && (bounds.top < top || bounds.bottom > window.innerHeight - 40)) window.scrollBy({ top: bounds.top - top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [activeMeasure, follow, playing]);

  useEffect(() => {
    const stopFollow = () => setFollow(false);
    window.addEventListener("wheel", stopFollow, { passive: true });
    window.addEventListener("touchmove", stopFollow, { passive: true });
    return () => { window.removeEventListener("wheel", stopFollow); window.removeEventListener("touchmove", stopFollow); };
  }, []);

  async function togglePlayback() {
    if (playing) engineRef.current?.pause();
    else {
      try {
        await engineRef.current?.play();
      }
      catch {
        setFailed(true);
        setStatus(youtubeUrl
          ? "Não foi possível iniciar o vídeo incorporado. Abra o vídeo no YouTube ou confira as permissões de reprodução."
          : "Não foi possível iniciar a reprodução. Tente novamente.");
      }
    }
  }

  function skipPlayback(seconds: number) {
    const currentTime = engineRef.current?.getCurrentTime();
    if (currentTime !== undefined) seek(currentTime + seconds);
  }

  async function toggleMetronome() {
    const enabled = !metronome;
    try {
      metronomeRef.current?.setSound("click");
      await metronomeRef.current?.setEnabled(enabled);
      setMetronome(enabled);
    } catch {
      setMetronome(false);
      setFailed(true);
      setStatus("Não foi possível iniciar o metrônomo neste navegador.");
    }
  }

  function goToSection(sectionId: string) {
    const section = document.sections.find((item) => item.id === sectionId);
    if (!section) return;
    seek(section.startTime);
    window.document.getElementById(section.id)?.scrollIntoView({ block: "start" });
  }

  return <div className="practice-workspace">
    <div className="practice-controls" ref={controlsRef}>
      <div className="playback-actions"><button className="button" type="button" onClick={togglePlayback} disabled={!playerReady}>{playing ? "❚❚ Pausar" : "▶ Tocar música"}</button>
        <button type="button" className="secondary-button" onClick={() => skipPlayback(-10)} disabled={!playerReady} aria-label="Voltar 10 segundos">⏪ −10s</button>
        <button type="button" className="secondary-button" onClick={() => skipPlayback(10)} disabled={!playerReady} aria-label="Avançar 10 segundos">⏩ +10s</button>
        <label>Velocidade<select aria-label="Velocidade" value={rate} onChange={(event) => { const value = Number(event.target.value); setRate(value); engineRef.current?.setPlaybackRate(value); metronomeRef.current?.resync(); }} disabled={!playerReady}>{(youtubeUrl ? [0.5, 0.75, 1] : [0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1]).map((value) => <option value={value} key={value}>{Math.round(value * 100)}%</option>)}</select></label>
        <button type="button" className="secondary-button" aria-pressed={metronome} disabled={!playerReady} onClick={toggleMetronome}>{metronome ? "Metrônomo ligado" : "Ligar metrônomo"}</button>
        <button type="button" className="secondary-button" aria-pressed={follow} onClick={() => setFollow(!follow)}>{follow ? "Acompanhamento ativo" : "Retomar acompanhamento"}</button>
      </div>
      {youtubeUrl ? youtubeVideoId ? <div className="youtube-practice-player">{youtubeIframeFallback ? <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?playsinline=1&rel=0`} title="Player alternativo do YouTube" referrerPolicy="origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <div ref={youtubeElementRef} />}</div> : <p className="audio-error" role="status">O link do YouTube desta música é inválido.</p> : audioUrl ? <audio ref={audioRef} src={audioUrl} controls preload="metadata" aria-label="Áudio da música" onPlay={() => { setPlaybackState(true); }} onPause={() => { setPlaybackState(false); }} onSeeked={() => metronomeRef.current?.resync()} onEnded={() => { setPlaybackState(false); setStatus("Sessão concluída. Toque novamente quando quiser."); }} onCanPlay={() => { setReadySource(audioUrl); setFailed(false); setStatus("Áudio pronto"); }} onWaiting={() => setStatus("Carregando áudio…")} onError={() => { setPlaybackState(false); setFailed(true); setStatus("Áudio indisponível. Recarregue a página para tentar novamente."); }} /> : <p>Áudio ainda indisponível para esta música. Você pode estudar a tab abaixo.</p>}
      {youtubeUrl ? <a className="youtube-fallback-link" href={youtubeUrl} target="_blank" rel="noopener noreferrer">Problemas para reproduzir? Abrir no YouTube ↗</a> : null}
      {youtubeUrl && !youtubeVideoId ? null : <p className={failed ? "audio-error" : "player-status"} role="status">{status}</p>}
      {activeLyric ? <p className="lyric-caption"><span>{activeLyric.text}</span><span className="lyric-translation">{activeLyric.translation}</span></p> : null}
    </div>

    <nav className="song-map" aria-label="Mapa da música">{document.sections.map((section) => {
      const share = section.measures.length / totalMeasures;
      const kind = sectionKind(section.name);
      return <button type="button" key={section.id} className={`song-map-segment kind-${kind} ${section.id === activeSectionId ? "is-active" : ""}`} style={{ flexGrow: share }} onClick={() => goToSection(section.id)} title={`${section.name} · ${section.measures.length} compassos`}>
        <span>{section.name}</span>
      </button>;
    })}</nav>

    {standardNotation ? <div className="tab-help"><h2>Partitura tradicional de bateria</h2><p>Esta faixa está escrita em pauta musical padrão, não em tab textual. As notas em laranja acompanham o áudio. Clique em um compasso para começar dali; você também pode reduzir a velocidade e ligar o metrônomo.</p><p>× acima da pauta: chimbal · × circulado: chimbal aberto · × abaixo da pauta: pedal do chimbal · notas entre parênteses: notas fantasma · &gt;: acento. O último compasso é incompleto, como na partitura enviada.</p></div> : <div className="tab-help"><h2>Sua tab, compasso a compasso.</h2><p>Clique em qualquer compasso ou no mapa acima para ouvir a partir dali. Cr: crash · Ri: ride · Ch: chimbal · Ca: chimbal aberto · Cx: caixa · T1/T2: tons · Su: surdo · Bu: bumbo · Cn: china · Sp: splash.</p>{sourceNotation ? <p>Notação do texto fornecido: x/X = pratos ou chimbal · o = tambor · f = flam (nota de preparação antes da nota principal) · - = sem toque. As maiúsculas foram preservadas; o texto não inclui legenda para distinguir x de X.</p> : <p>× prato · ● tambor · ○ chimbal aberto · ◎ chimbal aberto acentuado · g nota fantasma · X prato acentuado · O tambor acentuado · r rimshot · c cross-stick · b cúpula · f flam · · sem toque.</p>}<p>Leia da esquerda para a direita: notas na mesma coluna são tocadas juntas. Cada grupo “1 e & a” divide um tempo em quatro partes iguais (semicolcheias em 4/4).</p></div>}

    <nav className="section-navigation" aria-label="Seções da música">{document.sections.map((section) => <button className={`secondary-button kind-${sectionKind(section.name)} ${section.id === activeSectionId ? "is-active" : ""}`} type="button" key={section.id} aria-pressed={section.id === activeSectionId} onClick={() => goToSection(section.id)}>{section.name}</button>)}</nav>

    <div ref={viewerRef}>{document.sections.map((section) => <section id={section.id} key={section.id} className={`tab-section kind-${sectionKind(section.name)}`}>
      <div className="tab-section-heading"><h3><span className="section-order">{String(section.order).padStart(2, "0")}</span>{section.name}</h3><span className="section-meta">{section.measures.length} compassos</span></div>
      {section.lyricCue ? <p className="section-lyric-cue">“{section.lyricCue}”</p> : null}
      {section.guidance ? <p className="section-guidance">{section.guidance}</p> : null}
      <div className="measure-grid">{section.measures.map((measure) => <MeasureCard key={measure.id} measure={measure} active={measure.globalOrder === activeMeasure} onSeek={seek} sourceNotation={sourceNotation} standardNotation={standardNotation} />)}</div>
    </section>)}</div>
    <p className="small-note">O metrônomo acompanha o áudio e a velocidade selecionada, com acento no primeiro tempo. Count-in e loops ainda não estão disponíveis nesta versão.</p>
  </div>;
}
