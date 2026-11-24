import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Muda para true depois de configurar Google Client ID/Secret no Supabase
// (Authentication → Providers → Google). Enquanto false, o botão escondido
// evita o erro "Unsupported provider: missing OAuth secret".
const GOOGLE_LOGIN_DISPONIVEL = false;

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Entrar — Casa Inteligente" },
    { name: "description", content: "Entra ou cria a tua conta para controlar a tua casa." },
    { property: "og:title", content: "Entrar — Casa Inteligente" },
    { property: "og:description", content: "Entra ou cria a tua conta para controlar a tua casa." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});
function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    if (mode === "up") {
      if (password.length < 10) return setMsg("A palavra-passe precisa de pelo menos 10 caracteres.");
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      setMsg(error ? error.message : "Conta criada! Vê o teu email para confirmar.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setMsg("Email ou palavra-passe errados.");
      navigate({ to: "/casa" });
    }
  };
  const google = async () => {
    // OAuth direto do Supabase: funciona no PC, no telemóvel e em qualquer rede,
    // sem depender do broker do editor do Lovable.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/casa" },
    });
    if (error) {
      const t = error.message ?? "";
      if (/OAuth secret|Unsupported provider|missing/i.test(t)) {
        setMsg("O login com Google ainda não está configurado no Supabase. Entra com email e palavra-passe.");
      } else {
        setMsg(t);
      }
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-light">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        <input className="w-full rounded-md border border-border bg-background px-3 py-2" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-md border border-border bg-background px-3 py-2" type="password" required placeholder="Palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground">{mode === "in" ? "Entrar" : "Criar conta"}</button>
        {GOOGLE_LOGIN_DISPONIVEL && (
          <button type="button" onClick={google} className="w-full rounded-md border border-border px-3 py-2">Continuar com Google</button>
        )}
        <button type="button" className="w-full text-sm text-muted-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Ainda não tens conta? Criar" : "Já tens conta? Entrar"}</button>
        {mode === "in" && (
          <button type="button" onClick={() => navigate({ to: "/reset-password" })} className="w-full text-sm text-muted-foreground underline">Esqueci-me da palavra-passe</button>
        )}
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>
    </div>
  );
}
