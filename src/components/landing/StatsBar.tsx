// Ruta destino: src/components/landing/StatsBar.tsx

'use client'

type Stat = { valor: string; label: string }

type Props = {
  stats: Stat[]
}

export function StatsBar({ stats }: Props) {
  if (!stats || stats.length === 0) return null

  return (
    <section style={{
      padding: '20px 24px',
      borderTop: '0.5px solid #eee',
      borderBottom: '0.5px solid #eee',
      background: '#fff',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        gap: '20px',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', minWidth: '80px' }}>
            <div style={{
              fontSize: 'clamp(20px, 2.4vw, 26px)',
              fontWeight: 500,
              color: '#111',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              {s.valor}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 500,
              marginTop: '4px',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
