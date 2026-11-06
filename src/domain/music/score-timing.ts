import type { Measure } from "./document";

/** Includes the ending boundary; a final incomplete bar can contain fewer beats. */
export function measureBeatTimes(measure: Measure): number[] {
  if (measure.beatTimes?.length) return measure.beatTimes;
  return Array.from({ length: measure.numerator + 1 }, (_, index) => measure.startTime + index * (measure.endTime - measure.startTime) / measure.numerator);
}

export function positionAtTime(measure: Measure, time: number): number {
  const beats = measureBeatTimes(measure);
  if (time <= beats[0]!) return 0;
  for (let index = 0; index < beats.length - 1; index++) {
    if (time < beats[index + 1]!) return index + (time - beats[index]!) / (beats[index + 1]! - beats[index]!);
  }
  return beats.length - 1;
}

export function timeAtPosition(measure: Measure, position: number): number {
  const beats = measureBeatTimes(measure);
  const index = Math.max(0, Math.min(beats.length - 2, Math.floor(position)));
  const fraction = Math.max(0, Math.min(1, position - index));
  return beats[index]! + fraction * (beats[index + 1]! - beats[index]!);
}
