// src/hooks/useCountUp.ts
// Cuenta ascendente para métricas reales (leads, tasa de respuesta, citas) cuando
// entran en el viewport — refuerza el dato, no es decorativo. Respeta
// prefers-reduced-motion mostrando el valor final de inmediato.
'use client'

import { useEffect, useState } from 'react'

/** Recibe un valor como "47", "89%" u "8" y anima solo la parte numérica. */
export function useCountUp(value: string, active: boolean, duration = 900) {
  const match = value.match(/^(\d+)(.*)$/)
  const target = match ? parseInt(match[1], 10) : 0
  const suffix = match ? match[2] : ''
  const [display, setDisplay] = useState(active ? target : 0)

  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(target); return }
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])

  return `${display}${suffix}`
}
