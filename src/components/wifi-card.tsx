import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, Smartphone } from "lucide-react";

type Conn = { effectiveType?: string; downlink?: number; rtt?: number; type?: string };

// Descreve por que tipo de rede o aparelho está ligado.
// "cellular" = dados móveis do telemóvel; "wifi" = Wi-Fi (inclui hotspot do telemóvel).
function tipoLigacao(c: Conn): { label: string; movel: boolean } {
  if (c.type === "cellular") return { label: "Dados móveis do telemóvel", movel: true };
  if (c.type === "wifi") return { label: "Wi-Fi", movel: false };
  if (c.type === "ethernet") return { label: "Rede por cabo", movel: false };
  if (c.effectiveType && /^(slow-2g|2g|3g)$/.test(c.effectiveType)) {
    return { label: `Dados móveis (${c.effectiveType})`, movel: true };
  }
  return { label: "Internet", movel: false };
}

export function WifiCard() {
  const [online, setOnline] = useState(true);
  const [info, setInfo] = useState<Conn>({});
  const [ping, setPing] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);

  const read = () => {
    setOnline(navigator.onLine);
    const c = (navigator as unknown as { connection?: Conn }).connection;
    if (c) setInfo({ effectiveType: c.effectiveType, downlink: c.downlink, rtt: c.rtt, type: c.type });
  };

  const test = async () => {
    setTesting(true);
    const t = performance.now();
    try {
      await fetch(`/favicon.png?t=${Date.now()}`, { cache: "no-store" });
      setPing(Math.round(performance.now() - t));
      setOnline(true);
    } catch {
      setPing(null);
      setOnline(false);
    }
    setTesting(false);
  };

  useEffect(() => {
    read();
    void test();
    window.addEventListener("online", read);
    window.addEventListener("offline", read);
    const c = (navigator as unknown as { connection?: EventTarget }).connection;
    c?.addEventListener?.("change", read);
    return () => {
      window.removeEventListener("online", read);
      window.removeEventListener("offline", read);
      c?.removeEventListener?.("change", read);
    };
  }, []);

  const ligacao = tipoLigacao(info);

  return (
    <div className="rounded-3xl bg-card border border-border p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${online ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
          {online ? (ligacao.movel ? <Smartphone className="w-6 h-6" /> : <Wifi className="w-6 h-6" />) : <WifiOff className="w-6 h-6" />}
        </div>
        <div>
          <div className="font-medium">Wi-Fi da casa</div>
          <div className="text-sm text-muted-foreground">
            {online ? `Ligado via ${ligacao.label}` : "Sem ligação à Internet"}
            {online && info.downlink ? ` · ${info.downlink} Mb/s` : ""}
            {online && ping !== null ? ` · ${ping} ms` : ""}
          </div>
          {online && ligacao.movel && (
            <div className="text-xs text-muted-foreground mt-0.5">A controlar a casa pela rede do telemóvel</div>
          )}
        </div>
      </div>
      <button
        onClick={test}
        className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-muted hover:bg-accent"
      >
        <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
        Testar
      </button>
    </div>
  );
}
