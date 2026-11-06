import Link from "next/link";

export default function NotFound() {
  return <main id="main" className="message-page"><p className="eyebrow">404</p><h1>Página não encontrada.</h1><p>Este endereço não faz parte do repertório.</p><Link className="button" href="/">Voltar ao início</Link></main>;
}
