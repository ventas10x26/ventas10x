// Ruta destino: src/components/dashboard/PlanesClient.tsx
// Página de planes con tarjetas + modal de pago Nequi

'use client'

import { useState } from 'react'
import {
  PLANES,
  formatearCOP,
  diasRestantes,
  esTrial,
  esSuscripcionActiva,
  DATOS_NEQUI,
  type Plan,
  type Periodo,
  type Suscripcion,
} from '@/lib/suscripciones'

type Props = {
  suscripcionInicial: Suscripcion | null
}

export function PlanesClient({ suscripcionInicial }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>('mensual')
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null)

  const sub = suscripcionInicial
  const enTrial = esTrial(sub)
  const planActual = sub?.plan ?? null
  const dias = sub ? diasRestantes(sub.fecha_fin) : 0
  const activa = esSuscripcionActiva(sub)

  return (
    <div className="px-6 py-8 md:px-10">
      {/* Header */}
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-semibold text-brand-navy">Planes y precios</h1>
        <p className="mt-1 text-sm text-gray-500">
          {enTrial && dias > 0
            ? `🎁 Estás en trial. Te quedan ${dias} ${dias === 1 ? 'día' : 'días'}. Suscríbete para no perder acceso.`
            : activa && planActual !== 'trial'
            ? `Tu plan actual es ${PLANES[planActual!].nombre}. Vence en ${dias} ${dias === 1 ? 'día' : 'días'}.`
            : 'Elige el plan que mejor se ajuste a tu negocio.'}
        </p>
      </header>

      {/* Toggle mensual/anual */}
      <div className="flex justify-center mb-8">
        <div style={{
          display: 'inline-flex',
          background: '#f3f4f6',
          borderRadius: '12px',
          padding: '4px',
          gap: '4px',
        }}>
          <button
            onClick={() => setPeriodo('mensual')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: periodo === 'mensual' ? '#fff' : 'transparent',
              color: periodo === 'mensual' ? '#FF6B2B' : '#6b7280',
              boxShadow: periodo === 'mensual' ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            }}
          >
            Mensual
          </button>
          <button
            onClick={() => setPeriodo('anual')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: periodo === 'anual' ? '#fff' : 'transparent',
              color: periodo === 'anual' ? '#FF6B2B' : '#6b7280',
              boxShadow: periodo === 'anual' ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Anual
            <span style={{
              fontSize: '0.65rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: '#10b981',
              color: '#fff',
              fontWeight: 800,
              letterSpacing: '.04em',
            }}>
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Cards de planes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        {(['starter', 'pro', 'enterprise'] as Plan[]).map(planKey => {
          const plan = PLANES[planKey]
          const precio = periodo === 'anual' ? plan.precioAnual : plan.precioMensual
          const esActual = planActual === planKey && activa
          const esEnterprise = planKey === 'enterprise'

          return (
            <div
              key={planKey}
              style={{
                background: '#fff',
                border: plan.destacado ? '2px solid #FF6B2B' : '1px solid #e5e7eb',
                borderRadius: '20px',
                padding: '1.75rem',
                position: 'relative',
                boxShadow: plan.destacado ? '0 8px 24px rgba(255,107,43,.12)' : '0 1px 3px rgba(0,0,0,.04)',
              }}
            >
              {plan.destacado && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '4px 14px',
                  borderRadius: '999px',
                  letterSpacing: '.06em',
                  whiteSpace: 'nowrap',
                }}>
                  ⭐ MÁS POPULAR
                </div>
              )}

              {esActual && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(16,185,129,.15)',
                  color: '#059669',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  letterSpacing: '.04em',
                }}>
                  ● ACTIVO
                </div>
              )}

              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{plan.emoji}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f1c2e', marginBottom: '4px' }}>
                {plan.nombre}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1.25rem', minHeight: '2.4em' }}>
                {plan.descripcion}
              </p>

              {/* Precio */}
              {esEnterprise ? (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f1c2e' }}>
                    Personalizado
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    Hablemos para cotizar
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f1c2e', letterSpacing: '-.03em' }}>
                      {formatearCOP(precio)}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                      /{periodo === 'anual' ? 'año' : 'mes'}
                    </span>
                  </div>
                  {periodo === 'anual' && plan.ahorroAnual && (
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#10b981',
                      fontWeight: 700,
                      marginTop: '4px',
                    }}>
                      💰 {plan.ahorroAnual} (2 meses gratis)
                    </div>
                  )}
                </div>
              )}

              {/* Características */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {plan.caracteristicas.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: '#FF6B2B', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.5 }}>{c}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {esActual ? (
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'not-allowed',
                  }}
                >
                  Plan actual
                </button>
              ) : esEnterprise ? (
                <a
                  href="mailto:hola@ventas10x.co?subject=Interés%20Plan%20Enterprise"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.75rem',
                    background: '#0f1c2e',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  Contactar ventas →
                </a>
              ) : (
                <button
                  onClick={() => setPlanSeleccionado(planKey)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: plan.destacado
                      ? 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)'
                      : '#0f1c2e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: plan.destacado ? '0 4px 12px rgba(255,107,43,.25)' : 'none',
                  }}
                >
                  Suscribirme →
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal de pago */}
      {planSeleccionado && (
        <ModalPagoNequi
          plan={planSeleccionado}
          periodo={periodo}
          onClose={() => setPlanSeleccionado(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Modal de pago con QR Nequi
// ═══════════════════════════════════════════════════════════════

function ModalPagoNequi({
  plan,
  periodo,
  onClose,
}: {
  plan: Plan
  periodo: Periodo
  onClose: () => void
}) {
  const [paso, setPaso] = useState<1 | 2>(1)
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const planConfig = PLANES[plan]
  const monto = periodo === 'anual' ? planConfig.precioAnual : planConfig.precioMensual

  const enviar = async () => {
    if (!comprobante) {
      setError('Sube el comprobante de pago')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('plan', plan)
      formData.append('periodo', periodo)
      formData.append('notas', notas)
      formData.append('comprobante', comprobante)

      const res = await fetch('/api/pagos/subir-comprobante', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')

      setExito(data.mensaje || '✅ Comprobante recibido')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px',
          maxWidth: '520px', width: '100%',
          maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 5,
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f1c2e', margin: 0 }}>
              {planConfig.emoji} Plan {planConfig.nombre} · {periodo === 'anual' ? 'Anual' : 'Mensual'}
            </h3>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
              {formatearCOP(monto)}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            fontSize: '1.5rem', cursor: 'pointer', color: '#64748b',
          }}>×</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Éxito */}
          {exito && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem' }}>
                ¡Listo!
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                {exito}
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#FF6B2B', color: '#fff',
                  border: 'none', borderRadius: '10px',
                  fontSize: '0.9rem', fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Pasos */}
          {!exito && (
            <>
              {/* Indicador de paso */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                marginBottom: '1.5rem', justifyContent: 'center',
              }}>
                {[1, 2].map(p => (
                  <div
                    key={p}
                    style={{
                      width: paso === p ? '32px' : '8px',
                      height: '8px', borderRadius: '999px',
                      background: paso >= p ? '#FF6B2B' : '#e5e7eb',
                      transition: 'all .2s',
                    }}
                  />
                ))}
              </div>

              {/* Paso 1: Mostrar QR */}
              {paso === 1 && (
                <>
                  <div style={{
                    background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                    borderRadius: '16px', padding: '1.5rem',
                    textAlign: 'center', marginBottom: '1.25rem',
                  }}>
                    <div style={{ fontSize: '0.7rem', color: '#9a3412', fontWeight: 700, letterSpacing: '.06em', marginBottom: '0.5rem' }}>
                      PASO 1 · ESCANEA EL QR DESDE NEQUI
                    </div>

                    {/* QR Image */}
                    <div style={{
                      background: '#fff', borderRadius: '12px',
                      padding: '1rem', display: 'inline-block',
                      marginBottom: '0.75rem',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={DATOS_NEQUI.qrUrl}
                        alt="QR Nequi"
                        style={{ width: '280px', height: '280px', objectFit: 'contain', display: 'block' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#7c2d12' }}>
                      O envía a Nequi:<br />
                      <strong style={{ fontSize: '1.1rem', color: '#0f1c2e' }}>
                        {DATOS_NEQUI.numero}
                      </strong>
                      <br />
                      <span style={{ fontSize: '0.75rem' }}>{DATOS_NEQUI.titular}</span>
                    </div>

                    <div style={{
                      marginTop: '0.75rem', padding: '0.75rem',
                      background: '#fff', borderRadius: '8px',
                      fontSize: '0.85rem', color: '#0f1c2e',
                    }}>
                      Monto a pagar: <strong style={{ fontSize: '1.1rem', color: '#FF6B2B' }}>{formatearCOP(monto)}</strong>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.8rem', color: '#6b7280',
                    background: '#f9fafb', padding: '0.75rem 1rem',
                    borderRadius: '10px', marginBottom: '1.25rem',
                    lineHeight: 1.5,
                  }}>
                    💡 <strong>Consejo:</strong> Después de pagar, toma una captura del comprobante en Nequi (la pantalla que dice &quot;Pago exitoso&quot;) y súbela en el siguiente paso.
                  </div>

                  <button
                    onClick={() => setPaso(2)}
                    style={{
                      width: '100%', padding: '0.85rem',
                      background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)',
                      color: '#fff', border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.9rem', fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Ya pagué — subir comprobante →
                  </button>
                </>
              )}

              {/* Paso 2: Subir comprobante */}
              {paso === 2 && (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                      Comprobante de pago Nequi *
                    </label>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={e => setComprobante(e.target.files?.[0] || null)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px dashed #d1d5db',
                        borderRadius: '10px',
                        background: '#f9fafb',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    />
                    <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
                      JPG, PNG, WEBP o PDF · máx 5MB
                    </p>

                    {comprobante && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: '#166534',
                      }}>
                        ✅ {comprobante.name} ({(comprobante.size / 1024).toFixed(0)} KB)
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                      Notas (opcional)
                    </label>
                    <textarea
                      value={notas}
                      onChange={e => setNotas(e.target.value)}
                      placeholder="ej. Pagué desde la cuenta de mi esposo, número 300..."
                      maxLength={300}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.875rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {error && (
                    <div style={{
                      padding: '0.6rem 1rem',
                      background: '#fee2e2', color: '#991b1b',
                      borderRadius: '8px', fontSize: '0.85rem',
                      marginBottom: '1rem',
                    }}>
                      ❌ {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setPaso(1)}
                      disabled={enviando}
                      style={{
                        flex: 1,
                        padding: '0.85rem',
                        background: '#f3f4f6', color: '#374151',
                        border: 'none', borderRadius: '12px',
                        fontSize: '0.85rem', fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ← Atrás
                    </button>
                    <button
                      onClick={enviar}
                      disabled={enviando || !comprobante}
                      style={{
                        flex: 2,
                        padding: '0.85rem',
                        background: enviando || !comprobante
                          ? '#d1d5db'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff', border: 'none',
                        borderRadius: '12px',
                        fontSize: '0.9rem', fontWeight: 800,
                        cursor: enviando || !comprobante ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {enviando ? 'Enviando...' : '✓ Enviar comprobante'}
                    </button>
                  </div>

                  <p style={{
                    fontSize: '0.7rem', color: '#9ca3af',
                    textAlign: 'center', marginTop: '1rem',
                    lineHeight: 1.5,
                  }}>
                    Revisaremos tu comprobante en las próximas horas y activaremos tu plan automáticamente.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
