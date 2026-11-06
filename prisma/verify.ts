import "dotenv/config";
import assert from "node:assert/strict";
import { createDatabaseClient } from "../src/lib/db/create-client";
import { tabDocumentSchema } from "../src/domain/music/document";
import { createParanoidTab, paranoidSong } from "./paranoid-song";

const database = createDatabaseClient();
try {
  const expected = createParanoidTab();
  const tab = await database.tab.findUniqueOrThrow({ where: { id: paranoidSong.tabId }, include: { sections: { orderBy: { order: "asc" }, include: { measures: { orderBy: { order: "asc" }, include: { events: true } } } } } });
  const document = tabDocumentSchema.parse(tab);
  assert.equal(document.sections.length, expected.sections.length);
  assert.equal(document.sections.flatMap((section) => section.measures).length, expected.sections.flatMap((section) => section.measures).length);
  const normalize = (value: typeof document) => value.sections.map((section) => ({ ...section, guidance: section.guidance ?? null, lyricCue: section.lyricCue ?? null,
    measures: section.measures.map((measure) => ({ ...measure, beatTimes: measure.beatTimes ?? [],
      events: measure.events.toSorted((a, b) => a.beat - b.beat || a.subdivision - b.subdivision || a.instrument.localeCompare(b.instrument)),
    })),
  }));
  // Database event order is unspecified; compare every note and timing after sorting.
  assert.deepEqual(normalize(document), normalize(expected));
  assert.equal(await database.audioTrack.count({ where: { id: paranoidSong.audioId } }), 0);
  assert.equal(await database.drumEvent.count({ where: { measure: { tabId: paranoidSong.tabId } } }), expected.sections.flatMap((section) => section.measures).flatMap((measure) => measure.events).length);
  assert.ok(await database.song.count() >= 1);
  console.log("Banco e seed verificados.");
} finally {
  await database.$disconnect();
}
