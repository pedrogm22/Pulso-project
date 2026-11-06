import { tabDocumentSchema, type DrumEvent, type Section } from "../src/domain/music/document";
import timing from "./tabs/billie-jean-timing.json";

export const billieJeanTabId = "billie-jean-score-v1";

// Manually read from the user's Songsterr capture, bars 1–144, 4/4 at 117 BPM.
// All bars have the written eighth-note hi-hat, kick on 1/3, snare on 2/4,
// except for the explicit per-bar changes below and the three-beat final bar.
export const billieJeanChanges = {
  openHat: {
    34: [3.5], 36: [3.5], 38: [3.5], 40: [3.5], 41: [1.5, 3.5], 42: [1.5, 3.5],
    54: [3.5], 66: [3.5], 74: [3.5], 76: [3.5], 78: [3.5], 80: [3.5],
    81: [1.5, 3.5], 82: [0.5, 1.5, 2.5, 3.5], 94: [3.5], 102: [3.5],
    110: [3.5], 114: [3.5], 118: [3.5], 122: [3.5], 126: [3.5],
    130: [3.5], 134: [3.5], 138: [3.5], 142: [3.5],
  } as Record<number, number[]>,
  footHat: {
    35: [0], 37: [0], 39: [0], 41: [0, 2], 42: [0, 2], 43: [0],
    55: [0], 67: [0], 75: [0], 77: [0], 79: [0], 81: [0, 2], 82: [0, 1, 2, 3],
    83: [0], 95: [0], 103: [0], 115: [0], 119: [0], 123: [0], 127: [0],
    131: [0], 135: [0], 139: [0], 143: [0],
  } as Record<number, number[]>,
  crash: [43, 83],
  lowTomFill: [44, 84, 90, 92, 102, 114, 116, 126, 130, 136],
  highTomFill: [108, 128],
};

const sections = [
  [1, "Introdução"], [15, "Estrofe 1"], [27, "Estrofe 2"], [35, "Pré-refrão 1"],
  [43, "Refrão 1"], [55, "Estrofe 3"], [67, "Estrofe 4"], [75, "Pré-refrão 2"],
  [83, "Refrão 2"], [91, "Solo de guitarra"], [103, "Interlúdio"],
  [115, "Refrão 3"], [127, "Final"], [135, "Fade out"],
] as const;

export function billieJeanEvents(bar: number): DrumEvent[] {
  const events: DrumEvent[] = [];
  const add = (instrument: DrumEvent["instrument"], position: number, articulation: DrumEvent["articulation"] = "NORMAL") => events.push({
    instrument, beat: Math.floor(position) + 1, subdivision: position % 1,
    articulation, velocity: articulation === "GHOST" ? 45 : articulation === "ACCENT" ? 115 : 100,
  });
  const count = bar === 144 ? 3 : 4;
  for (let position = 0; position < count; position += 0.5) {
    const instrument = position === 0 && billieJeanChanges.crash.includes(bar) ? "CRASH"
      : billieJeanChanges.openHat[bar]?.includes(position) ? "OPEN_HI_HAT" : "HI_HAT";
    add(instrument, position, bar === 110 && position === 3.5 ? "ACCENT" : "NORMAL");
  }
  for (const position of [0, 2]) add("KICK", position);
  for (const position of [1, 3].filter((position) => position < count)) add("SNARE", position);
  for (const position of billieJeanChanges.footHat[bar] ?? []) add("FOOT_HI_HAT", position);
  if (billieJeanChanges.lowTomFill.includes(bar)) add("FLOOR_TOM", 2.75, "ACCENT");
  if (billieJeanChanges.highTomFill.includes(bar)) add("TOM_HIGH", 2.75, "ACCENT");
  if (bar === 34) add("SNARE", 3.75, "GHOST");
  if (bar === 74) { add("SNARE", 3.5, "GHOST"); add("SNARE", 3.75, "ACCENT"); }
  return events.sort((a, b) => a.beat - b.beat || a.subdivision - b.subdivision || a.instrument.localeCompare(b.instrument));
}

export function createBillieJeanTab() {
  const result: Section[] = sections.map(([first, name], index) => {
    const last = (sections[index + 1]?.[0] ?? 145) - 1;
    const measures = Array.from({ length: last - first + 1 }, (_, offset) => {
      const bar = first + offset;
      const start = (bar - 1) * 4;
      const beatTimes = timing.beatTimes.slice(start, start + (bar === 144 ? 4 : 5));
      return {
        id: `${billieJeanTabId}-m${bar}`, order: offset + 1, globalOrder: bar,
        numerator: 4, denominator: 4 as const, startTime: beatTimes[0]!, endTime: beatTimes.at(-1)!,
        beatTimes, events: billieJeanEvents(bar),
      };
    });
    return { id: `${billieJeanTabId}-s${index + 1}`, order: index + 1, name,
      startTime: measures[0]!.startTime, endTime: measures.at(-1)!.endTime, measures };
  });
  return tabDocumentSchema.parse({ id: billieJeanTabId, sections: result });
}
