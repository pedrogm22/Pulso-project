import { AccountForm } from "@/features/auth/account-form";
export const metadata = { title: "Minha conta" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ register?: string }> | { register?: string } }) {
  const params = await Promise.resolve(searchParams);
  const registerDefault = params.register === "1" || params.register === "true";
  return <main id="main"><p className="eyebrow">PRATIQUE EM COMUNIDADE</p><h1 className="page-title">Minha conta</h1><AccountForm registerDefault={registerDefault} /></main>;
}
