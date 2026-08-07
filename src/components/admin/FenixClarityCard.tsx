// Ruta destino: src/components/admin/FenixClarityCard.tsx
// Métricas agregadas de Clarity (no el mapa de calor en sí, que no tiene
// API para embeber) + un enlace directo al proyecto para ver las
// grabaciones de sesión y el heatmap real. Server component puro.
import type { FilaMetricaClarity } from '@/lib/clarity'

const ACCENT = '#F5821F'

// Los nombres que devuelve la API vienen en inglés y sin traducir; se
// muestra una versión legible cuando se reconoce el nombre, y el original
// tal cual si no -- así no se pierde una métrica nueva que Clarity agregue.
const NOMBRES_LEGIBLES: Record<string, string> = {
  Traffic: 'Tráfico',
  ScrollDepth: 'Profundidad de scroll',
  EngagementTime: 'Tiempo de interacción',
  PopularPages: 'Páginas más vistas',
  DeadClickCount: 'Clics muertos',
  RageClickCount: 'Clics de frustración',
  ExcessiveScroll: 'Scroll excesivo',
  QuickbackClick: 'Rebotes rápidos',
  ScriptErrorCount: 'Errores de script',
}

function primerValorNumerico(fila: Record<string, string | number>): number | null {
  for (const v of Object.values(fila)) {
    if (typeof v === 'number') return v
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  }
  return null
}

export function FenixClarityCard({
  metricas,
  error,
  projectId,
}: {
  metricas: FilaMetricaClarity[] | null
  error?: string
  projectId?: string
}) {
  const enlaceClarity = projectId ? `https://clarity.microsoft.com/projects/view/${projectId}/dashboard` : null

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 20px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: metricas ? '14px' : 0, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Mapa de calor y comportamiento</div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
            {metricas ? 'Últimos 3 días · Microsoft Clarity' : 'El mapa de calor en sí solo se ve dentro de Clarity'}
          </div>
        </div>
        {enlaceClarity && (
          <a href={enlaceClarity} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: ACCENT, color: '#12100C', fontSize: '12.5px', fontWeight: 700,
            padding: '9px 16px', borderRadius: '9px', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Ver mapa de calor en Clarity ↗
          </a>
        )}
      </div>

      {!metricas && (
        <div style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.6 }}>
          {error || 'Sin datos todavía'} — configure <code>CLARITY_API_TOKEN</code> para ver métricas agregadas aquí.
        </div>
      )}

      {metricas && metricas.length === 0 && (
        <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>Todavía no hay suficiente tráfico registrado.</div>
      )}

      {metricas && metricas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {metricas.map(m => {
            const total = m.information.reduce((s, fila) => s + (primerValorNumerico(fila) ?? 0), 0)
            return (
              <div key={m.metricName} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '11px 13px' }}>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{total.toLocaleString('es-CO')}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                  {NOMBRES_LEGIBLES[m.metricName] || m.metricName}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
