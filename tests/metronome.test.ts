import { describe, expect, it } from "vitest";
import { createDemoTab } from "../prisma/demo";
import { metronomeBeats } from "../src/lib/audio/metronome";

describe("metronome beat grid", () => {
  it("creates one click per beat and accents each measure start", () => {
    const document = createDemoTab();
    const measures = document.sections.flatMap((section) => section.measures);
    const beats = metronomeBeats(document);
    expect(beats).toHaveLength(measures.reduce((total, measure) => total + measure.numerator, 0));
    expect(beats.filter((beat) => beat.accent)).toHaveLength(measures.length);
    expect(beats.slice(0, 4).map((beat) => beat.accent)).toEqual([true, false, false, false]);
    expect(beats.slice(0, 4).map((beat) => beat.time)).toEqual([
      expect.closeTo(0), expect.closeTo(0.6), expect.closeTo(1.2), expect.closeTo(1.8),
    ]);
  });

  it("derives timing from each measure rather than assuming a fixed BPM", () => {
    const document = createDemoTab();
    const measure = document.sections[0]!.measures[0]!;
    measure.numerator = 3;
    measure.endTime = 3;
    document.sections[0]!.startTime = 0;
    expect(metronomeBeats({ ...document, sections: [{ ...document.sections[0]!, measures: [measure] }] })).toEqual([
      { time: 0, accent: true }, { time: 1, accent: false }, { time: 2, accent: false },
    ]);
  });
});
