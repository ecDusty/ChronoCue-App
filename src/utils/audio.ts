let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

export function unlockAudio(): void {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
  } catch {
    // ignore — audio unlock is best-effort
  }
}

export function playDefaultGong(): void {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    const t = ctx.currentTime

    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(80, t)
    osc1.frequency.exponentialRampToValueAtTime(60, t + 3)

    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(160, t)
    osc2.frequency.exponentialRampToValueAtTime(120, t + 2.5)

    const osc3 = ctx.createOscillator()
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(320, t)
    osc3.frequency.exponentialRampToValueAtTime(200, t + 1.5)

    const gain1 = ctx.createGain()
    gain1.gain.setValueAtTime(0.6, t)
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 4)

    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(0.3, t)
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 3)

    const gain3 = ctx.createGain()
    gain3.gain.setValueAtTime(0.15, t)
    gain3.gain.exponentialRampToValueAtTime(0.001, t + 2)

    const master = ctx.createGain()
    master.gain.setValueAtTime(0.8, t)

    osc1.connect(gain1).connect(master)
    osc2.connect(gain2).connect(master)
    osc3.connect(gain3).connect(master)
    master.connect(ctx.destination)

    osc1.start(t); osc1.stop(t + 4.5)
    osc2.start(t); osc2.stop(t + 3.5)
    osc3.start(t); osc3.stop(t + 2.5)
  } catch (err) {
    console.warn('Could not play gong:', err)
  }
}

export function playCustomSound(dataUrl: string): void {
  try {
    new Audio(dataUrl).play().catch(err => console.warn('Could not play custom sound:', err))
  } catch (err) {
    console.warn('Could not play custom sound:', err)
  }
}
