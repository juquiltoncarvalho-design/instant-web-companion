import type { PomodoroMode, PomodoroStatus } from "@/lib/pomodoro-store"

interface TimerDisplayProps {
  remainingSeconds: number
  totalSeconds: number
  mode: PomodoroMode
  status: PomodoroStatus
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const STATUS_LABEL: Record<PomodoroStatus, string> = {
  idle: "Pronto para comecar",
  running: "Em progresso",
  paused: "Em pausa",
  finished: "Sessao concluida",
}

// Cronometro circular com anel de progresso
export function TimerDisplay({ remainingSeconds, totalSeconds, mode, status }: TimerDisplayProps) {
  const radius = 130
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  const dashoffset = circumference * (1 - progress)

  const accent = mode === "focus" ? "text-rose-500" : "text-emerald-500"
  const stroke = mode === "focus" ? "stroke-rose-500" : "stroke-emerald-500"

  return (
    <div className="relative flex items-center justify-center">
      <svg width="300" height="300" viewBox="0 0 300 300" className="-rotate-90">
        {/* Anel de fundo */}
        <circle
          cx="150"
          cy="150"
          r={radius}
          className="fill-none stroke-muted"
          strokeWidth="14"
        />
        {/* Anel de progresso */}
        <circle
          cx="150"
          cy="150"
          r={radius}
          className={`fill-none ${stroke} transition-all duration-500 ease-linear`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
        />
      </svg>
      {/* Texto central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-sm font-semibold uppercase tracking-widest ${accent}`}>
          {mode === "focus" ? "Foco" : "Pausa"}
        </span>
        <span className="mt-1 font-mono text-6xl font-bold tabular-nums text-foreground">
          {formatTime(remainingSeconds)}
        </span>
        <span className="mt-2 text-sm text-muted-foreground">{STATUS_LABEL[status]}</span>
      </div>
    </div>
  )
}
