import type { Measure } from "@/domain/music/document";
import { measureBeatTimes, positionAtTime } from "@/domain/music/score-timing";

export function clearScoreHighlight(element: HTMLElement | null | undefined) {
  element?.querySelectorAll(".is-current-note").forEach((note) => note.classList.remove("is-current-note"));
  element?.querySelector(".staff-cursor")?.classList.remove("is-visible");
}

/** Update the engraved note groups from the audio clock, without redrawing the score. */
export function followScore(element: HTMLElement, measure: Measure, time: number) {
  const groups = Array.from(element.querySelectorAll<SVGElement>("[data-score-position]"));
  if (!groups.length) return;
  if (time < measure.startTime || time >= measure.endTime) { clearScoreHighlight(element); return; }
  const position = positionAtTime(measure, time);
  let index = groups.findLastIndex((note) => Number(note.dataset.scorePosition) <= position);
  index = Math.max(0, index);
  groups.forEach((note, i) => note.classList.toggle("is-current-note", i === index));
  const cursor = element.querySelector<SVGLineElement>(".staff-cursor");
  if (!cursor) return;
  const current = groups[index]!;
  const next = groups[index + 1];
  const startPosition = Number(current.dataset.scorePosition);
  const endPosition = next ? Number(next.dataset.scorePosition) : measureBeatTimes(measure).length - 1;
  const startX = Number(current.dataset.scoreX);
  const endX = Number(next?.dataset.scoreX ?? cursor.dataset.endX);
  const x = startX + (endX - startX) * (position - startPosition) / (endPosition - startPosition);
  cursor.setAttribute("x1", String(x)); cursor.setAttribute("x2", String(x)); cursor.classList.add("is-visible");
}
