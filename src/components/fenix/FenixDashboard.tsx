// Ruta destino: src/components/fenix/FenixDashboard.tsx
// Visual de producto para el hero. Reemplaza la fotografía de banco por una
// representación del producto: es lo que hacen Stripe, Linear o Ramp, y para
// una empresa que se posiciona como plataforma tecnológica comunica mucho
// mejor "recuperamos dinero con tecnología" que una foto corporativa genérica.
//
// Todo el contenido está marcado como vista ilustrativa: representa la
// estructura real de la plataforma, no cifras de un cliente.

const ACCENT = '#F5821F'
const INK = '#14100C'

const KPIS = [
  { label: 'Tasa de recuperación', valor: '68%', delta: '+12 pts' },
  { label: 'Días promedio de cierre', valor: '41', delta: '−9 días' },
  { label: 'Obligaciones activas', valor: '1.284', delta: '+86' },
]

const AGING = [
  { rango: '0–30', alto: 30 },
  { rango: '31–60', alto: 46 },
  { rango: '61–90', alto: 40 },
  { rango: '91–180', alto: 68 },
  { rango: '+180', alto: 92 },
]

const EVENTOS = [
  { texto: 'Acuerdo de pago registrado', etapa: 'Prejurídico', hora: '09:41' },
  { texto: 'Notificación de cobro enviada', etapa: 'Automatizado', hora: '09:28' },
  { texto: 'Proceso ejecutivo radicado', etapa: 'Jurídico', hora: 'Ayer' },
]

export function FenixDashboard() {
  return (
    <div className="fx-dash">
      {/* Panel principal */}
      <div className="fx-dash-main">
        <div className="fx-dash-top">
          <div>
            <div className="fx-dash-eyebrow">Recovery Intelligence®</div>
            <div className="fx-dash-title">Panel de recuperación</div>
          </div>
          <span className="fx-dash-chip">Vista ilustrativa</span>
        </div>

        {/* KPIs */}
        <div className="fx-dash-kpis">
          {KPIS.map(k => (
            <div key={k.label} className="fx-kpi">
              <div className="fx-kpi-label">{k.label}</div>
              <div className="fx-kpi-row">
                <span className="fx-kpi-valor">{k.valor}</span>
                <span className="fx-kpi-delta">{k.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Curva de recuperación */}
        <div className="fx-dash-chart">
          <div className="fx-dash-chart-head">
            <span className="fx-dash-sub">Recuperación acumulada</span>
            <span className="fx-dash-legend"><i /> Últimos 6 meses</span>
          </div>
          <svg viewBox="0 0 320 108" preserveAspectRatio="none" className="fx-chart-svg" aria-hidden="true">
            <defs>
              <linearGradient id="fxArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity="0.28" />
                <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[27, 54, 81].map(y => (
              <line key={y} x1="0" y1={y} x2="320" y2={y} stroke={INK} strokeOpacity="0.06" strokeWidth="1" />
            ))}
            <path
              d="M0,92 C34,86 52,72 78,70 C104,68 118,54 144,48 C170,42 186,34 212,26 C238,18 262,14 288,9 L320,5 L320,108 L0,108 Z"
              fill="url(#fxArea)"
            />
            <path
              d="M0,92 C34,86 52,72 78,70 C104,68 118,54 144,48 C170,42 186,34 212,26 C238,18 262,14 288,9 L320,5"
              fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Edad de cartera */}
        <div className="fx-dash-aging">
          <span className="fx-dash-sub">Edad de cartera</span>
          <div className="fx-aging-bars">
            {AGING.map((a, i) => (
              <div key={a.rango} className="fx-aging-col">
                <div
                  className="fx-aging-bar"
                  style={{
                    height: `${a.alto}%`,
                    background: i === AGING.length - 1 ? ACCENT : `${ACCENT}26`,
                  }}
                />
                <span className="fx-aging-label">{a.rango}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjeta flotante: bitácora de gestiones */}
      <div className="fx-dash-float">
        <div className="fx-float-head">
          <span className="fx-live" />
          Gestiones en curso
        </div>
        {EVENTOS.map(e => (
          <div key={e.texto} className="fx-float-row">
            <div>
              <div className="fx-float-texto">{e.texto}</div>
              <div className="fx-float-etapa">{e.etapa}</div>
            </div>
            <span className="fx-float-hora">{e.hora}</span>
          </div>
        ))}
      </div>

      <style>{`
        .fx-dash { position: relative; width: 100%; }

        .fx-dash-main {
          background: #fff;
          border: 1px solid rgba(20,16,12,.07);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 1px 2px rgba(20,16,12,.04), 0 24px 60px rgba(20,16,12,.10);
        }
        .fx-dash-top {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; margin-bottom: 26px;
        }
        .fx-dash-eyebrow {
          font-size: 10.5px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: #B85C07; margin-bottom: 6px;
        }
        .fx-dash-title { font-size: 17px; font-weight: 700; color: ${INK}; letter-spacing: -.01em; }
        .fx-dash-chip {
          flex-shrink: 0;
          font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
          color: rgba(20,16,12,.42); background: #F4F1ED;
          border-radius: 999px; padding: 6px 11px;
        }

        .fx-dash-kpis {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-bottom: 26px;
        }
        .fx-kpi {
          background: #FAF8F5; border: 1px solid rgba(20,16,12,.05);
          border-radius: 14px; padding: 14px;
        }
        .fx-kpi-label {
          font-size: 10.5px; color: rgba(20,16,12,.5); line-height: 1.35;
          margin-bottom: 8px; min-height: 28px;
        }
        .fx-kpi-row { display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap; }
        .fx-kpi-valor { font-size: 22px; font-weight: 700; color: ${INK}; letter-spacing: -.02em; line-height: 1; }
        .fx-kpi-delta { font-size: 10.5px; font-weight: 700; color: #1A7F45; }

        .fx-dash-sub {
          font-size: 11px; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; color: rgba(20,16,12,.45);
        }
        .fx-dash-chart { margin-bottom: 24px; }
        .fx-dash-chart-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .fx-dash-legend {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; color: rgba(20,16,12,.42);
        }
        .fx-dash-legend i {
          width: 14px; height: 3px; border-radius: 2px; background: ${ACCENT};
        }
        .fx-chart-svg { width: 100%; height: 108px; display: block; }

        .fx-aging-bars {
          display: flex; align-items: flex-end; gap: 8px;
          height: 84px; margin-top: 12px;
        }
        .fx-aging-col {
          flex: 1; height: 100%;
          display: flex; flex-direction: column; justify-content: flex-end; gap: 7px;
        }
        .fx-aging-bar { border-radius: 6px 6px 3px 3px; }
        .fx-aging-label {
          font-size: 9.5px; font-weight: 600; color: rgba(20,16,12,.4); text-align: center;
        }

        /* Tarjeta flotante */
        .fx-dash-float {
          position: absolute; left: -34px; bottom: -38px;
          width: 268px;
          background: ${INK};
          border-radius: 18px; padding: 16px 18px;
          box-shadow: 0 24px 55px rgba(20,16,12,.32);
        }
        .fx-float-head {
          display: flex; align-items: center; gap: 8px;
          font-size: 10.5px; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; color: rgba(255,255,255,.62);
          margin-bottom: 14px;
        }
        .fx-live {
          width: 6px; height: 6px; border-radius: 50%; background: #3ECF7E;
          box-shadow: 0 0 0 0 rgba(62,207,126,.6);
          animation: fx-live-pulse 2.4s ease infinite;
        }
        @keyframes fx-live-pulse {
          0% { box-shadow: 0 0 0 0 rgba(62,207,126,.5); }
          70% { box-shadow: 0 0 0 6px rgba(62,207,126,0); }
          100% { box-shadow: 0 0 0 0 rgba(62,207,126,0); }
        }
        .fx-float-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 10px; padding: 9px 0;
          border-top: 1px solid rgba(255,255,255,.08);
        }
        .fx-float-row:first-of-type { border-top: none; padding-top: 0; }
        .fx-float-texto { font-size: 12.5px; color: rgba(255,255,255,.92); line-height: 1.35; }
        .fx-float-etapa { font-size: 10.5px; color: ${ACCENT}; margin-top: 3px; font-weight: 600; }
        .fx-float-hora { font-size: 10.5px; color: rgba(255,255,255,.38); flex-shrink: 0; }

        @media (max-width: 1080px) {
          .fx-dash-float { position: static; width: 100%; margin-top: 16px; }
        }
        @media (max-width: 560px) {
          .fx-dash-main { padding: 20px; }
          .fx-dash-kpis { grid-template-columns: 1fr; }
          .fx-kpi-label { min-height: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fx-live { animation: none; }
        }
      `}</style>
    </div>
  )
}
