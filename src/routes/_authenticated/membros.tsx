import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHomes } from "@/lib/use-homes";
import { confirmCritical } from "@/components/confirm-critical";

export const Route = createFileRoute("/_authenticated/membros")({
  ssr: false,
  head: () => ({ meta: [{ title: "Membros da casa — Casa Inteligente" }] }),
  component: MembrosPage,
});

type Membro = { id: string; user_id: string; role: string; added_at: string; removed_at: string | null; profiles?: { email: string | null; display_name: string | null } };
type Convite = { id: string; email: string; role: string; created_at: string; accepted_at: string | null };
type Auditoria = { id: string; action: string; created_at: string; actor_id: string | null; profiles?: { email: string | null; display_name: string | null } | null };

function MembrosPage() {
  const navigate = useNavigate();
  const { current } = useHomes();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [auditoria, setAuditoria] = useState<Auditoria[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "viewer">("member");
  const [msg, setMsg] = useState("");
  const souDono = current?.role === "owner";

  const carregar = async () => {
    if (!current) return;
    const [m, i, a] = await Promise.all([
      supabase.from("home_members").select("id,user_id,role,added_at,removed_at,profiles(email,display_name)").eq("home_id", current.id).is("removed_at", null),
      souDono ? supabase.from("home_invites").select("id,email,role,created_at,accepted_at").eq("home_id", current.id) : Promise.resolve({ data: [] as Convite[] }),
      supabase.from("audit_log").select("id,action,created_at,actor_id,profiles(email,display_name)").eq("home_id", current.id).order("created_at", { ascending: false }).limit(30),
    ]);
    setMembros((m.data ?? []) as unknown as Membro[]);
    setConvites((i.data ?? []) as unknown as Convite[]);
    setAuditoria((a.data ?? []) as unknown as Auditoria[]);
  };

  useEffect(() => { void carregar(); }, [current?.id, souDono]);

  const convidar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !email.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("home_invites").insert({ home_id: current.id, email: email.trim().toLowerCase(), role, created_by: user.id } as any);
    setMsg(error ? error.message : `Convite enviado para ${email}.`);
    if (!error) { setEmail(""); void carregar(); }
  };

  const remover = async (m: Membro) => {
    if (!current) return;
    const ok = await confirmCritical("Remover este membro da casa");
    if (!ok) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("home_members").update({ removed_at: new Date().toISOString(), removed_by: user?.id ?? null }).eq("id", m.id);
    // (removed_by preenchido com o utilizador atual)
    setMsg(error ? error.message : "Membro removido.");
    if (!error) void carregar();
  };

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light">Membros da casa</h1>
          <button onClick={() => navigate({ to: "/casa" })} className="rounded-full border border-border px-3 py-1">Voltar</button>
        </div>
        <p className="text-sm text-muted-foreground">{current?.name ?? "—"} · {souDono ? "Dono" : "Sem permissão para gerir membros"}</p>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg">Quem tem acesso</h2>
          <div className="space-y-2">
            {membros.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                <span>{m.profiles?.display_name || m.profiles?.email || m.user_id}</span>
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground">{m.role === "owner" ? "Dono" : m.role === "member" ? "Familiar" : "Visitante"}</span>
                  {souDono && m.role !== "owner" && <button onClick={() => remover(m)} className="text-destructive underline">Remover</button>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {souDono && (
          <form onSubmit={convidar} className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg">Convidar familiar</h2>
            <input className="w-full rounded-md border border-border bg-background px-3 py-2" type="email" required placeholder="Email do familiar" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className="w-full rounded-md border border-border bg-background px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as "member" | "viewer")}>
              <option value="member">Familiar — pode controlar</option>
              <option value="viewer">Visitante — só vê</option>
            </select>
            <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Enviar convite</button>
            {convites.length > 0 && (
              <div className="pt-2 text-sm text-muted-foreground">
                Convites pendentes: {convites.filter((c) => !c.accepted_at).map((c) => c.email).join(", ")}
              </div>
            )}
          </form>
        )}

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg">Registo de atividade</h2>
          <div className="space-y-1 text-sm">
            {auditoria.map((a) => (
              <div key={a.id} className="flex justify-between gap-3 border-b border-border py-1">
                <span>{a.action}</span>
                <span className="text-muted-foreground">{a.profiles?.display_name || a.profiles?.email || "Alguém"} · {new Date(a.created_at).toLocaleString("pt-PT")}</span>
              </div>
            ))}
            {auditoria.length === 0 && <p className="text-muted-foreground">Ainda não há atividade registada.</p>}
          </div>
        </div>

        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </div>
    </div>
  );
}
