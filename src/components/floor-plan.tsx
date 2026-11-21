import planta from "@/assets/planta.jpg";
import { Lightbulb, AppWindow, PanelTopClose, Tv, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
const House3D = lazy(() => import("@/components/house-3d"));

interface Room {
  light: boolean;
  window: boolean;
  ac: { on: boolean };
  tv: { on: boolean };
}
interface Quarto {
  id: string;
  nome: string;
  Icon: ComponentType<{ className?: string }>;
  cor: string;
  tv: boolean;
}

const WIN: Record<string, { x: number; y: number }> = {
  quarto1: { x: 6, y: 22 },
  banheiro: { x: 54, y: 3 },
  quarto2: { x: 95, y: 24 },
  corredor: { x: 70, y: 42.9 },
  sala: { x: 8, y: 70 },
  cozinha: { x: 95, y: 75 },
};

const POS: Record<string, { x: number; y: number }> = {
  quarto1: { x: 20.7, y: 22.1 },
  banheiro: { x: 54.1, y: 10.5 },
  quarto2: { x: 80.1, y: 23.8 },
  corredor: { x: 58, y: 42.9 },
  sala: { x: 46, y: 67 },
  cozinha: { x: 87, y: 63 },
};

export function FloorPlan({
  quartos,
  rooms,
  selected,
  onSelect,
  onToggleLight,
  onSetDoor,
  onSetAll,
}: {
  quartos: readonly Quarto[];
  rooms: Record<string, Room>;
  selected: string;
  onSelect: (id: string) => void;
  onToggleLight: (id: string) => void;
  onSetDoor: (id: string, open: boolean) => void;
  onSetAll: (key: "light" | "window" | "ac" | "tv", on: boolean) => void;
}) {
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const all = (k: "light" | "window" | "ac" | "tv") =>
    quartos.filter((q) => k !== "tv" || q.tv).some((q) => {
      const r = rooms[q.id];
      if (!r) return false;
      return k === "ac" ? r.ac.on : k === "tv" ? r.tv.on : r[k];
    });
  const geral = [
    { k: "light" as const, label: "Luzes", Icon: Lightbulb },
    { k: "window" as const, label: "Janelas", Icon: AppWindow },
    { k: "tv" as const, label: "Televisões", Icon: Tv },
  ];

  return (
    <section className="col-span-12 grid grid-cols-12 gap-4">
      <nav className="col-span-12 lg:col-span-2 flex lg:flex-col gap-2 overflow-x-auto rounded-2xl border border-border bg-card/60 p-2">
        <div className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shrink-0">
          <Home className="h-4 w-4" /> Planta da Casa
        </div>
        {quartos.map((q) => (
          <button
            key={q.id}
            onClick={() => onSelect(q.id)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm shrink-0 transition ${
              selected === q.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60"
            }`}
          >
            <span style={{ color: q.cor }}><q.Icon className="h-4 w-4" /></span>
            {q.nome}
          </button>
        ))}
      </nav>

      <div className="col-span-12 lg:col-span-7 relative overflow-hidden rounded-2xl border border-border bg-card/60 p-2">
        <div className="absolute right-4 top-4 z-10 flex gap-1 rounded-full border border-border bg-background/80 p-1 text-xs">
          {(["2d", "3d"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-full px-3 py-1 font-medium ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{m.toUpperCase()}</button>
          ))}
        </div>
        {mode === "3d" && mounted ? (
          <Suspense fallback={<div className="aspect-[846/777] w-full animate-pulse rounded-xl bg-muted" />}>
            <House3D quartos={quartos} rooms={rooms} lights={POS} windows={WIN} selected={selected} onSelect={onSelect}
              onToggleLight={onToggleLight} onToggleWindow={(id) => onSetDoor(id, !rooms[id]?.window)} />
            <p className="mt-2 text-center text-xs text-muted-foreground">Arrasta para rodar, roda do rato para aproximar. Clica nas luzes e janelas.</p>
          </Suspense>
        ) : (
        <div className="relative">
          <img src={planta} alt="Planta da casa" className="w-full rounded-xl" />
          {quartos.map((q) => {
            const w = WIN[q.id];
            if (!w) return null;
            const open = rooms[q.id]?.window;
            return (
              <button
                key={`w-${q.id}`}
                onClick={() => { onSetDoor(q.id, !open); onSelect(q.id); }}
                title={`Janela - ${q.nome}`}
                aria-label={`Janela ${q.nome} ${open ? "aberta" : "fechada"}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${w.x}%`, top: `${w.y}%` }}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-md border-2 transition ${open ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
                  style={{ borderColor: q.cor }}
                >
                  {open ? <AppWindow className="h-4 w-4" /> : <PanelTopClose className="h-4 w-4" />}
                </span>
              </button>
            );
          })}
          {quartos.map((q) => {
            const p = POS[q.id];
            const on = rooms[q.id]?.light;
            if (!p) return null;
            return (
              <button
                key={q.id}
                onClick={() => { onToggleLight(q.id); onSelect(q.id); }}
                title={`Luz - ${q.nome}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <span
                  className="block h-9 w-9 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: q.cor,
                    background: on ? q.cor : "var(--background)",
                    boxShadow: on ? `0 0 28px 10px ${q.cor}` : "none",
                    opacity: on ? 1 : 0.85,
                  }}
                >
                  <Lightbulb className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
        )}
      </div>

      <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-card/60 p-4">
          <h3 className="font-medium">Janela — {quartos.find((q) => q.id === selected)?.nome}</h3>
          <p role="status" className="my-3 text-sm text-muted-foreground">{rooms[selected]?.window ? "Janela aberta" : "Janela fechada"}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={rooms[selected]?.window ? "outline" : "default"} onClick={() => onSetDoor(selected, true)} disabled={rooms[selected]?.window}>
              <AppWindow /> Abrir
            </Button>
            <Button variant={rooms[selected]?.window ? "default" : "outline"} onClick={() => onSetDoor(selected, false)} disabled={!rooms[selected]?.window}>
              <PanelTopClose /> Fechar
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <h3 className="mb-3 font-medium">Controlo Geral</h3>
          <div className="flex flex-col gap-3">
            {geral.map(({ k, label, Icon }) => {
              const on = all(k);
              return (
                <div key={k} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm">{label}</span>
                  <button
                    onClick={() => onSetAll(k, !on)}
                    className={`w-16 rounded-full px-2 py-1 text-xs font-bold transition ${
                      on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {on ? "ON" : "OFF"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <h3 className="mb-3 font-medium">Controlo por Divisão</h3>
          <div className="grid grid-cols-2 gap-2">
            {quartos.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  onSelect(q.id);
                  document.getElementById("divisoes")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 rounded-xl border border-border px-2 py-2 text-xs hover:bg-accent"
              >
                <span style={{ color: q.cor }}><q.Icon className="h-4 w-4" /></span>
                <span className="flex-1 text-left truncate">{q.nome}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
