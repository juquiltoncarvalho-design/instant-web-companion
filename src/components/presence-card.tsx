import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
const NOMES: Record<string, string> = { sala: "Sala", quarto1: "Quarto Principal", quarto2: "Quarto 2", cozinha: "Cozinha", banheiro: "Casa de Banho", corredor: "Corredor" };
export function PresenceCard({ homeId, canControl }: { homeId: string | null; canControl: boolean }) {
  const [rows, setRows] = useState<{ room: string; occupied: boolean }[]>([]);
  useEffect(() => {
    if (!homeId) return;
    const load = async () => {
      const { data } = await supabase.from("presence_sensors").select("room, occupied").eq("home_id", homeId);
      setRows(data ?? []);
    };
    void load();
    const ch = supabase.channel(`presence_${homeId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "presence_sensors", filter: `home_id=eq.${homeId}` }, () => void load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [homeId]);
  const toggle = async (room: string, occupied: boolean) => {
    setRows((r) => r.map((x) => (x.room === room ? { ...x, occupied } : x)));
    await supabase.from("presence_sensors").update({ occupied, source: "manual" }).eq("home_id", homeId!).eq("room", room);
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 font-medium">Quem está em casa</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {rows.map((r) => (
          <button key={r.room} disabled={!canControl} onClick={() => toggle(r.room, !r.occupied)}
            className={`rounded-xl px-3 py-2 text-left text-xs ${r.occupied ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {NOMES[r.room] ?? r.room}<br />{r.occupied ? "Alguém presente" : "Vazio"}
          </button>
        ))}
      </div>
    </div>
  );
}
