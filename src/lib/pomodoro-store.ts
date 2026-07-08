// Store de estado do Pomodoro partilhado entre o site e o ESP32.
// Usa um singleton em memoria (via globalThis) para sobreviver ao Hot Reload
// do Next.js em desenvolvimento. Numa implementacao de producao, este estado
// poderia ser guardado numa base de dados ou no Firebase.

export type PomodoroStatus = "idle" | "running" | "paused" | "finished"
export type PomodoroMode = "focus" | "break"

export interface SessionRecord {
  id: string
  mode: PomodoroMode
  durationSeconds: number
  completedAt: number // timestamp
}

export interface PomodoroState {
  status: PomodoroStatus
  mode: PomodoroMode
  // Duracoes configuraveis (em segundos)
  focusDuration: number
  breakDuration: number
  // Segundos restantes guardados no momento da ultima acao
  storedRemaining: number
  // Timestamp de quando o timer comecou a correr (null se nao estiver a correr)
  startedAt: number | null
  // Modo focus (nao interromper)
  focusModeDoNotDisturb: boolean
  // Ultima vez que o ESP32 comunicou (para estado ONLINE/OFFLINE)
  deviceLastSeen: number | null
  // Historico de sessoes concluidas
  sessions: SessionRecord[]
}

// Tempo (ms) sem heartbeat apos o qual o dispositivo e considerado OFFLINE
export const DEVICE_OFFLINE_THRESHOLD_MS = 10_000

const DEFAULT_FOCUS = 25 * 60
const DEFAULT_BREAK = 5 * 60

function createInitialState(): PomodoroState {
  return {
    status: "idle",
    mode: "focus",
    focusDuration: DEFAULT_FOCUS,
    breakDuration: DEFAULT_BREAK,
    storedRemaining: DEFAULT_FOCUS,
    startedAt: null,
    focusModeDoNotDisturb: false,
    deviceLastSeen: null,
    sessions: [],
  }
}

// Singleton persistente entre recargas de modulo em desenvolvimento
const globalForPomodoro = globalThis as unknown as {
  __pomodoroState?: PomodoroState
}

function getStore(): PomodoroState {
  if (!globalForPomodoro.__pomodoroState) {
    globalForPomodoro.__pomodoroState = createInitialState()
  }
  return globalForPomodoro.__pomodoroState
}

// Calcula os segundos restantes reais tendo em conta o tempo decorrido
function computeRemaining(state: PomodoroState): number {
  if (state.status !== "running" || state.startedAt === null) {
    return state.storedRemaining
  }
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000)
  return Math.max(0, state.storedRemaining - elapsed)
}

// Aplica transicoes automaticas (ex.: terminar quando chega a zero)
function reconcile(state: PomodoroState): void {
  if (state.status === "running") {
    const remaining = computeRemaining(state)
    if (remaining <= 0) {
      // Sessao concluida
      const duration = state.mode === "focus" ? state.focusDuration : state.breakDuration
      state.sessions.unshift({
        id: `${Date.now()}`,
        mode: state.mode,
        durationSeconds: duration,
        completedAt: Date.now(),
      })
      // Limitar historico a 50 registos
      state.sessions = state.sessions.slice(0, 50)

      state.status = "finished"
      state.startedAt = null
      state.storedRemaining = 0
    }
  }
}

export interface PublicPomodoroState {
  status: PomodoroStatus
  mode: PomodoroMode
  focusDuration: number
  breakDuration: number
  remainingSeconds: number
  focusModeDoNotDisturb: boolean
  deviceOnline: boolean
  deviceLastSeen: number | null
  sessions: SessionRecord[]
  serverTime: number
}

// Devolve o estado publico (com o restante ja calculado)
export function getPublicState(): PublicPomodoroState {
  const state = getStore()
  reconcile(state)
  const deviceOnline =
    state.deviceLastSeen !== null &&
    Date.now() - state.deviceLastSeen < DEVICE_OFFLINE_THRESHOLD_MS

  return {
    status: state.status,
    mode: state.mode,
    focusDuration: state.focusDuration,
    breakDuration: state.breakDuration,
    remainingSeconds: computeRemaining(state),
    focusModeDoNotDisturb: state.focusModeDoNotDisturb,
    deviceOnline,
    deviceLastSeen: state.deviceLastSeen,
    sessions: state.sessions,
    serverTime: Date.now(),
  }
}

// ---- Acoes ----

export function startTimer(): void {
  const state = getStore()
  reconcile(state)
  if (state.status === "running") return

  // Se estava terminado ou parado, garantir que ha tempo para correr
  if (state.status === "finished" || state.storedRemaining <= 0) {
    state.storedRemaining = state.mode === "focus" ? state.focusDuration : state.breakDuration
  }
  state.status = "running"
  state.startedAt = Date.now()
}

export function pauseTimer(): void {
  const state = getStore()
  reconcile(state)
  if (state.status !== "running") return
  state.storedRemaining = computeRemaining(state)
  state.status = "paused"
  state.startedAt = null
}

export function stopTimer(): void {
  const state = getStore()
  state.status = "idle"
  state.startedAt = null
  state.storedRemaining = state.mode === "focus" ? state.focusDuration : state.breakDuration
}

export function resetTimer(): void {
  const state = getStore()
  state.status = "idle"
  state.startedAt = null
  state.mode = "focus"
  state.storedRemaining = state.focusDuration
}

// Alterna entre modo de foco e pausa
export function switchMode(mode: PomodoroMode): void {
  const state = getStore()
  state.mode = mode
  state.status = "idle"
  state.startedAt = null
  state.storedRemaining = mode === "focus" ? state.focusDuration : state.breakDuration
}

// Define a duracao (em minutos) do modo indicado
export function setDuration(mode: PomodoroMode, minutes: number): void {
  const state = getStore()
  const seconds = Math.max(1, Math.round(minutes)) * 60
  if (mode === "focus") {
    state.focusDuration = seconds
  } else {
    state.breakDuration = seconds
  }
  // Se o timer nao esta a correr e estamos nesse modo, atualizar o restante
  if (state.status !== "running" && state.mode === mode) {
    state.storedRemaining = seconds
  }
}

export function setFocusMode(enabled: boolean): void {
  const state = getStore()
  state.focusModeDoNotDisturb = enabled
}

// Registado quando o ESP32 comunica (heartbeat)
export function deviceHeartbeat(): void {
  const state = getStore()
  state.deviceLastSeen = Date.now()
}
