// Ruta destino: src/components/fenix/FenixGlowCard.tsx
'use client'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type Props = {
  className?: string
  style?: CSSProperties
  children: ReactNode
}

// En touch/mobile no hay :hover, así que el fill se activa al entrar en viewport (scroll)
export function FenixGlowCard({ className = '', style, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia('(hover: none)').matches) return

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.55 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`${className} ${active ? 'is-active' : ''}`} style={style}>
      {children}
    </div>
  )
}
