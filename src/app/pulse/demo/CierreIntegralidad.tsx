'use client'

// Ruta destino: src/app/pulse/demo/CierreIntegralidad.tsx
//
// Franja de cierre que se monta al pie del panel "Integralidad 360°".
//
// POR QUÉ NO ES UNA QUINTA BARRA. Las cuatro líneas de integralidad
// (financiación, pólizas, retomas, accesorios) son ADHESIONES OPCIONALES: cada
// una puede venderse o no, y su penetración mide qué tan bien el equipo las
// ofreció. La matrícula no es opcional — es obligatoria. Dibujarla como una
// barra más, al lado de las otras, haría leer "penetración de matrícula 43%"
// como si el 57% de los compradores hubiera elegido no matricular, que es falso.
//
// Lo que sí es cierto, y es el aporte de esta franja: las cuatro líneas de
// arriba se calculan SOBRE PEDIDOS, y un pedido sin placa todavía no es una
// venta cerrada. Así que el ROE que muestra el panel está parcialmente sin
// realizar, y esta franja dice cuánto.

import { formatearNumero, formatearPct, formatearMillones } from './datos'

const FONT = 'var(--font-inter), sans-serif'
const INK = 'var(--pm-ink)'
const DIM = 'var(--pm-dim)'
const MUTED = 'var(--pm-muted)'
const LINE = 'var(--pm-line)'
const TRACK = 'var(--pm-track)'

export default function CierreIntegralidad({ pedidos, matriculas, roe }: { pedidos: number; matriculas: number; roe: number }) {
  const cierre = pedidos > 0 ? matriculas / pedidos : 0
  const sinPlaca = Math.max(0, pedidos - matriculas)
  // El ROE de las cuatro líneas se acredita sobre pedidos. La parte proporcional
  // que corresponde a unidades sin placa todavía no está realizada.
  const roeSinRealizar = roe * (1 - cierre)

  return (
    <div className="pmc" style={{ marginTop: '18px', paddingTop: '16px', borderTop: `1px solid ${LINE}` }}>
      {/* Sin interpolación dentro del <style>: el SWC de Next 15 falla al compilar
          expresiones dentro de un <style> en JSX. Los colores van literales. */}
      <style>{`
        .pmc { --pmc-ok:#2DD4BF; --pmc-risk:#FBBF24; }
        .pm-tema-dark .pmc { --pmc-ok:#2DD4BF; --pmc-risk:#FBBF24; }
        .pm-tema-light .pmc { --pmc-ok:#0D9488; --pmc-risk:#B45309; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: INK, fontWeight: 700 }}>Cierre — de pedido a placa</span>
        <span style={{ fontFamily: FONT, fontSize: '15px', fontWeight: 800, color: 'var(--pmc-ok)' }}>{formatearPct(cierre)}</span>
      </div>

      {/* Barra partida: lo inscrito y lo que todavía no llegó a placa suman el
          total de pedidos, no es una estimación. */}
      <div style={{ display: 'flex', height: '9px', borderRadius: '5px', background: TRACK, overflow: 'hidden' }}>
        <div className="pm-demo-barra" style={{ width: `${cierre * 100}%`, background: 'var(--pmc-ok)' }} />
        <div className="pm-demo-barra" style={{ width: `${(1 - cierre) * 100}%`, background: 'var(--pmc-risk)', opacity: 0.45 }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '6px', fontSize: '11px' }}>
        <span style={{ color: 'var(--pmc-ok)', fontWeight: 700 }}>{formatearNumero(matriculas)} con placa</span>
        <span style={{ color: 'var(--pmc-risk)', fontWeight: 700 }}>{formatearNumero(sinPlaca)} todavía sin placa</span>
      </div>

      <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '9px', background: 'var(--pm-inset)', border: `1px solid ${LINE}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT, fontSize: '17px', fontWeight: 800, color: 'var(--pmc-risk)' }}>{formatearMillones(roeSinRealizar)}</span>
          <span style={{ fontSize: '12px', color: DIM, fontWeight: 600 }}>de ROE todavía sin realizar</span>
        </div>
        <p style={{ fontSize: '11.5px', color: MUTED, lineHeight: 1.55, margin: '5px 0 0' }}>
          Las cuatro líneas de arriba se miden sobre pedidos. El margen se acredita cuando la unidad queda inscrita, así que esta parte está vendida pero no cerrada.
        </p>
      </div>
    </div>
  )
}
