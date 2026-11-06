import { getSiteContent } from "@/lib/site-content.server";

export async function TopMessage() {
  const { topMessage } = await getSiteContent();

  return (
    <section className="top-message" aria-label="Mensagem principal">
      <p className="eyebrow">MENSAGEM DO PULSO</p>
      <div className="top-editor-message">{topMessage}</div>
    </section>
  );
}
