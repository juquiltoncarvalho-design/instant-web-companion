import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react"

interface WeatherIconProps {
  code: number
  isDay?: boolean
  className?: string
}

// Mapeia o codigo meteorologico da Open-Meteo para um icone adequado,
// tendo em conta se e dia ou noite para o ceu limpo / pouco nublado.
export function WeatherIcon({ code, isDay = true, className = "h-6 w-6" }: WeatherIconProps) {
  // Ceu limpo
  if (code === 0) {
    return isDay ? (
      <Sun className={`${className} text-amber-400`} />
    ) : (
      <Moon className={`${className} text-slate-300`} />
    )
  }

  // Principalmente limpo / parcialmente nublado
  if (code === 1 || code === 2) {
    return isDay ? (
      <CloudSun className={`${className} text-amber-400`} />
    ) : (
      <CloudMoon className={`${className} text-slate-300`} />
    )
  }

  // Nublado
  if (code === 3) {
    return <Cloud className={`${className} text-slate-400`} />
  }

  // Nevoeiro
  if (code === 45 || code === 48) {
    return <CloudFog className={`${className} text-slate-400`} />
  }

  // Chuvisco
  if (code >= 51 && code <= 57) {
    return <CloudDrizzle className={`${className} text-sky-400`} />
  }

  // Chuva / aguaceiros
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return <CloudRain className={`${className} text-sky-500`} />
  }

  // Neve
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return <CloudSnow className={`${className} text-cyan-300`} />
  }

  // Trovoada
  if (code >= 95) {
    return <CloudLightning className={`${className} text-yellow-400`} />
  }

  return <Cloud className={`${className} text-slate-400`} />
}
