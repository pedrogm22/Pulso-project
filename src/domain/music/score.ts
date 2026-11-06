import type { DrumEvent, Measure } from "./document";
import { measureBeatTimes } from "./score-timing";

/** Simultaneous hits share a stem. Positions use quarter-note beats from zero. */
export function scoreChords(measure: Measure) {
  const byPosition = new Map<number, DrumEvent[]>();
  for (const event of measure.events) {
    const position = event.beat - 1 + event.subdivision;
    byPosition.set(position, [...(byPosition.get(position) ?? []), event]);
  }
  if (!byPosition.has(0)) byPosition.set(0, []);
  const positions = [...byPosition.keys()].sort((a, b) => a - b);
  const end = measureBeatTimes(measure).length - 1;
  return positions.map((position, index) => ({
    position, duration: (positions[index + 1] ?? end) - position,
    events: byPosition.get(position)!,
  }));
}

export function scoreDurationToVexFlow(duration: number): string {
  const normalized = Number(duration.toFixed(6));
  const candidates = new Map<number, string>([
    [0.125, "32"],
    [0.1875, "32d"],
    [0.25, "16"],
    [0.375, "16d"],
    [0.5, "8"],
    [0.75, "8d"],
    [1, "4"],
    [1.5, "4d"],
    [2, "2"],
    [3, "2d"],
    [4, "1"],
    [6, "1d"],
  ]);

  const exact = candidates.get(normalized);
  if (exact) return exact;

  let closest = [...candidates.keys()][0]!;
  let smallestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates.keys()) {
    const distance = Math.abs(candidate - normalized);
    if (distance < smallestDistance) {
      closest = candidate;
      smallestDistance = distance;
    }
  }

  if (smallestDistance > 0.125) throw new Error(`Unsupported score duration: ${duration}`);
  return candidates.get(closest)!;
}

// Treble-coordinate pitches are used with the percussion clef, matching the source.
export const percussionKeys: Record<DrumEvent["instrument"], string> = {
  FOOT_HI_HAT: "d/4/X2", KICK: "f/4", FLOOR_TOM: "a/4", TOM_MID: "b/4",
  SNARE: "c/5", TOM_HIGH: "d/5", HI_HAT: "g/5/X2", OPEN_HI_HAT: "g/5/X3",
  RIDE: "f/5/X2", CRASH: "a/5/X2", CHINA: "b/5/X2", SPLASH: "a/5/X2",
};
