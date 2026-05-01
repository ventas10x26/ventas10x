// Ruta destino: src/components/dashboard/SelectorOrg.tsx
// Dropdown que muestra todas las orgs del usuario y permite cambiar la activa.

'use client'

import { useEffect, useState, useRef } from 'react'

type Org = {
  id: string
  nombre: string
  slug: string | null
  owner_id: string
  es_propia: boolean
  rol: 'owner' | 'admin' | 'viewer'
}

const ROL_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  viewer: 'Viewer',
}

export function SelectorOrg() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [orgActivaId, setOrgActivaId] = useState<string | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [cambiando, setCambiando] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/team/orgs-mias')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setOrgs(d.orgs || [])
          setOrgActivaId(d.orgActivaId)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    if (abierto) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [abierto])

  const cambiarOrg = async (orgId: string) => {
    if (orgId === orgActivaId) {
      setAbierto(false)
      return
    }
    setCambiando(true)
    try {
      const res = await fetch('/api/team/switch-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      })
      if (res.ok) {
        // Recargar la página para que el server lea la cookie nueva
        window.location.reload()
      }
    } catch (e) {
      console.error(e)
      setCambiando(false)
    }
  }

  // Si está cargando o tiene 0/1 org, no mostrar el selector
  if (loading) return null
  if (orgs.length <= 1) return null

  const orgActiva = orgs.find((o) => o.id === orgActivaId) || orgs[0]
  const inicial = orgActiva.nombre.charAt(0).toUpperCase()

  return (
    <div ref={dropdownRef} style={{ position: 'relative', padding: '0 16px 8px' }}>
      <div
        style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          marginBottom: '6px',
          paddingLeft: '4px',
        }}
      >
        Trabajando en
      </div>

      <button
        onClick={() => setAbierto((s) => !s)}
        disabled={cambiando}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: cambiando ? 'wait' : 'pointer',
          transition: 'background .15s',
          opacity: cambiando ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!cambiando) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: '#FF6B2B',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '13px',
            flexShrink: 0,
          }}
        >
          {inicial}
        </div>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div
            style={{
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {orgActiva.nombre}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {ROL_LABELS[orgActiva.rol]} · {orgs.length} {orgs.length === 1 ? 'org' : 'orgs'}
          </div>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            color: 'rgba(255,255,255,0.5)',
            flexShrink: 0,
            transform: abierto ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform .2s',
          }}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {abierto && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: '16px',
            right: '16px',
            background: '#1a2942',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '6px',
            zIndex: 50,
            boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {orgs.map((o) => {
            const activa = o.id === orgActivaId
            const inicialOrg = o.nombre.charAt(0).toUpperCase()
            return (
              <button
                key={o.id}
                onClick={() => cambiarOrg(o.id)}
                style={{
                  width: '100%',
                  background: activa ? 'rgba(255,107,43,0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'background .12s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!activa) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  if (!activa) e.currentTarget.style.background = 'transparent'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    background: activa ? '#FF6B2B' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  {inicialOrg}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {o.nombre}
                  </div>
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: '10px',
                    }}
                  >
                    {ROL_LABELS[o.rol]}
                    {o.es_propia ? ' · Tu org' : ''}
                  </div>
                </div>
                {activa && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#FF6B2B', flexShrink: 0 }}>
                    <path d="M3 7l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
