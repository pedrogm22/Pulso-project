import "dotenv/config";
import { createDatabaseClient } from "../src/lib/db/create-client";
import { albumArtworkBySongSlug } from "../src/domain/music/album-artwork";
import { allCatalogEntries, estimateDifficulty, slugify } from "../src/features/songs/catalog-data";

const database = createDatabaseClient();
const catalog = allCatalogEntries.flatMap((entry) => {
  const artistSlug = slugify(entry.artist);
  const songSlug = slugify(entry.title);
  return [{
    ...entry,
    artistSlug,
    songSlug,
    difficulty: entry.difficulty ?? estimateDifficulty(entry.genre, entry.bpm),
    coverImage: albumArtworkBySongSlug[songSlug] ?? null,
  }];
});

function toDifficulty(value: string): "BEGINNER" | "INTERMEDIATE" | "ADVANCED" {
  if (value === "BEGINNER" || value === "ADVANCED") return value;
  return "INTERMEDIATE";
}

try {
  for (const entry of catalog) {
    await database.$transaction(async (transaction) => {
      const artist = await transaction.artist.upsert({
        where: { slug: entry.artistSlug },
        create: { name: entry.artist, slug: entry.artistSlug },
        update: {},
      });
      const existing = await transaction.song.findUnique({
        where: { artistId_slug: { artistId: artist.id, slug: entry.songSlug } },
        select: { id: true, bpm: true, coverImage: true },
      });
      const metadata = {
        bpm: existing?.bpm ?? entry.bpm,
        coverImage: existing?.coverImage ?? entry.coverImage,
      };

      if (existing) {
        await transaction.song.update({ where: { id: existing.id }, data: metadata });
      } else {
        await transaction.song.create({
          data: {
            ...metadata,
            title: entry.title,
            slug: entry.songSlug,
            artistId: artist.id,
            duration: null,
            difficulty: toDifficulty(entry.difficulty),
            genre: entry.genre,
            timeSignatureNumerator: entry.timeSignatureNumerator,
            timeSignatureDenominator: entry.timeSignatureDenominator,
          },
        });
      }
    });
  }
  console.log(`Catálogo importado: ${catalog.length} músicas; tabs, reproduções e arquivos de áudio foram preservados.`);
} finally {
  await database.$disconnect();
}
