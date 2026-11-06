import { tabDocumentSchema, type DrumEvent } from "../src/domain/music/document";

export const demo = {
  artistId: "demo-pulso-studio", artistName: "Pulso Studio", artistSlug: "pulso-studio",
  songId: "demo-primeiro-pulso", title: "Primeiro pulso", slug: "primeiro-pulso",
  tabId: "demo-primeiro-pulso-v1", audioId: "demo-primeiro-pulso-backing",
  bpm: 100, duration: 96, audioUrl: "/audio/primeiro-pulso.wav",
} as const;

/** Original teaching patterns; no transcription of a commercial recording. */
export type DemoSong = Omit<typeof demo, "songId" | "title" | "slug" | "tabId" | "audioId" | "bpm" | "duration" | "audioUrl"> & {
  songId: string; title: string; slug: string; tabId: string; audioId: string;
  bpm: number; duration: number; audioUrl: string; style: "rock" | "funk" | "pop";
};

export const demoSongs: DemoSong[] = [
  { ...demo, style: "rock" },
  { ...demo, songId: "demo-groove-da-noite", title: "Groove da noite", slug: "groove-da-noite", tabId: "demo-groove-da-noite-v1", audioId: "demo-groove-da-noite-backing", bpm: 90, duration: 160 * 60 / 90, audioUrl: "/audio/groove-da-noite.wav", style: "funk" },
  { ...demo, songId: "demo-luz-da-manha", title: "Luz da manhã", slug: "luz-da-manha", tabId: "demo-luz-da-manha-v1", audioId: "demo-luz-da-manha-backing", bpm: 120, duration: 80, audioUrl: "/audio/luz-da-manha.wav", style: "pop" },
];

export function createDemoTab(song: DemoSong = demoSongs[0]!) {
  let globalOrder = 0;
  const sections = ["Introdução", "Verso", "Refrão", "Ponte", "Saída"].map((name, sectionIndex) => ({
    id: `${song.tabId}-section-${sectionIndex + 1}`,
    name, order: sectionIndex + 1,
    startTime: sectionIndex * 32 * 60 / song.bpm, endTime: (sectionIndex + 1) * 32 * 60 / song.bpm,
    measures: Array.from({ length: 8 }, (_, index) => {
      const absoluteIndex = globalOrder++;
      const events: DrumEvent[] = [];
      for (let beat = 1; beat <= 4; beat++) {
        for (const subdivision of [0, 0.5]) events.push({ instrument: sectionIndex === 2 ? "RIDE" : "HI_HAT", beat, subdivision, velocity: 80, articulation: "NORMAL" });
        events.push({ instrument: beat % 2 === 1 ? "KICK" : "SNARE", beat, subdivision: 0, velocity: 100, articulation: "NORMAL" });
      }
      if (sectionIndex === 2 && index === 0) events.push({ instrument: "CRASH", beat: 1, subdivision: 0, velocity: 110, articulation: "ACCENT" });
      if (song.style === "funk") {
        events.push({ instrument: "KICK", beat: 3, subdivision: 0.75, velocity: 100, articulation: "NORMAL" });
        events.push({ instrument: "SNARE", beat: 2, subdivision: 0.75, velocity: 45, articulation: "GHOST" });
      }
      if (song.style === "pop") {
        events.push({ instrument: "KICK", beat: 2, subdivision: 0, velocity: 95, articulation: "NORMAL" });
        events.push({ instrument: "KICK", beat: 4, subdivision: 0, velocity: 95, articulation: "NORMAL" });
      }
      return {
        id: `${song.tabId}-measure-${absoluteIndex + 1}`,
        order: index + 1, globalOrder: absoluteIndex + 1,
        // Integer arithmetic avoids tiny discrepancies at shared boundaries.
        startTime: absoluteIndex * 4 * 60 / song.bpm, endTime: (absoluteIndex + 1) * 4 * 60 / song.bpm,
        numerator: 4, denominator: 4, events,
      };
    }),
  }));
  return tabDocumentSchema.parse({ id: song.tabId, sections });
}
