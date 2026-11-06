import { describe, expect, it } from "vitest";
import { DEFAULT_TOP_MESSAGE, normalizeTopMessage } from "../src/lib/site-content";

describe("site top editor", () => {
  it("keeps a trimmed message and falls back to a default value when empty", () => {
    expect(normalizeTopMessage("   Novo estudo de groove   ")).toBe("Novo estudo de groove");
    expect(normalizeTopMessage("   ")).toBe(DEFAULT_TOP_MESSAGE);
    expect(normalizeTopMessage("")).toBe(DEFAULT_TOP_MESSAGE);
  });
});
