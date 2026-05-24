'use client'

import { useMemo, useRef, useState } from 'react'
import type { PulseVozMuestraPublica } from '@/lib/pulse-agent'

type Props = {
  muestras: PulseVozMuestraPublica[]
  email?: string
  onRefresh?: () => void
}

function formatearFecha(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatearDuracion(seg: number) {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function labelOrigen(origen?: string) {
  if (origen === 'onboarding') return 'Onboarding'
  if (origen === 'agente') return 'Entrenamiento'
  return 'Grabación'
}

export function PulseAudioLogs({ muestras, email, onRefresh }: Props) {
  const [reproduciendoId, setReproduciendoId] = useState<string | null>(null)
  const [expandidoId, setExpandidoId] = useState<string | null>(null)
  // FIX: map de refs por id para controlar cada <audio> sin tocar el DOM con getElementById
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  const stats = useMemo(() => {
    const conAudio = muestras.filter((m) => m.audio_url && !m.solo_transcripcion).length
    const soloTexto = muestras.filter((m) => m.solo_transcripcion || !m.audio_url).length
    return { total: muestras.length, conAudio, soloTexto }
  }, [muestras])

  // FIX: pausa todos los audios EXCEPTO el que se quiere reproducir
  // Retorna una Promise.allSettled para esperar que todos estén pausados antes de hacer play
  const pausarTodosExcepto = (exceptoId: string | null) => {
    Object.entries(audioRefs.current).forEach(([id, el]) => {
      if (el && id !== exceptoId && !el.paused) {
        el.pause()
        el.currentTime = 0
      }
    })
  }

  const toggleAudio = (id: string) => {
    const audio = audioRefs.current[id]
    if (!audio) return

    if (reproduciendoId === id) {
      // Pausar el actual
      audio.pause()
      setReproduciendoId(null)
    } else {
      // Pausar todos los demás primero, luego reproducir este
      pausarTodosExcepto(id)
      // FIX: usar .then() para evitar el AbortError — play() es async
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setReproduciendoId(id))
          .catch((err) => {
            // AbortError es inofensivo (el usuario hizo click rápido), ignorar
            if (err?.name !== 'AbortError') console.warn('[PulseAudioLogs] play error:', err)
          })
      }
    }
  }

  return (
    <section
      id="pulse-audio-logs"
      style={{ marginTop: 32, paddingTop: 28, borderTop: '2px solid rgba(249, 115, 22, 0.35)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>📋</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#fff' }}>Logs de audio</h2>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#f97316', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.35)', padding: '4px 10px', borderRadius: 999, letterSpacing: 0.5 }}>EVOLUCIÓN DEL ASESOR</span>
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 560 }}>
            Registro cronológico de cada muestra de voz. Escucha grabaciones anteriores y compara cómo ha evolucionado tu tono de venta.
            {email ? <span style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: 12 }}>Asesor: {email}</span> : null}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <StatPill label="Total" value={String(stats.total)} />
          <StatPill label="Con audio" value={String(stats.conAudio)} color="#4ade80" />
          {stats.soloTexto > 0 && <StatPill label="Solo texto" value={String(stats.soloTexto)} color="#fbbf24" />}
          {onRefresh && (
            <button type="button" onClick={onRefresh} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Actualizar</button>
          )}
        </div>
      </div>

      {muestras.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', borderRadius: 14, border: '1px dashed #334155', background: 'rgba(15,23,42,0.5)' }}>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>No hay logs todavía. Graba una muestra en la pestaña <strong>Voz y tono</strong> para crear tu primer registro.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {muestras.map((m, index) => {
            const num = muestras.length - index
            const esActual = index === 0
            const tieneAudio = !!m.audio_url && !m.solo_transcripcion
            const expandido = expandidoId === m.id
            const reproduciendo = reproduciendoId === m.id

            return (
              <article
                key={m.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr auto',
                  gap: 16,
                  padding: '18px 16px',
                  borderBottom: '1px solid #1e293b',
                  background: esActual ? 'linear-gradient(90deg, rgba(249,115,22,0.08), transparent)' : 'transparent',
                }}
              >
                {/* Número */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${esActual ? '#f97316' : '#334155'}`, background: esActual ? 'rgba(249,115,22,0.2)' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: esActual ? '#f97316' : '#64748b' }}>
                    #{num}
                  </div>
                  {index < muestras.length - 1 && <div style={{ width: 2, height: 24, background: '#1e293b', margin: '6px auto 0' }} />}
                </div>

                {/* Contenido */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    {esActual && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#f97316', padding: '3px 8px', borderRadius: 4 }}>MÁS RECIENTE</span>}
                    <time dateTime={m.created_at} style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{formatearFecha(m.created_at)}</time>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{formatearDuracion(m.duracion_seg)} · {labelOrigen(m.origen)}</span>
                  </div>

                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '10px 0 0', lineHeight: 1.55, ...(expandido ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }) }}>
                    {m.transcripcion}
                  </p>

                  <button type="button" onClick={() => setExpandidoId(expandido ? null : m.id)} style={{ marginTop: 6, padding: 0, border: 'none', background: 'none', color: '#f97316', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {expandido ? 'Ver menos' : 'Ver transcripción completa'}
                  </button>

                  {m.solo_transcripcion && (
                    <p style={{ fontSize: 11, color: '#fbbf24', margin: '8px 0 0' }}>
                      ⚠ Solo transcripción guardada — vuelve a grabar para tener audio reproducible en Supabase Storage (`pulse-agente-voz`).
                    </p>
                  )}

                  {/* FIX: <audio> sin onPlay manual — el control lo maneja el botón y los refs */}
                  {tieneAudio && (
                    <div style={{ marginTop: 12 }}>
                      <audio
                        ref={(el) => { audioRefs.current[m.id] = el }}
                        src={m.audio_url!}
                        onEnded={() => setReproduciendoId(null)}
                        onPause={() => { if (reproduciendoId === m.id) setReproduciendoId(null) }}
                        style={{ width: '100%', height: 36, borderRadius: 8 }}
                        preload="metadata"
                      />
                    </div>
                  )}
                </div>

                {/* Botón play/pause */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch', minWidth: 120 }}>
                  {tieneAudio ? (
                    <button
                      type="button"
                      onClick={() => toggleAudio(m.id)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: 'none',
                        background: reproduciendo ? 'rgba(239,68,68,0.25)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: reproduciendo ? 'none' : '0 4px 14px rgba(34,197,94,0.25)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {reproduciendo ? '⏸ Pausar' : '▶ Reproducir'}
                    </button>
                  ) : (
                    <span style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', color: '#475569', fontSize: 11, textAlign: 'center' }}>Sin archivo de audio</span>
                  )}
                  <span style={{ fontSize: 10, color: '#475569', textAlign: 'center' }}>Log #{num}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function StatPill({ label, value, color = '#94a3b8' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #1e293b', background: 'rgba(15,23,42,0.6)', textAlign: 'center', minWidth: 72 }}>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}
