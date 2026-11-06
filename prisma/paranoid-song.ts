import { readFileSync } from "node:fs";
import path from "node:path";
import { parseAsciiTab } from "../src/domain/music/ascii-tab";

// Notes come from the text supplied by the user (see tabs/paranoid.txt).
// Tempo confirmed by the user. Audio alignment is still approximate.
export const paranoidSong = {
  songId: "song-paranoid", title: "Paranoid", slug: "paranoid",
  artistId: "artist-black-sabbath", artistName: "Black Sabbath", artistSlug: "black-sabbath",
  tabId: "song-paranoid-v1", audioId: "song-paranoid-drumless",
  audioUrl: "/audio/black-sabbath-paranoid.mp3", audioDuration: 169.308,
  bpm: 163, timeSignatureNumerator: 4, timeSignatureDenominator: 4,
  genre: "Metal", difficulty: "INTERMEDIATE" as const, releaseYear: 1970,
} as const;

export function createParanoidTab() {
  const source = readFileSync(path.join(process.cwd(), "prisma", "tabs", "paranoid.txt"), "utf8");
  const document = parseAsciiTab(source, { id: paranoidSong.tabId, bpm: paranoidSong.bpm });
  document.sections[0]!.guidance = "Tab convertida do texto fornecido (112 compassos). Sincronização aproximada a 163 BPM; ainda não conferida com a gravação.";
  return document;
}

export const tabDuration = createParanoidTab().sections.at(-1)!.endTime;
