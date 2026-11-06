import "dotenv/config";
import { createDatabaseClient } from "../src/lib/db/create-client";
import { paranoidSong } from "./paranoid-song";
import { lessons } from "./learning-content";

import { syncParanoidTab } from "./sync-paranoid";

const database = createDatabaseClient();
try {

  await syncParanoidTab(database);
  await database.$transaction(async (transaction) => {
    await transaction.audioTrack.deleteMany({ where: { id: paranoidSong.audioId } });
  }, { timeout: 30000 });

  for (const lesson of lessons) {
    const { cards, ...base } = lesson;
    const data = { ...base, duration: 32, videoUrl: `/lessons/${lesson.slug}.mp4`, captionsUrl: `/lessons/${lesson.slug}.vtt`, transcript: cards.join("\n\n"), license: "CC0-1.0" };
    await database.lesson.upsert({ where: { id: lesson.id }, create: data, update: data });
  }
  console.log("Seed concluído: 1 música (Paranoid), 1 tab. A reprodução usa o player do YouTube.");
} catch {
  console.error("Falha no seed. Verifique DATABASE_URL e aplique as migrations antes de repetir.");
  process.exitCode = 1;
} finally {
  await database.$disconnect();
}
