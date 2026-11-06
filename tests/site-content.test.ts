import { describe, expect, it } from "vitest";
import { DEFAULT_BLOG_POSTS, DEFAULT_TOP_MESSAGE, normalizeTopMessage, siteContentSchema } from "../src/lib/site-content";

describe("site content", () => {
  it("provides valid default content for the public pages", () => {
    expect(siteContentSchema.parse({ topMessage: DEFAULT_TOP_MESSAGE, posts: DEFAULT_BLOG_POSTS })).toEqual({
      topMessage: DEFAULT_TOP_MESSAGE,
      posts: DEFAULT_BLOG_POSTS,
    });
  });

  it("rejects incomplete posts and content beyond the editor limits", () => {
    expect(siteContentSchema.safeParse({
      topMessage: "Mensagem válida",
      posts: [{ ...DEFAULT_BLOG_POSTS[0], title: "" }],
    }).success).toBe(false);
    expect(siteContentSchema.safeParse({ topMessage: "x".repeat(501), posts: [] }).success).toBe(false);
    expect(siteContentSchema.safeParse({ topMessage: "Mensagem válida", posts: Array(51).fill(DEFAULT_BLOG_POSTS[0]) }).success).toBe(false);
  });

  it("normalizes an empty top message to the default", () => {
    expect(normalizeTopMessage("  ")).toBe(DEFAULT_TOP_MESSAGE);
  });
});
