import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/conta")({
  ssr: false,
  head: () => ({ meta: [{ title: "A minha conta — Casa Inteligente" }] }),
  component: ContaPage,
});

function ContaPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [msg, setMsg] = useState("");
  const [password, setPassword] = useState("");
  const [aMostrarMfa, setAMostrarMfa] = useState(false);
  const [fatorEnrolado, setFatorEnrolado] = useState(false);
  const [qr, setQr] = useState("");
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
      setNome(p?.display_name ?? "");
      const { data: factors } = await supabase.auth.mfa.listFactors();
      setFatorEnrolado((factors?.totp ?? []).some((f) => f.status === "verified"));
    })();
  }, []);

  const guardarNome = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ display_name: nome }).eq("id", user.id);
    setMsg(error ? error.message : "Nome guardado.");
  };

  const alterarPalavraPasse = async () => {
    if (password.length < 10) return setMsg("A palavra-passe precisa de pelo menos 10 caracteres.");
    const { error } = await supabase.auth.updateUser({ password });
    setMsg(error ? error.message : "Palavra-passe alterada.");
    if (!error) setPassword("");
  };

  const comecarMfa = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Casa Inteligente" });
    if (error) return setMsg(error.message);
    setQr(data.totp.qr_code);
    setAMostrarMfa(true);
    (window as unknown as { __mfaFactorId?: string }).__mfaFactorId = data.id;
  };

  const confirmarMfa = async () => {
    const factorId = (window as unknown as { __mfaFactorId?: string }).__mfaFactorId;
    if (!factorId) return setMsg("Comece a configuração primeiro.");
    const { data: challenge, error: e1 } = await supabase.auth.mfa.challenge({ factorId });
    if (e1) return setMsg(e1.message);
    const { error: e2 } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: codigo });
    if (e2) return setMsg(e2.message);
    setMsg("Verificação em dois passos ativada.");
    setFatorEnrolado(true);
    setAMostrarMfa(false);
    setQr("");
  };

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light">A minha conta</h1>
          <button onClick={() => navigate({ to: "/casa" })} className="rounded-full border border-border px-3 py-1">Voltar</button>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg">Dados</h2>
          <div className="text-sm text-muted-foreground">Email: {email || "—"}</div>
          <input className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Nome a mostrar" value={nome} onChange={(e) => setNome(e.target.value)} />
          <button onClick={guardarNome} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Guardar nome</button>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg">Palavra-passe</h2>
          <input className="w-full rounded-md border border-border bg-background px-3 py-2" type="password" placeholder="Nova palavra-passe (mín. 10 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={alterarPalavraPasse} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Alterar palavra-passe</button>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg">Verificação em dois passos (2FA)</h2>
          <p className="text-sm text-muted-foreground">
            {fatorEnrolado ? "Já tens 2FA ativo na tua conta." : "Protege a tua conta com um código de uma app de autenticação."}
          </p>
          {!fatorEnrolado && !aMostrarMfa && (
            <button onClick={comecarMfa} className="rounded-md border border-border px-4 py-2">Ativar 2FA</button>
          )}
          {aMostrarMfa && qr && (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Código QR para a app de autenticação" className="h-48 w-48 rounded bg-white p-2" />
              <input className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Código de 6 dígitos" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
              <button onClick={confirmarMfa} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Confirmar</button>
            </div>
          )}
        </div>

        <button onClick={() => navigate({ to: "/privacidade" })} className="text-sm text-muted-foreground underline">Política de privacidade e apagar conta</button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </div>
    </div>
  );
}
