let ctx: AudioContext | null = null;

export function playClick() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(1200, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.06);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.09);
  } catch {
    // sem audio
  }
}

export function installClickSound() {
  const handler = (e: PointerEvent) => {
    const el = (e.target as HTMLElement | null)?.closest("button, [role=button], a");
    if (el && !(el as HTMLButtonElement).disabled) playClick();
  };
  document.addEventListener("pointerdown", handler);
  return () => document.removeEventListener("pointerdown", handler);
}
