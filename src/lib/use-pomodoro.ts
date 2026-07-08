import { useCallback, useEffect, useState } from "react"
import type { PublicPomodoroState, PomodoroMode } from "@/lib/pomodoro-store"

async function fetchState(): Promise<PublicPomodoroState> {
  const r = await fetch("/api/pomodoro", { cache: "no-store" })
  return r.json()
}

export function usePomodoro() {
  const [data, setData] = useState<PublicPomodoroState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [localRemaining, setLocalRemaining] = useState<number | null>(null)

  // Poll server every second
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const s = await fetchState()
        if (!cancelled) {
          setData(s)
          setIsLoading(false)
        }
      } catch {
        /* ignore */
      }
    }
    void tick()
    const id = setInterval(tick, 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  // Smooth local countdown between polls
  useEffect(() => {
    if (!data) return
    setLocalRemaining(data.remainingSeconds)
  }, [data])

  useEffect(() => {
    if (!data || data.status !== "running") return
    const id = setInterval(() => {
      setLocalRemaining((prev) => (prev === null ? null : Math.max(0, prev - 1)))
    }, 1000)
    return () => clearInterval(id)
  }, [data])

  const send = useCallback(
    async (payload: {
      action: string
      mode?: PomodoroMode
      minutes?: number
      enabled?: boolean
    }) => {
      const res = await fetch("/api/pomodoro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const next = (await res.json()) as PublicPomodoroState
      setData(next)
      return next
    },
    [],
  )

  const remainingSeconds = localRemaining ?? data?.remainingSeconds ?? 0

  return {
    state: data,
    isLoading,
    remainingSeconds,
    start: () => send({ action: "start" }),
    pause: () => send({ action: "pause" }),
    stop: () => send({ action: "stop" }),
    reset: () => send({ action: "reset" }),
    switchMode: (mode: PomodoroMode) => send({ action: "switch-mode", mode }),
    setDuration: (mode: PomodoroMode, minutes: number) =>
      send({ action: "set-duration", mode, minutes }),
    setFocusMode: (enabled: boolean) => send({ action: "set-focus-mode", enabled }),
  }
}
