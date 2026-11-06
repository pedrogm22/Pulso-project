import "server-only";
import { getDatabase } from "@/lib/db";

const publishedTab = { status: { in: ["PUBLISHED", "VERIFIED"] as ("PUBLISHED" | "VERIFIED")[] } };

export function findSongs(query: string, artistSlug?: string, genre?: string) {
  return getDatabase().song.findMany({
    where: {
      AND: [{ OR: [{ tabs: { some: publishedTab } }, { audioTracks: { some: {} } }] }],
      ...(artistSlug ? { artist: { slug: artistSlug } } : {}),
      ...(genre ? { genre } : {}),
      OR: [{ title: { contains: query, mode: "insensitive" } }, { artist: { name: { contains: query, mode: "insensitive" } } }],
    },
    include: { artist: true, tabs: { where: publishedTab, select: { id: true }, take: 1 } }, orderBy: { title: "asc" }, take: 100,
  });
}

export function findSong(artistSlug: string, songSlug: string) {
  return getDatabase().song.findFirst({
    where: { slug: songSlug, artist: { slug: artistSlug }, OR: [{ tabs: { some: publishedTab } }, { audioTracks: { some: {} } }, { slug: "seven-nation-army" }] },
    include: {
      artist: true,
      audioTracks: { where: { type: { in: ["ORIGINAL", "BACKING", "DRUMLESS", "STEM"] } }, orderBy: { createdAt: "asc" } },
      lyrics: { orderBy: { startTime: "asc" } },
      tabs: { where: publishedTab, orderBy: { version: "desc" }, take: 1,
        include: { sections: { orderBy: { order: "asc" }, include: { measures: { orderBy: { order: "asc" }, include: { events: true } } } } } },
    },
  });
}
