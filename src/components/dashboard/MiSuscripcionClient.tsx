// Ruta destino: src/components/dashboard/MiSuscripcionClient.tsx

'use client'

import Link from 'next/link'
import {
  PLANES,
  formatearCOP,
  diasRestantes,
  esTrial,
  esSuscripcionActiva,
  necesitaRenovar,
  type Suscripcion,
  type Pago,
} from '@/lib/suscripciones'

type Props = {
  suscripcionInicial: Suscripcion | null
  pagosIniciales: Pago[]
}

export function MiSuscripcionClient({ suscripcionInicial, pagosIniciales }: Props) {
  const sub = suscripcionInicial
  const enTrial = esTrial(sub)
  const activa = esSuscripcionActiva(sub)
  const dias = sub ? diasRestantes(sub.fecha_fin) : 0
  const renovar = necesitaRenovar(sub)

  const planActual = sub ? PLANES[sub.plan] : null

  return (
    <div className="px-6 py-8 md:px-10 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-brand-navy">Mi suscripción</h1>
        <p className="mt-1 text-sm text-gray-500">
          Estado de tu plan y historial de pagos
        </p>
      </header>

      {/* Card del plan actual */}
      <div className="card p-6 mb-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '2.5rem' }}>{planActual?.emoji ?? '⭕'}</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Plan actual
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f1c2e' }}>
                {planActual?.nombre ?? 'Sin plan'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>
                {sub?.periodo === 'trial' ? '14 días gratis' : sub?.periodo}
              </div>
            </div>
          </div>

          <div>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px',
              background: activa
                ? renovar ? 'rgba(245,158,11,.15)' : 'rgba(16,185,129,.15)'
                : 'rgba(239,68,68,.15)',
              color: activa
                ? renovar ? '#d97706' : '#059669'
                : '#dc2626',
            }}>
              {activa
                ? renovar ? '⏰ Por vencer' : '● Activa'
                : '○ Vencida'}
            </span>
          </div>
        </div>

        {sub && (
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, marginBottom: '2px' }}>
                Inicio
              </div>
              <div style={{ fontSize: '0.85rem', color: '#0f1c2e', fontWeight: 600 }}>
                {new Date(sub.fecha_inicio).toLocaleDateString('es-CO', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, marginBottom: '2px' }}>
                {activa ? 'Vence' : 'Venció'}
              </div>
              <div style={{ fontSize: '0.85rem', color: activa ? '#0f1c2e' : '#dc2626', fontWeight: 600 }}>
                {new Date(sub.fecha_fin).toLocaleDateString('es-CO', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, marginBottom: '2px' }}>
                Días restantes
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: activa
                  ? dias > 7 ? '#10b981' : dias > 0 ? '#d97706' : '#dc2626'
                  : '#dc2626',
                fontWeight: 700,
              }}>
                {dias > 0 ? `${dias} ${dias === 1 ? 'día' : 'días'}` : 'Vencida'}
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(enTrial || !activa || renovar) && (
            <Link
              href="/dashboard/planes"
              className="btn-primary !text-sm"
              style={{ display: 'inline-block' }}
            >
              {enTrial ? 'Suscribirme →' : renovar ? 'Renovar plan →' : 'Reactivar plan →'}
            </Link>
          )}
          {!enTrial && activa && !renovar && (
            <Link
              href="/dashboard/planes"
              className="btn-secondary !text-sm"
              style={{ display: 'inline-block' }}
            >
              Cambiar plan
            </Link>
          )}
        </div>
      </div>

      {/* Historial de pagos */}
      {pagosIniciales.length > 0 && (
        <div className="card p-6">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f1c2e', marginBottom: '1rem' }}>
            📋 Historial de pagos
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pagosIniciales.map(pago => {
              const planConfig = PLANES[pago.plan]
              const colorEstado =
                pago.estado === 'aprobado' ? '#10b981' :
                pago.estado === 'rechazado' ? '#ef4444' :
                '#f59e0b'
              const bgEstado =
                pago.estado === 'aprobado' ? 'rgba(16,185,129,.1)' :
                pago.estado === 'rechazado' ? 'rgba(239,68,68,.1)' :
                'rgba(245,158,11,.1)'
              const labelEstado =
                pago.estado === 'aprobado' ? '✓ Aprobado' :
                pago.estado === 'rechazado' ? '✗ Rechazado' :
                '⏳ En revisión'

              return (
                <div
                  key={pago.id}
                  style={{
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    padding: '0.875rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{planConfig.emoji}</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f1c2e' }}>
                        Plan {planConfig.nombre} · {pago.periodo}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                        {new Date(pago.created_at).toLocaleDateString('es-CO', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f1c2e' }}>
                      {formatearCOP(pago.monto)}
                    </div>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700,
                      padding: '3px 10px', borderRadius: '999px',
                      background: bgEstado, color: colorEstado,
                      whiteSpace: 'nowrap',
                    }}>
                      {labelEstado}
                    </span>
                  </div>

                  {pago.estado === 'rechazado' && pago.motivo_rechazo && (
                    <div style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: '#fee2e2',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      color: '#991b1b',
                    }}>
                      <strong>Motivo:</strong> {pago.motivo_rechazo}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
