import { describe, expect, it } from "vitest";
import { createDemoTab, demoSongs } from "../prisma/demo";
import { createTimeline, eventSymbol } from "../src/domain/music/timeline";
import type { DrumEvent } from "../src/domain/music/document";

describe("practice timeline", () => {
  const document = createDemoTab();
  const timeline = createTimeline(document);
  it.each([[0, 1], [4.5, 2], [2.4, 2], [19.2, 9], [96, 40]])("time %s maps to measure %s", (time, measure) => {
    expect(timeline(time)?.measure.globalOrder).toBe(measure);
  });
  it("clamps the end and rejects invalid time", () => {
    expect(timeline(100)?.progress).toBe(1);
    expect(timeline(-1)).toBeNull();
    expect(() => timeline(NaN)).toThrow();
  });
  it("has no active measure during explicit gaps", () => {
    const copy = createDemoTab();
    copy.sections[0]!.measures[0]!.endTime = 2;
    expect(createTimeline(copy)(2.1)).toBeNull();
  });
  it("renders hits, silence and ghost notes at their subdivisions", () => {
    const measure = createDemoTab(demoSongs[1]).sections[0]!.measures[0]!;
    expect(eventSymbol(measure, "KICK", 0)).toBe("●");
    expect(eventSymbol(measure, "HI_HAT", 2)).toBe("×");
    expect(eventSymbol(measure, "SNARE", 7)).toBe("g");
    expect(eventSymbol(measure, "SNARE", 1)).toBe("·");
  });
  it("all three demos cover their audio duration and use distinct patterns", () => {
    for (const song of demoSongs) expect(createDemoTab(song).sections.at(-1)?.endTime).toBe(song.duration);
    const patterns = demoSongs.map((song) => JSON.stringify(createDemoTab(song).sections[0]?.measures[0]?.events));
    expect(new Set(patterns).size).toBe(3);
  });
  it.each<[DrumEvent["instrument"], DrumEvent["articulation"], string]>([
    ["OPEN_HI_HAT", "NORMAL", "○"], ["OPEN_HI_HAT", "ACCENT", "◎"],
    ["CHINA", "NORMAL", "×"], ["SPLASH", "NORMAL", "×"],
    ["CRASH", "ACCENT", "X"], ["SNARE", "ACCENT", "O"],
    ["SNARE", "RIMSHOT", "r"], ["SNARE", "CROSS_STICK", "c"],
    ["RIDE", "BELL", "b"], ["TOM_HIGH", "NORMAL", "●"],
    ["TOM_MID", "NORMAL", "●"], ["FLOOR_TOM", "NORMAL", "●"],
  ])("preserves %s / %s in notation", (instrument, articulation, symbol) => {
    const measure = createDemoTab().sections[0]!.measures[0]!;
    measure.events = [{ instrument, articulation, beat: 3, subdivision: 0.75, velocity: 90 }];
    expect(eventSymbol(measure, instrument, 11)).toBe(symbol);
    expect(eventSymbol(measure, instrument, 10)).toBe("·");
  });
});
