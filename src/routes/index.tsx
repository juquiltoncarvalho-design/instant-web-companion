import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Casa Inteligente — Entrar" },
    { name: "description", content: "Controla a tua casa inteligente com a tua própria conta." },
    { property: "og:title", content: "Casa Inteligente" },
    { property: "og:description", content: "Controla a tua casa inteligente com a tua própria conta." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/casa" : "/auth" });
  },
});
