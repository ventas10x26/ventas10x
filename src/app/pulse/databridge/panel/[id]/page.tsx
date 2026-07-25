// src/app/pulse/databridge/panel/[id]/page.tsx
//
// Panel real (persistido en Supabase) generado a partir de un proyecto de DataBridge —
// a diferencia del mockup del paso "Prototipo", esto sobrevive a un refresh: lee
// pulse_databridge_proyectos vía /api/pulse/databridge/proyectos/[id].

'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'
import { createClient } from '@/lib/supabase/client'

const FONT      = "var(--font-inter), sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const PALETTE = ['#4f8ef7', '#34c97e', '#f7924f', '#c97fd4', '#f7d24f', '#22d3ee', '#fb7185', '#a3e635']

interface SheetData { name: string; rows: Record<string, unknown>[] }
interface FieldMatch { fieldA: string; fieldB: string; label: string; score: number }
interface TableRelation { a: string; b: string; matches: FieldMatch[] }
interface Proyecto { id: string; nombre: string; tablas: SheetData[]; relaciones: TableRelation[]; created_at: string }

const ROWS_PAGE = 50

export default function DataBridgePanelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState<{ nombre: string; email: string } | null>(null)
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [visibleRows, setVisibleRows] = useState(ROWS_PAGE)

  // Mismo fix que en databridge/page.tsx: onAuthStateChange evita quedar con user=null si esta
  // página se abre justo después de un login con Google (redirect completo, puede haber una
  // ventana breve donde getUser() todavía no ve la sesión recién establecida).
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ email: data.user.email ?? '', nombre: (data.user.user_metadata?.full_name as string) || data.user.email?.split('@')[0] || '' })
      }
      setAuthChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email ?? '', nombre: (session.user.user_metadata?.full_name as string) || session.user.email?.split('@')[0] || '' })
      }
      setAuthChecked(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authChecked) return
    if (!user) { router.push(`/pulse/login?from=/pulse/databridge/panel/${id}`); return }
    fetch(`/api/pulse/databridge/proyectos/${id}`)
      .then(async r => {
        if (r.status === 404) { setNotFound(true); return null }
        if (!r.ok) throw new Error('error')
        return r.json()
      })
      .then(data => {
        if (data?.ok) {
          setProyecto(data.proyecto)
          setSelectedTable(data.proyecto.tablas[0]?.name ?? null)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [authChecked, user, id, router])

  const tabla = proyecto?.tablas.find(t => t.name === selectedTable) ?? null
  const headers = tabla ? Object.keys(tabla.rows[0] || {}) : []

  const verMas = useCallback(() => setVisibleRows(v => v + ROWS_PAGE), [])

  return (
    <PulseAppShell userName={user?.nombre} userEmail={user?.email} theme="light">
      <div style={{ background: '#f8f9fb', minHeight: '100%' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px 80px' }}>

          <a href="/pulse/databridge" style={{ fontSize: '12px', color: '#64748b', fontFamily: FONT_BODY, textDecoration: 'none' }}>← Volver a DataBridge</a>

          {loading && (
            <div style={{ marginTop: '40px', fontSize: '13px', color: '#64748b', fontFamily: FONT_BODY }}>Cargando panel…</div>
          )}

          {!loading && notFound && (
            <div style={{ marginTop: '40px', background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
              <div style={{ fontFamily: FONT, fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>No encontramos este panel</div>
              <div style={{ fontSize: '13px', color: '#64748b', fontFamily: FONT_BODY }}>Puede que no exista o que pertenezca a otra cuenta.</div>
            </div>
          )}

          {!loading && proyecto && (
            <>
              <div style={{ marginTop: '10px', marginBottom: '24px' }}>
                <h1 style={{ fontFamily: 'var(--font-geist-sans), sans-serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 450, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#0f172a', margin: '0 0 6px' }}>
                  {proyecto.nombre}
                </h1>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: FONT_BODY }}>
                  Desplegado el {new Date(proyecto.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* KPIs reales por tabla */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(proyecto.tablas.length, 4)}, 1fr)`, gap: '14px', marginBottom: '20px' }}>
                {proyecto.tablas.map((t, i) => (
                  <div key={t.name} style={{ background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontFamily: FONT_BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                    <div style={{ fontFamily: FONT, fontSize: '24px', fontWeight: 800, color: PALETTE[i % PALETTE.length] }}>{t.rows.length.toLocaleString('es-CO')}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: FONT_BODY }}>registros</div>
                  </div>
                ))}
              </div>

              {/* Browser de tablas */}
              <div style={{ background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', fontFamily: FONT_BODY }}>Datos</span>
                  <select
                    value={selectedTable ?? ''}
                    onChange={e => { setSelectedTable(e.target.value); setVisibleRows(ROWS_PAGE) }}
                    style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #d9dadc', background: '#f8fafc', color: '#0f172a', fontFamily: FONT_BODY }}
                  >
                    {proyecto.tablas.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                  {tabla && (
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: FONT_BODY }}>
                      {tabla.rows.length.toLocaleString('es-CO')} filas · {headers.length} campos
                    </span>
                  )}
                </div>

                {tabla && tabla.rows.length > 0 ? (
                  <>
                    <div style={{ overflow: 'auto', maxHeight: '460px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', fontFamily: FONT_BODY }}>
                        <thead>
                          <tr style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
                            {headers.map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tabla.rows.slice(0, visibleRows).map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              {headers.map(h => (
                                <td key={h} style={{ padding: '7px 12px', color: '#0f172a', whiteSpace: 'nowrap', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {String(row[h] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {visibleRows < tabla.rows.length && (
                      <button onClick={verMas} style={{ marginTop: '12px', fontSize: '12px', color: '#F2A93B', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, textDecoration: 'underline' }}>
                        Cargar más ({tabla.rows.length - visibleRows} restantes) →
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: '12px', color: '#64748b', fontFamily: FONT_BODY }}>Esta tabla no tiene filas.</div>
                )}
              </div>

              {/* Relaciones detectadas */}
              {proyecto.relaciones.length > 0 && (
                <div style={{ background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '20px', padding: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', fontFamily: FONT_BODY, marginBottom: '10px' }}>Relaciones detectadas</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {proyecto.relaciones.map((r, i) => (
                      <div key={i} style={{ fontSize: '12px', fontFamily: FONT_BODY, color: '#64748b', lineHeight: 1.6 }}>
                        <strong style={{ color: '#0f172a' }}>{r.a} ↔ {r.b}</strong>
                        {' — '}
                        {r.matches.map((m, mi) => (
                          <span key={mi}>{mi > 0 ? ', ' : ''}{m.fieldA} ↔ {m.fieldB}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PulseAppShell>
  )
}
