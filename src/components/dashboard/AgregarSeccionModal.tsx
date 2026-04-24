// Ruta destino: src/components/dashboard/AgregarSeccionModal.tsx
'use client'

import { useState } from 'react'
import { LandingSeccion, SECCIONES_META, TipoSeccion } from '@/types/secciones'

type Props = {
  onClose: () => void
  onCreada: (seccion: LandingSeccion) => void
  form: {
    titulo: string
    subtitulo: string
    producto: string
    color_acento: string
  }
  analisisPrevio?: string
}

export function AgregarSeccionModal({ onClose, onCreada, form, analisisPrevio }: Props) {
  const [modo, setModo] = useState<'elegir' | 'manual' | 'ia'>('elegir')
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoSeccion | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Solo mostrar los tipos disponibles en MVP
  const tiposDisponibles = (Object.keys(SECCIONES_META) as TipoSeccion[])
    .filter(t => SECCIONES_META[t].disponibleMVP)

  // Crear sección manualmente (contenido vacío, para editarla luego)
  const crearManual = async (tipo: TipoSeccion) => {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('/api/landing/secciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      onCreada(data.seccion)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear')
    } finally {
      setCargando(false)
    }
  }

  // Crear sección con IA (contenido pre-generado)
  const crearConIA = async (tipo: TipoSeccion) => {
    setCargando(true)
    setError(null)
    try {
      // 1. Pedir a la IA que genere el contenido
      const resIA = await fetch('/api/landing/ia-sugerir-seccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form,
          analisis: analisisPrevio,
          tipoPedido: tipo,
        }),
      })
      const sugerencia = await resIA.json()
      if (!resIA.ok || !sugerencia.contenido) {
        throw new Error(sugerencia.error || 'La IA no pudo generar contenido')
      }

      // 2. Crear la sección con el contenido generado
      const resCrear = await fetch('/api/landing/secciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          titulo: sugerencia.titulo,
          subtitulo: sugerencia.subtitulo,
          contenido: sugerencia.contenido,
        }),
      })
      const data = await resCrear.json()
      if (!resCrear.ok) throw new Error(data.error || 'Error')
      onCreada(data.seccion)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '1.5rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f1c2e' }}>
            {modo === 'elegir' ? 'Agregar nueva sección' : modo === 'ia' ? '✨ Crear con IA' : 'Crear manualmente'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.6rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            ❌ {error}
          </div>
        )}

        {/* Paso 1: Elegir modo (IA o manual) */}
        {modo === 'elegir' && (
          <div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.25rem' }}>
              ¿Cómo quieres crear la sección?
            </p>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button
                onClick={() => setModo('ia')}
                style={{
                  padding: '1.25rem',
                  background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(255,107,43,.25)',
                }}
              >
                <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                  ✨ Crear con IA (recomendado)
                </div>
                <div style={{ fontSize: '0.825rem', opacity: 0.95 }}>
                  La IA genera el contenido automáticamente basado en tu industria y landing actual
                </div>
              </button>

              <button
                onClick={() => setModo('manual')}
                style={{
                  padding: '1.25rem',
                  background: '#f3f4f6',
                  color: '#0f1c2e',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                  ✍️ Crear manualmente
                </div>
                <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                  Empiezas con una sección vacía y la llenas tú mismo
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Elegir tipo de sección */}
        {(modo === 'ia' || modo === 'manual') && (
          <div>
            <button
              onClick={() => { setModo('elegir'); setTipoSeleccionado(null); setError(null) }}
              style={{ background: 'transparent', border: 'none', color: '#FF6B2B', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}
            >
              ← Volver
            </button>

            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Elige qué tipo de sección quieres agregar:
            </p>

            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {tiposDisponibles.map(tipo => {
                const meta = SECCIONES_META[tipo]
                const seleccionado = tipoSeleccionado === tipo
                return (
                  <button
                    key={tipo}
                    onClick={() => setTipoSeleccionado(tipo)}
                    disabled={cargando}
                    style={{
                      padding: '1rem',
                      background: seleccionado ? `${meta.color}11` : '#fff',
                      border: `2px solid ${seleccionado ? meta.color : '#e5e7eb'}`,
                      borderRadius: '12px',
                      cursor: cargando ? 'wait' : 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all .15s',
                      opacity: cargando ? 0.6 : 1,
                    }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: `${meta.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}>
                      {meta.icono}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f1c2e' }}>
                        {meta.nombre}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {meta.descripcion}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {tipoSeleccionado && (
              <button
                onClick={() => modo === 'ia' ? crearConIA(tipoSeleccionado) : crearManual(tipoSeleccionado)}
                disabled={cargando}
                style={{
                  marginTop: '1.25rem',
                  width: '100%',
                  padding: '0.9rem',
                  background: '#FF6B2B',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: cargando ? 'wait' : 'pointer',
                  opacity: cargando ? 0.7 : 1,
                }}
              >
                {cargando
                  ? (modo === 'ia' ? '✨ Generando con IA...' : 'Creando...')
                  : (modo === 'ia' ? '✨ Generar y crear sección' : 'Crear sección vacía')
                }
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
