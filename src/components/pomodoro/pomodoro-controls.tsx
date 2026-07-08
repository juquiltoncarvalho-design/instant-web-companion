
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, Pause, Square, RotateCcw } from "lucide-react"
import type { PublicPomodoroState, PomodoroMode } from "@/lib/pomodoro-store"

interface PomodoroControlsProps {
  state: PublicPomodoroState
  onStart: () => void
  onPause: () => void
  onStop: () => void
  onReset: () => void
  onSwitchMode: (mode: PomodoroMode) => void
  onSetDuration: (mode: PomodoroMode, minutes: number) => void
}

export function PomodoroControls({
  state,
  onStart,
  onPause,
  onStop,
  onReset,
  onSwitchMode,
  onSetDuration,
}: PomodoroControlsProps) {
  const isRunning = state.status === "running"

  return (
    <div className="space-y-6">
      {/* Seletor de modo */}
      <div className="flex gap-2 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => onSwitchMode("focus")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            state.mode === "focus"
              ? "bg-rose-500 text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Foco
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode("break")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            state.mode === "break"
              ? "bg-emerald-500 text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pausa
        </button>
      </div>

      {/* Botoes principais */}
      <div className="flex items-center justify-center gap-3">
        {isRunning ? (
          <Button size="lg" onClick={onPause} className="gap-2">
            <Pause className="h-5 w-5" />
            Pausar
          </Button>
        ) : (
          <Button size="lg" onClick={onStart} className="gap-2">
            <Play className="h-5 w-5" />
            Iniciar
          </Button>
        )}
        <Button size="lg" variant="outline" onClick={onStop} className="gap-2">
          <Square className="h-5 w-5" />
          Parar
        </Button>
        <Button size="lg" variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-5 w-5" />
          Reiniciar
        </Button>
      </div>

      {/* Definir tempo manual */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Foco (minutos)</label>
          <Input
            type="number"
            min={1}
            max={120}
            defaultValue={Math.round(state.focusDuration / 60)}
            onChange={(e) => onSetDuration("focus", Number(e.target.value))}
            disabled={isRunning}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Pausa (minutos)</label>
          <Input
            type="number"
            min={1}
            max={60}
            defaultValue={Math.round(state.breakDuration / 60)}
            onChange={(e) => onSetDuration("break", Number(e.target.value))}
            disabled={isRunning}
          />
        </div>
      </div>
    </div>
  )
}
