import { describe, expect, it } from "vitest";
import { allCatalogEntries, estimateDifficulty, slugify } from "../src/features/songs/catalog-data";

describe("catalog metadata", () => {
  it("keeps the 102-song catalog free of duplicate artist/song slugs", () => {
    const keys = allCatalogEntries.map((entry) => `${slugify(entry.artist)}/${slugify(entry.title)}`);
    expect(keys).toHaveLength(100);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain("legiao-urbana/sera");
    expect(keys).not.toContain("madonna/like-a-prayer");
  });

  it("keeps missing BPM unknown while assigning the documented default difficulty", () => {
    const song = allCatalogEntries.find((entry) => entry.bpm === null);
    expect(song).toBeDefined();
    expect(song?.bpm).toBeNull();
    expect(estimateDifficulty("Rock", null)).toBe("INTERMEDIATE");
  });

  it("normalizes Portuguese names into stable URL slugs", () => {
    expect(slugify("Não Quero Dinheiro (Só Quero Amar)")).toBe("nao-quero-dinheiro-so-quero-amar");
  });

});
