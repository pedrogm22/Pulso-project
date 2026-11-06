export default function ForumPage() {
  return (
    <main id="main" className="content-page">
      <section className="inner-hero">
        <p className="eyebrow">FÓRUM</p>
        <h1>Troque ideias com a comunidade.</h1>
        <p className="lead">Acompanhe avisos sobre correções, melhorias e novidades do Pulso.</p>
      </section>

      <section className="forum-list">
        <article className="content-card forum-thread">
          <div>
            <span className="tag">📌 Fixado</span>
            <h2>Bugs e Atualizações</h2>
            <p>Encontrou um problema ou quer acompanhar as novidades? Deixe aqui seu relato e consulte as atualizações do Pulso.</p>
          </div>
          <div className="card-meta"><span>Tópico oficial</span></div>
        </article>
      </section>
    </main>
  );
}
