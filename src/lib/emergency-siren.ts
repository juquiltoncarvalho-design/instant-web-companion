// Sirene de emergencia REAL gerada com a Web Audio API.
// Nao usa ficheiros de audio nem simulacoes: sintetiza um som continuo
// de duas frequencias alternadas (padrao "nee-naw") que toca em loop
// ate ser explicitamente parado. Funciona como um alarme de incendio real.

export class EmergencySiren {
  private audioContext: AudioContext | null = null
  private oscillator: OscillatorNode | null = null
  private gainNode: GainNode | null = null
  private toggleInterval: ReturnType<typeof setInterval> | null = null
  private high = false
  private _isPlaying = false

  get isPlaying() {
    return this._isPlaying
  }

  // Inicia a sirene. Idempotente: chamar duas vezes nao cria dois sons.
  start() {
    if (this._isPlaying) return
    try {
      const Ctx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new Ctx()

      // Alguns navegadores iniciam o contexto suspenso ate uma interacao.
      if (this.audioContext.state === "suspended") {
        void this.audioContext.resume()
      }

      this.oscillator = this.audioContext.createOscillator()
      this.gainNode = this.audioContext.createGain()

      // Onda "sawtooth" = som aspero e penetrante, tipico de alarmes reais.
      this.oscillator.type = "sawtooth"
      this.oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime)

      // Volume forte mas dentro de limites seguros.
      this.gainNode.gain.setValueAtTime(0.35, this.audioContext.currentTime)

      this.oscillator.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)
      this.oscillator.start()

      // Alterna entre duas frequencias para criar o efeito de sirene.
      this.high = false
      this.toggleInterval = setInterval(() => {
        if (!this.audioContext || !this.oscillator) return
        this.high = !this.high
        const freq = this.high ? 880 : 620
        this.oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime)
      }, 450)

      this._isPlaying = true
    } catch {
      // Audio nao suportado neste ambiente.
      this._isPlaying = false
    }
  }

  // Para a sirene por completo e liberta os recursos de audio.
  stop() {
    if (this.toggleInterval) {
      clearInterval(this.toggleInterval)
      this.toggleInterval = null
    }
    try {
      if (this.gainNode && this.audioContext) {
        // Pequeno fade-out para evitar um "clique" ao cortar o som.
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.audioContext.currentTime)
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.08)
      }
      this.oscillator?.stop((this.audioContext?.currentTime ?? 0) + 0.1)
    } catch {
      // ignora se ja estiver parado
    }
    setTimeout(() => {
      try {
        this.oscillator?.disconnect()
        this.gainNode?.disconnect()
        void this.audioContext?.close()
      } catch {
        // ignora
      }
      this.oscillator = null
      this.gainNode = null
      this.audioContext = null
    }, 150)
    this._isPlaying = false
  }
}
