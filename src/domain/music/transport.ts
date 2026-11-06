import type { TabDocument } from "./document";
import { measureBeatTimes } from "./score-timing";

export type LoopRegion = { start: number; end: number };
export function transportTime(offset: number, elapsed: number, rate: number, duration: number, loop: LoopRegion | null) {
  const raw = offset + Math.max(0, elapsed) * rate;
  if (loop && raw >= loop.end) return loop.start + (raw - loop.start) % (loop.end - loop.start);
  return Math.min(duration, raw);
}
export function timelineBeats(document: TabDocument) {
  return document.sections.flatMap((section) => section.measures.flatMap((measure) => measureBeatTimes(measure).slice(0, -1).map((time, index) => ({ time, accent: index === 0 }))));
}
