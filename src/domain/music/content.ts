export type PracticeStem = { id: string; label: string; url: string; instrument: string };
export type PracticeLyric = { id: string; startTime: number; endTime: number; text: string; translation: string; language: string; translationLanguage: string };
export const genres = ["Rock", "Pop", "MPB", "Blues", "Jazz", "Samba", "Metal", "Reggae", "Outras"] as const;

export function formatGenreLabel(genre: string) {
  return genre === "Funk" ? "Outras" : genre;
}

export function resolveGenreLookup(genre: string) {
  const normalized = genre.trim();
  return normalized === "Outras" ? "Funk" : normalized;
}

export function formatTime(seconds: number) {
  const rounded = Math.max(0, Math.floor(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}
