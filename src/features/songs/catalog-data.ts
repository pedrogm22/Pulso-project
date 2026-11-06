import { catalogAdditions } from "./catalog-additions";
import { extraCatalogEntries } from "./catalog-extra";

export const slugify = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const catalogEntries = [
  { title: "We Will Rock You", artist: "Queen", genre: "Rock", bpm: 92 },
  { title: "Back in Black", artist: "AC/DC", genre: "Rock", bpm: 95 },
  { title: "Basket Case", artist: "Green Day", genre: "Rock", bpm: 118 },
  { title: "Paranoid", artist: "Black Sabbath", genre: "Metal", bpm: 163 },
  { title: "Come Together", artist: "The Beatles", genre: "Rock", bpm: 89 },
  { title: "Start Me Up", artist: "The Rolling Stones", genre: "Rock", bpm: 116 },
  { title: "Billie Jean", artist: "Michael Jackson", genre: "Pop", bpm: 117 },
  { title: "Dancing Queen", artist: "ABBA", genre: "Pop", bpm: 100 },
  { title: "Take on Me", artist: "a-ha", genre: "Pop", bpm: 168 },
  { title: "As It Was", artist: "Harry Styles", genre: "Pop", bpm: 173 },
  { title: "Rolling in the Deep", artist: "Adele", genre: "Pop", bpm: 105 },
  { title: "Não Quero Dinheiro (Só Quero Amar)", artist: "Tim Maia", genre: "MPB", bpm: 104 },
  { title: "Get Lucky", artist: "Daft Punk feat. Pharrell Williams", genre: "Funk", bpm: 116 },
] as const;

export const allCatalogEntries: ReadonlyArray<{
  title: string;
  artist: string;
  genre: string;
  bpm: number | null;
  difficulty?: string;
  timeSignatureNumerator?: number;
  timeSignatureDenominator?: number;
  youtubeWith?: string;
  youtubeWithout?: string;
}> = [...catalogEntries, ...extraCatalogEntries, ...catalogAdditions];

export function estimateDifficulty(genre: string, bpm: number | null) {
  if (genre === "Jazz") return "INTERMEDIATE";
  if (genre === "Metal") return bpm !== null && bpm < 110 ? "INTERMEDIATE" : "ADVANCED";
  if (bpm === null) return "INTERMEDIATE";
  return bpm <= 110 ? "BEGINNER" : bpm <= 140 ? "INTERMEDIATE" : "ADVANCED";
}
