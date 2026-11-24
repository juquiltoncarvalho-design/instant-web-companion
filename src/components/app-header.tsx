import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { HomeRef } from "@/lib/use-homes";

type Notificacao = { id: string; title: string; body: string | null; read: boolean; created_at: string };

export function AppHeader({ homes, current, onSelect }: { homes: HomeRef[]; current: HomeRef | null; onSelect: (id: string) => void }) {
  const navigate = useNavigate();
  const papel = current?.role === "owner" ? "Dono" : current?.role === "member" ? "Familiar" : "Visitante";
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("notifications").select("id,title,body,read,created_at").eq("read", false).order("created_at", { ascending: false }).limit(20);
      setNotificacoes((data ?? []) as Notificacao[]);
    })();
  }, []);

  const marcarLidas = async () => {
    const naoLidas = notificacoes.filter((n) => !n.read);
    if (naoLidas.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", naoLidas.map((n) => n.id));
    setNotificacoes([]);
  };

  return (
    <div className="col-span-12 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <select className="rounded-md border border-border bg-background px-2 py-1" value={current?.id ?? ""} onChange={(e) => onSelect(e.target.value)}>
          {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        {current && <span className="text-muted-foreground">{papel}</span>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate({ to: "/conta" })} className="rounded-full border border-border px-3 py-1 hover:bg-accent">Conta</button>
        <button onClick={() => navigate({ to: "/membros" })} className="rounded-full border border-border px-3 py-1 hover:bg-accent">Membros</button>
        <div className="relative">
          <button onClick={() => { setAberto(!aberto); if (!aberto) void marcarLidas(); }} className="rounded-full border border-border px-3 py-1 hover:bg-accent" title="Notificações">
            Avisos{notificacoes.length > 0 ? ` (${notificacoes.length})` : ""}
          </button>
          {aberto && notificacoes.length > 0 && (
            <div className="absolute right-0 z-50 mt-1 w-72 rounded-xl border border-border bg-card p-3 shadow-lg">
              {notificacoes.map((n) => <div key={n.id} className="border-b border-border py-1 text-xs"><strong>{n.title}</strong><div className="text-muted-foreground">{n.body}</div></div>)}
            </div>
          )}
        </div>
        <button className="rounded-full border border-border px-3 py-1 hover:bg-accent" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}>Sair</button>
      </div>
    </div>
  );
}
