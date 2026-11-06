import { getSiteContent } from "@/lib/site-content.server";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const { posts } = await getSiteContent();

  return (
    <main id="main" className="content-page">
      <section className="inner-hero">
        <p className="eyebrow">BLOG</p>
        <h1>{posts.length ? "Notas de estudo e ideias de prática." : "Blog em preparação."}</h1>
        <p className="lead">{posts.length ? "Conteúdo editorial do Pulso." : "Ainda não há publicações. Novos artigos serão publicados pela administração do Pulso."}</p>
      </section>
      {posts.length ? <section className="content-grid">
        {posts.map((post) => <article key={post.id} className="content-card">
          <span className="tag">{post.category}</span>
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
          <div className="card-meta"><span>{post.date}</span></div>
        </article>)}
      </section> : null}
    </main>
  );
}
