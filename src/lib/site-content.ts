import { z } from "zod";

export const DEFAULT_TOP_MESSAGE = "Compartilhe a ideia que está prendendo o groove do momento e mantenha este espaço sempre em sintonia.";

export function normalizeTopMessage(value?: string | null) {
  const cleanValue = value?.trim();
  return cleanValue && cleanValue.length > 0 ? cleanValue : DEFAULT_TOP_MESSAGE;
}

export const blogPostSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(40),
  excerpt: z.string().trim().min(1).max(600),
  date: z.string().trim().min(1).max(40),
});

export const siteContentSchema = z.object({
  topMessage: z.string().trim().min(1).max(500),
  posts: z.array(blogPostSchema).max(50),
});

export type BlogPost = z.infer<typeof blogPostSchema>;
export type SiteContent = z.infer<typeof siteContentSchema>;

export const DEFAULT_BLOG_POSTS: BlogPost[] = [];
