"use client";

import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { PracticePlayer, TrackedYouTubePlayer } from "./practice-player";

type Version = "with" | "without";
type Props = Omit<ComponentProps<typeof PracticePlayer>, "youtubeUrl" | "document" | "audioUrl"> & {
  songKey: string;
  artistSlug: string;
  songSlug: string;
  title: string;
  artist: string;
  document?: ComponentProps<typeof PracticePlayer>["document"];
  withDrumsUrl?: string;
  withoutDrumsUrl?: string;
};

function getVideoId(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const id = host === "youtu.be"
      ? url.pathname.slice(1)
      : host === "youtube.com" || host === "m.youtube.com"
        ? url.searchParams.get("v") ?? url.pathname.match(/^\/embed\/([\w-]{11})$/)?.[1]
        : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function SongPractice({ songKey, artistSlug, songSlug, title, artist, document, withDrumsUrl, withoutDrumsUrl, ...player }: Props) {
  const storageKey = `pulso:video:${songKey}`;
  const [version, setVersion] = useState<Version>("with");
  const [links, setLinks] = useState<{ with?: string; without?: string }>({});
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as { with?: string; without?: string; version?: Version };
        setLinks({ with: saved.with, without: saved.without });
        if (saved.version === "without" && saved.without) setVersion("without");
      } catch {
        localStorage.removeItem(storageKey);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [storageKey]);

  const persist = (next: { with?: string; without?: string }, nextVersion: Version) => {
    setLinks(next);
    setVersion(nextVersion);
    localStorage.setItem(storageKey, JSON.stringify({ ...next, version: nextVersion }));
  };

  const drumlessUrl = links.without ?? withoutDrumsUrl;
  const activeUrl = version === "without" ? drumlessUrl : links.with ?? withDrumsUrl;
  const activeVideoId = getVideoId(activeUrl);
  const searchQuery = `${artist} ${title}${version === "without" ? " drumless" : ""}`;
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
  const reportPlay = useCallback(() => {
    void fetch("/api/songs/daily-play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistSlug, songSlug }),
    }).then((response) => {
      if (!response.ok) console.warn("Não foi possível registrar esta reprodução.");
    }).catch((error: unknown) => {
      console.warn("Não foi possível registrar esta reprodução.", error);
    });
  }, [artistSlug, songSlug]);

  const apply = () => {
    const value = draft.trim();
    if (!getVideoId(value) || !/^https?:\/\//i.test(value)) {
      setError("Cole um link válido do YouTube (youtube.com/watch?v=… ou youtu.be/…).");
      return;
    }
    setError("");
    setDraft("");
    persist({ ...links, [version]: value }, version);
  };

  const reset = () => persist({ ...links, [version]: undefined }, version);

  return (
    <>
      <section className="video-version-picker" aria-label={`Escolher versão do vídeo de ${title} — ${artist}`}>
        <div className="video-search-action">
          <a className="button" href={searchUrl} target="_blank" rel="noopener noreferrer">🔎 Pesquisar versões de “{title}” no YouTube ↗</a>
          <span>Abre os resultados do YouTube em uma nova aba.</span>
        </div>
        <div role="group" aria-label="Versão" className="video-version-options">
          <button type="button" className={version === "with" ? "button" : "button secondary"} aria-pressed={version === "with"} onClick={() => { setError(""); setDraft(""); persist(links, "with"); }}>🎤 Com bateria</button>
          <button type="button" className={version === "without" ? "button" : "button secondary"} aria-pressed={version === "without"} onClick={() => { setError(""); setDraft(""); persist(links, "without"); }}>🥁 Sem bateria (drumless)</button>
        </div>
        {version === "without" && !drumlessUrl ? <p role="status">Ainda não há link “sem bateria” salvo para esta música. Você pode colar um link abaixo.</p> : null}
        <div className="video-link-editor">
          <input type="url" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") apply(); }} placeholder={`Colar link do YouTube (${version === "with" ? "com bateria" : "sem bateria"})`} aria-label="Link do YouTube" />
          <button type="button" className="button secondary" onClick={apply}>Usar este link</button>
          {(version === "with" ? links.with : links.without) ? <button type="button" className="button secondary" onClick={reset}>Restaurar padrão</button> : null}
        </div>
        {error ? <p className="audio-error" role="alert">{error}</p> : null}
      </section>
      {document ? <PracticePlayer {...player} document={document} youtubeUrl={activeUrl} onPlaybackStart={reportPlay} /> : (
        <>
          {activeVideoId ? <TrackedYouTubePlayer videoId={activeVideoId} title={`${title} — ${version === "with" ? "com bateria" : "sem bateria"} para praticar`} onPlaybackStart={reportPlay} /> : <p className="audio-error" role="status">Ainda não há um vídeo para esta versão.</p>}
        </>
      )}
    </>
  );
}
