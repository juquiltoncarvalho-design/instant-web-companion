
import { Brain, Coffee, History } from "lucide-react"
import type { SessionRecord } from "@/lib/pomodoro-store"

interface SessionHistoryProps {
  sessions: SessionRecord[]
}

export function SessionHistory({ sessions }: SessionHistoryProps) {
  const focusCount = sessions.filter((s) => s.mode === "focus").length
  const totalFocusMin = Math.round(
    sessions.filter((s) => s.mode === "focus").reduce((acc, s) => acc + s.durationSeconds, 0) / 60,
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Historico de Sessoes</h2>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-2xl font-bold text-rose-500">{focusCount}</p>
          <p className="text-xs text-muted-foreground">Sessoes de foco</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-2xl font-bold text-foreground">{totalFocusMin}</p>
          <p className="text-xs text-muted-foreground">Minutos focado</p>
        </div>
      </div>

      {/* Lista */}
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Ainda nao ha sessoes concluidas. Inicie o seu primeiro periodo de foco!
          </p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    s.mode === "focus"
                      ? "bg-rose-500/15 text-rose-500"
                      : "bg-emerald-500/15 text-emerald-500"
                  }`}
                >
                  {s.mode === "focus" ? <Brain className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {s.mode === "focus" ? "Foco" : "Pausa"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(s.durationSeconds / 60)} minutos
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(s.completedAt).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
