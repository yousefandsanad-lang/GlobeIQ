function playTones(frequencies, duration, gain) {
  try {
    const ctx = new AudioContext()
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.value = freq

      const start = ctx.currentTime + i * duration
      const end = start + duration

      gainNode.gain.setValueAtTime(gain, start)
      gainNode.gain.exponentialRampToValueAtTime(0.001, end)

      osc.start(start)
      osc.stop(end)
    })
  } catch {
    // audio unavailable — fail silently
  }
}

export function playCorrect() {
  playTones([523, 659], 0.15, 0.3)
}

export function playWrong() {
  playTones([200], 0.2, 0.2)
}

export function playReveal() {
  playTones([523, 659, 784], 0.12, 0.3)
}

export function playStreak() {
  playTones([523, 659, 784, 1047], 0.1, 0.35)
}
