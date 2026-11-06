import type { PrismaClient } from "../src/generated/prisma/client";
import { albumArtwork } from "../src/domain/music/album-artwork";
import { createParanoidTab, paranoidSong } from "./paranoid-song";

/** Update only this arrangement; retain measure IDs and unrelated catalog/user data. */
export async function syncParanoidTab(database: PrismaClient) {
  const document = createParanoidTab();
  await database.$transaction(async (transaction) => {
    const artist = { name: paranoidSong.artistName, slug: paranoidSong.artistSlug };
    await transaction.artist.upsert({ where: { id: paranoidSong.artistId }, create: { id: paranoidSong.artistId, ...artist }, update: artist });
    const song = { title: paranoidSong.title, slug: paranoidSong.slug, artistId: paranoidSong.artistId,
      genre: paranoidSong.genre, duration: paranoidSong.audioDuration, bpm: paranoidSong.bpm,
      timeSignatureNumerator: 4, timeSignatureDenominator: 4,
      difficulty: paranoidSong.difficulty, releaseYear: paranoidSong.releaseYear, coverImage: albumArtwork.paranoid };
    await transaction.song.upsert({ where: { id: paranoidSong.songId }, create: { id: paranoidSong.songId, ...song }, update: song });
    const tab = { songId: paranoidSong.songId, title: "Tab do texto fornecido — sincronização aproximada", version: 1,
      difficulty: paranoidSong.difficulty, status: "PUBLISHED" as const };
    await transaction.tab.upsert({ where: { id: document.id }, create: { id: document.id, ...tab }, update: tab });
    for (const section of document.sections) {
      const { measures, ...base } = section;
      const sectionData = { ...base, guidance: base.guidance ?? null, lyricCue: base.lyricCue ?? null, tabId: document.id };
      await transaction.section.upsert({ where: { id: section.id }, create: sectionData, update: sectionData });
      for (const measure of measures) {
        const { events, ...baseMeasure } = measure;
        const measureData = { ...baseMeasure, tabId: document.id, sectionId: section.id };
        await transaction.measure.upsert({ where: { id: measure.id }, create: measureData, update: measureData });
        await transaction.drumEvent.deleteMany({ where: { measureId: measure.id } });
        if (events.length) await transaction.drumEvent.createMany({ data: events.map((event) => ({ ...event, measureId: measure.id })) });
      }
    }
    await transaction.measure.deleteMany({ where: { tabId: document.id, id: { notIn: document.sections.flatMap((section) => section.measures.map((measure) => measure.id)) } } });
    await transaction.section.deleteMany({ where: { tabId: document.id, id: { notIn: document.sections.map((section) => section.id) } } });
  }, { timeout: 30000 });
  return document;
}
