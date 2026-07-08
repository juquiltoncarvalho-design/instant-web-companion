import type { ReactNode } from "react"

interface WindowFrameptions {
  title: string
  children: ReactNode
  className?: string
}

// Moldura no estilo de uma janela de aplicacao de desktop (macOS-like)
export function WindowFrame({ title, children, className }: WindowFrameptions) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-card shadow-2xl ${className ?? ""}`}
    >
      {/* Barra de titulo */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <p className="flex-1 text-center text-sm font-medium text-muted-foreground">{title}</p>
        {/* Espaco a direita para equilibrar o titulo centrado */}
        <div className="w-14" />
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
