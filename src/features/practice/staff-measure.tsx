"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { Measure } from "@/domain/music/document";
import { percussionKeys, scoreChords, scoreDurationToVexFlow } from "@/domain/music/score";
import { measureBeatTimes } from "@/domain/music/score-timing";

let engraving: Promise<typeof import("vexflow/bravura")> | undefined;
function loadEngraving() {
  engraving ??= import("vexflow/bravura").then(async (vf) => {
    await Promise.all([document.fonts.load("16px Bravura"), document.fonts.load("16px Academico")]);
    return vf;
  });
  return engraving;
}

export const StaffMeasure = memo(function StaffMeasure({ measure }: { measure: Measure }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const host = ref.current;
    if (!host) return;
    void loadEngraving().then((vf) => {
      if (cancelled) return;
      host.replaceChildren();
      const width = 500, height = 180;
      const canvas = document.createElement("div");
      const renderer = new vf.Renderer(canvas, vf.Renderer.Backends.SVG);
      host.append(...canvas.childNodes);
      renderer.resize(width, height);
      const context = renderer.getContext();
      context.setFillStyle("#f0f1e8").setStrokeStyle("#f0f1e8");
      const stave = new vf.Stave(10, 40, width - 20);
      stave.setStyle({ strokeStyle: "#777b73", fillStyle: "#afb5aa" });
      if (measure.order === 1) stave.addClef("percussion").addTimeSignature(`${measure.numerator}/${measure.denominator}`);
      stave.setContext(context).draw();
      const chords = scoreChords(measure);
      const notes = chords.map((chord) => {
        const duration = scoreDurationToVexFlow(chord.duration);
        const note = new vf.StaveNote({ keys: chord.events.length ? chord.events.map((event) => percussionKeys[event.instrument]) : ["b/4"], duration: `${duration}${chord.events.length ? "" : "r"}`, stemDirection: vf.Stem.DOWN });
        for (const [index, event] of chord.events.entries()) {
          if (event.articulation === "GHOST") {
            note.addModifier(new vf.Parenthesis(vf.Modifier.Position.LEFT), index);
            note.addModifier(new vf.Parenthesis(vf.Modifier.Position.RIGHT), index);
          }
        }
        if (chord.events.some((event) => event.articulation === "ACCENT")) note.addModifier(new vf.Articulation("a>").setPosition(vf.Modifier.Position.ABOVE));
        return note;
      });
      const beats = measureBeatTimes(measure).length - 1;
      const voice = new vf.Voice({ numBeats: beats, beatValue: 4 }).addTickables(notes);
      const beams = vf.Beam.generateBeams(notes, { groups: [new vf.Fraction(2, 4)], stemDirection: vf.Stem.DOWN, flatBeams: true });
      new vf.Formatter().joinVoices([voice]).formatToStave([voice], stave);
      voice.draw(context, stave);
      beams.forEach((beam) => beam.setContext(context).draw());
      const svg = host.querySelector("svg")!;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.removeAttribute("width"); svg.removeAttribute("height");
      svg.style.width = "100%"; svg.style.height = "auto";
      svg.setAttribute("aria-hidden", "true");
      notes.forEach((note, index) => {
        const group = note.getSVGElement();
        if (!group) throw new Error("Missing engraved note group");
        group.classList.add("score-note");
        group.dataset.scorePosition = String(chords[index]!.position);
        group.dataset.scoreX = String(note.getAbsoluteX());
      });
      const cursor = document.createElementNS("http://www.w3.org/2000/svg", "line");
      cursor.classList.add("staff-cursor");
      cursor.setAttribute("y1", "25"); cursor.setAttribute("y2", "140");
      cursor.dataset.endX = String(stave.getNoteEndX());
      svg.append(cursor);
      host.dataset.ready = "true";
    }).catch((cause: unknown) => { if (!cancelled) { console.error("Score engraving failed", cause); setError(true); } });
    return () => { cancelled = true; host.replaceChildren(); };
  }, [measure]);
  return <span className="staff-measure" ref={ref}>{error ? "Não foi possível desenhar a partitura. Recarregue a página." : <span className="score-loading">Preparando partitura…</span>}</span>;
});
