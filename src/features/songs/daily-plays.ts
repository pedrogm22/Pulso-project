import "server-only";
import { getDatabase } from "@/lib/db";
import { getSong } from "./service";

export function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function recordDailySongPlay(artistSlug: string, songSlug: string) {
  const db = getDatabase();
  let song = await db.song.findFirst({
    where: { slug: songSlug, artist: { slug: artistSlug } },
    select: { id: true },
  });
  if (!song) {
    const catalogSong = await getSong(artistSlug, songSlug);
    if (!catalogSong) return false;
    const artist = await db.artist.upsert({
      where: { slug: artistSlug },
      create: { slug: artistSlug, name: catalogSong.artist.name },
      update: {},
    });
    song = await db.song.upsert({
      where: { artistId_slug: { artistId: artist.id, slug: songSlug } },
      create: {
        slug: songSlug,
        title: catalogSong.title,
        artistId: artist.id,
        duration: null,
        bpm: catalogSong.bpm,
        difficulty: catalogSong.difficulty,
        genre: catalogSong.genre,
        coverImage: catalogSong.coverImage,
        timeSignatureNumerator: catalogSong.timeSignatureNumerator,
        timeSignatureDenominator: catalogSong.timeSignatureDenominator,
      },
      update: {},
      select: { id: true },
    });
  }

  const day = todayUtc();
  await db.dailySongPlay.upsert({
    where: { songId_day: { songId: song.id, day } },
    create: { songId: song.id, day, plays: 1 },
    update: { plays: { increment: 1 } },
  });
  return true;
}

export async function getDailyTopSongs() {
  try {
    return await getDatabase().dailySongPlay.findMany({
      where: { day: todayUtc() },
      orderBy: [{ plays: "desc" }, { song: { title: "asc" } }],
      take: 10,
      select: {
        plays: true,
        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            genre: true,
            difficulty: true,
            bpm: true,
            timeSignatureNumerator: true,
            timeSignatureDenominator: true,
            artist: { select: { name: true, slug: true } },
            tabs: { where: { status: { in: ["PUBLISHED", "VERIFIED"] } }, select: { id: true }, take: 1 },
          },
        },
      },
    });
  } catch (error) {
    console.warn("Banco de dados indisponível ao carregar as músicas mais tocadas de hoje.", error);
    return [];
  }
}
