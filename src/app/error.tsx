"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main" className="message-page"><h1>Algo saiu do ritmo.</h1><p>Não foi possível carregar esta página. Tente novamente.</p><Button onClick={reset}>Tentar novamente</Button></main>;
}
