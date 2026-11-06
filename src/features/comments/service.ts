import "server-only";
import { getDatabase } from "@/lib/db";

export async function listSongComments(songId: string) {
  try {
    const comments = await getDatabase().comment.findMany({
      where: { songId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return comments.map((comment) => ({
      id: comment.id,
      userId: comment.userId,
      name: comment.user.name?.trim() || "Baterista",
      body: comment.body,
      date: new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(comment.createdAt),
    }));
  } catch (error) {
    console.warn("Não foi possível carregar os comentários desta tab.", error);
    return [];
  }
}
