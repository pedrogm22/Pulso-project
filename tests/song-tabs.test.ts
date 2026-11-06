import { describe, expect, it } from "vitest";
import { createBillieJeanTab } from "../prisma/billie-jean-song";
import { createParanoidTab } from "../prisma/paranoid-song";
import { sevenNationArmySong } from "../prisma/seven-nation-army-song";

describe("song tab documents", () => {
  it("generates structured Billie Jean and Paranoid drum tabs", () => {
    const billieJean = createBillieJeanTab();
    const paranoid = createParanoidTab();

    expect(billieJean.sections.length).toBeGreaterThan(0);
    expect(billieJean.sections.flatMap((section) => section.measures).length).toBeGreaterThan(0);
    expect(paranoid.sections.length).toBeGreaterThan(0);
    expect(paranoid.sections.flatMap((section) => section.measures).length).toBeGreaterThan(0);
  });

  it("keeps Seven Nation Army's cover without exposing a local audio file or generating a tab", () => {
    expect("audioUrl" in sevenNationArmySong).toBe(false);
    expect(sevenNationArmySong.coverImage).toContain("mzstatic.com");
    expect("tabId" in sevenNationArmySong).toBe(false);
  });
});
