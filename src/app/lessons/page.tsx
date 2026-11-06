import type { Metadata } from "next";
import { lessons } from "../../../prisma/learning-content";

export const metadata: Metadata = { title: "Aulas Teóricas" };

export default function LessonsPage() {
  return (
    <main id="main" className="content-page">
      <section className="inner-hero">
        <p className="eyebrow">AULAS TEÓRICAS</p>
        <h1>Aprenda os fundamentos da bateria.</h1>
        <p className="lead">Conceitos essenciais, explicados em etapas curtas para você estudar no seu ritmo.</p>
      </section>

      <section className="content-grid" aria-label="Aulas disponíveis">
        {[...lessons].sort((first, second) => first.order - second.order).map((lesson) => (
          <article className="content-card lesson-card" key={lesson.id}>
            <div>
              <span className="tag">Aula {lesson.order}</span>
              <h2>{lesson.title}</h2>
              <p>{lesson.description}</p>
            </div>
            <ol>
              {lesson.cards.map((card) => <li key={card}>{card}</li>)}
            </ol>
          </article>
        ))}
      </section>
    </main>
  );
}
