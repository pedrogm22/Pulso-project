"use client";

import { useState } from "react";
import type { BlogPost, SiteContent } from "@/lib/site-content";

export function AdminContentEditor({ initialContent }: { initialContent: SiteContent }) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  function updatePost(id: string, updates: Partial<BlogPost>) {
    setContent((current) => ({
      ...current,
      posts: current.posts.map((post) => post.id === id ? { ...post, ...updates } : post),
    }));
  }

  function addPost() {
    const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
    setContent((current) => ({
      ...current,
      posts: [{ id: crypto.randomUUID(), title: "", category: "Prática", excerpt: "", date }, ...current.posts],
    }));
    setStatus("Novo artigo adicionado. Preencha os campos e salve as alterações.");
  }

  function removePost(id: string) {
    setContent((current) => ({ ...current, posts: current.posts.filter((post) => post.id !== id) }));
  }

  async function saveContent() {
    setIsSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar as alterações.");
      setStatus("Conteúdo publicado.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="admin-content-editor">
      <section className="admin-editor-section" aria-labelledby="top-message-heading">
        <div className="admin-editor-heading">
          <div><p className="eyebrow">FAIXA PRINCIPAL</p><h2 id="top-message-heading">Mensagem do topo</h2></div>
          <span className="muted">Visível na página inicial</span>
        </div>
        <label className="editor-field">
          <span>Texto</span>
          <textarea maxLength={500} rows={4} value={content.topMessage} onChange={(event) => setContent((current) => ({ ...current, topMessage: event.target.value }))} />
          <small>{content.topMessage.length}/500</small>
        </label>
      </section>

      <section className="admin-editor-section" aria-labelledby="blog-editor-heading">
        <div className="admin-editor-heading">
          <div><p className="eyebrow">PUBLICAÇÕES</p><h2 id="blog-editor-heading">Blog</h2></div>
          <button type="button" className="button secondary" onClick={addPost}>Adicionar artigo</button>
        </div>
        {content.posts.length ? (
          <div className="admin-post-list">
            {content.posts.map((post, index) => (
              <article className="admin-post-editor" key={post.id}>
                <div className="admin-post-heading"><h3>Artigo {index + 1}</h3><button type="button" className="button ghost danger-button" onClick={() => removePost(post.id)} aria-label={`Remover ${post.title || `artigo ${index + 1}`}`}>Remover</button></div>
                <div className="admin-post-fields">
                  <label className="editor-field"><span>Título</span><input maxLength={120} value={post.title} onChange={(event) => updatePost(post.id, { title: event.target.value })} /></label>
                  <label className="editor-field"><span>Categoria</span><input maxLength={40} value={post.category} onChange={(event) => updatePost(post.id, { category: event.target.value })} /></label>
                  <label className="editor-field"><span>Data exibida</span><input maxLength={40} value={post.date} onChange={(event) => updatePost(post.id, { date: event.target.value })} /></label>
                  <label className="editor-field full-width"><span>Resumo</span><textarea maxLength={600} rows={3} value={post.excerpt} onChange={(event) => updatePost(post.id, { excerpt: event.target.value })} /></label>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="muted">Nenhum artigo publicado.</p>}
      </section>

      <div className="admin-save-bar">
        <p role="status" aria-live="polite">{status}</p>
        <button type="button" className="button" onClick={saveContent} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar e publicar"}</button>
      </div>
    </div>
  );
}
