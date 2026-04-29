// Ruta destino: src/components/landing/ComoFuncionaSection.tsx

'use client'

type Paso = { titulo: string; descripcion: string }

type Props = {
  pasos: Paso[]
  colorAcento: string
}

export function ComoFuncionaSection({ pasos, colorAcento }: Props) {
  if (!pasos || pasos.length === 0) return null

  return (
    <section style={{
      padding: '40px 24px',
      background: '#fff',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: 'clamp(22px, 2.6vw, 28px)',
          fontWeight: 500,
          color: '#111',
          margin: '0 0 24px',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          Cómo funciona
        </h2>

        <div className="pasos-grid">
          {pasos.map((p, i) => (
            <div key={i}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: `${colorAcento}15`,
                color: colorAcento,
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}>
                {i + 1}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 500,
                color: '#111',
                marginBottom: '6px',
                letterSpacing: '-0.01em',
              }}>
                {p.titulo}
              </div>
              <div style={{
                fontSize: '13px',
                color: '#666',
                lineHeight: 1.6,
              }}>
                {p.descripcion}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pasos-grid {
          display: grid;
          grid-template-columns: repeat(${pasos.length}, 1fr);
          gap: 24px;
        }
        @media (max-width: 720px) {
          .pasos-grid { grid-template-columns: 1fr; gap: 20px; }
        }
      `}</style>
    </section>
  )
}
