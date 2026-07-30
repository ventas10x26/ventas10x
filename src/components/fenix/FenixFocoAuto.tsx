// Ruta destino: src/components/fenix/FenixFocoAuto.tsx
// Recorre las tarjetas de una rejilla marcando una a la vez, para que el
// destacado no dependa de que alguien pase el mouse.
//
// Trabaja sobre el DOM en vez de recibir las tarjetas como props: así la
// rejilla y su contenido siguen siendo componentes de servidor y solo esta
// capa de comportamiento viaja al cliente.
'use client'
import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** ms que dura cada tarjeta antes de ceder el turno */
  ciclo?: number
  className?: string
}

export function FenixFocoAuto({ children, ciclo = 2600, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raiz = ref.current
    if (!raiz) return

    const tarjetas = Array.from(raiz.querySelectorAll<HTMLElement>('.fx-card-lift'))
    if (tarjetas.length < 2) return

    raiz.style.setProperty('--fx-ciclo', `${ciclo}ms`)

    let indice = 0
    let fijada: number | null = null
    let reloj: ReturnType<typeof setInterval> | null = null

    const pintar = () => {
      const activa = fijada ?? indice
      tarjetas.forEach((t, i) => {
        t.classList.toggle('fx-foco', i === activa)
        const barra = t.querySelector<HTMLElement>('.fx-foco-barra')
        if (!barra) return
        // Quitar y releer el layout reinicia la animación de la barra: sin
        // esto la clase ya está puesta y el navegador no la vuelve a lanzar.
        barra.classList.remove('fx-foco-corre')
        void barra.offsetWidth
        if (i === activa && fijada === null) barra.classList.add('fx-foco-corre')
      })
    }

    const detener = () => {
      if (reloj) { clearInterval(reloj); reloj = null }
    }

    const arrancar = () => {
      detener()
      if (fijada !== null) return
      reloj = setInterval(() => {
        indice = (indice + 1) % tarjetas.length
        pintar()
      }, ciclo)
    }

    // Señalar una tarjeta fija el recorrido ahí: si siguiera avanzando, el
    // destacado se movería justo mientras se está leyendo.
    const limpiar: Array<() => void> = []
    tarjetas.forEach((t, i) => {
      const entra = () => { fijada = i; detener(); pintar() }
      const sale = () => { fijada = null; pintar(); arrancar() }
      t.addEventListener('mouseenter', entra)
      t.addEventListener('mouseleave', sale)
      limpiar.push(() => {
        t.removeEventListener('mouseenter', entra)
        t.removeEventListener('mouseleave', sale)
      })
    })

    pintar()
    arrancar()

    return () => {
      detener()
      limpiar.forEach(fn => fn())
      tarjetas.forEach(t => {
        t.classList.remove('fx-foco')
        t.querySelector('.fx-foco-barra')?.classList.remove('fx-foco-corre')
      })
    }
  }, [ciclo])

  return <div ref={ref} className={className}>{children}</div>
}
