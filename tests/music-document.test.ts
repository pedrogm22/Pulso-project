import { describe, expect, it } from "vitest";
import { createDemoTab, demo } from "../prisma/demo";
import { tabDocumentSchema } from "../src/domain/music/document";
import { scoreDurationToVexFlow } from "../src/domain/music/score";
import { readDatabaseEnvironment } from "../src/lib/validation/env";

describe("original demo document", () => {
  it("covers all five sections with forty contiguous measures and structured events", () => {
    const tab = createDemoTab();
    const measures = tab.sections.flatMap((section) => section.measures);
    expect(tab.sections.map((section) => section.name)).toEqual(["Introdução", "Verso", "Refrão", "Ponte", "Saída"]);
    expect(measures).toHaveLength(40);
    expect(measures[0]?.startTime).toBe(0);
    expect(measures.at(-1)?.endTime).toBe(demo.duration);
    expect(measures.flatMap((measure) => measure.events)).toHaveLength(481);
    for (let index = 1; index < measures.length; index++) expect(measures[index]?.startTime).toBe(measures[index - 1]?.endTime);
  });

  it.each(["overlap", "duration", "event", "order", "duplicate", "section-boundary"])("rejects invalid %s", (kind) => {
    const tab = createDemoTab();
    const section = tab.sections[0]!;
    const first = section.measures[0]!;
    const second = section.measures[1]!;
    if (kind === "overlap") second.startTime = first.endTime - 0.1;
    if (kind === "duration") first.endTime = first.startTime;
    if (kind === "event") first.events[0]!.beat = 5;
    if (kind === "order") second.globalOrder = 1;
    if (kind === "duplicate") second.id = first.id;
    if (kind === "section-boundary") section.endTime += 1;
    expect(tabDocumentSchema.safeParse(tab).success).toBe(false);
  });

  it("accepts explicit uneven timestamps and silence between measures", () => {
    const tab = createDemoTab();
    tab.sections[0]!.measures[0]!.endTime = 2.051;
    tab.sections[0]!.measures[1]!.startTime = 2.103;
    expect(tabDocumentSchema.safeParse(tab).success).toBe(true);
  });

  it("rejects nonfinite timestamps and invalid velocity", () => {
    const tab = createDemoTab();
    tab.sections[0]!.measures[0]!.startTime = Number.NaN;
    tab.sections[0]!.measures[0]!.events[0]!.velocity = 128;
    expect(tabDocumentSchema.safeParse(tab).success).toBe(false);
  });
});

describe("database environment", () => {
  it("requires a direct PostgreSQL URL without exposing credentials in errors", () => {
    expect(() => readDatabaseEnvironment({})).toThrow("DATABASE_URL");
    expect(() => readDatabaseEnvironment({ DATABASE_URL: "mysql://user:secret@host/db" })).toThrow("DATABASE_URL ausente ou inválida.");
    expect(readDatabaseEnvironment({ DATABASE_URL: "postgresql://localhost/pulso" }).DATABASE_URL).toBe("postgresql://localhost/pulso");
  });

  it("maps fractional beat values into supported VexFlow durations", () => {
    expect(scoreDurationToVexFlow(0.25)).toBe("16");
    expect(scoreDurationToVexFlow(0.5)).toBe("8");
    expect(scoreDurationToVexFlow(0.75)).toBe("8d");
    expect(scoreDurationToVexFlow(1)).toBe("4");
    expect(scoreDurationToVexFlow(1.5)).toBe("4d");
    expect(scoreDurationToVexFlow(2)).toBe("2");
  });
});
