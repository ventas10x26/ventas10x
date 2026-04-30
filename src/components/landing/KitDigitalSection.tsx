// Ruta destino: src/components/landing/KitDigitalSection.tsx
// Sección con animación timeline que explica el kit digital incluido al registrarse.
// La animación arranca cuando el usuario scrollea a la sección (IntersectionObserver).

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const FEATURES = [
  {
    emoji: '🎨',
    titulo: 'Landing por sector',
    subtitulo: 'Diseño branded para tu industria',
    descripcion: 'Detectamos tu sector y creamos una landing personalizada con tu copy, colores y CTAs optimizados.',
    color: '#FF6B2B',
  },
  {
    emoji: '📦',
    titulo: 'Catálogo automático',
    subtitulo: 'Productos generados con IA',
    descripcion: 'Subes tu producto principal, la IA crea descripciones, imágenes y precios sugeridos.',
    color: '#185FA5',
  },
  {
    emoji: '📊',
    titulo: 'Pipeline de leads',
    subtitulo: 'CRM listo para gestionar',
    descripcion: 'Captura, califica y haz seguimiento a leads desde un solo dashboard. Todo conectado a WhatsApp.',
    color: '#1d9e75',
  },
  {
    emoji: '🤖',
    titulo: 'Bot IA 24/7',
    subtitulo: 'Atiende clientes solo',
    descripcion: 'Tu asistente virtual responde preguntas, recomienda productos y agenda citas mientras tú duermes.',
    color: '#7C3AED',
  },
]

export default function KitDigitalSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [animado, setAnimado] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animado) {
          setAnimado(true)
        }
      },
      { threshold: 0.3 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [animado])

  return (
    <section
      ref={sectionRef}
      id="kit-digital"
      style={{
        background: '#fff',
        padding: '6rem 2rem 7rem',
        color: '#0f1c2e',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 4.5rem' }}>
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255,107,43,.1)',
              border: '1px solid rgba(255,107,43,.25)',
              padding: '6px 16px',
              borderRadius: '100px',
              marginBottom: '1.5rem',
              fontSize: '13px',
              color: '#FF6B2B',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
            className={animado ? 'kit-fade-in' : 'kit-hidden'}
            data-delay="0"
          >
            ✨ TODO INCLUIDO · UN SOLO REGISTRO
          </div>

          <h2
            style={{
              fontSize: 'clamp(32px, 4.5vw, 52px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: '#0f1c2e',
              margin: '0 0 1rem',
            }}
            className={animado ? 'kit-fade-in' : 'kit-hidden'}
            data-delay="100"
          >
            Tu kit digital completo,<br/>
            <span style={{ color: '#FF6B2B' }}>listo en minutos.</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(15px, 1.6vw, 18px)',
              color: '#5a6a7c',
              lineHeight: 1.6,
              margin: 0,
            }}
            className={animado ? 'kit-fade-in' : 'kit-hidden'}
            data-delay="200"
          >
            Landing por sector, catálogo automático, pipeline de leads y bot IA.
            Todo asistido por inteligencia artificial para maximizar tu productividad.
          </p>
        </div>

        <div className="kit-timeline-wrapper">
          <div className={`kit-line ${animado ? 'kit-line-active' : ''}`} />

          <div className="kit-nodes">
            {FEATURES.map((f, i) => (
              <div key={i} className="kit-node-wrapper">

                <div
                  className={`kit-node ${animado ? 'kit-node-active' : ''}`}
                  style={{
                    animationDelay: `${1.0 + i * 0.9}s`,
                    background: animado ? f.color : '#fff',
                    color: '#fff',
                    borderColor: f.color,
                  }}
                >
                  <span className="kit-emoji">{f.emoji}</span>
                </div>

                <div
                  className={`kit-card ${animado ? 'kit-card-active' : ''}`}
                  style={{ animationDelay: `${1.1 + i * 0.9}s` }}
                >
                  <div className="kit-card-title">{f.titulo}</div>
                  <div className="kit-card-subtitle" style={{ color: f.color }}>
                    {f.subtitulo}
                  </div>
                  <div className="kit-card-desc">{f.descripcion}</div>
                </div>

              </div>
            ))}
          </div>
        </div>

        <div
          className={`kit-cta ${animado ? 'kit-cta-active' : ''}`}
          style={{ marginTop: '4rem', textAlign: 'center' }}
        >
          <Link
            href="/auth/register"
            style={{
              display: 'inline-block',
              background: '#FF6B2B',
              color: '#fff',
              padding: '16px 38px',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 12px 30px rgba(255,107,43,0.3)',
            }}
          >
            Activar mi kit digital gratis →
          </Link>
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#888' }}>
            14 días gratis · Sin tarjeta · Cancela cuando quieras
          </div>
        </div>
      </div>

      <style>{`
        .kit-hidden {
          opacity: 0;
          transform: translateY(20px);
        }
        .kit-fade-in {
          opacity: 0;
          transform: translateY(20px);
          animation: kitFadeIn 0.7s ease-out forwards;
        }
        .kit-fade-in[data-delay="0"]   { animation-delay: 0s; }
        .kit-fade-in[data-delay="100"] { animation-delay: 0.15s; }
        .kit-fade-in[data-delay="200"] { animation-delay: 0.3s; }

        @keyframes kitFadeIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .kit-timeline-wrapper {
          position: relative;
          padding: 0;
        }

        .kit-line {
          position: absolute;
          top: 32px;
          left: 6%;
          width: 88%;
          height: 3px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          z-index: 0;
        }
        .kit-line::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #FF6B2B 0%, #FF8C42 100%);
          width: 0%;
          transition: width 0s;
        }
        .kit-line-active::after {
          animation: kitLineGrow 4s ease-in-out 0.5s forwards;
        }
        @keyframes kitLineGrow {
          to { width: 100%; }
        }

        .kit-nodes {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          position: relative;
          z-index: 1;
        }

        .kit-node-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .kit-node {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          opacity: 0.4;
          transform: scale(0.85);
          transition: opacity 0.4s, transform 0.4s;
          position: relative;
        }
        .kit-node-active {
          animation: kitNodePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes kitNodePop {
          0%   { opacity: 0.4; transform: scale(0.85); }
          50%  { opacity: 1;   transform: scale(1.15); box-shadow: 0 0 0 8px rgba(255,107,43,0.15); }
          100% { opacity: 1;   transform: scale(1);    box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        }

        .kit-emoji {
          font-size: 28px;
          line-height: 1;
        }

        .kit-card {
          margin-top: 18px;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.5s, transform 0.5s;
          padding: 0 8px;
        }
        .kit-card-active {
          animation: kitCardIn 0.6s ease-out forwards;
        }
        @keyframes kitCardIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .kit-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f1c2e;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }
        .kit-card-subtitle {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .kit-card-desc {
          font-size: 13px;
          color: #5a6a7c;
          line-height: 1.55;
        }

        .kit-cta {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s, transform 0.6s;
        }
        .kit-cta-active {
          animation: kitCardIn 0.7s ease-out 4.8s forwards;
        }

        @media (max-width: 720px) {
          .kit-line {
            top: 0;
            left: 32px;
            width: 3px;
            height: 100%;
            background: #e5e7eb;
          }
          .kit-line::after {
            background: linear-gradient(180deg, #FF6B2B 0%, #FF8C42 100%);
            width: 100%;
            height: 0%;
            transition: height 0s;
          }
          .kit-line-active::after {
            animation: kitLineGrowVertical 4s ease-in-out 0.5s forwards;
          }
          @keyframes kitLineGrowVertical {
            to { height: 100%; }
          }
          .kit-nodes {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .kit-node-wrapper {
            flex-direction: row;
            text-align: left;
            align-items: flex-start;
            gap: 16px;
          }
          .kit-node {
            flex-shrink: 0;
            width: 64px;
            height: 64px;
          }
          .kit-card {
            margin-top: 12px;
            flex: 1;
            padding: 0;
          }
        }
      `}</style>
    </section>
  )
}
