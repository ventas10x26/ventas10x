// src/hooks/useReveal.ts
// Revelado por scroll (fade + translateY) para Pulse Motor — un único mecanismo
// reutilizado en toda la home, en vez de animaciones sueltas por sección.
// Respeta prefers-reduced-motion: si está activo, revela de inmediato sin observer.
'use client'

import { useEffect, useRef, useState } from 'react'

export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setInView(true); return }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}
