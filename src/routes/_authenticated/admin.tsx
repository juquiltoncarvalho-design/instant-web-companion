import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Administração — Casa Inteligente" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!data) throw new Error("Sem permissão de administrador.");
  },
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [perfis, setPerfis] = useState<any[]>([]);
  const [casas, setCasas] = useState<any[]>([]);
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const carregar = async () => {
    const [p, c, a] = await Promise.all([
      supabase.from("profiles").select("id,email,display_name,blocked,created_at").order("created_at", { ascending: false }),
      supabase.from("homes").select("id,name,owner_id,created_at").order("created_at", { ascending: false }),
      supabase.from("audit_log").select("id,action,created_at,actor_id,home_id").order("created_at", { ascending: false }).limit(50),
    ]);
    setPerfis(p.data ?? []);
    setCasas(c.data ?? []);
    setAuditoria(a.data ?? []);
  };

  useEffect(() => { void carregar(); }, []);

  const bloquear = async (id: string, bloqueado: boolean) => {
    const { error } = await supabase.from("profiles").update({ blocked: !bloqueado }).eq("id", id);
    setMsg(error ? error.message : bloqueado ? "Conta desbloqueada." : "Conta bloqueada.");
    if (!error) void carregar();
  };

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light">Painel de administrador</h1>
          <button onClick={() => navigate({ to: "/casa" })} className="rounded-full border border-border px-3 py-1">Voltar</button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg">Utilizadores ({perfis.length})</h2>
          <div className="space-y-1 text-sm">
            {perfis.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 border-b border-border py-2">
                <span>{p.display_name || p.email || p.id} {p.blocked && <span className="text-destructive">(bloqueado)</span>}</span>
                <button onClick={() => bloquear(p.id, p.blocked)} className="text-sm underline">{p.blocked ? "Desbloquear" : "Bloquear"}</button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg">Casas ({casas.length})</h2>
          <div className="space-y-1 text-sm">
            {casas.map((c) => <div key={c.id} className="border-b border-border py-1">{c.name} · dono: {c.owner_id}</div>)}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg">Registo geral</h2>
          <div className="space-y-1 text-sm">
            {auditoria.map((a) => <div key={a.id} className="flex justify-between border-b border-border py-1"><span>{a.action}</span><span className="text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-PT")}</span></div>)}
          </div>
        </div>

        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </div>
    </div>
  );
}
