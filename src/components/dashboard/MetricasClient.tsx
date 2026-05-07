// Ruta destino: src/components/dashboard/MetricasClient.tsx
'use client'
import { useEffect, useState } from 'react'

const DARK = '#0f1c2e'
const ORANGE = '#FF6B2B'

type Metricas = {
  leads: {
    total: number
    este_mes: number
    esta_semana: number
    tendencia_mes: number
    por_etapa: { nuevo: number; contactado: number; interesado: number; cerrado: number }
  }
  campanas: {
    total: number
    este_mes: number
    emails_enviados: number
    clicks_total: number
    clicks_landing: number
    clicks_wa: number
    ctr: number
  }
  contactos: { total: number; este_mes: number }
  landing: { visitas_total: number; visitas_mes: number }
}

const ETAPAS = [
  { key: 'nuevo', label: 'Nuevo', color: '#94a3b8' },
  { key: 'contactado', label: 'Contactado', color: '#3b82f6' },
  { key: 'interesado', label: 'Interesado', color: '#f59e0b' },
  { key: 'cerrado', label: 'Cerrado', color: '#22c55e' },
]

function Stat({ label, value, sub, color, trend }: {
  label: string; value: number | string; sub?: string; color?: string; trend?: number
}) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px 24px' }}>
      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 800, color: color || DARK, lineHeight: 1 }}>{value}</div>
      {(sub || trend !== undefined) && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {sub && <span style={{ fontSize: '12px', color: '#94a3b8' }}>{sub}</span>}
          {trend !== undefined && trend !== 0 && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: trend > 0 ? '#22c55e' : '#ef4444' }}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes ant.
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {children}
    </div>
  )
}

export function MetricasClient() {
  const [data, setData] = useState<Metricas | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/metricas')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#94a3b8', fontSize: '14px' }}>
      Cargando métricas...
    </div>
  )

  if (!data) return null

  const totalLeads = Object.values(data.leads.por_etapa).reduce((a, b) => a + b, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '32px' }}>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: DARK, margin: 0 }}>📊 Métricas</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Resumen de tu actividad comercial</p>
      </div>

      {/* LEADS */}
      <div style={{ marginBottom: '32px' }}>
        <SectionLabel>Leads</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <Stat label="Total leads" value={data.leads.total} trend={data.leads.tendencia_mes} />
          <Stat label="Este mes" value={data.leads.este_mes} sub="nuevos leads" color={ORANGE} />
          <Stat label="Esta semana" value={data.leads.esta_semana} sub="últimos 7 días" />
          <Stat label="Cerrados" value={data.leads.por_etapa.cerrado} sub="convertidos" color="#22c55e" />
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px 24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: DARK, marginBottom: '16px' }}>Pipeline por etapa</div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {ETAPAS.map(e => {
              const val = data.leads.por_etapa[e.key as keyof typeof data.leads.por_etapa]
              const pct = totalLeads > 0 ? Math.round(val / totalLeads * 100) : 0
              return (
                <div key={e.key} style={{ flex: 1, minWidth: '120px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{e.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: e.color }}>{val}</span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: e.color, borderRadius: '999px', transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CAMPAÑAS */}
      <div style={{ marginBottom: '32px' }}>
        <SectionLabel>Campañas</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <Stat label="Emails enviados" value={data.campanas.emails_enviados} sub={`${data.campanas.total} campañas`} />
          <Stat label="Clics totales" value={data.campanas.clicks_total} color={ORANGE} />
          <Stat label="Ver página" value={data.campanas.clicks_landing} sub="clics en landing" color={ORANGE} />
          <Stat label="WhatsApp" value={data.campanas.clicks_wa} sub="clics en WA" color="#25D366" />
          <Stat
            label="CTR global"
            value={`${data.campanas.ctr}%`}
            sub="clics / enviados"
            color={data.campanas.ctr >= 20 ? '#22c55e' : data.campanas.ctr >= 10 ? '#f59e0b' : '#ef4444'}
          />
        </div>
      </div>

      {/* CONTACTOS + LANDING */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <SectionLabel>Contactos</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Stat label="Total" value={data.contactos.total} />
            <Stat label="Este mes" value={data.contactos.este_mes} sub="nuevos" color={ORANGE} />
          </div>
        </div>
        <div>
          <SectionLabel>Landing pública</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Stat label="Visitas totales" value={data.landing.visitas_total} />
            <Stat label="Este mes" value={data.landing.visitas_mes} sub="visitas" color={ORANGE} />
          </div>
        </div>
      </div>

    </div>
  )
}
