// Ruta destino: src/app/fenix-consultores/page.tsx
import type { Metadata } from 'next'
import { FenixNav } from '@/components/fenix/FenixNav'

export const metadata: Metadata = {
  title: 'Fenix Consultores Empresariales S.A.S. | Bufete de abogados especializados',
  description: 'Empresa dedicada a la defensa legal, con especialistas en consultoría empresarial, recaudo y saneamiento de cartera. Más de 12 años de experiencia.',
}

const DARK = '#05070c'
const ACCENT = '#F5821F'

const SERVICIOS = [
  {
    icono: '⚖️',
    titulo: 'Derecho Preventivo',
    desc: 'Consultoría jurídica, contable y administrativa para que su empresa racionalice recursos y agilice diligencias antes de que se conviertan en litigios.',
  },
  {
    icono: '💼',
    titulo: 'Recaudo y Saneamiento de Cartera',
    desc: 'Gestión del cobro de cartera del sector Real y de entidades del sector Salud, con procesos jurídicos ordenados y eficientes.',
  },
  {
    icono: '🏢',
    titulo: 'Consultoría Empresarial',
    desc: 'Acompañamiento permanente a empresas y particulares con herramientas técnicas, jurídicas y tecnológicas para una defensa legal integral.',
  },
]

const STATS = [
  { num: '200+', label: 'Clientes satisfechos' },
  { num: '12+', label: 'Años de experiencia' },
  { num: '330+', label: 'Casos de éxito' },
]

const VALORES = ['Integridad', 'Excelencia', 'Calidad', 'Liderazgo', 'Confidencialidad', 'Responsabilidad']

const PILARES = [
  {
    titulo: 'Gestión Judicial',
    desc: 'Ecosistema para la gestión judicial eficiente y digitalizada de los procesos de cartera.',
  },
  {
    titulo: 'Outsourcing de Cobranza',
    desc: 'Soluciones inteligentes para la recuperación de cartera, con seguimiento oportuno y resultados medibles.',
  },
]

const RESUMEN = [
  {
    titulo: 'Misión',
    desc: 'Lograr que nuestros clientes sientan el acompañamiento de un grupo de profesionales del derecho 24 horas al día, con soluciones convenientes y oportunas a sus requerimientos jurídicos, contables y administrativos, utilizando nuestras herramientas legales, operativas, tecnológicas y de talento humano calificado, para contribuir al desarrollo comercial y crecimiento económico.',
  },
  {
    titulo: 'Visión',
    desc: 'Ser el outsourcing jurídico, contable, administrativo y de cobranzas más reconocido en el sur occidente colombiano, brindando soluciones rápidas y efectivas a las empresas afiliadas.',
  },
  {
    titulo: 'Recurso Humano',
    desc: 'Nuestro equipo de trabajo está compuesto por profesionales y especialistas en Administración de Empresas, Contaduría, Finanzas y Derecho, que gracias a su alto grado de desempeño intelectual permiten que nuestra organización le garantice a nuestros clientes productos y servicios sólidos y confiables.',
  },
]

export default function FenixConsultoresPage() {
  return (
    <div style={{
      fontFamily: "var(--font-jakarta,'Plus Jakarta Sans',system-ui,sans-serif)",
      background: DARK,
      minHeight: '100vh',
      color: '#fff',
    }}>
      <FenixNav />

      {/* ── HERO ── */}
      <section id="inicio" style={{ padding: '6rem 1.5rem 5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Glow circular estilo Liquitty */}
        <div style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: '620px', height: '620px', borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 68%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
          width: '360px', height: '360px', borderRadius: '50%',
          border: `1px solid ${ACCENT}45`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `${ACCENT}18`, border: `1px solid ${ACCENT}45`,
            borderRadius: '20px', padding: '6px 16px', marginBottom: '2rem',
            fontSize: '13px', color: '#FFA45C', fontWeight: 600,
          }}>
            🔥 Bufete de abogados especializados
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 800,
            lineHeight: 1.08, letterSpacing: '-.04em', marginBottom: '1.5rem',
          }}>
            Fenix Consultores Empresariales S.A.S.<br />
            <span style={{ color: ACCENT }}>defensa legal y recaudo de cartera.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 1.6vw, 19px)', color: 'rgba(255,255,255,.6)',
            lineHeight: 1.8, maxWidth: '620px', margin: '0 auto 2.5rem',
          }}>
            Empresa dedicada a la defensa legal, con especialistas en consultoría
            empresarial, recaudo y saneamiento de cartera.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <a href="#contacto" style={{
              background: ACCENT, color: '#fff', padding: '16px 34px',
              borderRadius: '14px', fontSize: '15px', fontWeight: 700,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: `0 8px 28px ${ACCENT}45`,
            }}>
              Conocer Más →
            </a>
            <a href="tel:+573215036414" style={{
              background: 'rgba(255,255,255,.06)', color: '#fff',
              padding: '16px 28px', borderRadius: '14px', fontSize: '15px',
              fontWeight: 600, textDecoration: 'none', display: 'inline-block',
              border: '1px solid rgba(255,255,255,.14)',
            }}>
              📞 Llamar ahora
            </a>
          </div>

          {/* Tarjeta de líneas — equivalente al panel naranja del hero original */}
          <div style={{
            display: 'inline-flex', flexDirection: 'column', gap: '4px',
            background: `linear-gradient(135deg, ${ACCENT}, #c9600f)`,
            borderRadius: '18px', padding: '18px 32px',
            boxShadow: `0 12px 40px ${ACCENT}35`,
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.85 }}>
              Nuestras líneas
            </span>
            <span style={{ fontSize: '20px', fontWeight: 800 }}>+57 321 5036414</span>
            <span style={{ fontSize: '15px', fontWeight: 600, opacity: 0.9 }}>310 4159173</span>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP (equivalente a la barra de logos) ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '2.25rem 1.5rem' }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem',
        }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, color: ACCENT, lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', marginTop: '6px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section id="servicios" style={{ padding: '5.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Servicios de Derecho
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 44px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.15, margin: 0, maxWidth: '640px' }}>
              Soluciones jurídicas que respaldan la salud financiera de su empresa
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {SERVICIOS.map(s => (
              <div key={s.titulo} style={{
                background: 'rgba(255,255,255,.03)',
                border: `1px solid ${ACCENT}35`,
                borderRadius: '18px', padding: '32px 26px',
              }}>
                <div style={{ fontSize: '30px', marginBottom: '18px' }}>{s.icono}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>{s.titulo}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,.55)', lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ── */}
      <section id="empresa" style={{ padding: '5.5rem 1.5rem', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(280px, 1.2fr) minmax(240px, 1fr)', gap: '3rem', alignItems: 'center' }} className="fenix-grid-2">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Nosotros
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 42px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
              Más de una década <span style={{ color: ACCENT }}>defendiendo sus intereses</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', lineHeight: 1.85, marginBottom: '1rem' }}>
              Fénix Consultores Empresariales S.A.S., fue creada en febrero de 2010, y nace del
              deseo de fundar una empresa dedicada a la defensa legal de los intereses de las
              empresas y de particulares, utilizando las herramientas técnicas, jurídicas y
              tecnológicas que permiten realizar esta labor de una manera eficiente y ordenada.
            </p>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', lineHeight: 1.85 }}>
              Fénix Consultores está compuesta por un grupo de profesionales dispuestos a
              satisfacer las necesidades jurídicas de nuestros clientes, especializándonos en
              Derecho Preventivo y en el cobro de cartera del sector Real y de entidades del
              sector Salud.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {STATS.map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: '16px', padding: '22px 18px',
              }}>
                <div style={{ fontSize: '30px', fontWeight: 800, color: ACCENT, lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginTop: '6px' }}>{s.label}</div>
              </div>
            ))}
            <div style={{
              gridColumn: '1 / -1',
              background: `linear-gradient(135deg, ${ACCENT}18, transparent)`,
              border: `1px solid ${ACCENT}35`,
              borderRadius: '16px', padding: '20px 18px',
            }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }}>
                Tecnología avanzada y estrategias personalizadas para cada cliente.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALORES CORPORATIVOS (sección oscura, estilo Rocketvel) ── */}
      <section style={{ padding: '5.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Valores corporativos
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 42px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.15, marginBottom: '2.5rem', maxWidth: '560px' }}>
            Los principios que guían cada proceso jurídico
          </h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '3rem' }}>
            {VALORES.map(v => (
              <div key={v} style={{
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: '999px', padding: '10px 20px',
                fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,.85)',
              }}>
                {v}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {PILARES.map(p => (
              <div key={p.titulo} style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: '18px', padding: '28px',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{p.titulo}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,.55)', lineHeight: 1.7 }}>{p.desc}</div>
              </div>
            ))}
            <a href="#contacto" style={{
              background: ACCENT, borderRadius: '18px', padding: '28px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
              gap: '10px', textDecoration: 'none', color: '#fff',
            }}>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>Conoce más →</div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>Hable con un especialista de Fenix Consultores.</div>
            </a>
          </div>
        </div>
      </section>

      {/* ── PROPUESTA DE VALOR (recuadro estilo Liquitty) ── */}
      <section id="cartera" style={{ padding: '0 1.5rem 5.5rem' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          border: `1px solid ${ACCENT}35`, borderRadius: '24px', padding: '3rem',
          background: `radial-gradient(circle at 20% 20%, ${ACCENT}10 0%, transparent 60%)`,
          display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(260px, 1.3fr)', gap: '2.5rem', alignItems: 'center',
        }} className="fenix-grid-2">
          <div style={{
            aspectRatio: '4 / 3', borderRadius: '18px',
            background: `linear-gradient(135deg, ${ACCENT}25, rgba(255,255,255,.03))`,
            border: '1px solid rgba(255,255,255,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px',
          }}>
            ⚖️
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Gestión de Cartera
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.2, marginBottom: '1rem' }}>
              Propuesta de valor única
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', lineHeight: 1.8, marginBottom: '1rem' }}>
              En Fenix Consultores, transformamos la recuperación de cartera del sector Real y
              de entidades del sector Salud a través de un equipo jurídico especializado y un
              enfoque centrado en el cliente.
            </p>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', lineHeight: 1.8, marginBottom: '1.75rem' }}>
              Nuestra experiencia de más de 12 años en el sector nos permite ofrecer soluciones
              efectivas y personalizadas para cada empresa afiliada.
            </p>
            <a href="#contacto" style={{
              background: ACCENT, color: '#fff', padding: '14px 30px',
              borderRadius: '12px', fontSize: '14px', fontWeight: 700,
              textDecoration: 'none', display: 'inline-block',
              boxShadow: `0 8px 24px ${ACCENT}40`,
            }}>
              Conocer Más →
            </a>
          </div>
        </div>
      </section>

      {/* ── MISIÓN / VISIÓN / RECURSO HUMANO ── */}
      <section style={{ padding: '0 1.5rem 5.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Nuestro compromiso
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 38px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.2, margin: 0 }}>
              Los números que nos respaldan
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {RESUMEN.map(r => (
              <div key={r.titulo} style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: '18px', padding: '28px',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: ACCENT, marginBottom: '12px' }}>{r.titulo}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,.55)', lineHeight: 1.75 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / CONTACTO ── */}
      <section id="contacto" style={{ padding: '1rem 1.5rem 5.5rem' }}>
        <div style={{
          maxWidth: '700px', margin: '0 auto', textAlign: 'center',
          border: `1px solid ${ACCENT}35`, borderRadius: '24px', padding: '3.5rem 2rem',
          background: `radial-gradient(circle at 50% 0%, ${ACCENT}18 0%, transparent 65%)`,
        }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            ¿Necesita asesoría<br />
            <span style={{ color: ACCENT }}>jurídica especializada?</span>
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.55)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Hable con nuestro equipo. Atención 24 horas para nuestros clientes afiliados.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+573215036414" style={{
              background: ACCENT, color: '#fff', padding: '16px 34px',
              borderRadius: '14px', fontSize: '15px', fontWeight: 700,
              textDecoration: 'none', display: 'inline-block',
              boxShadow: `0 8px 32px ${ACCENT}45`,
            }}>
              +57 321 5036414
            </a>
            <a href="tel:3104159173" style={{
              background: 'rgba(255,255,255,.07)', color: '#fff',
              padding: '16px 32px', borderRadius: '14px', fontSize: '15px',
              fontWeight: 600, textDecoration: 'none', display: 'inline-block',
              border: '1px solid rgba(255,255,255,.12)',
            }}>
              310 4159173
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
          Fenix <span style={{ color: ACCENT }}>Consultores Empresariales S.A.S.</span>
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.35)', marginBottom: '4px' }}>
          © 2026 Fenix Consultores Empresariales S.A.S. Todos los derechos reservados.
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.3)' }}>
          Síguenos en Facebook
        </div>
      </footer>

      <style>{`
        @media (max-width: 760px) {
          .fenix-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
