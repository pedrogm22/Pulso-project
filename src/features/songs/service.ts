/* eslint-disable @typescript-eslint/no-explicit-any -- registros do catálogo mesclam banco e fallback; tipagem forte fica para depois */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { parseAsciiTab } from "@/domain/music/ascii-tab";
import { z } from "zod";
import { tabDocumentSchema } from "@/domain/music/document";
import { albumArtworkBySongSlug } from "@/domain/music/album-artwork";
import { resolveGenreLookup } from "@/domain/music/content";
import { createBillieJeanTab, billieJeanTabId } from "../../../prisma/billie-jean-song";
import { createParanoidTab, paranoidSong } from "../../../prisma/paranoid-song";
import { findSong, findSongs } from "./repository";
import { allCatalogEntries, estimateDifficulty, slugify } from "./catalog-data";
import { catalogAdditions } from "./catalog-additions";
import { videoLinks } from "./video-links";

const slugSchema = z.string().regex(/^[a-z0-9-]+$/).max(120);
const removedSongKeys = new Set(["legiao-urbana/sera", "madonna/like-a-prayer"]);
const isRemovedSong = (artistSlug: string, songSlug: string) => removedSongKeys.has(`${artistSlug}/${songSlug}`);
const billieJeanTabDocument = createBillieJeanTab();
const paranoidTabDocument = createParanoidTab();

type FallbackSong = {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  genre: string;
  difficulty: string;
  bpm: number | null;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  artist: { id: string; name: string; slug: string };
  tabs: Array<{ id: string; version: number; notationType: string; status: string }>;
  audioTracks: any[];
  lyrics: any[];
  videoWith: string | null;
  videoWithout: string | null;
};

const createAlbumArt = (title: string, artist: string, accent = "#d7262f", shadow = "#2a070a") => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${shadow}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <circle cx="300" cy="180" r="120" fill="rgba(255,255,255,0.12)"/>
  <circle cx="300" cy="180" r="56" fill="rgba(12,12,12,0.55)" stroke="rgba(255,255,255,0.8)" stroke-width="8"/>
  <path d="M125 380C190 310 230 330 300 380C380 330 430 300 475 380" fill="none" stroke="rgba(255,255,255,0.72)" stroke-width="10" stroke-linecap="round"/>
  <path d="M145 430C195 390 240 398 300 450C360 390 425 390 455 430" fill="none" stroke="rgba(255,255,255,0.72)" stroke-width="10" stroke-linecap="round"/>
  <text x="300" y="290" text-anchor="middle" fill="#fff" font-size="34" font-family="Arial, sans-serif" font-weight="700">${title.length > 22 ? `${title.slice(0, 22)}…` : title}</text>
  <text x="300" y="340" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="22" font-family="Arial, sans-serif" letter-spacing="2">${artist.toUpperCase()}</text>
</svg>
`)}`;

const fallbackTabsBySlug: Record<string, { id: string; version: number; notationType: string; status: string }[]> = {
  "billie-jean": [{ id: billieJeanTabId, version: 1, notationType: "STANDARD", status: "PUBLISHED" }],
  paranoid: [{ id: paranoidSong.tabId, version: 1, notationType: "ASCII", status: "PUBLISHED" }],
};

function getFallbackCoverImage(title: string, artist: string, slug: string) {
  const albumCover = albumArtworkBySongSlug[slug];
  if (albumCover) return albumCover;
  return createAlbumArt(title, artist, "#d7262f", "#2a070a");
}

const fallbackSongs: FallbackSong[] = allCatalogEntries.map((song, index) => {
  const artistSlug = slugify(song.artist);
  const songSlug = slugify(song.title);
  return {
    id: `fallback-${artistSlug}-${songSlug}-${index}`,
    title: song.title,
    slug: songSlug,
    coverImage: getFallbackCoverImage(song.title, song.artist, songSlug),
    audioTracks: [],
    genre: song.genre,
    difficulty: song.difficulty ?? estimateDifficulty(song.genre, song.bpm),
    bpm: song.bpm,
    timeSignatureNumerator: song.timeSignatureNumerator ?? 4,
    timeSignatureDenominator: song.timeSignatureDenominator ?? 4,
    artist: { id: `fallback-${artistSlug}`, name: song.artist, slug: artistSlug },
    videoWith: videoLinks[`${artistSlug}/${songSlug}`]?.com ?? song.youtubeWith ?? null,
    videoWithout: videoLinks[`${artistSlug}/${songSlug}`]?.sem ?? song.youtubeWithout ?? null,
    tabs: fallbackTabsBySlug[songSlug] ?? (existsSync(path.join(process.cwd(), "prisma", "tabs", `${songSlug}.txt`))
      ? [{ id: `${songSlug}-ascii-v1`, version: 1, notationType: "ASCII", status: "PUBLISHED" }] : []),
    lyrics: [],
  };
});

const asciiTabCache = new Map<string, ReturnType<typeof parseAsciiTab> | null>();

// Tabs em texto: prisma/tabs/<slug-da-musica>.txt, no formato lido por parseAsciiTab.
function asciiTabDocument(songSlug: string) {
  if (asciiTabCache.has(songSlug)) return asciiTabCache.get(songSlug)!;
  const file = path.join(process.cwd(), "prisma", "tabs", `${songSlug}.txt`);
  const song = fallbackSongs.find((item) => item.slug === songSlug);
  let document: ReturnType<typeof parseAsciiTab> | null = null;
  if (song?.bpm && existsSync(file)) {
    try {
      document = parseAsciiTab(readFileSync(file, "utf8"), { id: `${songSlug}-ascii-v1`, bpm: song.bpm });
    } catch (error) {
      console.warn(`Tab em texto inválida para ${songSlug}.`, error);
    }
  }
  asciiTabCache.set(songSlug, document);
  return document;
}

function fallbackDocument(songSlug: string) {
  if (songSlug === "billie-jean") return billieJeanTabDocument;
  if (songSlug === "paranoid") return paranoidTabDocument;
  return asciiTabDocument(songSlug);
}

export type SongFilters = { difficulty?: string; video?: string };

function isSongAvailable(artistSlug: string, songSlug: string) {
  return Boolean(getVideoLinks(artistSlug, songSlug).com);
}

function matchesFilters(song: { artist: { slug: string }; slug: string; difficulty: string }, filters: SongFilters) {
  const links = getVideoLinks(song.artist.slug, song.slug);
  if (filters.difficulty && song.difficulty !== filters.difficulty) return false;
  if (filters.video === "com") return Boolean(links?.com);
  if (filters.video === "sem") return Boolean(links?.sem);
  if (filters.video === "ambos") return Boolean(links?.com && links?.sem);
  return true;
}

function getFallbackSongs(query = "", genre?: string, artistSlug?: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedGenre = resolveGenreLookup(genre ?? "").trim().toLowerCase();
  return fallbackSongs.filter((song) => {
    const matchesQuery = !normalizedQuery || `${song.title} ${song.artist.name}`.toLowerCase().includes(normalizedQuery);
    const matchesGenre = !normalizedGenre || song.genre.toLowerCase() === normalizedGenre;
    return matchesQuery && matchesGenre && (!artistSlug || song.artist.slug === artistSlug);
  });
}

export const listSongs = cache(async (query = "", artistSlug?: string, genre?: string, difficulty?: string, video?: string): Promise<any[]> => {
  const filters: SongFilters = { difficulty: ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(difficulty ?? "") ? difficulty : undefined, video };
  const result = await listAllSongs(query, artistSlug, genre);
  return result.filter((song) => isSongAvailable(song.artist.slug, song.slug) && matchesFilters(song, filters));
});

const listAllSongs = cache(async (query = "", artistSlug?: string, genre?: string): Promise<any[]> => {
  try {
    const safeQuery = z.string().trim().max(120).parse(query.slice(0, 120));
    const normalizedGenre = resolveGenreLookup(genre ?? "");
    const songs = await findSongs(safeQuery, artistSlug, normalizedGenre.slice(0, 40));
    const fallbacks = getFallbackSongs(safeQuery, normalizedGenre, artistSlug);
    const merged = songs.map((song) => {
      const fallback = fallbacks.find((item) => item.artist.slug === song.artist.slug && item.slug === song.slug);
      return fallback ? {
        ...song,
        coverImage: albumArtworkBySongSlug[song.slug] ?? song.coverImage ?? fallback.coverImage,
        tabs: song.tabs.length ? song.tabs : fallback.tabs,
      } : song;
    });
    const existing = new Set(songs.map((song) => `${song.artist.slug}/${song.slug}`));
    return [...merged, ...fallbacks.filter((song) => !existing.has(`${song.artist.slug}/${song.slug}`))]
      .filter((song) => !isRemovedSong(song.artist.slug, song.slug))
      .sort((first, second) => first.title.localeCompare(second.title));
  } catch (error) {
    console.warn("Banco de dados indisponível ao listar músicas; usando catálogo de fallback.", error);
    return getFallbackSongs(query, resolveGenreLookup(genre ?? ""), artistSlug);
  }
});
export const getSong = cache(async (artistSlug: string, songSlug: string): Promise<any | null> => {
  if (!slugSchema.safeParse(artistSlug).success || !slugSchema.safeParse(songSlug).success) return null;
  if (isRemovedSong(artistSlug, songSlug)) return null;
  if (!isSongAvailable(artistSlug, songSlug)) return null;

  try {
    const song = await findSong(artistSlug, songSlug);
    const tab = song?.tabs[0];
    if (!song) {
      const fallbackSong = fallbackSongs.find((item) => item.artist.slug === artistSlug && item.slug === songSlug);
      if (!fallbackSong) return null;
      return { ...fallbackSong, document: fallbackDocument(fallbackSong.slug) };
    }
    const fallbackSong = fallbackSongs.find((item) => item.artist.slug === artistSlug && item.slug === songSlug);
    if (!tab && fallbackSong) return { ...song, coverImage: albumArtworkBySongSlug[songSlug] ?? song.coverImage ?? fallbackSong.coverImage, tabs: fallbackSong.tabs, document: fallbackDocument(songSlug) };
    return { ...song, coverImage: albumArtworkBySongSlug[songSlug] ?? song.coverImage ?? fallbackSong?.coverImage, document: tab ? tabDocumentSchema.parse(tab) : null };
  } catch (error) {
    console.warn("Banco de dados indisponível ao carregar música; usando fallback.", error);
    const fallbackSong = fallbackSongs.find((item) => item.artist.slug === artistSlug && item.slug === songSlug);
    if (!fallbackSong) return null;
    return { ...fallbackSong, document: fallbackDocument(fallbackSong.slug) };
  }
});

export function difficultyLabel(difficulty: string) {
  return difficulty === "INTERMEDIATE" ? "Intermediário" : difficulty === "ADVANCED" ? "Avançado" : "Iniciante";
}

export function getVideoLinks(artistSlug: string, songSlug: string) {
  if (isRemovedSong(artistSlug, songSlug)) return { com: null, sem: null };
  const key = `${artistSlug}/${songSlug}`;
  const links = videoLinks[key];
  if (links) return links;
  const entry = catalogAdditions.find((song) => slugify(song.artist) === artistSlug && slugify(song.title) === songSlug);
  return { com: entry?.youtubeWith ?? null, sem: entry && "youtubeWithout" in entry ? entry.youtubeWithout : null };
}
