import { tabDocumentSchema, type DrumEvent, type Section } from "./document";

export const asciiInstruments = {
  Cr: "CRASH", Ri: "RIDE", Ch: "HI_HAT", Cx: "SNARE",
  T1: "TOM_HIGH", T2: "TOM_MID", Su: "FLOOR_TOM", Bu: "KICK",
} as const;

/** Imports the supplied format: numbered blocks, eight lanes, 16 slots per 4/4 bar.
 * x/X are preserved verbatim: without a legend they do not imply an accent or open hat.
 * Timing and velocity are defaults, not measurements from the recording.
 */
export function parseAsciiTab(text: string, options: { id: string; bpm: number }) {
  if (!Number.isFinite(options.bpm) || options.bpm <= 0) throw new Error("BPM inválido.");
  const sections: Section[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  const time = (bar: number) => bar * 4 * 60 / options.bpm;
  let nextMeasure = 1;
  let block: { first: number; last: number; lanes: Set<string> } | undefined;
  const finishBlock = () => {
    if (block && block.lanes.size !== Object.keys(asciiInstruments).length) {
      throw new Error(`Compasso ${block.first}: faltam linhas de instrumentos.`);
    }
    block = undefined;
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!.trim();
    if (!line) continue;
    const heading = /^Compasso\s+(\d+)\s+ao\s+(\d+):+$/i.exec(line);
    if (heading) {
      finishBlock();
      const first = Number(heading[1]);
      const last = Number(heading[2]);
      const section = sections.at(-1);
      if (!section || first !== nextMeasure || last < first) throw new Error(`Bloco de compassos inválido: ${line}`);
      block = { first, last, lanes: new Set() };
      for (let order = first; order <= last; order++) {
        section.measures.push({
          id: `${options.id}-measure-${order}`, order: section.measures.length + 1,
          globalOrder: order, startTime: time(order - 1), endTime: time(order),
          numerator: 4, denominator: 4, events: [],
        });
      }
      section.endTime = time(last);
      nextMeasure = last + 1;
      continue;
    }
    if (line.endsWith(":")) {
      finishBlock();
      sections.push({ id: `${options.id}-section-${sections.length + 1}`, name: line.replace(/:+$/, ""),
        order: sections.length + 1, startTime: time(nextMeasure - 1), endTime: time(nextMeasure - 1), measures: [] });
      continue;
    }
    const lane = /^(Cr|Ri|Ch|Cx|T1|T2|Su|Bu)(?:\s+(.*))?$/.exec(line);
    if (lane) {
      const label = lane[1] as keyof typeof asciiInstruments;
      if (!block || block.lanes.has(label)) throw new Error(`Linha repetida ou fora de bloco: ${label}`);
      let notation = lane[2];
      while (!notation && index + 1 < lines.length) notation = lines[++index]!.trim();
      if (!notation || !/^\|[-xXof|]+\|$/.test(notation)) throw new Error(`Notação inválida: ${label}, compasso ${block.first}`);
      const bars = notation.slice(1, -1).split("|");
      if (bars.length !== block.last - block.first + 1 || bars.some((bar) => bar.length !== 16)) {
        throw new Error(`Linha ${label}, compasso ${block.first}: esperados 16 caracteres por compasso.`);
      }
      const section = sections.at(-1)!;
      const offset = section.measures.length - bars.length;
      bars.forEach((bar, barIndex) => {
        [...bar].forEach((symbol, slot) => {
          if (symbol === "-") return;
          section.measures[offset + barIndex]!.events.push({
            instrument: asciiInstruments[label], beat: Math.floor(slot / 4) + 1,
            subdivision: (slot % 4) / 4, velocity: 100,
            articulation: symbol === "f" ? "FLAM" : "NORMAL",
            sourceSymbol: symbol as DrumEvent["sourceSymbol"],
          });
        });
      });
      block.lanes.add(label);
      continue;
    }
    const section = sections.at(-1);
    if (section && section.measures.length === 0 && !block) {
      section.lyricCue = line;
      continue;
    }
    // Count guides may wrap onto a second line in pasted text; they are not note lanes.
    if (line.includes("|") && !/^[\d\s|e+a&]+$/.test(line)) throw new Error(`Linha de tab não reconhecida: ${line}`);
  }
  finishBlock();
  return tabDocumentSchema.parse({ id: options.id, sections });
}
