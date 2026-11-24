import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Recuperar palavra-passe — Casa Inteligente" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/conta" });
    setMsg(error ? error.message : "Enviámos um link de recuperação para o teu email.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <form onSubmit={enviar} className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-light">Recuperar palavra-passe</h1>
        <input className="w-full rounded-md border border-border bg-background px-3 py-2" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground">Enviar link</button>
        <button type="button" onClick={() => navigate({ to: "/auth" })} className="w-full text-sm text-muted-foreground">Voltar ao login</button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>
    </div>
  );
}
