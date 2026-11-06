import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminContentEditor } from "@/components/admin-content-editor";
import { getAuth } from "@/lib/auth/server";
import { getSiteContent } from "@/lib/site-content.server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase() ?? (process.env.NODE_ENV === "production" ? null : "admin@pulso.local");

export default async function AdminPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const email = session?.user?.email?.toLowerCase();

  if (!ADMIN_EMAIL || !session || !email || email !== ADMIN_EMAIL) {
    redirect("/account");
  }
  const content = await getSiteContent();

  return (
    <main id="main" className="content-page">
      <section className="inner-hero">
        <p className="eyebrow">ADMIN</p>
        <h1>Área administrativa</h1>
        <p className="lead">Gerencie as publicações e acompanhe a configuração da busca de vídeos.</p>
      </section>

      <section className="content-card" aria-labelledby="youtube-api-heading" style={{ marginBottom: 24 }}>
        <p className="eyebrow">INTEGRAÇÃO</p>
        <h2 id="youtube-api-heading">Busca do YouTube</h2>
        <p role="status">
          {process.env.YOUTUBE_API_KEY
            ? "Chave encontrada no ambiente do servidor. A busca está pronta para teste."
            : "A chave YOUTUBE_API_KEY ainda não está configurada no servidor."}
        </p>
        <p>
          Estimativa de configuração: <strong>10–20 minutos</strong>, incluindo a criação da chave e ativação da YouTube Data API v3 no Google Cloud. Após adicionar a chave ao ambiente e reiniciar o servidor, a busca costuma responder em poucos minutos; a ativação do Google pode demorar mais.
        </p>
        <p>A chave é configurada no ambiente do servidor e não deve ser publicada no navegador nem compartilhada aqui.</p>
        <a className="button secondary" href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Abrir credenciais do Google Cloud ↗</a>
      </section>
      <AdminContentEditor initialContent={content} />
    </main>
  );
}
