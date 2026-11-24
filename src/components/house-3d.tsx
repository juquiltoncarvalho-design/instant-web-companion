import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useRef, useState, type ComponentType } from "react";
import type { PointLight, Mesh } from "three";
import { Lightbulb, AppWindow, Tv, Sun, Sofa, Clapperboard, Moon, LogOut, Power, PanelTopClose, Users, Siren } from "lucide-react";

export interface Room3D { light: boolean; window: boolean; tv: { on: boolean } }
export interface Quarto3D { id: string; nome: string; cor: string; tv: boolean; Icon: ComponentType<{ className?: string }> }
type Rect = { x0: number; x1: number; z0: number; z1: number };

const W = 12, D = 10, H = 1.1;
// room rectangles in % of the plan
const RECTS: Record<string, [number, number, number, number]> = {
  quarto1: [0, 38, 0, 40], banheiro: [38, 62, 0, 30], quarto2: [62, 100, 0, 40],
  corredor: [38, 100, 30, 48], sala: [0, 58, 48, 100], cozinha: [58, 100, 48, 100],
};
const r3 = (id: string): Rect => {
  const [a, b, c, d] = RECTS[id] ?? [0, 10, 0, 10];
  return { x0: (a / 100 - 0.5) * W, x1: (b / 100 - 0.5) * W, z0: (c / 100 - 0.5) * D, z1: (d / 100 - 0.5) * D };
};
const FLOORS: Record<string, string> = { quarto1: "#6b4a35", quarto2: "#6b4a35", banheiro: "#9fb3bf", corredor: "#5a4636", sala: "#7a5a40", cozinha: "#8c8f94" };

function Box({ p, s, c, e, ei = 0, onClick }: { p: [number, number, number]; s: [number, number, number]; c: string; e?: string; ei?: number; onClick?: () => void }) {
  return (
    <RoundedBox args={s} radius={Math.min(0.04, ...s.map((v) => v / 2.2))} position={p} castShadow receiveShadow
      onClick={onClick ? (ev) => { ev.stopPropagation(); onClick(); } : undefined}>
      <meshStandardMaterial color={c} emissive={e ?? "#000"} emissiveIntensity={ei} roughness={0.6} />
    </RoundedBox>
  );
}

function Furniture({ id, rect, tvOn, onTV }: { id: string; rect: Rect; tvOn: boolean; onTV: () => void }) {
  const cx = (rect.x0 + rect.x1) / 2, cz = (rect.z0 + rect.z1) / 2;
  if (id.startsWith("quarto")) return (<>
    <Box p={[cx, 0.18, cz - 0.4]} s={[1.6, 0.36, 2]} c="#e8e4dc" />
    <Box p={[cx, 0.4, cz - 1.35]} s={[1.6, 0.5, 0.15]} c="#3b2a20" />
    <Box p={[cx - 1.1, 0.2, cz - 1.2]} s={[0.4, 0.4, 0.4]} c="#4a3a2e" />
    <Box p={[cx, 0.2, rect.z1 - 0.25]} s={[1.4, 0.4, 0.35]} c="#2b2b2e" />
    <Box p={[cx, 0.75, rect.z1 - 0.2]} s={id === "quarto1" ? [1.5, 0.7, 0.06] : [1.1, 0.6, 0.06]} c="#111" e={id === "quarto1" ? "#c084fc" : "#60a5fa"} ei={tvOn ? 1.8 : 0} onClick={onTV} />
    {tvOn && <pointLight position={[cx, 0.8, rect.z1 - 0.6]} color={id === "quarto1" ? "#c084fc" : "#60a5fa"} intensity={2} distance={2.5} />}
  </>);
  if (id === "sala") return (<>
    <Box p={[cx - 0.8, 0.22, cz + 0.6]} s={[2.4, 0.44, 0.9]} c="#c9c4bb" />
    <Box p={[cx - 0.8, 0.15, cz - 0.4]} s={[1.2, 0.3, 0.7]} c="#5b4030" />
    <Box p={[cx - 0.8, 0.25, rect.z0 + 0.35]} s={[2.2, 0.5, 0.4]} c="#2b2b2e" />
    <Box p={[cx - 0.8, 0.85, rect.z0 + 0.4]} s={[1.8, 0.8, 0.06]} c="#111" e="#f472b6" ei={tvOn ? 1.6 : 0} onClick={onTV} />
  </>);
  if (id === "cozinha") return (<>
    <Box p={[rect.x1 - 0.4, 0.45, cz]} s={[0.6, 0.9, 3.2]} c="#d6d3cf" />
    <Box p={[cx - 0.3, 0.4, cz]} s={[1.4, 0.8, 0.9]} c="#3f3f46" />
    <Box p={[cx - 0.3, 0.45, rect.z1 - 0.3]} s={[0.9, 0.6, 0.06]} c="#111" e="#4ade80" ei={tvOn ? 1.6 : 0} onClick={onTV} />
  </>);
  if (id === "banheiro") return (<>
    <Box p={[cx - 0.6, 0.25, cz - 0.3]} s={[0.8, 0.5, 1.6]} c="#f4f4f5" />
    <Box p={[cx + 0.7, 0.4, rect.z0 + 0.3]} s={[0.7, 0.8, 0.4]} c="#e4e4e7" />
  </>);
  return <Box p={[cx + 1, 0.4, cz]} s={[0.5, 0.8, 0.5]} c="#3b3b40" />;
}

function RoomMesh({ q, room, selected, occupied, onSelect, onLight, onWindow, onTV }: {
  q: Quarto3D; room: Room3D; selected: boolean; occupied: boolean; onSelect: () => void; onLight: () => void; onWindow: () => void; onTV: () => void;
}) {
  const r = r3(q.id); const w = r.x1 - r.x0, d = r.z1 - r.z0; const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2; const t = 0.1;
  const outerZ = r.z0 <= -D / 2 + 0.01 ? r.z0 : r.z1 >= D / 2 - 0.01 ? r.z1 : null;
  const outerX = r.x0 <= -W / 2 + 0.01 ? r.x0 : r.x1 >= W / 2 - 0.01 ? r.x1 : null;
  return (
    <group>
      <mesh position={[cx, 0.01, cz]} rotation-x={-Math.PI / 2} receiveShadow onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <planeGeometry args={[w - 0.05, d - 0.05]} />
        <meshStandardMaterial color={FLOORS[q.id] ?? "#555"} emissive={q.cor} emissiveIntensity={selected ? 0.12 : 0} roughness={0.8} />
      </mesh>
      {[[cx, r.z0, w, t], [cx, r.z1, w, t]].map(([x, z, a, b], i) => <Box key={`h${i}`} p={[x!, H / 2, z!]} s={[a!, H, b!]} c="#f1eee8" />)}
      {[[r.x0, cz, t, d], [r.x1, cz, t, d]].map(([x, z, a, b], i) => <Box key={`v${i}`} p={[x!, H / 2, z!]} s={[a!, H, b!]} c="#f1eee8" />)}
      <Furniture id={q.id} rect={r} tvOn={q.tv && room.tv.on} onTV={onTV} />
      {/* ceiling light */}
      <group position={[cx, H + 0.35, cz]}>
        <mesh onClick={(e) => { e.stopPropagation(); onLight(); }}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color={room.light ? "#ffd27a" : "#d4d4d8"} emissive="#ffb347" emissiveIntensity={room.light ? 3 : 0} />
        </mesh>
        {room.light && <pointLight color="#ffb35c" intensity={9} distance={5} decay={1.4} position={[0, -0.3, 0]} />}
      </group>
      {/* window on outer wall */}
      {(outerZ !== null || outerX !== null) && (
        <group position={outerZ !== null ? [cx, 0.7, outerZ] : [outerX!, 0.7, cz]} rotation-y={outerZ !== null ? 0 : Math.PI / 2}>
          <mesh position={[room.window ? 0.3 : 0, 0, 0]} rotation-y={room.window ? -0.9 : 0} onClick={(e) => { e.stopPropagation(); onWindow(); }}>
            <boxGeometry args={[0.9, 0.55, 0.14]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={room.window ? 1.2 : 0.15} transparent opacity={0.75} />
          </mesh>
          <Html center position={[0, 0.55, 0]} zIndexRange={[10, 0]}>
            <button onClick={onWindow} className="whitespace-nowrap rounded-full border border-border bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">
              {room.window ? "Aberta" : "Fechada"}
            </button>
          </Html>
        </group>
      )}
      <Html center position={[cx, H + 0.8, cz]} zIndexRange={[10, 0]}>
        <div className="pointer-events-none flex items-center gap-1 whitespace-nowrap rounded-full border border-border bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: q.cor }} />{q.nome}{occupied && " · Movimento"}
        </div>
      </Html>
    </group>
  );
}

function SirenBeacon({ on, onClick }: { on: boolean; onClick: () => void }) {
  const l = useRef<PointLight>(null); const m = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const k = on ? (Math.sin(clock.elapsedTime * 12) > 0 ? 1 : 0.1) : 0;
    if (l.current) l.current.intensity = k * 25;
    if (m.current) m.current.rotation.y = clock.elapsedTime * (on ? 8 : 0);
  });
  return (
    <group position={[0, H + 0.3, 0.2]}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick(); }}><cylinderGeometry args={[0.22, 0.28, 0.12, 24]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh ref={m} position={[0, 0.18, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ef4444" emissive="#ff2020" emissiveIntensity={on ? 3 : 0.2} transparent opacity={0.9} />
      </mesh>
      <pointLight ref={l} color="#ff2a2a" intensity={0} distance={12} decay={1.2} position={[0, 0.4, 0]} />
    </group>
  );
}

const SCENES = [
  { k: "morning", label: "Bom dia", Icon: Sun }, { k: "cozy", label: "Aconchego", Icon: Sofa },
  { k: "cinema", label: "Cinema", Icon: Clapperboard }, { k: "night", label: "Noite", Icon: Moon }, { k: "leaving", label: "Sair de casa", Icon: LogOut },
] as const;
export type Scene3D = (typeof SCENES)[number]["k"];

function DeviceCard({ on, Icon, title, sub, cor, onClick, right }: { on: boolean; Icon: ComponentType<{ className?: string }>; title: string; sub: string; cor: string; onClick: () => void; right?: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-2xl border p-3 text-left transition"
      style={on ? { borderColor: cor, background: `color-mix(in oklab, ${cor} 18%, var(--card))`, boxShadow: `0 0 24px -6px ${cor}` } : { borderColor: "var(--border)", background: "var(--card)" }}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: on ? cor : "var(--muted)", color: on ? "var(--background)" : "var(--muted-foreground)" }}><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{title}</span><span className="block truncate text-xs text-muted-foreground">{sub}</span></span>
      {right && <span className="text-xs font-bold">{right}</span>}
    </button>
  );
}

export default function House3D({ quartos, rooms, presence, selected, onSelect, onToggleLight, onToggleWindow, onToggleTV, onScene, onAllOff, onBack, sirenOn, onSiren }: {
  quartos: readonly Quarto3D[]; rooms: Record<string, Room3D>; presence: Record<string, boolean>; selected: string;
  onSelect: (id: string) => void; onToggleLight: (id: string) => void; onToggleWindow: (id: string) => void; onToggleTV: (id: string) => void;
  onScene: (s: Scene3D) => void; onAllOff: () => void; onBack: () => void; sirenOn: boolean; onSiren: () => void;
}) {
  const [filter, setFilter] = useState<string>("todos");
  const get = (id: string): Room3D => rooms[id] ?? { light: false, window: false, tv: { on: false } };
  const lightsOn = quartos.filter((q) => get(q.id).light).length;
  const winOpen = quartos.filter((q) => get(q.id).window).length;
  const tvs = quartos.filter((q) => q.tv); const tvOn = tvs.filter((q) => get(q.id).tv.on).length;
  const activeCount = (id: string) => { const r = get(id); return (r.light ? 1 : 0) + (r.window ? 1 : 0) + (r.tv.on ? 1 : 0); };
  const shown = quartos.filter((q) => filter === "todos" || q.id === filter);

  return (
    <section className="col-span-12 grid grid-cols-12 overflow-hidden rounded-3xl border border-border bg-[oklch(0.2_0.03_275)]">
      <div className="relative col-span-12 lg:col-span-8 min-h-[340px] lg:min-h-[520px]">
        <div className="absolute left-4 top-4 z-10">
          <h2 className="text-2xl font-semibold">A minha casa</h2>
          <p className="text-sm text-muted-foreground"><span className="text-primary">●</span> {lightsOn} de {quartos.length} luzes acesas · {winOpen} janelas abertas</p>
        </div>
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <button onClick={onBack} className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold">Ver em 2D</button>
          <button onClick={onSiren} title="Sirene" className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${sirenOn ? "animate-pulse bg-destructive text-destructive-foreground" : "border border-destructive/60 bg-background/80 text-destructive"}`}><Siren className="h-4 w-4" />{sirenOn ? "Desligar sirene" : "Sirene"}</button>
          <button onClick={onAllOff} title="Desligar tudo" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40"><Power className="h-4 w-4" /></button>
        </div>
        <div className="absolute inset-0" data-scene-ready>
          <Canvas shadows camera={{ position: [0, 13, 12], fov: 45 }} dpr={[1, 1.75]}>
            <color attach="background" args={["#1b1d2e"]} />
            <ambientLight intensity={0.3} color="#8b8fd9" />
            <directionalLight position={[6, 12, 6]} intensity={0.7} castShadow shadow-mapSize={[1024, 1024]} />
            <Environment resolution={64}><Lightformer intensity={0.8} position={[0, 6, 0]} scale={[12, 12, 1]} /></Environment>
            <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#23263b" /></mesh>
            {quartos.map((q) => (
              <RoomMesh key={q.id} q={q} room={get(q.id)} selected={selected === q.id} occupied={!!presence[q.id]}
                onSelect={() => onSelect(q.id)} onLight={() => { onToggleLight(q.id); onSelect(q.id); }}
                onWindow={() => { onToggleWindow(q.id); onSelect(q.id); }} onTV={() => { if (q.tv) { onToggleTV(q.id); onSelect(q.id); } }} />
            ))}
            <SirenBeacon on={sirenOn} onClick={onSiren} />
            <OrbitControls maxPolarAngle={Math.PI / 2.2} minDistance={6} maxDistance={22} enableDamping />
          </Canvas>
        </div>
        <p className="absolute bottom-3 left-0 right-0 z-10 text-center text-xs text-muted-foreground">Arrasta para rodar · roda para aproximar · clica nas luzes, janelas e TVs</p>
      </div>

      <aside className="col-span-12 lg:col-span-4 flex max-h-[720px] flex-col gap-4 overflow-y-auto border-l border-border bg-[oklch(0.17_0.03_275)] p-4">
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-5">
          {SCENES.map(({ k, label, Icon }) => (
            <button key={k} onClick={() => onScene(k)} className="flex flex-col items-center gap-1 rounded-xl p-2 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"><Icon className="h-4 w-4" />{label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[{ id: "todos", nome: "Todos" }, ...quartos].map((q) => {
            const n = q.id === "todos" ? 0 : activeCount(q.id);
            return (
              <button key={q.id} onClick={() => { setFilter(q.id); if (q.id !== "todos") onSelect(q.id); }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${filter === q.id ? "bg-accent text-foreground" : "text-muted-foreground"}`}>
                {q.nome}{n > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{n}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex-1">Casa toda</span>
          <span className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1"><Lightbulb className="h-3.5 w-3.5 text-primary" />{lightsOn}/{quartos.length}</span>
          <span className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1"><Tv className="h-3.5 w-3.5 text-primary" />{tvOn}/{tvs.length}</span>
          <span className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1"><Users className="h-3.5 w-3.5 text-primary" />{Object.values(presence).filter(Boolean).length}</span>
        </div>
        {shown.map((q) => {
          const r = get(q.id);
          return (
            <div key={q.id} className="flex flex-col gap-2">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{q.nome}</h4>
              <div className="grid grid-cols-2 gap-2">
                <DeviceCard on={r.light} Icon={Lightbulb} title={`Luz — ${q.nome}`} sub={r.light ? "Ligada" : "Desligada"} cor="oklch(0.85 0.17 85)" onClick={() => onToggleLight(q.id)} />
                <DeviceCard on={r.window} Icon={r.window ? AppWindow : PanelTopClose} title="Janela" sub={r.window ? "Aberta" : "Fechada"} cor="oklch(0.8 0.12 200)" onClick={() => onToggleWindow(q.id)} />
                {q.tv && <DeviceCard on={r.tv.on} Icon={Tv} title="Televisão" sub={r.tv.on ? "Ligada" : "Desligada"} cor="oklch(0.7 0.2 0)" onClick={() => onToggleTV(q.id)} />}
                <DeviceCard on={!!presence[q.id]} Icon={Users} title="Presença" sub={q.nome} cor="oklch(0.78 0.17 145)" onClick={() => onSelect(q.id)} right={presence[q.id] ? "Movimento" : "Vazio"} />
              </div>
            </div>
          );
        })}
      </aside>
    </section>
  );
}
