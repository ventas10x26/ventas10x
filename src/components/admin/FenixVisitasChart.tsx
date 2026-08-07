// Ruta destino: src/components/admin/FenixVisitasChart.tsx
// Tarjeta de visitas diarias para /admin/fenix. Server component puro (sin
// 'use client'): recibe los datos ya resueltos, no vuelve a pedirlos.
import type { VisitaDiaria } from '@/lib/ga4'

const ACCENT = '#F5821F'

function formatFecha(yyyymmdd: string) {
  const y = yyyymmdd.slice(0, 4), m = yyyymmdd.slice(4, 6), d = yyyymmdd.slice(6, 8)
  return new Date(`${y}-${m}-${d}T00:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export function FenixVisitasChart({ dias, error }: { dias: VisitaDiaria[] | null; error?: string }) {
  if (!dias) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 20px', marginBottom: '18px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Visitas de la landing</div>
        <div style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.6 }}>
          {error || 'Sin datos todavía'} — configure <code>GA4_PROPERTY_ID</code>, <code>GA_SERVICE_ACCOUNT_EMAIL</code> y{' '}
          <code>GA_SERVICE_ACCOUNT_PRIVATE_KEY</code> para conectar Google Analytics.
        </div>
      </div>
    )
  }

  const totalVisitas = dias.reduce((s, d) => s + d.visitas, 0)
  const totalUsuarios = dias.reduce((s, d) => s + d.usuarios, 0)
  const max = Math.max(1, ...dias.map(d => d.visitas))
  const ultimos = dias.slice(-21) // no saturar la barra en móvil/pantallas angostas

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 20px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Visitas de la landing</div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>Últimos {dias.length} días · ventas10x.co y app.consultoresfenix.com</div>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: ACCENT }}>{totalVisitas.toLocaleString('es-CO')}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Vistas</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{totalUsuarios.toLocaleString('es-CO')}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Visitantes</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '64px' }}>
        {ultimos.map(d => (
          <div key={d.fecha} title={`${formatFecha(d.fecha)}: ${d.visitas} vistas`} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end',
          }}>
            <div style={{
              width: '100%', minHeight: '2px', borderRadius: '3px 3px 1px 1px',
              height: `${Math.max(3, (d.visitas / max) * 100)}%`,
              background: d.visitas > 0 ? `${ACCENT}` : '#f1f5f9',
              opacity: d.visitas > 0 ? 0.85 : 1,
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#cbd5e1' }}>
        <span>{formatFecha(ultimos[0]?.fecha || dias[0].fecha)}</span>
        <span>{formatFecha(ultimos[ultimos.length - 1]?.fecha || dias[dias.length - 1].fecha)}</span>
      </div>
    </div>
  )
}
