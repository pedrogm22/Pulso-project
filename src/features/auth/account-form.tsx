"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function AccountForm({ registerDefault = false }: { registerDefault?: boolean }) {
  const { data: session, isPending } = authClient.useSession();
  const [register, setRegister] = useState(registerDefault);
  const [lastDefault, setLastDefault] = useState(registerDefault);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (lastDefault !== registerDefault) {
    setLastDefault(registerDefault);
    setRegister(registerDefault);
  }

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setMessage("");
    try {
      const client = authClient as typeof authClient & {
        signIn: {
          social: (options: { provider: "google"; callbackURL?: string; newUserCallbackURL?: string }) => Promise<{ error?: { message?: string } | null }>;
        };
      };

      const response = await client.signIn.social({ provider: "google", callbackURL: "/search", newUserCallbackURL: "/account" });
      if (response?.error) {
        setMessage("O Google ainda não está configurado para esta instalação. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.");
      }
    } catch (error) {
      const description = error instanceof Error ? error.message : "Google indisponível no momento.";
      setMessage(description);
    } finally {
      setBusy(false);
    }
  };

  if (isPending) return <p role="status">Carregando conta…</p>;
  if (session) return <div className="content-panel"><h2>Olá, {session.user.name}.</h2><p>Você já pode comentar nas músicas.</p><a className="button" href="/search">Escolher uma música</a><button className="secondary-button" onClick={async () => { await authClient.signOut(); }}>Sair da conta</button></div>;
  return <form className="account-form" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")), password = String(data.get("password"));
    try {
      const response = register ? await authClient.signUp.email({ email, password, name: String(data.get("name")) }) : await authClient.signIn.email({ email, password });
      if (response.error) setMessage(register ? "Não foi possível criar a conta. Verifique os dados ou tente entrar." : "Não foi possível entrar. Verifique e-mail e senha.");
    } catch { setMessage("Serviço indisponível. Tente novamente."); } finally { setBusy(false); }
  }}>
    <h2>{register ? "Crie sua conta" : "Entre na sua conta"}</h2>
    {register && <label>Seu nome<input name="name" required minLength={2} maxLength={60} autoComplete="name" /></label>}
    <label>E-mail<input name="email" type="email" required autoComplete="email" maxLength={254} /></label>
    <label>Senha (mínimo de 10 caracteres)<input name="password" type="password" required minLength={10} maxLength={128} autoComplete={register ? "new-password" : "current-password"} /></label>
    <p role="status">{message}</p>
    <div className="auth-actions">
      <button className="button" disabled={busy}>{busy ? "Aguarde…" : register ? "Criar conta" : "Entrar"}</button>
      <button type="button" className="button secondary" onClick={handleGoogleSignIn} disabled={busy}>Entrar com Google</button>
    </div>
    <button type="button" className="secondary-button" onClick={() => { setRegister(!register); setMessage(""); }}>{register ? "Já tenho conta" : "Quero criar uma conta"}</button>
    <p className="small-note">Use uma senha exclusiva. Recuperação por e-mail ainda não foi configurada nesta prévia.</p>
  </form>;
}
