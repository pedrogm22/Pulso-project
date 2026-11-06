import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { asciiInstruments, parseAsciiTab } from "../src/domain/music/ascii-tab";
import { createParanoidTab, paranoidSong, tabDuration } from "../prisma/paranoid-song";
import { eventSymbol } from "../src/domain/music/timeline";

const source = readFileSync(new URL("../prisma/tabs/paranoid.txt", import.meta.url), "utf8");
const options = { id: paranoidSong.tabId, bpm: paranoidSong.bpm };
const document = createParanoidTab();
const measures = document.sections.flatMap((section) => section.measures);

describe("supplied Paranoid transcription", () => {
  it("keeps all 112 bars in their ten sections without fabricated outro bars", () => {
    expect(document.sections.map((section) => section.measures.length)).toEqual([8, 8, 8, 8, 16, 8, 24, 8, 8, 16]);
    expect(measures).toHaveLength(112);
    expect(tabDuration).toBe(112 * 4 * 60 / 163);
    expect(tabDuration).toBeLessThan(paranoidSong.audioDuration);
  });
  it("matches every cell of every instrument lane against the supplied text", () => {
    // Independent scan of the source: no parser-generated fixture or hit-count-only comparison.
    const counters = new Map<string, number>();
    const rows = [...source.matchAll(/\b(Cr|Ri|Ch|Cx|T1|T2|Su|Bu)\s+(\|[-xXof|]+\|)/g)];
    expect(rows).toHaveLength(28 * 8);
    for (const [, label, notation] of rows) {
      const instrument = asciiInstruments[label as keyof typeof asciiInstruments];
      const start = counters.get(label!) ?? 0;
      const bars = notation!.slice(1, -1).split("|");
      bars.forEach((bar, offset) => {
        const measure = measures[start + offset]!;
        const actual = Array.from({ length: 16 }, (_, slot) => eventSymbol(measure, instrument, slot).replace("·", "-")).join("");
        expect(actual, `${label} compasso ${start + offset + 1}`).toBe(bar);
      });
      counters.set(label!, start + bars.length);
    }
    expect([...counters.values()]).toEqual(Array(8).fill(112));
  });
  it("preserves the intro flam, sixteenth-note fills and final rest", () => {
    expect(measures.slice(0, 3).every((measure) => !measure.events.length)).toBe(true);
    expect(measures[3]!.events).toEqual([{ instrument: "SNARE", beat: 4, subdivision: 0, velocity: 100, articulation: "FLAM", sourceSymbol: "f" }]);
    expect(measures[4]!.events.some((event) => event.instrument === "CRASH" && event.beat === 1)).toBe(true);
    expect(measures[7]!.events.filter((event) => event.instrument === "SNARE").map((event) => [event.beat, event.subdivision])).toEqual([[2, 0], [3, 0.25], [3, 0.5], [3, 0.75], [4, 0]]);
    expect(measures[39]!.events.filter((event) => event.instrument === "SNARE")).toHaveLength(11);
    expect(measures[111]!.events.some((event) => event.instrument === "SNARE")).toBe(false);
    expect(measures.flatMap((measure) => measure.events).some((event) => event.instrument === "RIDE")).toBe(false);
  });
  it("preserves X without guessing open hi-hat or accent", () => {
    expect(measures[8]!.events.find((event) => event.instrument === "HI_HAT")).toMatchObject({ sourceSymbol: "X", articulation: "NORMAL" });
  });
  it("places the supplied lyric cues in their corresponding sections", () => {
    expect(document.sections.map((section) => section.lyricCue ?? null)).toEqual([
      null,
      "Finished with my woman (...)",
      null,
      "All day long I think of things (...)",
      "Can you help me? (...)",
      "I need someone to show (...)",
      null,
      "Make a joke and I will sigh (...)",
      null,
      "And so as you hear (...)",
    ]);
  });
  it("also accepts inline instrument labels", () => {
    const inline = source.replace(/\b(Cr|Ri|Ch|Cx|T1|T2|Su|Bu)\s*\r?\n/g, "$1 ");
    expect(parseAsciiTab(inline, options)).toEqual(parseAsciiTab(source, options));
  });
  it.each([
    ["short lane", source.replace("|----------------|", "|---------------|")],
    ["missing lane", source.replace(/Ri\s+\|[-|]+\|/, "")],
    ["unknown hit", source.replace("f---", "z---")],
    ["duplicate lane", source.replace("Ri", "Cr")],
    ["nonconsecutive bars", source.replace("Compasso 5 ao 8", "Compasso 6 ao 9")],
    ["unknown lane", source.replace("Ri", "ZZ")],
  ])("rejects %s instead of silently changing notes", (_name, input) => {
    expect(() => parseAsciiTab(input, options)).toThrow();
  });
});
