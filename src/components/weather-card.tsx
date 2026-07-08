
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WeatherIcon } from "@/components/weather-icon"
import { CitySearch } from "@/components/city-search"
import { MapPin, RefreshCw, Loader2, Droplets, Wind, Thermometer, ChevronUp, ChevronDown } from "lucide-react"

interface WeatherData {
  condition: string
  weatherCode: number
  humidity: number
  windSpeed: number
  feelsLike: number
  minTemp: number
  maxTemp: number
  isDay: boolean
}

interface HourlyItem {
  time: string
  temp: number
  code: number
  isDay: boolean
}

interface DailyItem {
  date: string
  min: number
  max: number
  code: number
}

interface LocationInfo {
  latitude: number
  longitude: number
  city: string
  country: string
}

interface WeatherCardProps {
  location: LocationInfo | null
  weatherData: WeatherData
  outdoorTemperature: number
  hourlyForecast: HourlyItem[]
  dailyForecast: DailyItem[]
  isLoadingWeather: boolean
  locationError: string | null
  autoAcEnabled: boolean
  onRefresh: () => void
  onSelectLocation: (lat: number, lon: number, city: string, country: string) => void
}

// Gradiente do cartao principal ao estilo weather.com (azul de dia, indigo a noite)
function getHeroGradient(isDay: boolean) {
  return isDay
    ? "from-sky-500 via-sky-600 to-blue-700"
    : "from-indigo-800 via-indigo-900 to-slate-900"
}

function formatHour(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
}

function formatDayLabel(iso: string, index: number) {
  if (index === 0) return "Hoje"
  const d = new Date(iso)
  return d.toLocaleDateString("pt-PT", { weekday: "short" })
}

export function WeatherCard({
  location,
  weatherData,
  outdoorTemperature,
  hourlyForecast,
  dailyForecast,
  isLoadingWeather,
  locationError,
  autoAcEnabled,
  onRefresh,
  onSelectLocation,
}: WeatherCardProps) {
  // Amplitude para o grafico simples de temperaturas dos proximos dias
  const allTemps = dailyForecast.flatMap((d) => [d.min, d.max])
  const minRange = allTemps.length ? Math.min(...allTemps) : 0
  const maxRange = allTemps.length ? Math.max(...allTemps) : 1
  const range = Math.max(1, maxRange - minRange)

  return (
    <Card className="border-2 shadow-lg overflow-hidden p-0">
      {/* Cabecalho com gradiente ao estilo weather.com */}
      <div className={`bg-gradient-to-br ${getHeroGradient(weatherData.isDay)} text-white`}>
        <div className="flex items-start justify-between p-5 pb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            {location ? (
              <span>
                {location.city}
                {location.country ? `, ${location.country}` : ""}
              </span>
            ) : (
              <span>A obter localizacao...</span>
            )}
          </div>
          <Button
            onClick={onRefresh}
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white border-0"
            disabled={isLoadingWeather}
            aria-label="Atualizar clima"
          >
            {isLoadingWeather ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Barra de pesquisa de cidades/zonas de Portugal */}
        <div className="px-5 pb-3">
          <CitySearch onSelect={onSelectLocation} />
        </div>

        {isLoadingWeather ? (
          <div className="flex flex-col items-center justify-center py-12 px-5">
            <Loader2 className="h-10 w-10 animate-spin mb-3" />
            <p className="text-sm text-white/90">A obter dados meteorologicos...</p>
            <p className="text-xs text-white/70 mt-1">Permita o acesso a localizacao no navegador</p>
          </div>
        ) : (
          <div className="px-5 pb-5">
            {/* Temperatura grande + icone */}
            <div className="flex items-center justify-between">
              <div className="flex items-start">
                <span className="text-7xl font-bold leading-none tracking-tight">
                  {Math.round(outdoorTemperature)}
                </span>
                <span className="text-3xl font-semibold mt-1">°</span>
              </div>
              <div className="flex flex-col items-center">
                <WeatherIcon code={weatherData.weatherCode} isDay={weatherData.isDay} className="h-16 w-16" />
                <span className="text-sm font-medium mt-1 text-center text-balance">
                  {weatherData.condition}
                </span>
              </div>
            </div>

            {/* Sensacao / Max / Min */}
            <div className="flex items-center gap-4 mt-3 text-sm text-white/90 flex-wrap">
              <span>
                Sensacao <strong>{weatherData.feelsLike}°</strong>
              </span>
              <span className="text-white/40">|</span>
              <span className="flex items-center gap-1">
                <ChevronUp className="h-4 w-4" />
                Max <strong>{weatherData.maxTemp}°</strong>
              </span>
              <span className="text-white/40">|</span>
              <span className="flex items-center gap-1">
                <ChevronDown className="h-4 w-4" />
                Min <strong>{weatherData.minTemp}°</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {!isLoadingWeather && (
        <CardContent className="p-5 space-y-5">
          {locationError && (
            <Badge variant="secondary" className="text-xs font-normal">
              {locationError}
            </Badge>
          )}

          {/* Detalhes: humidade, vento, AC */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Droplets className="h-5 w-5 text-sky-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Humidade</p>
                <p className="font-semibold">{weatherData.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Wind className="h-5 w-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Vento</p>
                <p className="font-semibold">{weatherData.windSpeed} km/h</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Thermometer className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Climatizacao</p>
                <p className="font-semibold text-sm">{autoAcEnabled ? "Auto ON" : "Auto OFF"}</p>
              </div>
            </div>
          </div>

          {/* Previsao horaria */}
          {hourlyForecast.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Proximas horas</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {hourlyForecast.map((h, i) => (
                  <div
                    key={h.time}
                    className="flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-lg bg-muted/40"
                  >
                    <span className="text-xs text-muted-foreground">
                      {i === 0 ? "Agora" : formatHour(h.time)}
                    </span>
                    <WeatherIcon code={h.code} isDay={h.isDay} className="h-6 w-6" />
                    <span className="text-sm font-semibold">{h.temp}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previsao de varios dias */}
          {dailyForecast.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Proximos dias</h3>
              <div className="space-y-1">
                {dailyForecast.map((d, i) => {
                  const leftPct = ((d.min - minRange) / range) * 100
                  const widthPct = ((d.max - d.min) / range) * 100
                  return (
                    <div key={d.date} className="flex items-center gap-3 py-1.5">
                      <span className="w-12 text-sm font-medium capitalize">
                        {formatDayLabel(d.date, i)}
                      </span>
                      <WeatherIcon code={d.code} isDay className="h-5 w-5 shrink-0" />
                      <span className="w-8 text-sm text-muted-foreground text-right">{d.min}°</span>
                      {/* Barra de amplitude de temperatura */}
                      <div className="flex-1 h-1.5 bg-muted rounded-full relative">
                        <div
                          className="absolute h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"
                          style={{ left: `${leftPct}%`, width: `${Math.max(8, widthPct)}%` }}
                        />
                      </div>
                      <span className="w-8 text-sm font-semibold text-right">{d.max}°</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
