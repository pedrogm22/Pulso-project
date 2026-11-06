import { headers } from "next/headers";
import { getAuth } from "@/lib/auth/server";
import { siteContentSchema } from "@/lib/site-content";
import { saveSiteContent } from "@/lib/site-content.server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase() ?? (process.env.NODE_ENV === "production" ? null : "admin@pulso.local");

export async function PUT(request: Request) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const email = session?.user?.email?.toLowerCase();
  if (!ADMIN_EMAIL || !session || !email || email !== ADMIN_EMAIL) {
    return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Conteúdo inválido." }, { status: 400 });
  }

  const parsed = siteContentSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Revise os campos: título, categoria, resumo e mensagem são obrigatórios." }, { status: 400 });
  }

  try {
    await saveSiteContent(parsed.data);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Não foi possível salvar o conteúdo do site.", error);
    return Response.json({ error: "Não foi possível salvar. Verifique se o banco de dados está conectado e migrado." }, { status: 503 });
  }
}
