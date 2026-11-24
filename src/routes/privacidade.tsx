import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { confirmCritical } from "@/components/confirm-critical";

export const Route = createFileRoute("/privacidade")({
  ssr: false,
  head: () => ({ meta: [{ title: "Privacidade — Casa Inteligente" }] }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

  const apagar = async () => {
    const ok = await confirmCritical("Apagar a tua conta e todos os dados");
    if (!ok) return;
    // A remoção completa é feita por uma função de serviço; aqui pedimos confirmação
    // e deixamos registo para o administrador.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("audit_log").insert({ actor_id: user.id, action: "pedido_apagar_conta", details: { email: user.email } } as any);
    if (error) return setMsg(error.message);
    setMsg("Pedido registado. A tua conta será apagada pelo administrador.");
  };

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light">Política de privacidade</h1>
          <button onClick={() => navigate({ to: "/casa" })} className="rounded-full border border-border px-3 py-1">Voltar</button>
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed">
          <h2 className="text-lg">Que dados guardamos</h2>
          <p>Guardamos o teu email, nome, a lista de casas e membros, o estado das luzes e janelas, o registo de atividade (quem fez o quê e quando), as notificações e o histórico do Pomodoro.</p>
          <h2 className="text-lg">Quem vê os teus dados</h2>
          <p>Os dados da tua casa só são visíveis para os membros dessa casa e para os administradores da aplicação. Ninguém mais vê o estado da tua casa.</p>
          <h2 className="text-lg">Como apagar a tua conta</h2>
          <p>Podes pedir o apagamento da tua conta e de todos os dados associados. O pedido fica registado e é processado pelo administrador.</p>
          <button onClick={apagar} className="rounded-md bg-destructive px-4 py-2 text-destructive-foreground">Pedir apagamento da conta</button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
