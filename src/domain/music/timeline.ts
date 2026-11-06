import type { Measure, TabDocument } from "./document";
import { positionAtTime } from "./score-timing";

export function createTimeline(document: TabDocument) {
  const entries = document.sections.flatMap((section) => section.measures.map((measure) => ({ section, measure })));
  return (time: number) => {
    if (!Number.isFinite(time)) throw new Error("Invalid timeline time");
    let low = 0;
    let high = entries.length - 1;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (entries[middle]!.measure.startTime <= time) low = middle + 1;
      else high = middle - 1;
    }
    const entry = entries[high];
    if (!entry || (time >= entry.measure.endTime && high < entries.length - 1)) return null;
    const progress = Math.max(0, Math.min(1, (time - entry.measure.startTime) / (entry.measure.endTime - entry.measure.startTime)));
    return { ...entry, progress, beat: Math.min(entry.measure.numerator, Math.floor(positionAtTime(entry.measure, time)) + 1) };
  };
}

export function eventSymbol(measure: Measure, instrument: string, slot: number) {
  const event = measure.events.find((event) => event.instrument === instrument && Math.abs((event.beat - 1 + event.subdivision) * 4 - slot) < 0.001);
  if (!event) return "·";
  if (event.sourceSymbol) return event.sourceSymbol;
  if (event.articulation === "FLAM") return "f";
  if (event.articulation === "GHOST") return "g";
  if (event.articulation === "RIMSHOT") return "r";
  if (event.articulation === "CROSS_STICK") return "c";
  if (event.articulation === "BELL") return "b";
  if (instrument === "OPEN_HI_HAT") return event.articulation === "ACCENT" ? "◎" : "○";
  const cymbal = ["HI_HAT", "RIDE", "CRASH", "CHINA", "SPLASH"].includes(instrument);
  if (event.articulation === "ACCENT") return cymbal ? "X" : "O";
  return cymbal ? "×" : "●";
}
