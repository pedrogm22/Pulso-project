import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Pulso | De Baterista Para Baterista", template: "%s | Pulso" },
  description: "Uma plataforma de estudo de bateria. Conheça a base do Pulso e sua primeira demo original.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <a className="skip-link" href="#main">Pular para o conteúdo</a>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="Pulso — início"><Logo className="brand-mark" /> pulso<span className="brand-dot">.</span></Link>
          <nav aria-label="Navegação principal">
            <Link href="/">Início</Link>
            <Link href="/search">Músicas</Link>
            <Link href="/lessons">Aulas Teóricas</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/forum">Fórum</Link>
            <Link href="/artists/pulso-studio">Pulso Studio</Link>
          </nav>
          <div className="header-auth-actions">
            <Link href="/account" className="header-auth-link">Entrar</Link>
            <Link href="/account?register=1" className="header-auth-link primary">Cadastrar</Link>
          </div>
        </header>
        {children}
        <footer><Link href="/" className="brand"><Logo className="brand-mark" /> pulso.</Link><p>Feito para quem pensa em compassos.</p><span>Preview · v0.2</span></footer>
      </body>
    </html>
  );
}
