import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
export interface HomeRef { id: string; name: string; role: string }
export function useHomes() {
  const [list, setList] = useState<HomeRef[]>([]);
  const [current, setCurrent] = useState<HomeRef | null>(null);
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("home_members")
        .select("role, home_id, homes(name)")
        .eq("user_id", u.user.id)
        .is("removed_at", null);
      const homes = (data ?? []).map((m: any) => ({ id: m.home_id, name: m.homes?.name ?? "Casa", role: m.role }));
      setList(homes);
      const saved = localStorage.getItem("casa_atual");
      setCurrent(homes.find((h) => h.id === saved) ?? homes.find((h) => h.role === "owner") ?? homes[0] ?? null);
    })();
  }, []);
  const select = (id: string) => {
    localStorage.setItem("casa_atual", id);
    setCurrent(list.find((h) => h.id === id) ?? null);
  };
  return { list, current, select };
}
