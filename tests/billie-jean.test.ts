import { describe, expect, it } from "vitest";
import { createBillieJeanTab } from "../prisma/billie-jean-song";
import { scoreChords } from "../src/domain/music/score";
import { measureBeatTimes, positionAtTime, timeAtPosition } from "../src/domain/music/score-timing";
import { metronomeBeats } from "../src/lib/audio/metronome";
import { tabDocumentSchema } from "../src/domain/music/document";

const tab = createBillieJeanTab();
const measures = tab.sections.flatMap((section) => section.measures);
const bar = (number: number) => measures[number - 1]!;
const hits = (number: number, instrument: string) => bar(number).events.filter((event) => event.instrument === instrument).map((event) => [event.beat, event.subdivision, event.articulation]);

describe("Billie Jean score transcribed from the supplied PDF", () => {
  it("retains all 144 bars and the source section boundaries", () => {
    expect(measures).toHaveLength(144);
    expect(tab.sections.map((section) => section.measures[0]!.globalOrder)).toEqual([1, 15, 27, 35, 43, 55, 67, 75, 83, 91, 103, 115, 127, 135]);
    expect(hits(1, "KICK")).toEqual([[1, 0, "NORMAL"], [3, 0, "NORMAL"]]);
    expect(hits(1, "SNARE")).toEqual([[2, 0, "NORMAL"], [4, 0, "NORMAL"]]);
    expect(hits(1, "HI_HAT")).toHaveLength(8);
  });
  it("preserves the two distinct snare pickups and the tom-fill placements", () => {
    expect(hits(34, "SNARE")).toContainEqual([4, 0.75, "GHOST"]);
    expect(hits(74, "SNARE")).toEqual([[2, 0, "NORMAL"], [4, 0, "NORMAL"], [4, 0.5, "GHOST"], [4, 0.75, "ACCENT"]]);
    for (const number of [44, 84, 90, 92, 102, 114, 116, 126, 130, 136]) expect(hits(number, "FLOOR_TOM")).toEqual([[3, 0.75, "ACCENT"]]);
    for (const number of [108, 128]) expect(hits(number, "TOM_HIGH")).toEqual([[3, 0.75, "ACCENT"]]);
    expect(hits(45, "FLOOR_TOM")).toEqual([]);
    expect(scoreChords(bar(44)).map(({ position, duration }) => [position, duration])).toEqual([[0, .5], [.5, .5], [1, .5], [1.5, .5], [2, .5], [2.5, .25], [2.75, .25], [3, .5], [3.5, .5]]);
  });
  it("preserves open hats, foot closures and crashes without duplicate closed hats", () => {
    expect(hits(82, "OPEN_HI_HAT").map(([beat, subdivision]) => [beat, subdivision])).toEqual([[1, .5], [2, .5], [3, .5], [4, .5]]);
    expect(hits(82, "FOOT_HI_HAT")).toHaveLength(4);
    expect(hits(43, "CRASH")).toEqual([[1, 0, "NORMAL"]]);
    expect(hits(43, "HI_HAT")).not.toContainEqual([1, 0, "NORMAL"]);
    expect(hits(110, "OPEN_HI_HAT")).toEqual([[4, .5, "ACCENT"]]);
  });
  it("aligns 575 beats and the incomplete last bar, without stretching to nominal BPM", () => {
    expect(metronomeBeats(tab)).toHaveLength(575);
    expect(bar(1).startTime).toBeCloseTo(.122, 2);
    expect(bar(121).startTime).toBeCloseTo(245.528, 2);
    expect(bar(144).endTime).toBeCloseTo(294.025, 2);
    expect(measureBeatTimes(bar(144))).toHaveLength(4);
    expect(hits(144, "HI_HAT")).toHaveLength(6);
    expect(hits(144, "SNARE")).toEqual([[2, 0, "NORMAL"]]);
    for (const measure of measures) for (const chord of scoreChords(measure)) {
      const time = timeAtPosition(measure, chord.position);
      expect(time).toBeGreaterThanOrEqual(measure.startTime);
      expect(time).toBeLessThan(measure.endTime);
      expect(positionAtTime(measure, time)).toBeCloseTo(chord.position, 7);
    }
  });
  it("rejects beat grids that could highlight the wrong note", () => {
    const broken = structuredClone(tab);
    broken.sections[0]!.measures[0]!.beatTimes![2] = 0;
    expect(tabDocumentSchema.safeParse(broken).success).toBe(false);
  });
});
