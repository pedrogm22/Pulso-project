import { albumArtwork } from "../src/domain/music/album-artwork";

export const sevenNationArmySong = {
  songId: "song-seven-nation-army",
  artistId: "artist-the-white-stripes",
  artistName: "The White Stripes",
  artistSlug: "the-white-stripes",
  title: "Seven Nation Army",
  slug: "seven-nation-army",
  genre: "Rock",
  bpm: 124,
  duration: 235.164,
  releaseYear: 2003,
  difficulty: "BEGINNER" as const,
  coverImage: albumArtwork.sevenNationArmy,
};
