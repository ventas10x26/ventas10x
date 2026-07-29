// Ruta destino: src/components/fenix/FenixScrollPanel.tsx
// El panel se "descubre y aleja" según cuánto scroll haya hecho el usuario:
// mientras la sección se acerca al centro del viewport crece y se acerca,
// y al alejarse se encoge y se atenúa. Es reversible en ambos sentidos.
//
// El progreso se calcula con requestAnimationFrame (no en el evento de
// scroll) para no bloquear el hilo principal, y respeta prefers-reduced-motion.
'use client'
import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react'

type Props = {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function FenixScrollPanel({ children, className = '', style }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false

    const actualizar = () => {
      ticking = false
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight

      // 0 = el panel apenas asoma por abajo · 1 = está centrado en pantalla
      const centro = rect.top + rect.height / 2
      const distancia = Math.abs(centro - vh / 2)
      const maxDistancia = vh / 2 + rect.height / 2
      const p = 1 - Math.min(distancia / maxDistancia, 1)

      // Suavizado (ease-out) para que el cambio no se sienta lineal
      const t = 1 - Math.pow(1 - p, 2)

      const escala = 0.92 + t * 0.08          // 0.92 → 1
      const desplazamiento = (1 - t) * 46     // 46px → 0
      const opacidad = 0.45 + t * 0.55        // .45 → 1

      el.style.transform = `translateY(${desplazamiento.toFixed(1)}px) scale(${escala.toFixed(4)})`
      el.style.opacity = opacidad.toFixed(3)
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(actualizar)
    }

    // Estado inicial al cargar (el pedido incluye "al momento de cargar")
    actualizar()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{ willChange: 'transform, opacity', transformOrigin: 'center bottom', ...style }}
    >
      {children}
    </div>
  )
}
