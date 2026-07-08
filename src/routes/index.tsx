import { createFileRoute } from "@tanstack/react-router"


import { useState, useEffect, useRef } from "react"
import { Link } from "@tanstack/react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Lightbulb,
  LightbulbOff,
  Plus,
  Trash2,
  Clock,
  Moon,
  Sun,
  Home,
  Zap,
  History,
  Shuffle,
  Terminal,
  Square,
  BedDouble,
  ChefHat,
  Sofa,
  Bath,
  DoorOpen,
  Tv,
  Thermometer,
  Snowflake,
  Flame,
  User,
  Users,
  Eye,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Play,
  Power,
  Mic,
  MicOff,
  Bot,
  Send,
  Loader2,
  MapPin,
  RefreshCw,
  Timer,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeatherCard } from "@/components/weather-card"

const EMOJIS = {
  LIGHT_ON: "💡",
  LIGHT_OFF: "🌑",
  WINDOW_OPEN: "🪟",
  WINDOW_CLOSED: "🚪",
  SUCCESS: "✅",
  INFO: "ℹ️",
  WARNING: "⚠️",
  CLOCK: "⏰",
  TV: "📺",
  AC_COOL: "❄️",
  AC_HEAT: "🔥",
  PRESENCE: "👤",
  TEMPERATURE: "🌡️",
} as const

const CORES_LOG = {
  SUCCESS: "text-green-500",
  INFO: "text-blue-500",
  WARNING: "text-amber-500",
  ERROR: "text-red-500",
  LIGHT: "text-amber-400",
  WINDOW: "text-blue-400",
  TV: "text-purple-400",
  AC: "text-cyan-400",
  PRESENCE: "text-emerald-400",
  AI: "text-violet-400",
} as const

// Mapeamento dos codigos meteorologicos da Open-Meteo para descricoes em portugues
const WEATHER_CODE_MAP: Record<number, string> = {
  0: "Ceu limpo",
  1: "Principalmente limpo",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Nevoeiro",
  48: "Nevoeiro com geada",
  51: "Chuvisco leve",
  53: "Chuvisco moderado",
  55: "Chuvisco intenso",
  61: "Chuva leve",
  63: "Chuva moderada",
  65: "Chuva forte",
  71: "Neve leve",
  73: "Neve moderada",
  75: "Neve forte",
  80: "Aguaceiros leves",
  81: "Aguaceiros moderados",
  82: "Aguaceiros fortes",
  95: "Trovoada",
  96: "Trovoada com granizo leve",
  99: "Trovoada com granizo forte",
}

// Comandos que o assistente de voz entende
const COMANDOS_VOZ = {
  "acender luz": { action: "light-on", device: "light" },
  "apagar luz": { action: "light-off", device: "light" },
  "ligar luz": { action: "light-on", device: "light" },
  "desligar luz": { action: "light-off", device: "light" },
  "abrir janela": { action: "window-open", device: "window" },
  "fechar janela": { action: "window-close", device: "window" },
  "ligar tv": { action: "tv-on", device: "tv" },
  "desligar tv": { action: "tv-off", device: "tv" },
  "ligar ar": { action: "ac-on", device: "ac" },
  "desligar ar": { action: "ac-off", device: "ac" },
  "modo manha": { action: "morning-mode", device: "scene" },
  "bom dia": { action: "morning-mode", device: "scene" },
  "modo noite": { action: "night-mode", device: "scene" },
  "boa noite": { action: "night-mode", device: "scene" },
  "saindo de casa": { action: "leaving-mode", device: "scene" },
  "sair de casa": { action: "leaving-mode", device: "scene" },
} as const

const CANAIS_TV = [
  { id: 1, nome: "SIC", genero: "Generalista" },
  { id: 2, nome: "TVI", genero: "Generalista" },
  { id: 3, nome: "RTP1", genero: "Generalista" },
  { id: 4, nome: "Sport TV", genero: "Desporto" },
  { id: 5, nome: "Disney Channel", genero: "Infantil" },
  { id: 6, nome: "CNN Portugal", genero: "Noticias" },
  { id: 7, nome: "Netflix", genero: "Streaming" },
  { id: 8, nome: "HBO Max", genero: "Streaming" },
] as const

const PESSOAS = [
  { id: "joao", nome: "Joao", canalFavorito: 4, tempPreferida: 22 },
  { id: "maria", nome: "Maria", canalFavorito: 7, tempPreferida: 24 },
  { id: "pedro", nome: "Pedro", canalFavorito: 5, tempPreferida: 21 },
  { id: "ana", nome: "Ana", canalFavorito: 6, tempPreferida: 23 },
] as const

const QUARTOS = [
  { id: "sala", nome: "Sala de Estar", icon: Sofa, color: "text-blue-500" },
  { id: "quarto1", nome: "Quarto Principal", icon: BedDouble, color: "text-purple-500" },
  { id: "quarto2", nome: "Quarto 2", icon: BedDouble, color: "text-pink-500" },
  { id: "cozinha", nome: "Cozinha", icon: ChefHat, color: "text-orange-500" },
  { id: "banheiro", nome: "Banheiro", icon: Bath, color: "text-cyan-500" },
  { id: "corredor", nome: "Corredor", icon: DoorOpen, color: "text-gray-500" },
] as const

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"] as const
const DIAS_SEMANA_COMPLETO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const

interface RoomState {
  lightStatus: "on" | "off"
  windowStatus: "open" | "close"
  acStatus: "off" | "cooling" | "heating"
  acTemperature: number
  presence: string[]
}

interface TvState {
  isOn: boolean
  channel: number
  volume: number
  isMuted: boolean
}

interface Schedule {
  id: string
  roomId: string
  time: string
  action: "light-on" | "light-off" | "window-open" | "window-close"
  enabled: boolean
  weekdays: number[]
}

interface HistoryEntry {
  timestamp: Date
  roomId: string
  roomName: string
  action: string
  device: string
}

interface ConsoleLog {
  id: string
  timestamp: Date
  message: string
  type: "success" | "info" | "warning" | "error"
  emoji: string
}

interface AIMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

function HomeAutomation() {
  const [roomStates, setRoomStates] = useState<Record<string, RoomState>>(
    QUARTOS.reduce(
      (acc, room) => ({
        ...acc,
        [room.id]: { 
          lightStatus: "off", 
          windowStatus: "close",
          acStatus: "off",
          acTemperature: 22,
          presence: []
        },
      }),
      {},
    ),
  )

  const [tvState, setTvState] = useState<TvState>({
    isOn: false,
    channel: 1,
    volume: 50,
    isMuted: false
  })

  const [outdoorTemperature, setOutdoorTemperature] = useState(25)
  const [autoAcEnabled, setAutoAcEnabled] = useState(true)
  const [acThresholdHot, setAcThresholdHot] = useState(28)
  const [acThresholdCold, setAcThresholdCold] = useState(18)

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lightsStatus, setLightsStatus] = useState<"on" | "off">("off")
  const [windowsStatus, setWindowsStatus] = useState<"open" | "close">("close")
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [lightOnTime, setLightOnTime] = useState(0)
  const [randomMode, setRandomMode] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
  const [morningModeActive, setMorningModeActive] = useState(false)
  const [nightModeActive, setNightModeActive] = useState(false)

  // Estados do Assistente de Voz AI
  const [isListening, setIsListening] = useState(false)
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Ola! Sou o assistente da sua casa inteligente. Pode me dar comandos como: 'acender luz da sala', 'ligar ar condicionado', 'modo noite', ou perguntar sobre a temperatura!",
      timestamp: new Date()
    }
  ])
  const [userInput, setUserInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  // Modo de voz: quando ativo, o assistente ouve continuamente (mãos-livres)
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false)
  // Indica se o assistente esta a falar (TTS) - para evitar ouvir-se a si proprio
  const [isSpeaking, setIsSpeaking] = useState(false)
  // Texto reconhecido em tempo real (resultados intermedios)
  const [interimTranscript, setInterimTranscript] = useState("")
  // Referencias persistentes ao objeto de reconhecimento e flags de controlo
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const voiceModeRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const [weatherData, setWeatherData] = useState({
    condition: "Carregando...",
    weatherCode: 0,
    humidity: 0,
    windSpeed: 0,
    feelsLike: 0,
    minTemp: 0,
    maxTemp: 0,
    isDay: true,
  })

  // Previsao horaria (proximas horas) e de varios dias
  const [hourlyForecast, setHourlyForecast] = useState<
    { time: string; temp: number; code: number; isDay: boolean }[]
  >([])
  const [dailyForecast, setDailyForecast] = useState<
    { date: string; min: number; max: number; code: number }[]
  >([])

  // Estados de geolocalizacao
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    city: string
    country: string
  } | null>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Sistema de sons
  const playSound = (type: "click" | "success" | "toggle" | "random") => {
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      if (type === "random") {
        // Som especial para modo aleatorio - melodia divertida
        oscillator.type = "sine"
        const notes = [523.25, 659.25, 783.99, 1046.50] // Do, Mi, Sol, Do (oitava)
        let time = audioContext.currentTime
        
        notes.forEach((freq, i) => {
          const osc = audioContext.createOscillator()
          const gain = audioContext.createGain()
          osc.connect(gain)
          gain.connect(audioContext.destination)
          osc.type = "sine"
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.15, time + i * 0.1)
          gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.1 + 0.15)
          osc.start(time + i * 0.1)
          osc.stop(time + i * 0.1 + 0.15)
        })
        return
      }
      
      switch (type) {
        case "click":
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.1)
          break
        case "success":
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.2)
          break
        case "toggle":
          oscillator.type = "triangle"
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.08)
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.08)
          break
      }
    } catch (e) {
      // Audio nao suportado
    }
  }

  const adicionarLog = (message: string, type: "success" | "info" | "warning" | "error", emoji: string) => {
    const logStyle = {
      success: "color: #22c55e; font-weight: bold;",
      info: "color: #3b82f6; font-weight: bold;",
      warning: "color: #f59e0b; font-weight: bold;",
      error: "color: #ef4444; font-weight: bold;",
    }

    console.log(`%c${emoji} [v0] ${message}`, logStyle[type])

    const newLog: ConsoleLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      type,
      emoji,
    }

    setConsoleLogs((prev) => [newLog, ...prev.slice(0, 19)])
  }

  useEffect(() => {
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 18) {
      setTheme("light")
      document.documentElement.classList.remove("dark")
    } else {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [currentTime])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  const getTimeIcon = () => {
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 18) return <Sun className="h-6 w-6 text-amber-500" />
    return <Moon className="h-6 w-6 text-blue-400" />
  }

  const getBackgroundGradient = () => {
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 12) return "from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
    if (hour >= 12 && hour < 18) return "from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20"
    return "from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20"
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    adicionarLog("Sistema de automação residencial iniciado", "success", EMOJIS.SUCCESS)

    // Obter localizacao e clima real
    fetchLocationAndWeather()

    return () => {
      clearInterval(timer)
    }
  }, [])

  // Funcao auxiliar de fetch com timeout
  const fetchComTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 10000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeoutId)
      return response
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  // Aplica os dados meteorologicos no estado
  const aplicarDadosMeteo = (weatherApiData: {
    current?: Record<string, number>
    hourly?: { time?: string[]; temperature_2m?: number[]; weather_code?: number[]; is_day?: number[] }
    daily?: {
      time?: string[]
      temperature_2m_min?: number[]
      temperature_2m_max?: number[]
      weather_code?: number[]
    }
  }) => {
    const current = weatherApiData.current
    const daily = weatherApiData.daily
    const hourly = weatherApiData.hourly

    if (!current || !daily) {
      throw new Error("Dados meteorologicos invalidos")
    }

    setOutdoorTemperature(Math.round(current.temperature_2m * 10) / 10)
    setWeatherData({
      condition: WEATHER_CODE_MAP[current.weather_code] || "Desconhecido",
      weatherCode: current.weather_code,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      feelsLike: Math.round(current.apparent_temperature),
      minTemp: Math.round(daily.temperature_2m_min?.[0] ?? 0),
      maxTemp: Math.round(daily.temperature_2m_max?.[0] ?? 0),
      isDay: current.is_day === 1,
    })

    // Processar previsao horaria - apenas as proximas 24 horas a partir de agora
    if (hourly?.time && hourly.temperature_2m && hourly.weather_code) {
      const agora = Date.now()
      const horas: { time: string; temp: number; code: number; isDay: boolean }[] = []
      for (let i = 0; i < hourly.time.length && horas.length < 24; i++) {
        const t = new Date(hourly.time[i]).getTime()
        if (t >= agora - 3600000) {
          horas.push({
            time: hourly.time[i],
            temp: Math.round(hourly.temperature_2m[i]),
            code: hourly.weather_code[i],
            isDay: hourly.is_day ? hourly.is_day[i] === 1 : true,
          })
        }
      }
      setHourlyForecast(horas)
    }

    // Processar previsao de varios dias
    if (daily.time && daily.temperature_2m_min && daily.temperature_2m_max && daily.weather_code) {
      const dias = daily.time.map((d, i) => ({
        date: d,
        min: Math.round(daily.temperature_2m_min![i]),
        max: Math.round(daily.temperature_2m_max![i]),
        code: daily.weather_code![i],
      }))
      setDailyForecast(dias)
    }
  }

  // Aplica dados simulados de fallback
  const aplicarDadosSimulados = () => {
    setLocation({ latitude: 38.7223, longitude: -9.1393, city: "Lisboa", country: "Portugal" })
    setOutdoorTemperature(22)
    setWeatherData({
      condition: "Parcialmente nublado",
      weatherCode: 2,
      humidity: 65,
      windSpeed: 12,
      feelsLike: 21,
      minTemp: 18,
      maxTemp: 26,
      isDay: true,
    })
    // Previsao horaria simulada
    const agora = new Date()
    const horas: { time: string; temp: number; code: number; isDay: boolean }[] = []
    for (let i = 0; i < 24; i++) {
      const t = new Date(agora.getTime() + i * 3600000)
      const h = t.getHours()
      horas.push({
        time: t.toISOString(),
        temp: Math.round(20 + Math.sin((h / 24) * Math.PI * 2) * 5),
        code: 2,
        isDay: h >= 7 && h < 20,
      })
    }
    setHourlyForecast(horas)
    // Previsao de 7 dias simulada
    const dias: { date: string; min: number; max: number; code: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(agora.getTime() + i * 86400000)
      dias.push({
        date: d.toISOString(),
        min: 16 + Math.floor(Math.random() * 4),
        max: 24 + Math.floor(Math.random() * 5),
        code: [0, 1, 2, 3, 61][Math.floor(Math.random() * 5)],
      })
    }
    setDailyForecast(dias)
  }

  // Funcao para obter localizacao e dados meteorologicos reais
  const fetchLocationAndWeather = async () => {
    setIsLoadingWeather(true)
    setLocationError(null)

    let latitude: number
    let longitude: number

    // Etapa 1: Obter localizacao do usuario
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocalizacao nao suportada"))
          return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          // alta precisao desligada = obtem posicao mais rapido (evita timeout)
          enableHighAccuracy: false,
          // timeout maior para tolerar dispositivos lentos e permissao demorada
          timeout: 20000,
          // aceita uma posicao em cache de ate 10 minutos
          maximumAge: 600000
        })
      })
      latitude = position.coords.latitude
      longitude = position.coords.longitude
    } catch (error) {
      // Identificar o motivo da falha para dar uma mensagem adequada
      const geoError = error as GeolocationPositionError
      let motivo = "Localizacao indisponivel"

      if (geoError && typeof geoError.code === "number") {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          motivo = "Permissao de localizacao negada"
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          motivo = "Posicao indisponivel"
        } else if (geoError.code === geoError.TIMEOUT) {
          motivo = "Tempo limite ao obter localizacao"
        }
      }

      // Nao e um erro critico - usamos Lisboa como padrao
      console.warn(`[v0] ${motivo}. Usando Lisboa como padrao.`)
      setLocationError(`${motivo}. Usando Lisboa como padrao.`)
      adicionarLog(`${motivo} - usando Lisboa. Permita o acesso para dados reais.`, "warning", EMOJIS.WARNING)
      aplicarDadosSimulados()
      // Tentar obter clima real de Lisboa mesmo assim
      await fetchWeatherForLocation(38.7223, -9.1393, true)
      setIsLoadingWeather(false)
      return
    }

    // Etapa 2: Obter nome da cidade (reverse geocoding) - opcional
    let city = "Localizacao atual"
    let country = ""
    try {
      const geoResponse = await fetchComTimeout(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      )
      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.municipality || "Localizacao atual"
        country = geoData.address?.country || ""
      }
    } catch (error) {
      console.error("[v0] Erro no reverse geocoding (nao critico):", error)
    }

    setLocation({ latitude, longitude, city, country })

    // Etapa 3: Obter dados meteorologicos reais
    const sucesso = await fetchWeatherForLocation(latitude, longitude, true)
    if (sucesso) {
      adicionarLog(`Localizacao: ${city}${country ? ", " + country : ""} - Temperatura atualizada`, "success", EMOJIS.TEMPERATURE)
    } else {
      setLocationError("Nao foi possivel obter o clima. Usando dados simulados.")
      aplicarDadosSimulados()
    }
    setIsLoadingWeather(false)
  }

  // Selecionar uma cidade/zona escolhida na barra de pesquisa
  const selecionarLocalizacao = async (
    lat: number,
    lon: number,
    city: string,
    country: string
  ) => {
    setIsLoadingWeather(true)
    setLocationError(null)
    setLocation({ latitude: lat, longitude: lon, city, country })
    const sucesso = await fetchWeatherForLocation(lat, lon, true)
    if (sucesso) {
      adicionarLog(`Localizacao alterada para ${city}${country ? ", " + country : ""}`, "success", EMOJIS.TEMPERATURE)
    } else {
      setLocationError("Nao foi possivel obter o clima desta localizacao.")
    }
    setIsLoadingWeather(false)
  }

  // Atualizar clima periodicamente (a cada 10 minutos)
  useEffect(() => {
    if (!location) return

    const weatherUpdateInterval = setInterval(() => {
      fetchWeatherForLocation(location.latitude, location.longitude)
    }, 600000) // 10 minutos

    return () => clearInterval(weatherUpdateInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  // Retorna true se obteve dados com sucesso, false caso contrario
  // tentativas: numero de tentativas antes de desistir
  const fetchWeatherForLocation = async (
    lat: number,
    lon: number,
    primeiraVez = false,
    tentativas = 2
  ): Promise<boolean> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`

    for (let i = 0; i < tentativas; i++) {
      try {
        // Timeout maior (20s) para tolerar redes lentas e abas em segundo plano
        const weatherResponse = await fetchComTimeout(url, {}, 20000)

        if (!weatherResponse.ok) {
          throw new Error(`API retornou status ${weatherResponse.status}`)
        }

        const weatherApiData = await weatherResponse.json()
        aplicarDadosMeteo(weatherApiData)
        return true
      } catch (error) {
        const isAbort = error instanceof Error && error.name === "AbortError"
        const isUltimaTentativa = i === tentativas - 1

        if (!isUltimaTentativa) {
          // Aguardar antes de tentar novamente (backoff simples)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          continue
        }

        // Esgotadas as tentativas - mantem os dados anteriores (nao e critico)
        const motivo = isAbort ? "tempo limite excedido" : (error instanceof Error ? error.message : "erro de rede")
        console.warn(`[v0] Nao foi possivel atualizar o clima (${motivo}). Mantendo ultimos dados.`)

        if (!primeiraVez) {
          adicionarLog("Falha ao atualizar clima - mantendo ultimos dados", "warning", EMOJIS.WARNING)
        }
        return false
      }
    }
    return false
  }

  useEffect(() => {
    if (lightsStatus === "on") {
      const interval = setInterval(() => {
        setLightOnTime((prev) => prev + 1)
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [lightsStatus])

  useEffect(() => {
    const checkSchedules = () => {
      const now = currentTime.toTimeString().slice(0, 5)
      const currentWeekday = currentTime.getDay()

      schedules.forEach((schedule) => {
        if (schedule.enabled && schedule.time === now && schedule.weekdays.includes(currentWeekday)) {
          executarAcao(schedule.roomId, schedule.action, true)
        }
      })
    }

    checkSchedules()
  }, [currentTime, schedules])

  useEffect(() => {
    if (randomMode) {
      adicionarLog("Modo aleatório ativado - simulando presença", "info", EMOJIS.INFO)
      const interval = setInterval(
        () => {
          const randomRoom = QUARTOS[Math.floor(Math.random() * QUARTOS.length)]
          const randomAction = Math.random() > 0.5
          executarAcao(randomRoom.id, randomAction ? "light-on" : "light-off", false)
        },
        Math.random() * 30000 + 30000,
      )
      return () => clearInterval(interval)
    } else if (consoleLogs.length > 0 && consoleLogs[0].message.includes("aleatório ativado")) {
      adicionarLog("Modo aleatório desativado", "warning", EMOJIS.WARNING)
    }
  }, [randomMode])

  // Sistema de AC automatico baseado na temperatura
  useEffect(() => {
    if (!autoAcEnabled) return

    QUARTOS.forEach((room) => {
      const state = roomStates[room.id]
      if (outdoorTemperature >= acThresholdHot && state.acStatus !== "cooling") {
        setRoomStates(prev => ({
          ...prev,
          [room.id]: { ...prev[room.id], acStatus: "cooling" }
        }))
        adicionarLog(`${room.nome}: AC ligado (Refrigeração) - Temperatura externa: ${outdoorTemperature}°C`, "info", EMOJIS.AC_COOL)
      } else if (outdoorTemperature <= acThresholdCold && state.acStatus !== "heating") {
        setRoomStates(prev => ({
          ...prev,
          [room.id]: { ...prev[room.id], acStatus: "heating" }
        }))
        adicionarLog(`${room.nome}: AC ligado (Aquecimento) - Temperatura externa: ${outdoorTemperature}°C`, "info", EMOJIS.AC_HEAT)
      } else if (outdoorTemperature > acThresholdCold && outdoorTemperature < acThresholdHot && state.acStatus !== "off") {
        setRoomStates(prev => ({
          ...prev,
          [room.id]: { ...prev[room.id], acStatus: "off" }
        }))
        adicionarLog(`${room.nome}: AC desligado - Temperatura agradável`, "success", EMOJIS.SUCCESS)
      }
    })
  }, [outdoorTemperature, autoAcEnabled, acThresholdHot, acThresholdCold])

  // Detectar presenca e ligar TV no canal favorito
  useEffect(() => {
    const salaPresence = roomStates["sala"]?.presence || []
    if (salaPresence.length > 0 && !tvState.isOn) {
      const pessoa = PESSOAS.find(p => p.id === salaPresence[0])
      if (pessoa) {
        setTvState(prev => ({
          ...prev,
          isOn: true,
          channel: pessoa.canalFavorito
        }))
        const canal = CANAIS_TV.find(c => c.id === pessoa.canalFavorito)
        adicionarLog(`TV ligada automaticamente no ${canal?.nome} - Canal favorito de ${pessoa.nome}`, "success", EMOJIS.TV)
      }
    }
  }, [roomStates])

  const executarAcao = (roomId: string, action: string, isAutomatic: boolean) => {
    const room = QUARTOS.find((r) => r.id === roomId)
    if (!room) return

    setRoomStates((prev) => {
      const newStates = { ...prev }

      if (action === "light-on") {
        newStates[roomId].lightStatus = "on"
        addHistory(roomId, room.nome, "Luz Acesa", "light")
        adicionarLog(
          `${room.nome}: Luz acesa ${isAutomatic ? "automaticamente" : "manualmente"}`,
          "success",
          EMOJIS.LIGHT_ON,
        )
      } else if (action === "light-off") {
        newStates[roomId].lightStatus = "off"
        addHistory(roomId, room.nome, "Luz Apagada", "light")
        adicionarLog(
          `${room.nome}: Luz apagada ${isAutomatic ? "automaticamente" : "manualmente"}`,
          "success",
          EMOJIS.LIGHT_OFF,
        )
      } else if (action === "window-open") {
        newStates[roomId].windowStatus = "open"
        addHistory(roomId, room.nome, "Janela Aberta", "window")
        adicionarLog(
          `${room.nome}: Janela aberta ${isAutomatic ? "automaticamente" : "manualmente"}`,
          "success",
          EMOJIS.WINDOW_OPEN,
        )
      } else if (action === "window-close") {
        newStates[roomId].windowStatus = "close"
        addHistory(roomId, room.nome, "Janela Fechada", "window")
        adicionarLog(
          `${room.nome}: Janela fechada ${isAutomatic ? "automaticamente" : "manualmente"}`,
          "success",
          EMOJIS.WINDOW_CLOSED,
        )
      }

      return newStates
    })
  }

  const addHistory = (roomId: string, roomName: string, action: string, device: string) => {
    setHistory((prev) => [{ timestamp: new Date(), roomId, roomName, action, device }, ...prev.slice(0, 19)])
  }

  const getNextAction = (schedules: Schedule[], currentStatus: string) => {
    const now = currentTime
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const currentWeekday = now.getDay()

    const upcomingSchedules = schedules
      .filter((s) => s.enabled && s.weekdays.includes(currentWeekday))
      .map((s) => {
        const [hours, minutes] = s.time.split(":").map(Number)
        const scheduleMinutes = hours * 60 + minutes
        return { ...s, scheduleMinutes }
      })
      .filter((s) => s.scheduleMinutes > currentMinutes)
      .sort((a, b) => a.scheduleMinutes - b.scheduleMinutes)

    if (upcomingSchedules.length > 0) {
      const next = upcomingSchedules[0]
      const minutesUntil = next.scheduleMinutes - currentMinutes
      return { time: next.time, action: next.action, minutesUntil }
    }
    return null
  }

  const activateNightMode = () => {
    playSound("success")
    if (nightModeActive) {
      setNightModeActive(false)
      adicionarLog("Modo Noite desativado", "info", "🌙")
      return
    }
    
    setMorningModeActive(false)
    setNightModeActive(true)
    
    QUARTOS.forEach((room) => {
      executarAcao(room.id, "light-off", false)
      executarAcao(room.id, "window-close", false)
    })
    adicionarLog("Modo Noite ativado - toda a casa desligada", "success", "🌙")
  }

  const activateMorningMode = () => {
    playSound("success")
    if (morningModeActive) {
      setMorningModeActive(false)
      adicionarLog("Modo Manha desativado", "info", "☀️")
      return
    }
    
    setNightModeActive(false)
    setMorningModeActive(true)
    
    QUARTOS.forEach((room) => {
      executarAcao(room.id, "light-on", false)
      executarAcao(room.id, "window-open", false)
    })
    adicionarLog("Modo Manha ativado - toda a casa preparada", "success", "☀️")
  }

  const activateLeavingMode = () => {
    playSound("success")
    QUARTOS.forEach((room) => {
      executarAcao(room.id, "light-off", false)
      executarAcao(room.id, "window-close", false)
    })
    adicionarLog("Modo Saindo ativado - segurança ativa", "warning", "🏠")
  }

  const addSchedule = () => {
    const newSchedule: Schedule = {
      id: Date.now().toString(),
      roomId: QUARTOS[0].id,
      time: "12:00",
      action: "light-on",
      enabled: true,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    }
    setSchedules([...schedules, newSchedule])
    adicionarLog("Novo agendamento adicionado", "info", EMOJIS.CLOCK)
  }

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id))
    adicionarLog("Agendamento removido", "warning", "🗑️")
  }

  const updateSchedule = (id: string, updates: Partial<Schedule>) => {
    setSchedules(schedules.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const togglePresence = (roomId: string, personId: string) => {
    playSound("toggle")
    setRoomStates(prev => {
      const currentPresence = prev[roomId].presence
      const newPresence = currentPresence.includes(personId)
        ? currentPresence.filter(p => p !== personId)
        : [...currentPresence, personId]
      
      const pessoa = PESSOAS.find(p => p.id === personId)
      const room = QUARTOS.find(r => r.id === roomId)
      
      if (newPresence.includes(personId)) {
        adicionarLog(`${pessoa?.nome} entrou em ${room?.nome}`, "info", EMOJIS.PRESENCE)
      } else {
        adicionarLog(`${pessoa?.nome} saiu de ${room?.nome}`, "info", EMOJIS.PRESENCE)
      }
      
      return {
        ...prev,
        [roomId]: { ...prev[roomId], presence: newPresence }
      }
    })
  }

  const setAcTemperature = (roomId: string, temp: number) => {
    playSound("click")
    setRoomStates(prev => ({
      ...prev,
      [roomId]: { ...prev[roomId], acTemperature: temp }
    }))
    const room = QUARTOS.find(r => r.id === roomId)
    adicionarLog(`${room?.nome}: Temperatura do AC ajustada para ${temp}°C`, "info", EMOJIS.TEMPERATURE)
  }

  const toggleAcStatus = (roomId: string, status: "off" | "cooling" | "heating") => {
    playSound("toggle")
    setRoomStates(prev => ({
      ...prev,
      [roomId]: { ...prev[roomId], acStatus: status }
    }))
    const room = QUARTOS.find(r => r.id === roomId)
    const statusText = status === "off" ? "desligado" : status === "cooling" ? "refrigerando" : "aquecendo"
    adicionarLog(`${room?.nome}: AC ${statusText}`, "success", status === "cooling" ? EMOJIS.AC_COOL : status === "heating" ? EMOJIS.AC_HEAT : EMOJIS.SUCCESS)
  }

  const tvControls = {
    togglePower: () => {
      playSound("click")
      setTvState(prev => {
        const newState = !prev.isOn
        adicionarLog(newState ? "TV ligada" : "TV desligada", "info", EMOJIS.TV)
        return { ...prev, isOn: newState }
      })
    },
    changeChannel: (channel: number) => {
      playSound("click")
      const canal = CANAIS_TV.find(c => c.id === channel)
      setTvState(prev => ({ ...prev, channel }))
      adicionarLog(`TV: Canal alterado para ${canal?.nome}`, "info", EMOJIS.TV)
    },
    adjustVolume: (delta: number) => {
      playSound("click")
      setTvState(prev => ({
        ...prev,
        volume: Math.max(0, Math.min(100, prev.volume + delta))
      }))
    },
    toggleMute: () => {
      playSound("toggle")
      setTvState(prev => {
        adicionarLog(prev.isMuted ? "TV: Som ativado" : "TV: Mudo ativado", "info", EMOJIS.TV)
        return { ...prev, isMuted: !prev.isMuted }
      })
    }
  }

  // Funcao do Assistente de Voz AI
  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase().trim()
    let response = ""
    let actionTaken = false

    // Verificar comandos de cena
    if (lowerCommand.includes("modo manha") || lowerCommand.includes("bom dia")) {
      activateMorningMode()
      response = "Modo manha ativado! Todas as luzes acesas e janelas abertas. Tenha um otimo dia!"
      actionTaken = true
    } else if (lowerCommand.includes("modo noite") || lowerCommand.includes("boa noite")) {
      activateNightMode()
      response = "Modo noite ativado! Todas as luzes apagadas e janelas fechadas. Durma bem!"
      actionTaken = true
    } else if (lowerCommand.includes("saindo") || lowerCommand.includes("sair de casa")) {
      activateLeavingMode()
      response = "Modo seguranca ativado! Tudo desligado e fechado. Ate logo!"
      actionTaken = true
    }
    // Verificar comandos de TV
    else if (lowerCommand.includes("ligar tv") || lowerCommand.includes("liga tv")) {
      if (!tvState.isOn) {
        tvControls.togglePower()
        response = "TV ligada! O que deseja assistir?"
      } else {
        response = "A TV ja esta ligada."
      }
      actionTaken = true
    } else if (lowerCommand.includes("desligar tv") || lowerCommand.includes("desliga tv")) {
      if (tvState.isOn) {
        tvControls.togglePower()
        response = "TV desligada!"
      } else {
        response = "A TV ja esta desligada."
      }
      actionTaken = true
    }
    // Verificar comandos de temperatura/clima
    else if (lowerCommand.includes("temperatura") || lowerCommand.includes("quantos graus") || lowerCommand.includes("clima") || lowerCommand.includes("tempo")) {
      response = `A temperatura exterior atual e de ${outdoorTemperature.toFixed(1)} graus Celsius. `
      response += `Sensacao termica de ${weatherData.feelsLike} graus. `
      response += `Minima de ${weatherData.minTemp} e maxima de ${weatherData.maxTemp} graus hoje. `
      response += `Humidade em ${weatherData.humidity}% e vento a ${weatherData.windSpeed} km/h.`
      actionTaken = true
    }
    // Verificar comandos de luz por quarto
    else if (lowerCommand.includes("luz") || lowerCommand.includes("luzes")) {
      const turnOn = lowerCommand.includes("acender") || lowerCommand.includes("ligar") || lowerCommand.includes("acende") || lowerCommand.includes("liga")
      const turnOff = lowerCommand.includes("apagar") || lowerCommand.includes("desligar") || lowerCommand.includes("apaga") || lowerCommand.includes("desliga")
      
      let targetRoom = null
      for (const room of QUARTOS) {
        if (lowerCommand.includes(room.nome.toLowerCase()) || lowerCommand.includes(room.id)) {
          targetRoom = room
          break
        }
      }

      if (lowerCommand.includes("toda") || lowerCommand.includes("todas") || lowerCommand.includes("casa")) {
        if (turnOn) {
          QUARTOS.forEach(r => executarAcao(r.id, "light-on", false))
          response = "Todas as luzes da casa foram acesas!"
        } else if (turnOff) {
          QUARTOS.forEach(r => executarAcao(r.id, "light-off", false))
          response = "Todas as luzes da casa foram apagadas!"
        }
        actionTaken = true
      } else if (targetRoom) {
        if (turnOn) {
          executarAcao(targetRoom.id, "light-on", false)
          response = `Luz do ${targetRoom.nome} acesa!`
        } else if (turnOff) {
          executarAcao(targetRoom.id, "light-off", false)
          response = `Luz do ${targetRoom.nome} apagada!`
        }
        actionTaken = true
      }
    }
    // Verificar comandos de janela
    else if (lowerCommand.includes("janela") || lowerCommand.includes("janelas")) {
      const open = lowerCommand.includes("abrir") || lowerCommand.includes("abre")
      const close = lowerCommand.includes("fechar") || lowerCommand.includes("fecha")
      
      let targetRoom = null
      for (const room of QUARTOS) {
        if (lowerCommand.includes(room.nome.toLowerCase()) || lowerCommand.includes(room.id)) {
          targetRoom = room
          break
        }
      }

      if (lowerCommand.includes("toda") || lowerCommand.includes("todas") || lowerCommand.includes("casa")) {
        if (open) {
          QUARTOS.forEach(r => executarAcao(r.id, "window-open", false))
          response = "Todas as janelas foram abertas!"
        } else if (close) {
          QUARTOS.forEach(r => executarAcao(r.id, "window-close", false))
          response = "Todas as janelas foram fechadas!"
        }
        actionTaken = true
      } else if (targetRoom) {
        if (open) {
          executarAcao(targetRoom.id, "window-open", false)
          response = `Janela do ${targetRoom.nome} aberta!`
        } else if (close) {
          executarAcao(targetRoom.id, "window-close", false)
          response = `Janela do ${targetRoom.nome} fechada!`
        }
        actionTaken = true
      }
    }
    // Verificar comandos de ar condicionado
    else if (lowerCommand.includes("ar condicionado") || lowerCommand.includes("ar ") || lowerCommand.includes("ac")) {
      const turnOn = lowerCommand.includes("ligar") || lowerCommand.includes("liga")
      const turnOff = lowerCommand.includes("desligar") || lowerCommand.includes("desliga")
      const cool = lowerCommand.includes("frio") || lowerCommand.includes("refriger")
      const heat = lowerCommand.includes("quente") || lowerCommand.includes("aquecer")

      if (turnOn || cool || heat) {
        const status = cool ? "cooling" : heat ? "heating" : "cooling"
        QUARTOS.forEach(r => toggleAcStatus(r.id, status))
        response = `Ar condicionado ${cool ? "refrigerando" : heat ? "aquecendo" : "ligado"} em toda a casa!`
        actionTaken = true
      } else if (turnOff) {
        QUARTOS.forEach(r => toggleAcStatus(r.id, "off"))
        response = "Ar condicionado desligado em toda a casa!"
        actionTaken = true
      }

      // Verificar se quer ajustar temperatura
      const tempMatch = lowerCommand.match(/(\d+)\s*graus?/)
      if (tempMatch) {
        const temp = parseInt(tempMatch[1])
        if (temp >= 16 && temp <= 30) {
          QUARTOS.forEach(r => setAcTemperature(r.id, temp))
          response = `Temperatura do ar condicionado ajustada para ${temp} graus em toda a casa!`
          actionTaken = true
        }
      }
    }
    // Status geral
    else if (lowerCommand.includes("status") || lowerCommand.includes("como esta")) {
      const lightsOn = QUARTOS.filter(r => roomStates[r.id].lightStatus === "on").length
      const windowsOpen = QUARTOS.filter(r => roomStates[r.id].windowStatus === "open").length
      const acOn = QUARTOS.filter(r => roomStates[r.id].acStatus !== "off").length
      
      response = `Status da casa: ${lightsOn} luzes acesas, ${windowsOpen} janelas abertas, ${acOn} ar condicionados ligados. `
      response += `Temperatura externa: ${outdoorTemperature.toFixed(1)} graus. `
      response += `TV ${tvState.isOn ? "ligada" : "desligada"}.`
      actionTaken = true
    }
    // Comando nao reconhecido
    else {
      response = "Desculpe, nao entendi o comando. Experimente dizer: 'acender luz da sala', 'ligar ar condicionado', 'modo noite', 'qual a temperatura', ou 'status da casa'."
    }

    if (actionTaken) {
      adicionarLog(`Assistente AI: ${response}`, "info", "🤖")
    }

    return response
  }

  // Faz o assistente falar em voz alta (Text-to-Speech) com voz portuguesa.
  // Enquanto fala, pausa a escuta para nao se ouvir a si proprio.
  const falar = (texto: string, aoTerminar?: () => void) => {
    if (!("speechSynthesis" in window)) {
      aoTerminar?.()
      return
    }

    // Cancelar qualquer fala anterior em curso
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = "pt-PT"
    utterance.rate = 1
    utterance.pitch = 1

    // Escolher uma voz portuguesa se estiver disponivel
    const vozes = window.speechSynthesis.getVoices()
    const vozPt = vozes.find((v) => v.lang === "pt-PT") || vozes.find((v) => v.lang.startsWith("pt"))
    if (vozPt) utterance.voice = vozPt

    utterance.onstart = () => {
      isSpeakingRef.current = true
      setIsSpeaking(true)
      // Pausar o reconhecimento enquanto fala, para nao captar a propria voz
      try {
        recognitionRef.current?.stop()
      } catch {
        // ignora se ja estiver parado
      }
    }

    utterance.onend = () => {
      isSpeakingRef.current = false
      setIsSpeaking(false)
      aoTerminar?.()
      // Se o modo de voz continuo estiver ativo, volta a ouvir
      if (voiceModeRef.current) {
        setTimeout(() => iniciarEscuta(), 400)
      }
    }

    window.speechSynthesis.speak(utterance)
  }

  // Processa um comando (de voz ou texto), regista as mensagens e responde por voz.
  const enviarComando = (comando: string) => {
    const texto = comando.trim()
    if (!texto) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: texto,
      timestamp: new Date(),
    }
    setAiMessages((prev) => [...prev, userMessage])
    setIsProcessing(true)
    setInterimTranscript("")
    playSound("click")

    setTimeout(() => {
      const response = processVoiceCommand(texto)

      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }
      setAiMessages((prev) => [...prev, aiResponse])
      setIsProcessing(false)
      playSound("success")

      // Responder sempre em voz alta
      falar(response)
    }, 300)

    setUserInput("")
  }

  const handleAiSubmit = () => {
    if (!userInput.trim() || isProcessing) return
    enviarComando(userInput)
  }

  // Verifica se o reconhecimento de voz e suportado
  const vozSuportada = () =>
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)

  // Inicia (ou reinicia) a escuta de voz
  const iniciarEscuta = () => {
    if (!vozSuportada()) {
      adicionarLog("Reconhecimento de voz nao suportado neste navegador", "error", "🎤")
      return
    }
    // Nao iniciar se estiver a falar (evita ouvir-se a si proprio)
    if (isSpeakingRef.current) return
    // Ja existe uma sessao ativa
    if (recognitionRef.current) return

    const SpeechRecognitionClass =
      (window as typeof window & { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition ||
      (window as typeof window & { SpeechRecognition: new () => SpeechRecognition }).SpeechRecognition

    const recognition = new SpeechRecognitionClass()
    recognition.lang = "pt-PT"
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ""
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) {
          finalTranscript += res[0].transcript
        } else {
          interim += res[0].transcript
        }
      }

      if (interim) setInterimTranscript(interim)

      if (finalTranscript.trim()) {
        setInterimTranscript("")
        enviarComando(finalTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" e "aborted" sao comuns e nao criticos
      if (event.error !== "no-speech" && event.error !== "aborted") {
        adicionarLog(`Erro no reconhecimento de voz: ${event.error}`, "error", "🎤")
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
      // No modo continuo, reiniciar automaticamente (a nao ser que esteja a falar)
      if (voiceModeRef.current && !isSpeakingRef.current) {
        setTimeout(() => iniciarEscuta(), 300)
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
    }
  }

  // Para a escuta de voz
  const pararEscuta = () => {
    const rec = recognitionRef.current
    recognitionRef.current = null
    try {
      rec?.stop()
    } catch {
      // ignora
    }
    setIsListening(false)
    setInterimTranscript("")
  }

  // Liga/desliga o modo de voz continuo (mãos-livres)
  const alternarModoVoz = () => {
    if (!vozSuportada()) {
      adicionarLog("Reconhecimento de voz nao suportado neste navegador", "error", "🎤")
      return
    }
    playSound("toggle")
    const novoEstado = !voiceModeRef.current
    voiceModeRef.current = novoEstado
    setVoiceModeEnabled(novoEstado)

    if (novoEstado) {
      adicionarLog("Modo de voz ativado - pode falar os seus comandos", "success", "🎤")
      falar("Modo de voz ativado. Estou a ouvir. Pode dar-me os seus comandos.")
    } else {
      adicionarLog("Modo de voz desativado", "info", "🎤")
      window.speechSynthesis?.cancel()
      pararEscuta()
    }
  }

  // Escuta pontual (um unico comando) - usada pelo botao de microfone
  const startVoiceRecognition = () => {
    if (voiceModeRef.current) return // ja esta em modo continuo
    iniciarEscuta()
  }

  // Garantir que as vozes do TTS sao carregadas
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Forca o carregamento da lista de vozes
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const getTemperatureColor = (temp: number) => {
    if (temp <= 10) return "text-blue-600"
    if (temp <= 18) return "text-cyan-500"
    if (temp <= 24) return "text-green-500"
    if (temp <= 30) return "text-orange-500"
    return "text-red-600"
  }

  const getTemperatureGradient = (temp: number) => {
    if (temp <= 10) return "from-blue-500 to-blue-700"
    if (temp <= 18) return "from-cyan-400 to-blue-500"
    if (temp <= 24) return "from-green-400 to-emerald-500"
    if (temp <= 30) return "from-orange-400 to-red-500"
    return "from-red-500 to-red-700"
  }

  const toggleWeekday = (scheduleId: string, weekday: number) => {
    setSchedules(
      schedules.map((s) => {
        if (s.id === scheduleId) {
          const weekdays = s.weekdays.includes(weekday)
            ? s.weekdays.filter((d) => d !== weekday)
            : [...s.weekdays, weekday].sort()
          return { ...s, weekdays }
        }
        return s
      }),
    )
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} p-4 md:p-8 transition-all duration-1000`}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {getTimeIcon()}
                <h1 className="text-4xl font-bold tracking-tight">{getGreeting()}!</h1>
              </div>
              <p className="text-lg text-muted-foreground">Casa Inteligente - 6 Quartos Automatizados</p>
            </div>
            <Link
              to="/pomodoro"
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
            >
              <Timer className="h-5 w-5 text-rose-500" />
              Pomodoro IoT
            </Link>
          </div>
        </div>

        <Card className="border-2 shadow-lg bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Clock className="h-8 w-8 mx-auto text-primary animate-pulse" />
              <div className="text-6xl font-mono font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {currentTime.toLocaleTimeString("pt-BR")}
              </div>
              <p className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estacao Meteorologica - estilo weather.com */}
        <WeatherCard
          location={location}
          weatherData={weatherData}
          outdoorTemperature={outdoorTemperature}
          hourlyForecast={hourlyForecast}
          dailyForecast={dailyForecast}
          isLoadingWeather={isLoadingWeather}
          locationError={locationError}
          autoAcEnabled={autoAcEnabled}
          onRefresh={fetchLocationAndWeather}
          onSelectLocation={selecionarLocalizacao}
        />

        {/* Assistente de Voz AI */}
        <Card className="border-2 shadow-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-violet-500" />
                Assistente de Voz AI
              </span>
              <Badge
                variant={isSpeaking || isListening ? "default" : "secondary"}
                className={
                  isSpeaking
                    ? "bg-violet-500 animate-pulse"
                    : isListening
                    ? "bg-green-500 animate-pulse"
                    : ""
                }
              >
                {isSpeaking ? "A falar..." : isListening ? "A ouvir..." : "Pronto"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Controle a casa toda com a sua voz. Ative o modo de voz e diga, por exemplo: &quot;acender a luz da sala&quot;, &quot;qual a temperatura&quot; ou &quot;modo noite&quot;.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Botao principal de voz (mãos-livres) */}
            <div className="flex flex-col items-center gap-3 py-2">
              <button
                type="button"
                onClick={alternarModoVoz}
                aria-label={voiceModeEnabled ? "Desativar modo de voz" : "Ativar modo de voz"}
                className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${
                  voiceModeEnabled
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/40"
                    : "bg-muted text-muted-foreground hover:bg-violet-500/20"
                }`}
              >
                {/* Aneis de animacao quando ativo */}
                {voiceModeEnabled && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
                    {isListening && (
                      <span className="absolute -inset-2 rounded-full border-2 border-green-400 animate-pulse" />
                    )}
                  </>
                )}
                {voiceModeEnabled ? (
                  <Mic className="h-10 w-10 relative z-10" />
                ) : (
                  <MicOff className="h-10 w-10 relative z-10" />
                )}
              </button>
              <p className="text-sm font-medium text-center">
                {voiceModeEnabled
                  ? isSpeaking
                    ? "A responder..."
                    : isListening
                    ? "A ouvir o seu comando..."
                    : "Modo de voz ativo"
                  : "Toque para ativar o modo de voz"}
              </p>
              {/* Transcricao em tempo real */}
              {interimTranscript && (
                <p className="text-sm text-violet-500 italic text-center min-h-5">
                  &quot;{interimTranscript}&quot;
                </p>
              )}
            </div>

            {/* Area de mensagens */}
            <div className="h-48 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-lg border">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-violet-100 dark:bg-violet-900/50 text-foreground"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {msg.role === "assistant" && <Bot className="h-4 w-4 mt-0.5 text-violet-500" />}
                      <p className="text-sm">{msg.content}</p>
                      {msg.role === "user" && <User className="h-4 w-4 mt-0.5" />}
                    </div>
                    <p className="text-[10px] opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-violet-100 dark:bg-violet-900/50 p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Input de texto (alternativa a voz) e microfone pontual */}
            <div className="flex gap-2">
              <Button
                onClick={startVoiceRecognition}
                variant={isListening && !voiceModeEnabled ? "default" : "outline"}
                size="icon"
                className={`shrink-0 ${isListening && !voiceModeEnabled ? "bg-green-500 hover:bg-green-600 animate-pulse" : ""}`}
                disabled={isListening || voiceModeEnabled}
                title="Falar um unico comando"
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    handleAiSubmit()
                  }
                }}
                placeholder="Ou escreva um comando aqui..."
                className="flex-1"
                disabled={isProcessing}
              />
              <Button
                onClick={handleAiSubmit}
                disabled={!userInput.trim() || isProcessing}
                className="shrink-0"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {/* Comandos rapidos */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => enviarComando("qual a temperatura")} disabled={isProcessing}>
                Temperatura
              </Button>
              <Button variant="outline" size="sm" onClick={() => enviarComando("status da casa")} disabled={isProcessing}>
                Status
              </Button>
              <Button variant="outline" size="sm" onClick={() => enviarComando("modo noite")} disabled={isProcessing}>
                Modo Noite
              </Button>
              <Button variant="outline" size="sm" onClick={() => enviarComando("acender todas as luzes")} disabled={isProcessing}>
                Acender Tudo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Controle de Temperatura Automatica */}
        <Card className="border-2 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Controle de Climatizacao Automatica
            </CardTitle>
            <CardDescription>Configure os limites de temperatura para ativar o AC automaticamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-4 w-4 text-red-500" />
                  Ligar refrigeracao quando:
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={acThresholdHot}
                    onChange={(e) => setAcThresholdHot(Number(e.target.value))}
                    className="w-20"
                  />
                  <span>°C ou mais</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Snowflake className="h-4 w-4 text-blue-500" />
                  Ligar aquecimento quando:
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={acThresholdCold}
                    onChange={(e) => setAcThresholdCold(Number(e.target.value))}
                    className="w-20"
                  />
                  <span>°C ou menos</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={autoAcEnabled}
                  onCheckedChange={(enabled) => {
                    playSound("toggle")
                    setAutoAcEnabled(enabled)
                    adicionarLog(enabled ? "AC automatico ativado" : "AC automatico desativado", "info", EMOJIS.SUCCESS)
                  }}
                />
                <span className="font-medium">AC Automatico</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TV da Sala */}
        <Card className={`border-2 shadow-lg bg-card/50 backdrop-blur ${tvState.isOn ? "ring-2 ring-purple-400" : ""}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Tv className="h-5 w-5 text-purple-500" />
                TV da Sala de Estar
              </span>
              <Badge variant={tvState.isOn ? "default" : "secondary"}>
                {tvState.isOn ? "Ligada" : "Desligada"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Quando alguem entra na sala, a TV liga automaticamente no canal favorito
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={tvControls.togglePower}
                variant={tvState.isOn ? "default" : "outline"}
                className={tvState.isOn ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                <Power className="h-4 w-4 mr-2" />
                {tvState.isOn ? "Desligar" : "Ligar"}
              </Button>
              
              {tvState.isOn && (
                <>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => tvControls.adjustVolume(-10)} variant="outline" size="icon">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button onClick={tvControls.toggleMute} variant={tvState.isMuted ? "destructive" : "outline"} size="icon">
                      {tvState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Button onClick={() => tvControls.adjustVolume(10)} variant="outline" size="icon">
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">{tvState.volume}%</span>
                  </div>
                </>
              )}
            </div>

            {tvState.isOn && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Canais</label>
                <div className="grid grid-cols-4 gap-2">
                  {CANAIS_TV.map((canal) => (
                    <Button
                      key={canal.id}
                      onClick={() => tvControls.changeChannel(canal.id)}
                      variant={tvState.channel === canal.id ? "default" : "outline"}
                      size="sm"
                      className="flex-col h-auto py-2"
                    >
                      <span className="font-semibold">{canal.nome}</span>
                      <span className="text-xs text-muted-foreground">{canal.genero}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Presenca na Sala */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4" />
                Detector de Presenca - Sala
              </label>
              <div className="flex flex-wrap gap-2">
                {PESSOAS.map((pessoa) => {
                  const isPresent = roomStates["sala"]?.presence.includes(pessoa.id)
                  return (
                    <Button
                      key={pessoa.id}
                      onClick={() => togglePresence("sala", pessoa.id)}
                      variant={isPresent ? "default" : "outline"}
                      size="sm"
                      className={isPresent ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    >
                      <User className="h-4 w-4 mr-1" />
                      {pessoa.nome}
                      {isPresent && <span className="ml-1 text-xs">(na sala)</span>}
                    </Button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Clique para simular entrada/saida de pessoas. A TV liga automaticamente no canal favorito.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Cenas Rápidas
            </CardTitle>
            <CardDescription>Controle toda a casa com um clique</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={activateMorningMode}
                  variant={morningModeActive ? "default" : "outline"}
                  className={`h-auto flex-col gap-2 py-4 ${morningModeActive ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-transparent hover:bg-amber-500/10"}`}
                >
                  <Sun className={`h-6 w-6 ${morningModeActive ? "text-white" : "text-amber-500"}`} />
                  <span className="font-semibold">Modo Manha</span>
                  <span className={`text-xs ${morningModeActive ? "text-amber-100" : "text-muted-foreground"}`}>
                    {morningModeActive ? "ON - Clique para OFF" : "OFF - Tudo Ligado"}
                  </span>
                </Button>
                <Badge variant={morningModeActive ? "default" : "secondary"} className="justify-center">
                  {morningModeActive ? "ATIVO" : "INATIVO"}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={activateNightMode}
                  variant={nightModeActive ? "default" : "outline"}
                  className={`h-auto flex-col gap-2 py-4 ${nightModeActive ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-transparent hover:bg-blue-500/10"}`}
                >
                  <Moon className={`h-6 w-6 ${nightModeActive ? "text-white" : "text-blue-400"}`} />
                  <span className="font-semibold">Modo Noite</span>
                  <span className={`text-xs ${nightModeActive ? "text-blue-100" : "text-muted-foreground"}`}>
                    {nightModeActive ? "ON - Clique para OFF" : "OFF - Tudo Desligado"}
                  </span>
                </Button>
                <Badge variant={nightModeActive ? "default" : "secondary"} className="justify-center">
                  {nightModeActive ? "ATIVO" : "INATIVO"}
                </Badge>
              </div>
              
              <Button
                onClick={activateLeavingMode}
                variant="outline"
                className="h-auto flex-col gap-2 py-4 bg-transparent hover:bg-red-500/10"
              >
                <Home className="h-6 w-6 text-red-400" />
                <span className="font-semibold">Saindo de Casa</span>
                <span className="text-xs text-muted-foreground">Seguranca</span>
              </Button>
              <Button
                onClick={() => {
                  playSound("random")
                  setRandomMode(!randomMode)
                }}
                variant={randomMode ? "default" : "outline"}
                className="h-auto flex-col gap-2 py-4"
              >
                <Shuffle className="h-6 w-6" />
                <span className="font-semibold">Modo Aleatorio</span>
                <span className="text-xs text-muted-foreground">{randomMode ? "Ativo" : "Simular"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {QUARTOS.map((room) => {
            const RoomIcon = room.icon
            const state = roomStates[room.id]
            const isLightOn = state.lightStatus === "on"
            const isWindowOpen = state.windowStatus === "open"
            const presenceCount = state.presence.length

            return (
              <Card
                key={room.id}
                className={`border-2 shadow-lg transition-all duration-500 ${
                  isLightOn ? "ring-2 ring-amber-400 shadow-amber-400/20" : ""
                } ${presenceCount > 0 ? "ring-2 ring-emerald-400" : ""}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <RoomIcon className={`h-5 w-5 ${room.color}`} />
                      {room.nome}
                    </span>
                    <div className="flex items-center gap-1">
                      {presenceCount > 0 && (
                        <Badge variant="default" className="bg-emerald-600">
                          <Users className="h-3 w-3 mr-1" />
                          {presenceCount}
                        </Badge>
                      )}
                      <Badge variant={isLightOn ? "default" : "secondary"}>
                        {isLightOn ? EMOJIS.LIGHT_ON : EMOJIS.LIGHT_OFF}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Detector de Presenca */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">Presenca</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {PESSOAS.map((pessoa) => {
                        const isPresent = state.presence.includes(pessoa.id)
                        return (
                          <Button
                            key={pessoa.id}
                            onClick={() => togglePresence(room.id, pessoa.id)}
                            variant={isPresent ? "default" : "outline"}
                            size="sm"
                            className={`h-7 text-xs ${isPresent ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                          >
                            {pessoa.nome.charAt(0)}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Luz */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isLightOn ? (
                          <Lightbulb className="h-5 w-5 text-amber-400 animate-pulse" />
                        ) : (
                          <LightbulbOff className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-semibold">Luz</span>
                      </div>
                      <Badge variant={isLightOn ? "default" : "secondary"}>{isLightOn ? "Acesa" : "Apagada"}</Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          playSound("click")
                          executarAcao(room.id, "light-on", false)
                        }}
                        size="sm"
                        variant={isLightOn ? "default" : "outline"}
                        className="flex-1"
                      >
                        Acender
                      </Button>
                      <Button
                        onClick={() => {
                          playSound("click")
                          executarAcao(room.id, "light-off", false)
                        }}
                        size="sm"
                        variant={!isLightOn ? "default" : "outline"}
                        className="flex-1"
                      >
                        Apagar
                      </Button>
                    </div>
                  </div>

                  {/* Janela */}
                  <div className="border-t pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Square className={`h-5 w-5 ${isWindowOpen ? "text-blue-400" : "text-muted-foreground"}`} />
                        <span className="font-semibold">Janela</span>
                      </div>
                      <Badge variant={isWindowOpen ? "default" : "secondary"}>
                        {isWindowOpen ? "Aberta" : "Fechada"}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          playSound("toggle")
                          executarAcao(room.id, "window-open", false)
                        }}
                        size="sm"
                        variant={isWindowOpen ? "default" : "outline"}
                        className="flex-1"
                      >
                        Abrir
                      </Button>
                      <Button
                        onClick={() => {
                          playSound("toggle")
                          executarAcao(room.id, "window-close", false)
                        }}
                        size="sm"
                        variant={!isWindowOpen ? "default" : "outline"}
                        className="flex-1"
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>

                  {/* Ar Condicionado */}
                  <div className="border-t pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {state.acStatus === "cooling" ? (
                          <Snowflake className="h-5 w-5 text-blue-400 animate-pulse" />
                        ) : state.acStatus === "heating" ? (
                          <Flame className="h-5 w-5 text-red-400 animate-pulse" />
                        ) : (
                          <Thermometer className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-semibold">AC</span>
                      </div>
                      <Badge 
                        variant={state.acStatus !== "off" ? "default" : "secondary"}
                        className={state.acStatus === "cooling" ? "bg-blue-600" : state.acStatus === "heating" ? "bg-red-600" : ""}
                      >
                        {state.acStatus === "off" ? "Desligado" : state.acStatus === "cooling" ? "Refrigerando" : "Aquecendo"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setAcTemperature(room.id, state.acTemperature - 1)}
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <span className="text-xl font-bold w-16 text-center">{state.acTemperature}°C</span>
                      <Button
                        onClick={() => setAcTemperature(room.id, state.acTemperature + 1)}
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        onClick={() => toggleAcStatus(room.id, "off")}
                        size="sm"
                        variant={state.acStatus === "off" ? "default" : "outline"}
                        className="flex-1"
                      >
                        OFF
                      </Button>
                      <Button
                        onClick={() => toggleAcStatus(room.id, "cooling")}
                        size="sm"
                        variant={state.acStatus === "cooling" ? "default" : "outline"}
                        className={`flex-1 ${state.acStatus === "cooling" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                      >
                        <Snowflake className="h-3 w-3 mr-1" />
                        Frio
                      </Button>
                      <Button
                        onClick={() => toggleAcStatus(room.id, "heating")}
                        size="sm"
                        variant={state.acStatus === "heating" ? "default" : "outline"}
                        className={`flex-1 ${state.acStatus === "heating" ? "bg-red-600 hover:bg-red-700" : ""}`}
                      >
                        <Flame className="h-3 w-3 mr-1" />
                        Quente
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Tabs defaultValue="agendamentos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
          </TabsList>

          <TabsContent value="agendamentos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Agendamentos</CardTitle>
                    <CardDescription>Configure horários automáticos para cada quarto</CardDescription>
                  </div>
                  <Button onClick={() => {
                    playSound("click")
                    addSchedule()
                  }} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {schedules.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum agendamento configurado</p>
                ) : (
                  schedules.map((schedule) => {
                    const room = QUARTOS.find((r) => r.id === schedule.roomId)
                    return (
                      <Card key={schedule.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={schedule.enabled}
                                onCheckedChange={(enabled) => {
                                  playSound("toggle")
                                  updateSchedule(schedule.id, { enabled })
                                }}
                              />
                              <div>
                                <p className="font-semibold">{room?.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  {schedule.action === "light-on" && "Acender luz"}
                                  {schedule.action === "light-off" && "Apagar luz"}
                                  {schedule.action === "window-open" && "Abrir janela"}
                                  {schedule.action === "window-close" && "Fechar janela"}
                                </p>
                              </div>
                            </div>
                            <Button onClick={() => {
                              playSound("click")
                              removeSchedule(schedule.id)
                            }} variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Quarto</label>
                              <select
                                value={schedule.roomId}
                                onChange={(e) => updateSchedule(schedule.id, { roomId: e.target.value })}
                                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                              >
                                {QUARTOS.map((room) => (
                                  <option key={room.id} value={room.id}>
                                    {room.nome}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Ação</label>
                              <select
                                value={schedule.action}
                                onChange={(e) =>
                                  updateSchedule(schedule.id, {
                                    action: e.target.value as Schedule["action"],
                                  })
                                }
                                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="light-on">Acender Luz</option>
                                <option value="light-off">Apagar Luz</option>
                                <option value="window-open">Abrir Janela</option>
                                <option value="window-close">Fechar Janela</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Horário</label>
                            <Input
                              type="time"
                              value={schedule.time}
                              onChange={(e) => updateSchedule(schedule.id, { time: e.target.value })}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Dias da Semana</label>
                            <div className="flex gap-2">
                              {DIAS_SEMANA.map((dia, index) => (
                                <Button
                                  key={index}
                                  onClick={() => toggleWeekday(schedule.id, index)}
                                  variant={schedule.weekdays.includes(index) ? "default" : "outline"}
                                  size="sm"
                                  className="w-10 h-10 p-0"
                                >
                                  {dia}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Atividades
                </CardTitle>
                <CardDescription>Últimas 20 ações executadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhuma atividade registrada</p>
                  ) : (
                    history.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {entry.device === "light"
                              ? entry.action.includes("Acesa")
                                ? EMOJIS.LIGHT_ON
                                : EMOJIS.LIGHT_OFF
                              : entry.action.includes("Aberta")
                                ? EMOJIS.WINDOW_OPEN
                                : EMOJIS.WINDOW_CLOSED}
                          </span>
                          <div>
                            <p className="font-semibold">{entry.roomName}</p>
                            <p className="text-muted-foreground">{entry.action}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {entry.timestamp.toLocaleTimeString("pt-BR")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="console">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Console de Sistema
                </CardTitle>
                <CardDescription>Logs em tempo real das ações executadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-black/90 p-4 font-mono text-sm h-96 overflow-y-auto">
                  {consoleLogs.length === 0 ? (
                    <p className="text-green-500">Sistema pronto. Aguardando comandos...</p>
                  ) : (
                    <div className="space-y-1">
                      {consoleLogs.map((log) => (
                        <div key={log.id} className="flex gap-2">
                          <span className="text-gray-500">[{log.timestamp.toLocaleTimeString("pt-BR")}]</span>
                          <span className={CORES_LOG[log.type.toUpperCase() as keyof typeof CORES_LOG]}>
                            {log.emoji} {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Casa Inteligente - Automação IoT" },
      { name: "description", content: "Painel de controlo de casa inteligente com assistente de voz, clima e Pomodoro IoT." },
    ],
  }),
  component: HomeAutomation,
})
