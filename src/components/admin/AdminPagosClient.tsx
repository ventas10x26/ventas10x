// Ruta destino: src/components/admin/AdminPagosClient.tsx
// UI completa del panel admin con cards de pagos + aprobar/rechazar

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLANES, formatearCOP } from '@/lib/suscripciones'
import type { Pago } from '@/types/database'

type PagoConProfile = Pago & {
  vendedor_nombre: string
  vendedor_empresa: string | null
  vendedor_slug: string | null
  comprobante_url_firmada: string | null
}

type Props = {
  pagos: PagoConProfile[]
  adminEmail: string
}

type Filtro = 'pendiente' | 'aprobado' | 'rechazado' | 'todos'

export function AdminPagosClient({ pagos, adminEmail }: Props) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<Filtro>('pendiente')
  const [pagoActivo, setPagoActivo] = useState<PagoConProfile | null>(null)
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pagosFiltrados = filtro === 'todos'
    ? pagos
    : pagos.filter(p => p.estado === filtro)

  const conteos = {
    pendiente: pagos.filter(p => p.estado === 'pendiente').length,
    aprobado: pagos.filter(p => p.estado === 'aprobado').length,
    rechazado: pagos.filter(p => p.estado === 'rechazado').length,
    todos: pagos.length,
  }

  const aprobar = async (pago: PagoConProfile) => {
    setProcesando(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/pagos/${pago.id}/aprobar`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setMensaje(data.mensaje || '✅ Aprobado')
      setPagoActivo(null)
      setAccion(null)
      setTimeout(() => router.refresh(), 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setProcesando(false)
    }
  }

  const rechazar = async () => {
    if (!pagoActivo) return
    if (motivoRechazo.trim().length < 5) {
      setError('Motivo muy corto')
      return
    }
    setProcesando(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/pagos/${pagoActivo.id}/rechazar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoRechazo.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setMensaje(data.mensaje || '✗ Rechazado')
      setPagoActivo(null)
      setAccion(null)
      setMotivoRechazo('')
      setTimeout(() => router.refresh(), 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#FF6B2B', fontWeight: 800, letterSpacing: '.1em', marginBottom: '4px' }}>
              ADMIN · PANEL
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f1c2e', margin: 0 }}>
              💰 Pagos recibidos
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
              Revisa comprobantes y activa los planes · Sesión: {adminEmail}
            </p>
          </div>
          <a
            href="/dashboard"
            style={{
              fontSize: '0.8rem', color: '#6b7280',
              padding: '8px 14px', border: '1px solid #e5e7eb',
              borderRadius: '8px', textDecoration: 'none',
            }}
          >
            ← Volver al dashboard
          </a>
        </header>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {([
            { key: 'pendiente', label: '⏳ Pendientes', color: '#f59e0b' },
            { key: 'aprobado', label: '✅ Aprobados', color: '#10b981' },
            { key: 'rechazado', label: '❌ Rechazados', color: '#ef4444' },
            { key: 'todos', label: '📋 Todos', color: '#6b7280' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: filtro === f.key ? f.color : '#fff',
                color: filtro === f.key ? '#fff' : '#374151',
                boxShadow: filtro === f.key ? 'none' : '0 1px 2px rgba(0,0,0,.05)',
              }}
            >
              {f.label} · {conteos[f.key]}
            </button>
          ))}
        </div>

        {/* Mensajes globales */}
        {mensaje && (
          <div style={{
            padding: '0.75rem 1rem', background: '#f0fdf4', color: '#166534',
            border: '1px solid #86efac', borderRadius: '10px', marginBottom: '1rem',
            fontSize: '0.85rem',
          }}>
            {mensaje}
          </div>
        )}
        {error && (
          <div style={{
            padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b',
            border: '1px solid #fca5a5', borderRadius: '10px', marginBottom: '1rem',
            fontSize: '0.85rem',
          }}>
            ❌ {error}
          </div>
        )}

        {/* Lista de pagos */}
        {pagosFiltrados.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '3rem 2rem',
            textAlign: 'center', border: '1px solid #f3f4f6',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f1c2e', marginBottom: '4px' }}>
              No hay pagos en esta categoría
            </div>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
              Los nuevos pagos aparecerán aquí
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pagosFiltrados.map(pago => (
              <PagoCard
                key={pago.id}
                pago={pago}
                onAprobar={() => { setPagoActivo(pago); setAccion('aprobar') }}
                onRechazar={() => { setPagoActivo(pago); setAccion('rechazar') }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {pagoActivo && accion && (
        <div
          onClick={() => { setPagoActivo(null); setAccion(null); setMotivoRechazo('') }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '1.5rem' }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f1c2e', marginBottom: '0.5rem' }}>
              {accion === 'aprobar'
                ? `✅ Aprobar pago de ${pagoActivo.vendedor_nombre}`
                : `❌ Rechazar pago de ${pagoActivo.vendedor_nombre}`
              }
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              {accion === 'aprobar'
                ? `Activarás Plan ${PLANES[pagoActivo.plan as keyof typeof PLANES]?.nombre} ${pagoActivo.periodo} por ${formatearCOP(pagoActivo.monto)}. Se enviará email de confirmación al vendedor.`
                : 'Indica por qué se rechaza. El vendedor recibirá un email con el motivo.'
              }
            </p>

            {accion === 'rechazar' && (
              <textarea
                value={motivoRechazo}
                onChange={e => setMotivoRechazo(e.target.value)}
                placeholder="ej. El comprobante no muestra el monto correcto, o el destinatario no coincide..."
                rows={3}
                maxLength={300}
                style={{
                  width: '100%', padding: '0.75rem',
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  fontSize: '0.85rem', outline: 'none', resize: 'vertical',
                  fontFamily: 'inherit', marginBottom: '1rem',
                }}
              />
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setPagoActivo(null); setAccion(null); setMotivoRechazo('') }}
                disabled={procesando}
                style={{
                  padding: '0.6rem 1rem',
                  background: '#f3f4f6', color: '#374151',
                  border: 'none', borderRadius: '8px',
                  fontSize: '0.85rem', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={accion === 'aprobar' ? () => aprobar(pagoActivo) : rechazar}
                disabled={procesando}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: accion === 'aprobar'
                    ? 'linear-gradient(135deg,#10b981 0%,#059669 100%)'
                    : 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '0.85rem', fontWeight: 700,
                  cursor: procesando ? 'wait' : 'pointer',
                  opacity: procesando ? 0.7 : 1,
                }}
              >
                {procesando ? 'Procesando...' : accion === 'aprobar' ? '✓ Confirmar y activar' : '✗ Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Card individual del pago
// ═══════════════════════════════════════════════════════════════

function PagoCard({
  pago,
  onAprobar,
  onRechazar,
}: {
  pago: PagoConProfile
  onAprobar: () => void
  onRechazar: () => void
}) {
  const [verImagen, setVerImagen] = useState(false)

  const planConfig = PLANES[pago.plan as keyof typeof PLANES]
  const colorEstado =
    pago.estado === 'aprobado' ? '#10b981' :
    pago.estado === 'rechazado' ? '#ef4444' : '#f59e0b'
  const bgEstado =
    pago.estado === 'aprobado' ? 'rgba(16,185,129,.1)' :
    pago.estado === 'rechazado' ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)'

  return (
    <div style={{
      background: '#fff',
      border: pago.estado === 'pendiente' ? '2px solid #fbbf24' : '1px solid #f3f4f6',
      borderRadius: '14px',
      padding: '1.25rem',
      display: 'grid',
      gridTemplateColumns: '120px 1fr auto',
      gap: '1rem',
      alignItems: 'start',
    }}>
      {/* Comprobante thumbnail */}
      <button
        onClick={() => setVerImagen(true)}
        style={{
          width: '120px', height: '120px',
          background: '#f3f4f6',
          borderRadius: '10px',
          overflow: 'hidden',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          position: 'relative',
        }}
      >
        {pago.comprobante_url_firmada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pago.comprobante_url_firmada}
            alt="Comprobante"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: '2rem' }}>
            📄
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: '4px', right: '4px',
          background: 'rgba(0,0,0,.6)', color: '#fff',
          fontSize: '0.6rem', fontWeight: 700,
          padding: '2px 6px', borderRadius: '4px',
        }}>
          🔍 Ver
        </div>
      </button>

      {/* Info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f1c2e' }}>
            {pago.vendedor_nombre}
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700,
            padding: '2px 8px', borderRadius: '999px',
            background: bgEstado, color: colorEstado,
            textTransform: 'uppercase', letterSpacing: '.04em',
          }}>
            {pago.estado}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>
          {pago.vendedor_empresa && <span>🏢 {pago.vendedor_empresa}</span>}
          {pago.vendedor_slug && <span>🔗 /u/{pago.vendedor_slug}</span>}
          <span>📅 {new Date(pago.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '1.2rem' }}>{planConfig?.emoji || '💎'}</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f1c2e' }}>
            Plan {planConfig?.nombre || pago.plan}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize' }}>
            · {pago.periodo}
          </span>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
            {formatearCOP(pago.monto)}
          </span>
        </div>

        {pago.notas_vendedor && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            padding: '6px 10px', borderRadius: '6px',
            fontSize: '0.7rem', color: '#92400e',
            fontStyle: 'italic', marginTop: '6px',
          }}>
            📝 Nota: &quot;{pago.notas_vendedor}&quot;
          </div>
        )}

        {pago.estado === 'rechazado' && pago.motivo_rechazo && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            padding: '6px 10px', borderRadius: '6px',
            fontSize: '0.7rem', color: '#991b1b',
            marginTop: '6px',
          }}>
            <strong>Rechazado:</strong> {pago.motivo_rechazo}
          </div>
        )}

        {pago.estado === 'aprobado' && pago.aprobado_at && (
          <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '6px' }}>
            ✓ Aprobado el {new Date(pago.aprobado_at).toLocaleString('es-CO')}
          </div>
        )}
      </div>

      {/* Acciones */}
      {pago.estado === 'pendiente' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          <button
            onClick={onAprobar}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✓ Aprobar
          </button>
          <button
            onClick={onRechazar}
            style={{
              padding: '8px 16px',
              background: '#fff', color: '#dc2626',
              border: '1px solid #fca5a5', borderRadius: '8px',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✗ Rechazar
          </button>
        </div>
      )}

      {/* Modal ver imagen */}
      {verImagen && pago.comprobante_url_firmada && (
        <div
          onClick={() => setVerImagen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '2rem', cursor: 'zoom-out',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pago.comprobante_url_firmada}
            alt="Comprobante completo"
            style={{ maxWidth: '100%', maxHeight: '95vh', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}
