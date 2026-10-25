import { FloorPlan } from "@/components/floor-plan";
import { Button } from "@/components/ui/button";
import { WifiCard } from "@/components/wifi-card";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Lightbulb,
  BedDouble,
  ChefHat,
  Sofa,
  Bath,
  DoorOpen,
  Tv,
  Snowflake,
  Send,
  Loader2,
  Mic,
  MicOff,
  Timer,
  Sun,
  Moon,
  LogOut,
  Wifi,
  Blinds,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Siren,
  Flame,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmergencySiren } from "@/lib/emergency-siren";
import { GlassWeatherCard } from "@/components/glass-weather-card";

// ---------------- Types ----------------
interface RoomState {
  light: boolean;
  window: boolean;
  doorAuto: boolean;
  ac: { on: boolean; temp: number };
  tv: { on: boolean; channel: number; volume: number; mute: boolean };
}

interface HomeState {
  rooms: Record<string, RoomState>;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface ActivityEntry {
  id: string;
  ts: number;
  text: string;
  kind: "light" | "window" | "ac" | "tv" | "scene" | "ai";
}

// ---------------- Constants ----------------
const QUARTOS = [
  { id: "sala", nome: "Sala de Estar", Icon: Sofa, cor: "oklch(0.72 0.17 55)", tv: true },
  { id: "quarto1", nome: "Quarto Principal", Icon: BedDouble, cor: "oklch(0.68 0.2 300)", tv: true },
  { id: "quarto2", nome: "Quarto 2", Icon: BedDouble, cor: "oklch(0.72 0.17 350)", tv: true },
  { id: "cozinha", nome: "Cozinha", Icon: ChefHat, cor: "oklch(0.75 0.17 140)", tv: true },
  { id: "banheiro", nome: "Casa de Banho", Icon: Bath, cor: "oklch(0.75 0.13 200)", tv: false },
  { id: "corredor", nome: "Corredor", Icon: DoorOpen, cor: "oklch(0.8 0.15 90)", tv: false },
] as const;

const CANAIS_TV = ["SIC", "TVI", "RTP1", "Sport TV", "Disney", "CNN", "Netflix", "HBO"];

function defaultRoom(): RoomState {
  return {
    light: false,
    window: false,
    doorAuto: true,
    ac: { on: false, temp: 22 },
    tv: { on: false, channel: 1, volume: 20, mute: false },
  };
}

function defaultHome(): HomeState {
  return {
    rooms: Object.fromEntries(QUARTOS.map((q) => [q.id, defaultRoom()])),
  };
}

function greeting(hour: number): string {
  if (hour < 6) return "Boa madrugada";
  if (hour < 13) return "Bom dia";
  if (hour < 20) return "Boa tarde";
  return "Boa noite";
}

// ---------------- Hook: realtime home state ----------------
function useHomeState() {
  const [state, setState] = useState<HomeState>(defaultHome);
  const [ready, setReady] = useState(false);
  const localVersion = useRef(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from("home_state").select("state").eq("id", 1).maybeSingle();
      if (!mounted) return;
      const remote = (data?.state as HomeState | undefined) ?? null;
      const merged: HomeState = remote?.rooms
        ? { rooms: { ...defaultHome().rooms, ...remote.rooms } }
        : defaultHome();
      setState(merged);
      setReady(true);
    })();

    const ch = supabase
      .channel("home_state_rt")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "home_state" },
        (payload) => {
          const newState = (payload.new as { state: HomeState }).state;
          if (newState?.rooms) {
            setState({ rooms: { ...defaultHome().rooms, ...newState.rooms } });
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const push = useCallback(async (next: HomeState) => {
    localVersion.current += 1;
    setState(next);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("home_state").upsert({ id: 1, state: next as any, updated_at: new Date().toISOString() });
  }, []);

  return { state, ready, push };
}

// ---------------- Component ----------------
function Dashboard() {
  const { state, push } = useHomeState();
  const [now, setNow] = useState(new Date());
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou a Ana, a assistente da tua casa inteligente. Diz-me, por exemplo: \"Ana, acende a luz da sala\", \"modo noite\", \"inicia o Pomodoro\" ou \"sirene de emergência\".",
      ts: Date.now(),
    },
  ]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("sala");
  const [sirenOn, setSirenOn] = useState(false);
  const sirenRef = useRef<EmergencySiren | null>(null);

  const setSiren = useCallback((on: boolean) => {
    if (!sirenRef.current) sirenRef.current = new EmergencySiren();
    if (on) {
      sirenRef.current.start();
      // Liga automaticamente para o número de emergência (Portugal)
      setTimeout(() => {
        window.location.href = "tel:+351923346087";
      }, 300);
    } else sirenRef.current.stop();
    setSirenOn(on);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const logActivity = useCallback((text: string, kind: ActivityEntry["kind"]) => {
    setActivity((prev) => [{ id: crypto.randomUUID(), ts: Date.now(), text, kind }, ...prev].slice(0, 25));
  }, []);

  // ------------- Mutators -------------
  const updateRoom = useCallback(
    (roomId: string, fn: (r: RoomState) => RoomState) => {
      const next: HomeState = { ...state, rooms: { ...state.rooms, [roomId]: fn(state.rooms[roomId] ?? defaultRoom()) } };
      void push(next);
    },
    [state, push],
  );
  const updateRoomRef = useRef(updateRoom);
  updateRoomRef.current = updateRoom;

  const toggleLight = (roomId: string) => {
    const cur = state.rooms[roomId] ?? defaultRoom();
    updateRoom(roomId, (r) => ({ ...r, light: !r.light }));
    const room = QUARTOS.find((q) => q.id === roomId);
    logActivity(`Luz ${cur.light ? "apagada" : "acesa"} - ${room?.nome ?? roomId}`, "light");
  };
  const toggleWindow = (roomId: string) => {
    const cur = state.rooms[roomId] ?? defaultRoom();
    updateRoom(roomId, (r) => ({ ...r, window: !r.window }));
    const room = QUARTOS.find((q) => q.id === roomId);
    logActivity(`Porta ${cur.window ? "fechada" : "aberta"} - ${room?.nome ?? roomId}`, "window");
    if (!cur.window && (cur.doorAuto ?? true)) {
      window.setTimeout(() => {
        updateRoom(roomId, (r) => ({ ...r, window: false }));
        logActivity(`Porta fechada automaticamente - ${room?.nome ?? roomId}`, "window");
      }, 30000);
    }
  };
  const setDoorAuto = (roomId: string, auto: boolean) => {
    updateRoom(roomId, (r) => ({ ...r, doorAuto: auto }));
    const room = QUARTOS.find((q) => q.id === roomId);
    logActivity(`Porta em modo ${auto ? "automático" : "manual"} - ${room?.nome ?? roomId}`, "window");
  };
  const toggleAC = (roomId: string) => {
    const cur = state.rooms[roomId] ?? defaultRoom();
    updateRoom(roomId, (r) => ({ ...r, ac: { ...r.ac, on: !r.ac.on } }));
    const room = QUARTOS.find((q) => q.id === roomId);
    logActivity(`AC ${cur.ac.on ? "desligado" : "ligado"} - ${room?.nome ?? roomId}`, "ac");
  };
  const setACTemp = (roomId: string, delta: number) => {
    updateRoom(roomId, (r) => ({ ...r, ac: { ...r.ac, temp: Math.max(16, Math.min(30, r.ac.temp + delta)) } }));
  };
  const toggleTV = (roomId: string) => {
    const cur = state.rooms[roomId] ?? defaultRoom();
    updateRoom(roomId, (r) => ({ ...r, tv: { ...r.tv, on: !r.tv.on } }));
    const room = QUARTOS.find((q) => q.id === roomId);
    logActivity(`TV ${cur.tv.on ? "desligada" : "ligada"} - ${room?.nome ?? roomId}`, "tv");
  };
  const changeChannel = (roomId: string, delta: number) => {
    updateRoom(roomId, (r) => ({ ...r, tv: { ...r.tv, channel: ((r.tv.channel - 1 + delta + CANAIS_TV.length) % CANAIS_TV.length) + 1 } }));
  };
  const changeVolume = (roomId: string, delta: number) => {
    updateRoom(roomId, (r) => ({ ...r, tv: { ...r.tv, volume: Math.max(0, Math.min(100, r.tv.volume + delta)) } }));
  };
  const toggleMute = (roomId: string) => {
    updateRoom(roomId, (r) => ({ ...r, tv: { ...r.tv, mute: !r.tv.mute } }));
  };

  const applyScene = (scene: "morning" | "night" | "leaving") => {
    const next: HomeState = { ...state, rooms: { ...state.rooms } };
    for (const q of QUARTOS) {
      const r = { ...(next.rooms[q.id] ?? defaultRoom()) };
      if (scene === "morning") {
        r.light = q.id === "sala" || q.id === "cozinha";
        r.window = true;
      } else if (scene === "night") {
        r.light = false;
        r.window = false;
      } else {
        r.light = false;
        r.window = false;
        r.ac = { ...r.ac, on: false };
        r.tv = { ...r.tv, on: false };
      }
      next.rooms[q.id] = r;
    }
    void push(next);
    logActivity(`Cena "${scene === "morning" ? "manhã" : scene === "night" ? "noite" : "sair de casa"}" aplicada`, "scene");
  };

  // ------------- AI -------------
  const askAI = useCallback(
    async (text: string) => {
      const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", content: text, ts: Date.now() };
      setMessages((m) => [...m, userMsg]);
      setAiLoading(true);
      try {
        const res = await fetch("/api/ai-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, state }),
        });
        const data = (await res.json()) as { reply: string; actions: Array<{ room: string; device: string; op: string; value: number }> };
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: data.reply, ts: Date.now() }]);
        void (async () => {
          try {
            const r = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: data.reply }),
            });
            if (!r.ok) return;
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.onended = () => URL.revokeObjectURL(url);
            await audio.play().catch(() => {});
          } catch {}
        })();
        logActivity(data.reply.slice(0, 80), "ai");

        // Apply actions
        if (data.actions?.length) {
          let next: HomeState = { ...state, rooms: { ...state.rooms } };
          for (const a of data.actions) {
            if (a.device === "scene" && (a.op === "morning" || a.op === "night" || a.op === "leaving")) {
              for (const q of QUARTOS) {
                const r = { ...(next.rooms[q.id] ?? defaultRoom()) };
                if (a.op === "morning") { r.light = q.id === "sala" || q.id === "cozinha"; r.window = true; }
                else if (a.op === "night") { r.light = false; r.window = false; }
                else { r.light = false; r.window = false; r.ac = { ...r.ac, on: false }; r.tv = { ...r.tv, on: false }; }
                next.rooms[q.id] = r;
              }
              continue;
            }
            if (a.device === "siren") {
              const on = a.op === "on";
              setSiren(on);
              logActivity(on ? "Sirene de emergência ATIVADA" : "Sirene de emergência desligada", "scene");
              continue;
            }
            if (a.device === "pomodoro") {
              const op = a.op === "start" ? "start" : a.op === "pause" ? "pause" : a.op === "stop" ? "stop" : a.op === "reset" ? "reset" : null;
              if (op) {
                void fetch("/api/pomodoro", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: op }),
                }).catch(() => {});
                logActivity(`Pomodoro: ${op === "start" ? "iniciado" : op === "pause" ? "em pausa" : op === "stop" ? "parado" : "reiniciado"}`, "ai");
              }
              continue;
            }
            if (!a.room || !next.rooms[a.room]) continue;
            const r = { ...next.rooms[a.room] };
            if (a.device === "light") r.light = a.op === "on";
            else if (a.device === "window") r.window = a.op === "open";
            else if (a.device === "ac") {
              if (a.op === "off") r.ac = { ...r.ac, on: false };
              else r.ac = { on: true, temp: typeof a.value === "number" ? a.value : r.ac.temp };
            } else if (a.device === "tv") {
              if (a.op === "off") r.tv = { ...r.tv, on: false };
              else if (a.op === "on") r.tv = { ...r.tv, on: true };
              else if (a.op === "channel" && typeof a.value === "number") r.tv = { ...r.tv, on: true, channel: Math.max(1, Math.min(CANAIS_TV.length, a.value)) };
              else if (a.op === "volume" && typeof a.value === "number") r.tv = { ...r.tv, volume: Math.max(0, Math.min(100, a.value)) };
              else if (a.op === "mute") r.tv = { ...r.tv, mute: !r.tv.mute };
            }
            next.rooms[a.room] = r;
          }
          await push(next);
        }
      } catch (err) {
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: "Ups, não consegui responder agora.", ts: Date.now() }]);
      } finally {
        setAiLoading(false);
      }
    },
    [state, push, logActivity, setSiren],
  );

  const submitAI = () => {
    const t = aiInput.trim();
    if (!t) return;
    setAiInput("");
    void askAI(t);
  };

  // ------------- Voice (real STT + TTS via Lovable AI) -------------
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        setListening(false);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 800) return;
        try {
          setAiLoading(true);
          const fd = new FormData();
          fd.append("file", blob, "recording");
          const res = await fetch("/api/stt", { method: "POST", body: fd });
          if (!res.ok) throw new Error("stt");
          const { text } = (await res.json()) as { text: string };
          const t = text.trim();
          if (!t) {
            setAiLoading(false);
            return;
          }
          setAiInput("");
          setAiLoading(false);
          void askAI(t);
        } catch {
          setAiLoading(false);
        }
      };
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      alert("Não foi possível aceder ao microfone.");
      setListening(false);
    }
  };
  const stopVoice = () => {
    try {
      recRef.current?.stop();
    } catch {}
    recRef.current = null;
  };

  // ------------- Derived -------------
  const activeCount = useMemo(
    () =>
      Object.entries(state.rooms).reduce((acc, [, r]) => acc + (r.light ? 1 : 0) + (r.ac.on ? 1 : 0) + (r.tv.on ? 1 : 0) + (r.window ? 1 : 0), 0),
    [state],
  );
  const totalRoomsActive = useMemo(
    () => Object.values(state.rooms).filter((r) => r.light || r.ac.on || r.tv.on || r.window).length,
    [state],
  );
  const roomSel = state.rooms[selectedRoom] ?? defaultRoom();
  const selMeta = QUARTOS.find((q) => q.id === selectedRoom) ?? QUARTOS[0];

  const timeStr = now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });

  // ------------- Chat autoscroll -------------
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiLoading]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4 md:gap-6">
        {/* Header */}
        <header className="col-span-12 flex flex-col md:flex-row md:items-end md:justify-between gap-3 px-1">
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-[11px] mb-1">
              {greeting(now.getHours())}
            </p>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight">
              Controlo da <span className="text-primary">casa</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{totalRoomsActive} {totalRoomsActive === 1 ? "divisão ativa" : "divisões ativas"}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSiren(true);
                logActivity("🔥 Simulação de FOGO: sirene ativada e chamada para 923 346 087", "scene");
              }}
              title="Simular fogo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm transition"
            >
              <Flame className="w-4 h-4" />
              Fogo
            </button>
            <button
              onClick={() => {
                const next = !sirenOn;
                setSiren(next);
                logActivity(next ? "Sirene de emergência ATIVADA" : "Sirene de emergência desligada", "scene");
              }}
              title="Sirene de emergência"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition ${
                sirenOn
                  ? "border-destructive bg-destructive text-destructive-foreground animate-pulse"
                  : "border-border bg-card hover:bg-accent text-muted-foreground"
              }`}
            >
              <Siren className="w-4 h-4" />
              {sirenOn ? "Sirene ligada" : "Sirene"}
            </button>
            <Link
              to="/pomodoro"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-accent transition text-sm"
            >
              <Timer className="w-4 h-4" />
              Pomodoro IoT
            </Link>
            <div className="text-right">
              <div className="text-4xl md:text-5xl font-mono font-light tracking-tighter tabular-nums">{timeStr}</div>
              <p className="text-muted-foreground text-sm first-letter:uppercase">{dateStr}</p>
            </div>
          </div>
        </header>

        <FloorPlan
          quartos={QUARTOS}
          rooms={state.rooms}
          selected={selectedRoom}
          onSelect={setSelectedRoom}
          onToggleLight={toggleLight}
          onSetDoor={(id, open) => {
            if ((state.rooms[id]?.window ?? false) !== open) toggleWindow(id);
          }}
          onSetAll={(k, on) => {
            const rooms = Object.fromEntries(
              QUARTOS.map((q) => {
                const r = state.rooms[q.id] ?? defaultRoom();
                const n =
                  k === "light" ? { ...r, light: on } :
                  k === "window" ? { ...r, window: on } :
                  k === "ac" ? { ...r, ac: { ...r.ac, on } } :
                  q.tv ? { ...r, tv: { ...r.tv, on } } : r;
                return [q.id, n];
              }),
            );
            void push({ rooms });
            logActivity(k === "window" ? `Portas ${on ? "abertas" : "fechadas"} em toda a casa` : `${k === "light" ? "Luzes" : k === "ac" ? "Ar condicionado" : "Televisões"} ${on ? "ligados" : "desligados"} em toda a casa`, k);
          }}
        />

        {/* Left column */}
        <div id="divisoes" className="col-span-12 lg:col-span-8 flex flex-col gap-4 md:gap-6">
          {/* Weather */}
          <GlassWeatherCard />
          <WifiCard />

          {/* Scenes */}
          <div className="grid grid-cols-3 gap-3">
            <SceneButton icon={Sun} label="Bom dia" onClick={() => applyScene("morning")} />
            <SceneButton icon={Moon} label="Modo noite" onClick={() => applyScene("night")} />
            <SceneButton icon={LogOut} label="Sair de casa" onClick={() => applyScene("leaving")} />
          </div>

          {/* Rooms grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {QUARTOS.map((q) => {
              const r = state.rooms[q.id] ?? defaultRoom();
              const active = (r.light ? 1 : 0) + (r.ac.on ? 1 : 0) + (r.tv.on ? 1 : 0) + (r.window ? 1 : 0);
              const isSel = selectedRoom === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedRoom(q.id)}
                  style={{
                    borderColor: isSel ? q.cor : `color-mix(in oklab, ${q.cor} 35%, transparent)`,
                    backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${q.cor} 16%, transparent), transparent 70%)`,
                    boxShadow: isSel ? `0 8px 32px -8px color-mix(in oklab, ${q.cor} 55%, transparent)` : undefined,
                  }}
                  className="rounded-3xl bg-card border p-5 cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ color: q.cor, background: `color-mix(in oklab, ${q.cor} ${r.light ? 30 : 14}%, transparent)` }}
                      >
                        <q.Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-medium" style={{ color: q.cor }}>{q.nome}</h3>
                    </div>
                    {active > 0 ? (
                      <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full font-medium">{active} ativo</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground px-2 py-1">Repouso</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TileButton active={r.light} icon={Lightbulb} label="Luz" onClick={(e) => { e.stopPropagation(); toggleLight(q.id); }} />
                    <TileButton active={r.window} icon={DoorOpen} label={r.window ? "Fechar porta" : "Abrir porta"} onClick={(e) => { e.stopPropagation(); toggleWindow(q.id); }} />
                    {q.tv && <TileButton active={r.tv.on} icon={Tv} label={r.tv.on ? CANAIS_TV[r.tv.channel - 1] : "TV"} onClick={(e) => { e.stopPropagation(); toggleTV(q.id); }} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected room detail */}
          <div className="rounded-3xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <selMeta.Icon className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Controlo detalhado — {selMeta.nome}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Porta */}
              <div className="rounded-2xl bg-muted/40 border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><DoorOpen className="w-4 h-4" /> Porta</div>
                  <span role="status" className="text-xs text-muted-foreground">{roomSel.window ? "Aberta" : "Fechada"}</span>
                </div>
                <Button className="w-full mb-3" onClick={() => toggleWindow(selectedRoom)}><DoorOpen />{roomSel.window ? "Fechar porta" : "Abrir porta"}</Button>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setDoorAuto(selectedRoom, false)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${!(roomSel.doorAuto ?? true) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setDoorAuto(selectedRoom, true)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${(roomSel.doorAuto ?? true) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                  >
                    Automático
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(roomSel.doorAuto ?? true)
                    ? "Modo automático: a porta fecha-se sozinha aos 30 segundos, e as cenas e a Ana abrem e fecham por ti."
                    : "Modo manual: abres e fechas tu, a porta fica como a deixares."}
                </p>
              </div>
              {/* TV */}
              {selMeta.tv && <div className="rounded-2xl bg-muted/40 border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Tv className="w-4 h-4" /> Televisão</div>
                  <button onClick={() => toggleTV(selectedRoom)} className={`text-xs px-2 py-1 rounded-full ${roomSel.tv.on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{roomSel.tv.on ? "Ligada" : "Desligada"}</button>
                </div>
                <div className="text-center text-sm font-medium mb-3">{CANAIS_TV[roomSel.tv.channel - 1]}</div>
                <div className="flex items-center gap-2 justify-center">
                  <button onClick={() => changeChannel(selectedRoom, -1)} className="w-9 h-9 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-xs">CH-</button>
                  <button onClick={() => changeChannel(selectedRoom, 1)} className="w-9 h-9 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-xs">CH+</button>
                  <button onClick={() => changeVolume(selectedRoom, -5)} className="w-9 h-9 rounded-lg bg-muted hover:bg-accent flex items-center justify-center"><Volume2 className="w-4 h-4 opacity-50" /></button>
                  <div className="text-xs tabular-nums w-8 text-center">{roomSel.tv.mute ? "—" : roomSel.tv.volume}</div>
                  <button onClick={() => changeVolume(selectedRoom, 5)} className="w-9 h-9 rounded-lg bg-muted hover:bg-accent flex items-center justify-center"><Volume2 className="w-4 h-4" /></button>
                  <button onClick={() => toggleMute(selectedRoom)} className={`w-9 h-9 rounded-lg flex items-center justify-center ${roomSel.tv.mute ? "bg-destructive/20 text-destructive" : "bg-muted hover:bg-accent"}`}>{roomSel.tv.mute ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
                </div>
              </div>}
            </div>
          </div>
        </div>

        {/* Right column: AI + Activity */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 md:gap-6">
          {/* AI Assistant */}
          <div className="rounded-3xl bg-card border border-border p-5 flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aiLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                <h3 className="font-medium">Ana — Assistente de Voz</h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Wifi className="w-3 h-3" /> Tempo real</div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3 max-h-[340px]">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> a pensar...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={listening ? stopVoice : startVoice}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition ${listening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted hover:bg-accent text-muted-foreground"}`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAI()}
                placeholder="Ex: Ana, acende a luz da sala..."
                className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary/60"
              />
              <button
                onClick={submitAI}
                disabled={aiLoading || !aiInput.trim()}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Activity */}
          <div className="flex-1 rounded-3xl bg-card border border-border p-5 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Atividade</h3>
              <span className="text-xs text-muted-foreground">{activeCount} dispositivos ligados</span>
            </div>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sem atividade recente.</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {activity.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        a.kind === "light" ? "bg-amber-400" :
                        a.kind === "window" ? "bg-blue-400" :
                        a.kind === "ac" ? "bg-cyan-400" :
                        a.kind === "tv" ? "bg-purple-400" :
                        a.kind === "scene" ? "bg-primary" : "bg-violet-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{a.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.ts).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Small components ----------------
function TileButton({
  active, icon: Icon, label, onClick,
}: { active: boolean; icon: any; label: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2 p-3 rounded-2xl transition-all text-left ${
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function SceneButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-card border border-border hover:border-primary/60 hover:bg-accent transition p-4 flex items-center gap-3 text-sm"
    >
      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ana — Casa Inteligente" },
      { name: "description", content: "Dashboard de casa inteligente com a assistente de voz Ana, sincronização em tempo real, clima, sirene de emergência e Pomodoro IoT." },
      { property: "og:title", content: "Ana — Casa Inteligente" },
      { property: "og:description", content: "Controla as portas, as luzes e as televisões da tua casa com a Ana." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: Dashboard,
});
