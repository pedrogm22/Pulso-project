"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuth } from "@/lib/auth/server";
import { getDatabase } from "@/lib/db";

const commentSchema = z.object({ songId: z.string().min(1).max(120), body: z.string().trim().min(3).max(1500) });

export async function postComment(input: unknown) {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { error: "Escreva entre 3 e 1.500 caracteres." };
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session || !session.user?.id) return { error: "Entre na sua conta para comentar." };
  const database = getDatabase();
  const song = await database.song.findUnique({ where: { id: parsed.data.songId }, include: { artist: true } });
  if (!song) return { error: "Música não encontrada." };
  // Atomic shared-database bucket; concurrent requests cannot bypass the limit.
  const bucket = Math.floor(Date.now() / 60000);
  const rate = await database.rateLimit.upsert({ where: { key: `comments:${session.user.id}:${bucket}` }, create: { key: `comments:${session.user.id}:${bucket}`, count: 1, lastRequest: BigInt(Date.now()) }, update: { count: { increment: 1 }, lastRequest: BigInt(Date.now()) } });
  if (rate.count > 3) return { error: "Aguarde um minuto antes de comentar novamente." };
  await database.comment.create({ data: { ...parsed.data, userId: session.user.id } });
  await database.rateLimit.deleteMany({ where: { key: { startsWith: "comments:" }, lastRequest: { lt: BigInt(Date.now() - 86400000) } } });
  revalidatePath(`/songs/${song.artist.slug}/${song.slug}`);
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session || !session.user?.id) return { error: "Entre na sua conta." };
  const comment = await getDatabase().comment.findFirst({ where: { id: commentId, userId: session.user.id }, include: { song: { include: { artist: true } } } });
  if (!comment) return { error: "Comentário não encontrado." };
  await getDatabase().comment.deleteMany({ where: { id: comment.id, userId: session.user.id } });
  revalidatePath(`/songs/${comment.song.artist.slug}/${comment.song.slug}`);
  return { success: true };
}
