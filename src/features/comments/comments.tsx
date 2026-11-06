"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth/client";
import { postComment, deleteComment } from "./actions";

type CommentData = { id: string; body: string; userId: string; name: string; date: string };
export function Comments({ songId, comments }: { songId: string; comments: CommentData[] }) {
  const { data: session } = authClient.useSession();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return <section className="content-panel comments"><h2>Comentários da tab</h2><p>Compartilhe uma dúvida ou uma dica sobre esta tab com outros bateristas.</p>
    {session ? <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const body = String(new FormData(form).get("body")); startTransition(async () => { try { const result = await postComment({ songId, body }); setMessage(result.error ?? "Comentário publicado."); if (result.success) form.reset(); } catch { setMessage("Não foi possível publicar. Tente novamente."); } }); }}><label htmlFor="comment-body">Seu comentário</label><textarea id="comment-body" name="body" required minLength={3} maxLength={1500} rows={3} /><button className="button" disabled={pending}>{pending ? "Enviando…" : "Publicar comentário"}</button></form> : <p><Link className="catalog-link" href="/account">Entre ou crie uma conta para comentar ↗</Link></p>}
    <p role="status">{message}</p>
    {!comments.length && <p className="muted">Seja a primeira pessoa a comentar.</p>}
    {comments.map((comment) => <article key={comment.id} className="comment"><strong>{comment.name}</strong><span className="muted"> {comment.date}</span><p>{comment.body}</p>{session?.user.id === comment.userId && <button className="secondary-button" disabled={pending} onClick={() => startTransition(async () => { try { const result = await deleteComment(comment.id); setMessage(result.error ?? "Comentário excluído."); } catch { setMessage("Não foi possível excluir."); } })}>Excluir meu comentário</button>}</article>)}
    {comments.length === 50 && <p className="small-note">Mostrando os 50 comentários mais recentes.</p>}
  </section>;
}
