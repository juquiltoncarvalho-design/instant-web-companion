import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture, Html, Environment, Lightformer } from "@react-three/drei";
import { Suspense } from "react";
import planta from "@/assets/planta.jpg";

interface Room { light: boolean; window: boolean }
interface Quarto { id: string; nome: string; cor: string }
type Pos = Record<string, { x: number; y: number }>;

const W = 10;
const D = W * (777 / 846);
const H = 1.4;
const toXZ = (p: { x: number; y: number }): [number, number] => [((p.x - 50) / 100) * W, ((p.y - 50) / 100) * D];

function Floor() {
  const tex = useTexture(planta);
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[W, D]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
}

function Walls() {
  const t = 0.12;
  const walls: Array<[number, number, number, number]> = [
    [0, -D / 2, W, t], [0, D / 2, W, t], [-W / 2, 0, t, D], [W / 2, 0, t, D],
  ];
  return (
    <>
      {walls.map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, H / 2, z]} castShadow>
          <boxGeometry args={[w, H, d]} />
          <meshStandardMaterial color="#d9d4cc" transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  );
}

export default function House3D({ quartos, rooms, lights, windows, selected, onSelect, onToggleLight, onToggleWindow }: {
  quartos: readonly Quarto[]; rooms: Record<string, Room>; lights: Pos; windows: Pos; selected: string;
  onSelect: (id: string) => void; onToggleLight: (id: string) => void; onToggleWindow: (id: string) => void;
}) {
  return (
    <div className="aspect-[846/777] w-full overflow-hidden rounded-xl bg-muted" data-scene-ready>
      <Canvas shadows camera={{ position: [0, 9, 9], fov: 45 }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 10, 4]} intensity={1.1} castShadow />
        <Environment>
          <Lightformer intensity={1.5} position={[0, 6, 0]} scale={[10, 10, 1]} />
        </Environment>
        <Suspense fallback={null}><Floor /></Suspense>
        <Walls />
        {quartos.map((q) => {
          const p = lights[q.id]; if (!p) return null;
          const [x, z] = toXZ(p); const on = rooms[q.id]?.light;
          return (
            <group key={q.id} position={[x, H + 0.3, z]}>
              <mesh onClick={(e) => { e.stopPropagation(); onToggleLight(q.id); onSelect(q.id); }} castShadow>
                <sphereGeometry args={[selected === q.id ? 0.28 : 0.22, 24, 24]} />
                <meshStandardMaterial color={q.cor} emissive={q.cor} emissiveIntensity={on ? 2.5 : 0.05} />
              </mesh>
              {on && <pointLight color={q.cor} intensity={6} distance={4} decay={1.5} />}
              <Html center position={[0, 0.5, 0]} className="pointer-events-none whitespace-nowrap rounded bg-background/80 px-1.5 text-[10px] text-foreground">{q.nome}</Html>
            </group>
          );
        })}
        {quartos.map((q) => {
          const p = windows[q.id]; if (!p) return null;
          const [x, z] = toXZ(p); const open = rooms[q.id]?.window;
          return (
            <group key={`w-${q.id}`} position={[x, 0.75, z]}>
              <mesh rotation-y={open ? Math.PI / 2.5 : 0} onClick={(e) => { e.stopPropagation(); onToggleWindow(q.id); onSelect(q.id); }}>
                <boxGeometry args={[0.7, 0.6, 0.06]} />
                <meshStandardMaterial color={open ? "#7dd3fc" : q.cor} transparent opacity={0.8} />
              </mesh>
            </group>
          );
        })}
        <OrbitControls maxPolarAngle={Math.PI / 2.1} minDistance={4} maxDistance={20} />
      </Canvas>
    </div>
  );
}
