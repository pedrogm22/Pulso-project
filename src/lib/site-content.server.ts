import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getDatabase } from "@/lib/db";
import { DEFAULT_BLOG_POSTS, DEFAULT_TOP_MESSAGE, siteContentSchema, type SiteContent } from "@/lib/site-content";

const retiredDemoPostIds = new Set(["groove-estavel", "marcar-accentos", "partes-dificeis"]);

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const record = await getDatabase().siteContent.findUnique({ where: { id: "main" } });
    if (!record) return { topMessage: DEFAULT_TOP_MESSAGE, posts: DEFAULT_BLOG_POSTS };

    const parsed = siteContentSchema.safeParse({ topMessage: record.topMessage, posts: record.blogPosts });
    return parsed.success
      ? { ...parsed.data, posts: parsed.data.posts.filter((post) => !retiredDemoPostIds.has(post.id)) }
      : { topMessage: DEFAULT_TOP_MESSAGE, posts: DEFAULT_BLOG_POSTS };
  } catch (error) {
    console.warn("Banco indisponível ao carregar conteúdo editorial; usando conteúdo padrão.", error);
    return { topMessage: DEFAULT_TOP_MESSAGE, posts: DEFAULT_BLOG_POSTS };
  }
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  const parsed = siteContentSchema.parse(content);
  await getDatabase().siteContent.upsert({
    where: { id: "main" },
    create: { id: "main", topMessage: parsed.topMessage, blogPosts: parsed.posts as Prisma.InputJsonValue },
    update: { topMessage: parsed.topMessage, blogPosts: parsed.posts as Prisma.InputJsonValue },
  });
}
