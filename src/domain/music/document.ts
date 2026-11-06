import { z } from "zod";

export const instrumentSchema = z.enum([
  "KICK", "SNARE", "HI_HAT", "OPEN_HI_HAT", "FOOT_HI_HAT", "CRASH", "RIDE",
  "TOM_HIGH", "TOM_MID", "FLOOR_TOM", "CHINA", "SPLASH",
]);
const denominatorSchema = z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(8), z.literal(16), z.literal(32)]);
export const drumEventSchema = z.object({
  instrument: instrumentSchema,
  beat: z.number().int().positive(),
  subdivision: z.number().min(0).lt(1),
  velocity: z.number().int().min(1).max(127),
  articulation: z.enum(["NORMAL", "GHOST", "RIMSHOT", "CROSS_STICK", "ACCENT", "BELL", "FLAM"]),
  sourceSymbol: z.enum(["x", "X", "o", "f"]).nullable().optional(),
});
export const measureSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  globalOrder: z.number().int().positive(),
  startTime: z.number().nonnegative(),
  endTime: z.number().positive(),
  numerator: z.number().int().positive(),
  denominator: denominatorSchema,
  beatTimes: z.array(z.number().nonnegative()).optional(),
  events: z.array(drumEventSchema),
}).superRefine((measure, context) => {
  if (measure.endTime <= measure.startTime) context.addIssue({ code: "custom", message: "Measure must have positive duration." });
  if (measure.events.some((event) => event.beat > measure.numerator)) context.addIssue({ code: "custom", message: "Event outside measure." });
  const beats = measure.beatTimes;
  if (beats?.length) {
    if (beats.length < 2 || beats.length > measure.numerator + 1 || beats[0] !== measure.startTime || beats.at(-1) !== measure.endTime || beats.some((time, index) => index > 0 && time <= beats[index - 1]!)) context.addIssue({ code: "custom", message: "Invalid measured beat boundaries." });
    if (measure.events.some((event) => event.beat - 1 + event.subdivision >= beats.length - 1)) context.addIssue({ code: "custom", message: "Event outside partial measure." });
  }
});
export const sectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  guidance: z.string().nullable().optional(),
  lyricCue: z.string().nullable().optional(),
  order: z.number().int().positive(),
  startTime: z.number().nonnegative(),
  endTime: z.number().positive(),
  measures: z.array(measureSchema).min(1),
});

export const tabDocumentSchema = z.object({
  id: z.string().min(1),
  sections: z.array(sectionSchema).min(1),
}).superRefine((tab, context) => {
  const ids = new Set<string>();
  let lastEnd = 0;
  let globalOrder = 1;
  const report = (message: string) => context.addIssue({ code: "custom", message });
  tab.sections.forEach((section, sectionIndex) => {
    if (ids.has(section.id)) report("Duplicate section ID.");
    ids.add(section.id);
    if (section.order !== sectionIndex + 1) report("Sections must be in consecutive order.");
    if (section.startTime < lastEnd || section.endTime <= section.startTime) report("Sections overlap or have invalid duration.");
    if (section.measures[0]?.startTime !== section.startTime || section.measures.at(-1)?.endTime !== section.endTime) report("Section boundaries must match its measures.");
    section.measures.forEach((measure, index) => {
      if (ids.has(measure.id)) report("Duplicate measure ID.");
      ids.add(measure.id);
      if (measure.order !== index + 1 || measure.globalOrder !== globalOrder++) report("Measures must be in consecutive order.");
      if (measure.startTime < lastEnd || measure.startTime < section.startTime || measure.endTime > section.endTime) report("Measures overlap or exceed section boundaries.");
      lastEnd = measure.endTime;
    });
  });
});

export type DrumEvent = z.infer<typeof drumEventSchema>;
export type Measure = z.infer<typeof measureSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type TabDocument = z.infer<typeof tabDocumentSchema>;
