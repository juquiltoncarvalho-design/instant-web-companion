import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { HomeRef } from "@/lib/use-homes";
export function AppHeader({ homes, current, onSelect }: { homes: HomeRef[]; current: HomeRef | null; onSelect: (id: string) => void }) {
  const navigate = useNavigate();
  const papel = current?.role === "owner" ? "Dono" : current?.role === "member" ? "Familiar" : "Visitante";
  return (
    <div className="col-span-12 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <select className="rounded-md border border-border bg-background px-2 py-1" value={current?.id ?? ""} onChange={(e) => onSelect(e.target.value)}>
          {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        {current && <span className="text-muted-foreground">{papel}</span>}
      </div>
      <button className="rounded-full border border-border px-3 py-1 hover:bg-accent" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}>Sair</button>
    </div>
  );
}
