import Link from "next/link";
import { TabCreatorStudio } from "@/components/tab-creator";

export const dynamic = "force-dynamic";

export default function PulsoStudioPage() {
  return (
    <main id="main" className="content-page">
      <section className="inner-hero">
        <p className="eyebrow">PULSO STUDIO</p>
        <h1>Crie, organize e testar seu repertório.</h1>
        <p className="lead">O criador de tabs é gratuito para todos. Use o espaço para montar padrões, validar frases e preparar material para a sua prática.</p>
        <div className="editor-actions">
          <Link href="#tab-creator" className="button">Criar tab gratuitamente</Link>
          <Link href="/search" className="button secondary">Explorar repertório</Link>
        </div>
      </section>

      <div id="tab-creator">
        <TabCreatorStudio />
      </div>
    </main>
  );
}
