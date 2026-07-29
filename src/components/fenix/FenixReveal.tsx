// Ruta destino: src/components/fenix/FenixReveal.tsx
// Revelado progresivo por scroll.
//
// Diseñado para degradar con seguridad: el HTML del servidor sale VISIBLE.
// Solo se oculta en el efecto de cliente y únicamente si el elemento está
// fuera del viewport (así no hay parpadeo de lo que ya se está viendo), y
// hay un temporizador de respaldo que lo revela igual si el
// IntersectionObserver nunca dispara. Nunca puede quedar contenido oculto.
'use client'
import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Retraso en ms para escalonar elementos hermanos */
  delay?: number
  className?: string
}

export function FenixReveal({ children, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // `instante` corta la transición: se usa en el respaldo, porque una
    // transición iniciada con el elemento fuera de pantalla queda congelada
    // en su valor inicial (opacidad 0) y el contenido no se vería nunca.
    const reveal = (instante = false) => {
      if (instante) el.style.transition = 'none'
      el.classList.remove('fenix-reveal-hidden')
      el.classList.add('fenix-reveal-in')
    }

    // Si el usuario prefiere menos movimiento, no se oculta nada.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rect = el.getBoundingClientRect()
    const yaVisible = rect.top < window.innerHeight * 0.9
    if (yaVisible) return // lo que ya está en pantalla se deja como está

    el.classList.add('fenix-reveal-hidden')
    if (delay) el.style.transitionDelay = `${delay}ms`

    // Respaldo: si el observer no dispara, se revela de todas formas.
    const respaldo = setTimeout(() => reveal(true), 2500)

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal()
          clearTimeout(respaldo)
          obs.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    obs.observe(el)

    return () => {
      clearTimeout(respaldo)
      obs.disconnect()
    }
  }, [delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
