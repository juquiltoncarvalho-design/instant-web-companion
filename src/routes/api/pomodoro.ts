import { createFileRoute } from "@tanstack/react-router"
import {
  getPublicState,
  startTimer,
  pauseTimer,
  stopTimer,
  resetTimer,
  switchMode,
  setDuration,
  setFocusMode,
  deviceHeartbeat,
  type PomodoroMode,
} from "@/lib/pomodoro-store"

export const Route = createFileRoute("/api/pomodoro")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get("device") === "1") deviceHeartbeat()
        return Response.json(getPublicState())
      },
      POST: async ({ request }) => {
        let body: {
          action?: string
          mode?: PomodoroMode
          minutes?: number
          enabled?: boolean
        }
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: "Corpo JSON invalido" }, { status: 400 })
        }
        switch (body.action) {
          case "start":
            startTimer()
            break
          case "pause":
            pauseTimer()
            break
          case "stop":
            stopTimer()
            break
          case "reset":
            resetTimer()
            break
          case "switch-mode":
            if (body.mode === "focus" || body.mode === "break") switchMode(body.mode)
            else return Response.json({ error: "Modo invalido" }, { status: 400 })
            break
          case "set-duration":
            if (
              (body.mode === "focus" || body.mode === "break") &&
              typeof body.minutes === "number"
            )
              setDuration(body.mode, body.minutes)
            else return Response.json({ error: "Parametros invalidos" }, { status: 400 })
            break
          case "set-focus-mode":
            setFocusMode(Boolean(body.enabled))
            break
          case "heartbeat":
            deviceHeartbeat()
            break
          default:
            return Response.json({ error: "Acao desconhecida" }, { status: 400 })
        }
        return Response.json(getPublicState())
      },
    },
  },
})
