// Ruta destino: src/components/landing/CTACierre.tsx
'use client'

import { useState } from 'react'

type Props = {
  colorAcento: string
  ctaTexto: string
  ctaMicrocopy: string
  whatsapp: string
  mensajeWa: string
  slug: string
  industria?: string
  nombreVendedor?: string
}

const INDUSTRIA_CONFIG: Record<string, {
  titulo: string
  subtitulo: string
  opciones: string[]
  garantia: string
  contador: string
}> = {
  automotriz: {
    titulo: 'Si no encuentro tu vehículo ideal, te digo exactamente por qué.',
    subtitulo: 'Sin compromiso. Sin rodeos. Solo respuestas claras.',
    opciones: ['SUV / Camioneta', 'Sedán / Compacto', 'Eléctrico / Híbrido', 'Solo estoy cotizando'],
    garantia: 'Próxima cita disponible: hoy · cupos limitados',
    contador: 'personas cotizaron esta semana',
  },
  inmobiliaria: {
    titulo: 'Si no tengo tu propiedad ideal, te digo exactamente dónde buscarla.',
    subtitulo: 'Sin compromiso. Asesoría honesta y personalizada.',
    opciones: ['Apartamento', 'Casa', 'Local comercial', 'Solo estoy mirando'],
    garantia: 'Próxima asesoría disponible: hoy · cupos limitados',
    contador: 'personas recibieron asesoría esta semana',
  },
  retail: {
    titulo: 'Encuentro lo que buscas o te aviso cuando llegue.',
    subtitulo: 'Atención personalizada. Sin vueltas.',
    opciones: ['Ropa', 'Calzado', 'Accesorios', 'Solo estoy viendo'],
    garantia: 'Respuesta inmediata · atención personalizada',
    contador: 'clientes atendidos esta semana',
  },
  salud: {
    titulo: 'Tu salud primero. Te orientamos sin costo ni compromiso.',
    subtitulo: 'Información clara. Atención oportuna.',
    opciones: ['Consulta médica', 'Procedimiento', 'Medicamento', 'Solo información'],
    garantia: 'Próxima cita disponible hoy · atención oportuna',
    contador: 'pacientes atendidos esta semana',
  },
  educacion: {
    titulo: 'Encuentra el programa que cambia tu carrera.',
    subtitulo: 'Te asesoramos sin compromiso para tomar la mejor decisión.',
    opciones: ['Curso', 'Diplomado', 'Posgrado / Maestría', 'Solo información'],
    garantia: 'Próxima sesión informativa: hoy · cupos limitados',
    contador: 'personas se inscribieron esta semana',
  },
  fitness: {
    titulo: 'Empieza hoy. Tu primera sesión no te compromete a nada.',
    subtitulo: 'Sin contratos forzosos. Solo resultados reales.',
    opciones: ['Membresía mensual', 'Plan personalizado', 'Clases grupales', 'Solo cotizando'],
    garantia: 'Disponibilidad hoy · cupos limitados',
    contador: 'nuevos miembros se unieron esta semana',
  },
  turismo: {
    titulo: 'Si no tengo el viaje que sueñas, diseñamos uno juntos.',
    subtitulo: 'Asesoría sin costo. Precios directos sin intermediarios.',
    opciones: ['Paquete completo', 'Solo hotel', 'Tour / Excursión', 'Solo cotizando'],
    garantia: 'Oferta disponible hoy · plazas limitadas',
    contador: 'viajeros asesorados esta semana',
  },
  servicios: {
    titulo: 'Si no podemos ayudarte, te decimos quién puede.',
    subtitulo: 'Presupuesto sin compromiso. Respuesta en minutos.',
    opciones: ['Presupuesto', 'Consulta técnica', 'Proyecto completo', 'Solo información'],
    garantia: 'Disponibilidad hoy · respuesta en 5 min',
    contador: 'proyectos cotizados esta semana',
  },
  tecnologia: {
    titulo: 'Demo gratis. Decide después de ver cómo funciona.',
    subtitulo: 'Sin presión. Sin letra pequeña.',
    opciones: ['Ver demo', 'Cotización', 'Soporte técnico', 'Solo información'],
    garantia: 'Demo disponible hoy · sin compromisos',
    contador: 'empresas evaluaron la solución esta semana',
  },
}

const DEFAULT_CONFIG = {
  titulo: 'Si no resolvemos tu necesidad, te decimos exactamente cómo hacerlo.',
  subtitulo: 'Sin compromiso. Respuesta directa y honesta.',
  opciones: ['Quiero información', 'Quiero cotizar', 'Quiero agendar', 'Solo estoy mirando'],
  garantia: 'Disponibilidad hoy · respuesta rápida',
  contador: 'personas atendidas esta semana',
}

function whatsappLink(numero: string, mensaje: string, slug: string, opcion?: string): string {
  if (!numero) return '#'
  const num = numero.replace(/\D/g, '')
  const base = mensaje?.trim() || `Hola, vengo desde tu landing (${slug}) y quiero más información.`
  const msg = encodeURIComponent(opcion ? `${base} Me interesa: ${opcion}` : base)
  return `https://wa.me/${num}?text=${msg}`
}

export function CTACierre({
  colorAcento,
  ctaTexto,
  ctaMicrocopy,
  whatsapp,
  mensajeWa,
  slug,
  industria = 'default',
  nombreVendedor,
}: Props) {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null)
  const cfg = INDUSTRIA_CONFIG[industria.toLowerCase()] || DEFAULT_CONFIG
  const contadorNum = Math.floor(Math.random() * 30) + 20

  return (
    <section style={{
      padding: '4rem 1.5rem',
      background: '#0f1c2e',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle at 20% 50%, ${colorAcento}18 0%, transparent 60%), radial-gradient(circle at 80% 50%, ${colorAcento}10 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '560px', margin: '0 auto', position: 'relative' }}>

        {/* Contador social */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: '20px', padding: '5px 14px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 500 }}>
              {contadorNum} {cfg.contador}
            </span>
          </div>
        </div>

        {/* Título */}
        <h2 style={{
          fontSize: 'clamp(22px,3.5vw,30px)', fontWeight: 700,
          color: '#fff', textAlign: 'center', margin: '0 0 .75rem',
          lineHeight: 1.2, letterSpacing: '-0.03em',
        }}>
          {cfg.titulo}
        </h2>
        <p style={{
          fontSize: '15px', color: 'rgba(255,255,255,.5)',
          textAlign: 'center', margin: '0 0 2rem', lineHeight: 1.6,
        }}>
          {cfg.subtitulo}
        </p>

        {/* Selector de interés */}
        <div style={{
          background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem',
        }}>
          <p style={{
            fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,.4)',
            textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 10px',
          }}>
            ¿Qué estás buscando?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {cfg.opciones.map(op => (
              <button
                key={op}
                onClick={() => setOpcionSeleccionada(op === opcionSeleccionada ? null : op)}
                style={{
                  padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 500, textAlign: 'left',
                  transition: 'all .15s',
                  background: opcionSeleccionada === op ? `${colorAcento}20` : 'rgba(255,255,255,.05)',
                  border: opcionSeleccionada === op ? `1.5px solid ${colorAcento}` : '1px solid rgba(255,255,255,.12)',
                  color: opcionSeleccionada === op ? '#fff' : 'rgba(255,255,255,.65)',
                }}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
          <a
            href={whatsappLink(whatsapp, mensajeWa, slug, opcionSeleccionada || undefined)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: '#25D366', color: '#fff', textDecoration: 'none',
              borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 600,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.549 4.118 1.516 5.851L0 24l6.335-1.507A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.648-.51-5.163-1.4l-.37-.22-3.763.895.952-3.668-.242-.38A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            WhatsApp directo
          </a>
          <button
            onClick={() => {
              const btn = document.querySelector('[data-chat-toggle]') as HTMLElement
              const botAbierto = document.querySelector('[data-chat-open]')
              if (btn && !botAbierto) btn.click()
              else if (btn) {
                const chatInput = document.querySelector('input[placeholder="Escribe tu mensaje…"]') as HTMLInputElement
                if (chatInput) chatInput.focus()
              }
            }}
            style={{
              background: 'rgba(255,255,255,.1)', color: '#fff',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: '12px', padding: '14px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            🤖 Chatear con IA
          </button>
        </div>

        {/* Microgarantías */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: '0', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.25rem',
        }}>
          {[
            { label: 'Sin compromisos', icon: '✓' },
            { label: 'Respuesta en 5 min', icon: '⏱' },
            { label: 'Asesoría personalizada', icon: '★' },
          ].map((g, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '0 8px',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,.1)' : 'none',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px', fontSize: '13px', color: '#4ade80',
              }}>
                {g.icon}
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', margin: 0, lineHeight: 1.4 }}>
                {g.label}
              </p>
            </div>
          ))}
        </div>

        {/* Disponibilidad */}
        <div style={{
          marginTop: '1.25rem', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '6px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.35)', margin: 0 }}>
            {cfg.garantia}
          </p>
        </div>
      </div>
    </section>
  )
}
