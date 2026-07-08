import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun as SunIcon, CloudSnow, CloudLightning, MapPin, Loader2 } from "lucide-react";

interface Hourly { time: string; temp: number }
interface WeatherState {
  temp: number;
  code: number;
  feels: number;
  min: number;
  max: number;
  hourly: Hourly[];
  city: string;
  isDay: boolean;
}

const CODE_ICON: Record<number, typeof SunIcon> = {
  0: SunIcon, 1: SunIcon, 2: Cloud, 3: Cloud,
  45: Cloud, 48: Cloud,
  51: CloudRain, 53: CloudRain, 55: CloudRain,
  61: CloudRain, 63: CloudRain, 65: CloudRain,
  71: CloudSnow, 73: CloudSnow, 75: CloudSnow,
  80: CloudRain, 81: CloudRain, 82: CloudRain,
  95: CloudLightning, 96: CloudLightning, 99: CloudLightning,
};

const CODE_DESC: Record<number, string> = {
  0: "Céu limpo", 1: "Pouco nublado", 2: "Parcialmente nublado", 3: "Nublado",
  45: "Nevoeiro", 48: "Nevoeiro gelado",
  51: "Chuvisco leve", 53: "Chuvisco", 55: "Chuvisco intenso",
  61: "Chuva leve", 63: "Chuva", 65: "Chuva forte",
  71: "Neve leve", 73: "Neve", 75: "Neve forte",
  80: "Aguaceiros", 81: "Aguaceiros", 82: "Aguaceiros fortes",
  95: "Trovoada", 96: "Trovoada", 99: "Trovoada forte",
};

export function GlassWeatherCard() {
  const [w, setW] = useState<WeatherState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number; city: string }>({
    lat: 38.7223, lon: -9.1393, city: "Lisboa",
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const rev = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&language=pt&count=1`);
          const revJson = await rev.json();
          const city = revJson?.results?.[0]?.name ?? "";
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude, city: city || "Local" });
        } catch {
          // ignore
        }
      },
      () => {},
      { timeout: 4000 },
    );
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,is_day,apparent_temperature&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
        const res = await fetch(url);
        const j = await res.json();
        if (!alive) return;
        const now = new Date();
        const hourly: Hourly[] = [];
        const times: string[] = j.hourly.time;
        const temps: number[] = j.hourly.temperature_2m;
        for (let i = 0; i < times.length && hourly.length < 6; i++) {
          if (new Date(times[i]).getTime() > now.getTime()) {
            hourly.push({ time: times[i], temp: Math.round(temps[i]) });
          }
        }
        setW({
          temp: Math.round(j.current.temperature_2m),
          code: j.current.weather_code,
          feels: Math.round(j.current.apparent_temperature),
          min: Math.round(j.daily.temperature_2m_min[0]),
          max: Math.round(j.daily.temperature_2m_max[0]),
          hourly,
          city: coords.city,
          isDay: !!j.current.is_day,
        });
        setError(null);
      } catch (e) {
        setError("Não consegui carregar o tempo.");
      }
    })();
    return () => { alive = false; };
  }, [coords]);

  if (!w) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 flex items-center justify-center min-h-[180px]">
        {error ? (
          <span className="text-sm text-muted-foreground">{error}</span>
        ) : (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  const Icon = CODE_ICON[w.code] ?? Cloud;
  const desc = CODE_DESC[w.code] ?? "—";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-5xl font-light tabular-nums">{w.temp}°</span>
          <div>
            <p className="font-medium">{desc}</p>
            <p className="text-muted-foreground text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{w.city}</p>
          </div>
        </div>
        <div className="flex gap-4 md:gap-6 mt-4 flex-wrap">
          {w.hourly.map((h) => (
            <div key={h.time} className="text-center">
              <p className="text-[11px] text-muted-foreground uppercase mb-1">
                {new Date(h.time).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-sm tabular-nums">{h.temp}°</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>Sensação {w.feels}°</span>
          <span>Máx {w.max}°</span>
          <span>Mín {w.min}°</span>
        </div>
      </div>
      <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <Icon className="w-20 h-20 md:w-24 md:h-24 text-primary/25 shrink-0" strokeWidth={1} />
    </div>
  );
}
