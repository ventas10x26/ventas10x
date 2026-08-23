// Ruta destino: src/components/admin/AdminDatabridgeClient.tsx
//
// Tabla de solo lectura -- a propósito sin renombrar/borrar acá (eso ya existe en
// /pulse/databridge, con el dueño real de cada proyecto). Este panel es para que Pulse
// Motor vea la operación completa, no para administrar la cuenta de un cliente puntual.

'use client'

import { useMemo, useState } from 'react'

const FONT      = "var(--font-inter), sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const BLUE      = '#2563EB'

interface ProyectoAdmin {
  id: string
  nombre: string
  createdAt: string
  tablas: number
  relaciones: number
  userEmail: string
}

export function AdminDatabridgeClient({ proyectos }: { proyectos: ProyectoAdmin[] }) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return proyectos
    return proyectos.filter(p => p.nombre.toLowerCase().includes(q) || p.userEmail.toLowerCase().includes(q))
  }, [proyectos, busqueda])

  const usuariosUnicos = new Set(proyectos.map(p => p.userEmail)).size

  const fecha = (iso: string) => {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)', borderRadius: '999px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px', fontFamily: FONT_BODY }}>
          Admin · Pulse Motor
        </div>
        <h1 style={{ fontFamily: FONT, fontSize: 'clamp(26px,3.4vw,38px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 8px', color: '#0f172a' }}>
          Todos los proyectos de <span style={{ color: BLUE }}>DataBridge</span>
        </h1>
        <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px', fontFamily: FONT_BODY }}>
          {proyectos.length} {proyectos.length === 1 ? 'proyecto' : 'proyectos'} · {usuariosUnicos} {usuariosUnicos === 1 ? 'usuario' : 'usuarios'}
        </p>

        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre de proyecto o email..."
          style={{ width: '100%', maxWidth: '420px', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d9dadc', background: '#ffffff', color: '#0f172a', fontSize: '13.5px', fontFamily: FONT_BODY, outline: 'none', marginBottom: '20px' }}
        />

        <div style={{ background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.6fr 0.8fr 0.9fr 1.3fr 0.9fr', gap: '12px', padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', fontFamily: FONT_BODY }}>
            <span>Proyecto</span>
            <span>Usuario</span>
            <span>Tablas</span>
            <span>Relaciones</span>
            <span>Creado</span>
            <span></span>
          </div>

          {filtrados.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: '13px', color: '#94a3b8', fontFamily: FONT_BODY }}>
              {proyectos.length === 0 ? 'Todavía no hay proyectos desplegados.' : 'Nada coincide con esa búsqueda.'}
            </div>
          ) : (
            filtrados.map(p => (
              <div
                key={p.id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.6fr 0.8fr 0.9fr 1.3fr 0.9fr', gap: '12px', padding: '13px 18px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: '13px', fontFamily: FONT_BODY }}
              >
                <span style={{ color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</span>
                <span style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.userEmail}</span>
                <span style={{ color: '#475569' }}>{p.tablas}</span>
                <span style={{ color: '#475569' }}>{p.relaciones}</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{fecha(p.createdAt)}</span>
                <a
                  href={`/pulse/databridge/panel/${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: BLUE, fontWeight: 600, textDecoration: 'none', fontSize: '12.5px', justifySelf: 'end' }}
                >
                  Ver panel →
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
