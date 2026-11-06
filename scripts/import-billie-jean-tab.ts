import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createDatabaseClient } from "../src/lib/db/create-client";
import { createBillieJeanTab } from "../prisma/billie-jean-song";
import timing from "../prisma/tabs/billie-jean-timing.json";

const database = createDatabaseClient();
try {
  const audio = readFileSync(new URL("../tests/michael-jackson-billie-jean.mp3", import.meta.url));
  if (createHash("sha256").update(audio).digest("hex") !== timing.audioSha256) throw new Error("O áudio mudou. Refaça o alinhamento antes de importar a partitura.");
  const document = createBillieJeanTab();
  const song = await database.song.findFirstOrThrow({ where: { slug: "billie-jean", artist: { slug: "michael-jackson" } } });
  await database.$transaction(async (tx) => {
    const tab = { songId: song.id, title: "Billie Jean — partitura transcrita do PDF fornecido", version: 1, difficulty: "BEGINNER" as const, notationType: "STANDARD" as const, status: "PUBLISHED" as const };
    await tx.tab.upsert({ where: { id: document.id }, create: { id: document.id, ...tab }, update: tab });
    for (const section of document.sections) {
      const { measures, ...base } = section;
      const sectionData = { ...base, tabId: document.id };
      await tx.section.upsert({ where: { id: section.id }, create: sectionData, update: sectionData });
      for (const measure of measures) {
        const { events, ...baseMeasure } = measure;
        const data = { ...baseMeasure, tabId: document.id, sectionId: section.id };
        await tx.measure.upsert({ where: { id: measure.id }, create: data, update: data });
        await tx.drumEvent.deleteMany({ where: { measureId: measure.id } });
        await tx.drumEvent.createMany({ data: events.map((event) => ({ ...event, measureId: measure.id })) });
      }
    }
  }, { timeout: 30000 });
  console.log(`Billie Jean: ${document.sections.length} seções, 144 compassos, partitura e tempos importados.`);
} finally {
  await database.$disconnect();
}
