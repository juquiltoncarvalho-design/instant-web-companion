
import { Cpu, Wifi, WifiOff } from "lucide-react"

interface DeviceStatusProps {
  online: boolean
  lastSeen: number | null
}

export function DeviceStatus({ online, lastSeen }: DeviceStatusProps) {
  const lastSeenText = lastSeen
    ? new Date(lastSeen).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "nunca"

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            online ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"
          }`}
        >
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Dispositivo ESP32</p>
          <p className="text-xs text-muted-foreground">Ultima comunicacao: {lastSeenText}</p>
        </div>
      </div>
      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
          online ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"
        }`}
      >
        {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        {online ? "ONLINE" : "OFFLINE"}
      </div>
    </div>
  )
}
