import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return setMsg("Não foi possível entrar com Google.");
    if (!r.redirected) navigate({ to: "/casa" });
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-light">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        <input className="w-full rounded-md border border-border bg-background px-3 py-2" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-md border border-border bg-background px-3 py-2" type="password" required placeholder="Palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground">{mode === "in" ? "Entrar" : "Criar conta"}</button>
        <button type="button" onClick={google} className="w-full rounded-md border border-border px-3 py-2">Continuar com Google</button>
        <button type="button" className="w-full text-sm text-muted-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Ainda não tens conta? Criar" : "Já tens conta? Entrar"}</button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>
    </div>
  );
}
