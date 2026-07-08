
import { useState, useEffect, useRef } from "react"
import { Search, Loader2, MapPin, X } from "lucide-react"

interface CityResult {
  id: number
  name: string
  latitude: number
  longitude: number
  admin1?: string
  country: string
}

interface CitySearchProps {
  onSelect: (lat: number, lon: number, city: string, country: string) => void
}

export function CitySearch({ onSelect }: CitySearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CityResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fechar a lista ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Pesquisa com debounce (aguarda o utilizador parar de escrever)
  useEffect(() => {
    const termo = query.trim()
    if (termo.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    let cancelado = false
    setIsSearching(true)

    const timeout = setTimeout(async () => {
      try {
        // API de geocoding da Open-Meteo - filtrada para Portugal (countryCode=PT)
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            termo
          )}&count=10&language=pt&format=json&countryCode=PT`
        )
        const data = await res.json()
        if (cancelado) return

        const lista: CityResult[] = (data.results || []).map((r: CityResult) => ({
          id: r.id,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          admin1: r.admin1,
          country: r.country,
        }))
        setResults(lista)
        setIsOpen(true)
      } catch (err) {
        console.error("[v0] Erro na pesquisa de cidades:", err)
        if (!cancelado) setResults([])
      } finally {
        if (!cancelado) setIsSearching(false)
      }
    }, 350)

    return () => {
      cancelado = true
      clearTimeout(timeout)
    }
  }, [query])

  const escolher = (r: CityResult) => {
    onSelect(r.latitude, r.longitude, r.name, r.country || "Portugal")
    setQuery(r.name)
    setIsOpen(false)
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 backdrop-blur">
        <Search className="h-4 w-4 text-white/80 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Procurar cidade ou zona de Portugal..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/70 focus:outline-none"
          aria-label="Procurar cidade ou zona de Portugal"
        />
        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-white/80 shrink-0" />}
        {!isSearching && query && (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setResults([])
              setIsOpen(false)
            }}
            aria-label="Limpar pesquisa"
            className="text-white/70 hover:text-white shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lista de resultados */}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => escolher(r)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="font-medium">{r.name}</span>
                {r.admin1 && (
                  <span className="text-xs text-muted-foreground">{r.admin1}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Sem resultados */}
      {isOpen && !isSearching && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg">
          Nenhuma localizacao encontrada em Portugal.
        </div>
      )}
    </div>
  )
}
