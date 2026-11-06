import { expect, it } from "vitest";
import { AudioEngine } from "../src/lib/audio/audio-engine";
import { createTimeline } from "../src/domain/music/timeline";
import { createDemoTab, demoSongs } from "../prisma/demo";

it("seeks to the requested measure even when the media clock truncates to microseconds", () => {
  let mediaTime = 0;
  const media = {
    duration: 106.666667, playbackRate: 1,
    get currentTime() { return mediaTime; },
    set currentTime(time: number) { mediaTime = Math.floor(time * 1_000_000) / 1_000_000; },
    play: async () => {}, pause: () => {},
  };
  const engine = new AudioEngine(media);
  const document = createDemoTab(demoSongs[1]);
  const timeline = createTimeline(document);
  for (const section of document.sections) for (const measure of section.measures) {
    engine.seek(measure.startTime);
    expect(timeline(engine.getCurrentTime())?.measure.id).toBe(measure.id);
  }
  engine.seek(-10);
  expect(engine.getCurrentTime()).toBe(0);
  engine.seek(200);
  expect(engine.getCurrentTime()).toBe(media.duration);
});
