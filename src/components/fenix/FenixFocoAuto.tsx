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
  /** Qué elementos entran en el recorrido dentro de este bloque. */
  selector?: string
  /**
   * Selector, relativo a cada tarjeta, del control que además permite
   * fijar el foco con click o teclado (debe ser un <button>). Sin esto,
   * solo el mouse lo hace vía :hover — lo que deja fuera a pantallas
   * táctiles y a quien navega con teclado.
   */
  activador?: string
  className?: string
}

export function FenixFocoAuto({
  children,
  ciclo = 2600,
  selector = '.fx-card-lift',
  activador,
  className = '',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raiz = ref.current
    if (!raiz) return

    const tarjetas = Array.from(raiz.querySelectorAll<HTMLElement>(selector))
    if (tarjetas.length < 2) return

    raiz.style.setProperty('--fx-ciclo', `${ciclo}ms`)

    let indice = 0
    // Dos formas de fijar la tarjeta activa, con prioridades distintas: un
    // click es una decisión explícita y gana sobre el simple paso del mouse
    // por otra tarjeta vecina; soltar el click devuelve el control al hover
    // (si lo hay) o al recorrido automático.
    let hoverFija: number | null = null
    let clicFija: number | null = null
    let reloj: ReturnType<typeof setInterval> | null = null

    const activa = () => clicFija ?? hoverFija ?? indice
    const pausado = () => hoverFija !== null || clicFija !== null

    const pintar = () => {
      const act = activa()
      tarjetas.forEach((t, i) => {
        t.classList.toggle('fx-foco', i === act)
        const barra = t.querySelector<HTMLElement>('.fx-foco-barra')
        if (barra) {
          // Quitar y releer el layout reinicia la animación de la barra: sin
          // esto la clase ya está puesta y el navegador no la vuelve a lanzar.
          barra.classList.remove('fx-foco-corre')
          void barra.offsetWidth
          if (i === act && !pausado()) barra.classList.add('fx-foco-corre')
        }
        // "Presionado" solo cuando lo fijó un click, no durante el hover ni
        // el ciclo automático: son estados distintos para quien usa lector
        // de pantalla.
        if (activador) {
          t.querySelector(activador)?.setAttribute('aria-pressed', String(clicFija === i))
        }
      })
    }

    const detener = () => {
      if (reloj) { clearInterval(reloj); reloj = null }
    }

    const arrancar = () => {
      detener()
      if (pausado()) return
      reloj = setInterval(() => {
        indice = (indice + 1) % tarjetas.length
        pintar()
      }, ciclo)
    }

    const limpiar: Array<() => void> = []
    tarjetas.forEach((t, i) => {
      const entra = () => { hoverFija = i; detener(); pintar() }
      const sale = () => { hoverFija = null; pintar(); arrancar() }
      t.addEventListener('mouseenter', entra)
      t.addEventListener('mouseleave', sale)
      limpiar.push(() => {
        t.removeEventListener('mouseenter', entra)
        t.removeEventListener('mouseleave', sale)
      })

      const disparador = activador ? t.querySelector<HTMLElement>(activador) : null
      if (disparador) {
        // Un <button> nativo ya dispara "click" con Enter o espacio, así que
        // basta un solo listener para cubrir mouse, táctil y teclado. Volver
        // a activar la misma tarjeta suelta el candado en vez de dejarlo
        // pegado a una sola para siempre.
        const alternar = () => {
          clicFija = clicFija === i ? null : i
          pintar()
          arrancar() // no hace nada si sigue pausado, por el propio click o por hover
        }
        disparador.addEventListener('click', alternar)
        limpiar.push(() => disparador.removeEventListener('click', alternar))
      }
    })

    pintar()
    arrancar()

    return () => {
      detener()
      limpiar.forEach(fn => fn())
      tarjetas.forEach(t => {
        t.classList.remove('fx-foco')
        t.querySelector('.fx-foco-barra')?.classList.remove('fx-foco-corre')
        if (activador) t.querySelector(activador)?.setAttribute('aria-pressed', 'false')
      })
    }
  }, [ciclo, selector, activador])

  return <div ref={ref} className={className}>{children}</div>
}
