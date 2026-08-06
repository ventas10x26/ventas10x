// Ruta destino: src/components/fenix/FenixFases.tsx
// Avanza un contador de fases y lo publica como `data-fase` en su contenedor.
//
// Todo el aspecto se resuelve en CSS con selectores de atributo. La ventaja
// frente a marcar elementos uno a uno es que una fase puede encender varios
// elementos a la vez — que es justo lo que pide la línea de vida, donde dos
// hitos ocurren en el mismo momento del recorrido.
'use client'
import { useEffect, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Número de fases del ciclo. */
  total?: number
  /** ms que dura cada fase. */
  ciclo?: number
  className?: string
}

export function FenixFases({ children, total = 3, ciclo = 2600, className = '' }: Props) {
  const [fase, setFase] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setFase(f => (f + 1) % total), ciclo)
    return () => clearInterval(t)
  }, [total, ciclo])

  return (
    <div className={className} data-fase={fase}>
      {children}
    </div>
  )
}
