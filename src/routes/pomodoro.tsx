import { createFileRoute } from "@tanstack/react-router"


import { useEffect, useRef } from "react"
import { usePomodoro } from "@/lib/use-pomodoro"
import { WindowFrame } from "@/components/pomodoro/window-frame"
import { TimerDisplay } from "@/components/pomodoro/timer-display"
import { PomodoroControls } from "@/components/pomodoro/pomodoro-controls"
import { DeviceStatus } from "@/components/pomodoro/device-status"
import { SessionHistory } from "@/components/pomodoro/session-history"
import { Switch } from "@/components/ui/switch"
import { Loader2, Moon, Timer } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

function PomodoroPage() {
  const {
    state,
    isLoading,
    remainingSeconds,
    start,
    pause,
    stop,
    reset,
    switchMode,
    setDuration,
    setFocusMode,
  } = usePomodoro()

  const prevStatusRef = useRef<string | null>(null)

  // Notificar quando a sessao termina
  useEffect(() => {
    if (!state) return
    const prev = prevStatusRef.current
    if (prev && prev !== "finished" && state.status === "finished") {
      const isFoco = state.mode === "focus"
      const titulo = isFoco ? "Sessao de foco concluida!" : "Pausa terminada!"
      const mensagem = isFoco
        ? "Bom trabalho! Esta na hora de fazer uma pausa."
        : "A pausa terminou. Pronto para voltar ao foco?"

      // Notificacao do sistema (se permitida e nao estiver em modo nao-interromper)
      if (!state.focusModeDoNotDisturb && typeof Notification !== "undefined") {
        if (Notification.permission === "granted") {
          new Notification(titulo, { body: mensagem })
        }
      }

      // Toast sempre visivel na app
      toast.success(titulo, { description: mensagem })

      // Som de alerta
      tocarAlarme()
    }
    prevStatusRef.current = state.status
  }, [state])

  // Pedir permissao para notificacoes ao carregar
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const totalSeconds = state
    ? state.mode === "focus"
      ? state.focusDuration
      : state.breakDuration
    : 25 * 60

  if (isLoading || !state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Cabecalho */}
        <header className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500 text-white">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pomodoro IoT</h1>
            <p className="text-sm text-muted-foreground">
              Temporizador de produtividade sincronizado com o seu ESP32
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* Coluna do temporizador */}
          <WindowFrame title="Pomodoro Timer">
            <div className="flex flex-col items-center gap-8">
              <TimerDisplay
                remainingSeconds={remainingSeconds}
                totalSeconds={totalSeconds}
                mode={state.mode}
                status={state.status}
              />
              <div className="w-full max-w-md">
                <PomodoroControls
                  state={state}
                  onStart={start}
                  onPause={pause}
                  onStop={stop}
                  onReset={reset}
                  onSwitchMode={switchMode}
                  onSetDuration={setDuration}
                />
              </div>
            </div>
          </WindowFrame>

          {/* Coluna lateral */}
          <div className="space-y-6">
            <DeviceStatus online={state.deviceOnline} lastSeen={state.deviceLastSeen} />

            {/* Modo focus (nao interromper) */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-500">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Modo Focus</p>
                  <p className="text-xs text-muted-foreground">Silencia notificacoes do sistema</p>
                </div>
              </div>
              <Switch
                checked={state.focusModeDoNotDisturb}
                onCheckedChange={(v) => setFocusMode(v)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <SessionHistory sessions={state.sessions} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Toca um som de alarme simples usando a Web Audio API
function tocarAlarme() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    const notas = [880, 1046, 880]
    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = "sine"
      const t = ctx.currentTime + i * 0.25
      gain.gain.setValueAtTime(0.001, t)
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24)
      osc.start(t)
      osc.stop(t + 0.25)
    })
  } catch {
    // Ignora se o audio nao estiver disponivel
  }
}

export const Route = createFileRoute("/pomodoro")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pomodoro IoT — Casa Inteligente" },
      { name: "description", content: "Temporizador Pomodoro sincronizado com dispositivo ESP32." },
    ],
  }),
  component: PomodoroPage,
})
