// src/hooks/useScrollProgress.ts
// Progreso de scroll (0→1) a medida que un contenedor alto cruza el viewport — para
// secciones "pineadas" (scroll-jacking) donde el contenido se transforma con el scroll
// en vez de revelarse una sola vez. Respeta prefers-reduced-motion: progress queda fijo
// en 0 y el consumidor debe renderizar el estado estático de reposo. También se apaga en
// viewports angostos (mobile): el centrado vertical + overflow:hidden del hero pineado
// recorta el título cuando el contenido (badge + H1 envuelto en 3-4 líneas + párrafo)
// es más alto que el 100vh disponible — el mismo problema que reduced-motion, mismo fix.
'use client'

import { useEffect, useRef, useState } from 'react'

const MOBILE_BREAKPOINT = '(max-width: 760px)'

export function useScrollProgress<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileQuery = window.matchMedia(MOBILE_BREAKPOINT)
    const evaluate = () => setReduced(motionQuery.matches || mobileQuery.matches)
    evaluate()
    motionQuery.addEventListener('change', evaluate)
    mobileQuery.addEventListener('change', evaluate)

    let raf = 0
    const compute = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const p = total > 0 ? -rect.top / total : 0
      setProgress(Math.min(1, Math.max(0, p)))
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(compute) }
    if (!motionQuery.matches && !mobileQuery.matches) {
      compute()
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll)
    }
    return () => {
      motionQuery.removeEventListener('change', evaluate)
      mobileQuery.removeEventListener('change', evaluate)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return { ref, progress, reduced }
}
