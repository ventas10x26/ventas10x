// Ruta destino: src/app/fenix-consultores/privacidad/page.tsx
// El middleware de app.consultoresfenix.com reescribe cualquier ruta que no
// empiece por /fenix-consultores, /admin, /auth, /api u /og hacia
// /fenix-consultores${pathname}. Por eso este archivo vive aquí adentro pero
// se ve públicamente en app.consultoresfenix.com/privacidad (sin el prefijo).
import type { Metadata } from 'next'
import Link from 'next/link'
import { Space_Grotesk } from 'next/font/google'
import { FenixLogo } from '@/components/fenix/FenixLogo'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://app.consultoresfenix.com'),
  title: 'Política de Privacidad · Fénix Consultores',
  description: 'Política de privacidad y tratamiento de datos personales de Fénix Consultores Empresariales S.A.S., incluyendo el uso de WhatsApp Business Platform e inteligencia artificial en la gestión de cartera.',
  alternates: { canonical: '/privacidad' },
  robots: { index: true, follow: true },
}

type Seccion = { titulo: string; parrafos?: string[]; items?: string[] }

// El contenido distingue dos titulares porque la operación real de Fénix los
// trata distinto: el lead que llena el formulario autoriza directamente, el
// deudor de una obligación nos llega por encargo de un cliente empresarial
// (Fénix es Encargado, no Responsable, frente a esos datos).
const SECCIONES: Seccion[] = [
  {
    titulo: 'Quiénes somos',
    parrafos: [
      'Fénix Consultores Empresariales S.A.S. ("Fénix", "nosotros") es una firma colombiana especializada en recuperación estratégica de cartera empresarial, con más de 12 años de experiencia combinando gestión jurídica y tecnología. Esta política explica cómo recopilamos, usamos, protegemos y compartimos los datos personales que tratamos a través de nuestro sitio web, nuestra plataforma de gestión de cartera y nuestros canales de contacto, incluido WhatsApp.',
    ],
  },
  {
    titulo: 'A quién aplica esta política',
    parrafos: ['Esta política aplica a dos grupos de titulares de datos personales:'],
    items: [
      'Visitantes y contactos comerciales: personas que diligencian el formulario de diagnóstico gratuito en nuestro sitio web o que se comunican con nosotros para conocer nuestros servicios.',
      'Titulares de obligaciones (deudores): personas naturales cuyos datos nos son entregados por nuestros clientes empresariales para la gestión de cobro de una obligación. Frente a estos titulares, Fénix actúa como Encargado del Tratamiento por cuenta de la empresa cliente, que conserva la calidad de Responsable del Tratamiento original de esa información.',
    ],
  },
  {
    titulo: 'Datos personales que recopilamos',
    parrafos: [
      'De visitantes y contactos comerciales: nombre, empresa, cargo, teléfono, correo electrónico y el contenido del mensaje que nos envíe.',
      'De titulares de obligaciones gestionadas por encargo: nombre completo, tipo y número de documento de identidad, datos de contacto, y datos de la obligación a gestionar (monto, estado, historial de pagos y compromisos). No solicitamos ni tratamos datos sensibles (salud, biometría, origen étnico, orientación sexual, afiliación política o religiosa, entre otros) para la prestación de este servicio.',
      'Datos técnicos de navegación: dirección IP, tipo de dispositivo, páginas visitadas y cookies de analítica, recopilados mientras navega en app.consultoresfenix.com.',
    ],
  },
  {
    titulo: 'Cómo recopilamos sus datos',
    parrafos: [
      'Recopilamos información: (a) directamente de usted, cuando diligencia el formulario de contacto o nos escribe por WhatsApp o correo; (b) de nuestros clientes empresariales, quienes nos entregan la información de su cartera para que la gestionemos en su nombre; y (c) de forma automática, a través de cookies y herramientas de analítica en nuestro sitio web.',
    ],
  },
  {
    titulo: 'Mensajería por WhatsApp Business Platform e Inteligencia Artificial',
    parrafos: [
      'Nos comunicamos con usted a través de la Plataforma de Mensajería Empresarial de WhatsApp (WhatsApp Business Platform), operada por Meta. El envío y la entrega técnica de estos mensajes están sujetos también a la política de privacidad de WhatsApp/Meta. Para agilizar la atención, algunas conversaciones son asistidas por sistemas de inteligencia artificial, que ayudan a priorizar, redactar o dirigir respuestas bajo la supervisión de nuestro equipo; esta información no se usa para entrenar modelos de terceros ajenos a la prestación de nuestro servicio.',
      'Si en cualquier momento prefiere que no le escribamos más por este canal, puede indicarlo y dejaremos de contactarlo.',
    ],
  },
  {
    titulo: 'Finalidades del tratamiento',
    items: [
      'Evaluar y responder solicitudes de diagnóstico y contacto comercial.',
      'Gestionar el cobro prejurídico o judicial de obligaciones, por encargo de nuestros clientes.',
      'Comunicarnos con usted por teléfono, correo o WhatsApp.',
      'Generar reportes ejecutivos y de trazabilidad para nuestros clientes sobre el estado de la gestión.',
      'Mejorar nuestros servicios y nuestra plataforma tecnológica.',
      'Cumplir con obligaciones legales y regulatorias aplicables en Colombia.',
    ],
  },
  {
    titulo: 'Base legal y autorización',
    parrafos: [
      'Tratamos sus datos con fundamento en: su autorización previa, expresa e informada; la ejecución del contrato de prestación de servicios de recuperación de cartera suscrito con nuestro cliente empresarial (cuando actuamos como Encargados del Tratamiento); y el cumplimiento de obligaciones legales, en los términos de la Ley 1581 de 2012, el Decreto 1377 de 2013 y el Decreto 1074 de 2015.',
    ],
  },
  {
    titulo: 'Con quién compartimos su información',
    parrafos: [
      'No vendemos ni arrendamos sus datos personales. Podemos compartirla, bajo acuerdos de confidencialidad, con: nuestro cliente empresarial que nos encargó la gestión de la obligación; proveedores tecnológicos que nos ayudan a operar la plataforma (almacenamiento de base de datos, hosting, mensajería vía Meta/WhatsApp Business Platform, y proveedores de inteligencia artificial que asisten la atención); y autoridades competentes cuando exista un requerimiento legal.',
    ],
  },
  {
    titulo: 'Transferencia y transmisión internacional de datos',
    parrafos: [
      'Algunos de nuestros proveedores tecnológicos procesan información en servidores ubicados fuera de Colombia. Estas transferencias y transmisiones internacionales se realizan conforme al régimen previsto en el Decreto 1377 de 2013, exigiendo a dichos proveedores niveles adecuados de protección de datos.',
    ],
  },
  {
    titulo: 'Sus derechos como titular',
    parrafos: [
      'De acuerdo con la Ley 1581 de 2012, usted tiene derecho a conocer, actualizar y rectificar sus datos personales; solicitar prueba de la autorización otorgada; ser informado sobre el uso dado a sus datos; presentar quejas ante la Superintendencia de Industria y Comercio (SIC); revocar la autorización y/o solicitar la supresión de sus datos, cuando no exista un deber legal o contractual que nos obligue a conservarlos; y acceder de forma gratuita a sus datos personales.',
    ],
  },
  {
    titulo: 'Cómo ejercer sus derechos',
    parrafos: [
      'Puede ejercer sus derechos escribiéndonos a gerencia@consultoresfenix.com, indicando su nombre completo, número de documento y una descripción clara de su solicitud. Atenderemos consultas dentro de los 10 días hábiles siguientes y reclamos dentro de los 15 días hábiles siguientes a su radicación, conforme a los términos de la ley.',
    ],
  },
  {
    titulo: 'Seguridad de la información',
    parrafos: [
      'Implementamos medidas técnicas y organizativas razonables para proteger sus datos personales, incluyendo cifrado en tránsito, autenticación segura y controles de acceso por roles dentro de nuestra plataforma. Ningún sistema es completamente infalible, por lo que le recomendamos no compartir información sensible por canales no oficiales.',
    ],
  },
  {
    titulo: 'Conservación de los datos',
    parrafos: [
      'Conservamos los datos de contacto comercial mientras exista una relación o interés vigente, y los datos de obligaciones gestionadas durante el tiempo que dure el encargo con nuestro cliente y los plazos adicionales exigidos por la normativa contable, fiscal y de archivo aplicable en Colombia.',
    ],
  },
  {
    titulo: 'Cookies y tecnologías de rastreo',
    parrafos: [
      'Nuestro sitio web utiliza cookies esenciales para su funcionamiento y cookies de analítica para entender cómo se usa el sitio. No utilizamos cookies de publicidad de terceros. Usted puede configurar su navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades.',
    ],
  },
  {
    titulo: 'Menores de edad',
    parrafos: ['Nuestros servicios están dirigidos a empresas y personas mayores de edad. No recopilamos intencionalmente datos de menores de edad.'],
  },
  {
    titulo: 'Cambios a esta política',
    parrafos: ['Podemos actualizar esta política para reflejar cambios en nuestras prácticas o en la normativa aplicable. La versión vigente estará siempre disponible en esta página, indicando la fecha de la última actualización.'],
  },
]

function IconoTel() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function IconoMail() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2.5" /><path d="m3 6.5 9 6 9-6" />
    </svg>
  )
}

export default function FenixPrivacidadPage() {
  return (
    <div className={`pz ${spaceGrotesk.variable}`}>
      {/* ═══ NAV ═══ */}
      <nav className="pz-nav">
        <div className="pz-nav-inner">
          <Link href="/fenix-consultores" className="pz-brand" aria-label="Fénix Consultores Empresariales S.A.S.">
            <FenixLogo uid="pz-nav" size={40} theme="light" />
          </Link>
          <div className="pz-nav-actions">
            <Link href="/fenix-consultores" className="pz-nav-back">← Volver al inicio</Link>
            <a href="tel:+573215036414" className="pz-nav-tel">Llamar</a>
          </div>
        </div>
      </nav>

      {/* ═══ HEADER ═══ */}
      <header className="pz-header">
        <div className="pz-container">
          <span className="pz-label">Legal</span>
          <h1>Política de Privacidad y Tratamiento de Datos Personales</h1>
          <p className="pz-updated">Última actualización: agosto de 2026 · Fénix Consultores Empresariales S.A.S. · app.consultoresfenix.com</p>
          <p className="pz-lead">
            En Fénix protegemos la información de las empresas que confían en nosotros y de las
            personas cuyas obligaciones gestionamos por su encargo. Esta política explica qué datos
            recopilamos, para qué los usamos, con quién los compartimos —incluyendo la Plataforma de
            Mensajería de WhatsApp (Meta) y la inteligencia artificial que asiste nuestra atención—
            y cómo puede ejercer sus derechos conforme a la ley colombiana.
          </p>
          <div className="pz-scope">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
            <p>
              <b>Esta política aplica a dos grupos de titulares:</b> visitantes y contactos
              comerciales que nos escriben para conocer nuestros servicios, y personas cuyas
              obligaciones (cartera) gestionamos por encargo de nuestros clientes empresariales,
              ya sea por vía prejurídica o judicial.
            </p>
          </div>
        </div>
      </header>

      {/* ═══ CONTENIDO ═══ */}
      <main className="pz-content">
        <div className="pz-container">
          {SECCIONES.map((s, i) => (
            <article key={s.titulo} className="pz-sec">
              <span className="pz-n">{String(i + 1).padStart(2, '0')}</span>
              <h2>{s.titulo}</h2>
              {s.parrafos?.map((p, j) => <p key={j}>{p}</p>)}
              {s.items && (
                <ul>
                  {s.items.map(it => <li key={it}>{it}</li>)}
                </ul>
              )}
            </article>
          ))}

          {/* Contacto y autoridad de control */}
          <div className="pz-contact">
            <div>
              <h3>¿Preguntas sobre esta política?</h3>
              <p>Escríbanos y le responderemos, o acuda ante la Superintendencia de Industria y Comercio (SIC) si sus derechos no han sido atendidos.</p>
            </div>
            <div className="pz-contact-links">
              <a href="mailto:gerencia@consultoresfenix.com"><IconoMail /> gerencia@consultoresfenix.com</a>
              <a href="tel:+573215036414"><IconoTel /> +57 321 5036414</a>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="pz-footer">
        <div className="pz-container pz-footer-inner">
          <Link href="/fenix-consultores" className="pz-brand">
            <FenixLogo uid="pz-foot" size={44} theme="dark" />
          </Link>
          <p className="pz-footer-desc">
            FÉNIX Recovery Intelligence®. Recuperación estratégica de activos empresariales con
            tecnología y respaldo jurídico especializado desde 2010.
          </p>
          <div className="pz-footer-links">
            <Link href="/fenix-consultores">Inicio</Link>
            <a href="tel:+573215036414">+57 321 5036414</a>
            <a href="mailto:gerencia@consultoresfenix.com">gerencia@consultoresfenix.com</a>
          </div>
          <div className="pz-footer-legal">© 2026 Fenix Consultores Empresariales S.A.S. Todos los derechos reservados.</div>
        </div>
      </footer>

      <style>{`
        .pz {
          --accent: #F5821F;
          --accent-text: #B0570A;
          --ink: #14100C;
          --ink-2: rgba(20,16,12,.66);
          --ink-3: rgba(20,16,12,.46);
          --line: rgba(20,16,12,.09);
          --white: #FFFFFF;
          --cream: #FBF9F6;
          --graphite: #14100C;
          --velo-azul: linear-gradient(135deg, rgba(0,38,130,.4) 0%, rgba(20,16,12,0) 55%);
          background: var(--white);
          color: var(--ink);
          font-family: var(--font-jakarta, 'Plus Jakarta Sans'), system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .pz h1, .pz h2, .pz h3 { font-family: var(--font-space-grotesk), system-ui, sans-serif; margin: 0; }
        .pz p { margin: 0; }
        .pz a { text-decoration: none; }
        .pz-container { max-width: 820px; margin: 0 auto; padding: 0 24px; }

        .pz-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(251,249,246,.92); backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--line);
          padding: 14px 24px;
        }
        .pz-nav-inner { max-width: 1080px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .pz-brand { display: inline-flex; align-items: center; }
        .pz-nav-actions { display: flex; align-items: center; gap: 22px; }
        .pz-nav-back { font-size: 14px; font-weight: 600; color: var(--ink-2); }
        .pz-nav-back:hover { color: var(--accent-text); }
        .pz-nav-tel {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent); color: #fff; border-radius: 999px;
          padding: 10px 18px; font-size: 13.5px; font-weight: 700;
          box-shadow: 0 6px 18px rgba(245,130,31,.3);
          transition: background-color .2s ease;
        }
        .pz-nav-tel:hover { background: #E0740F; }

        .pz-header { padding: 68px 0 48px; background: linear-gradient(180deg, #FFFFFF 0%, var(--cream) 100%); }
        .pz-label {
          display: inline-block; font-size: 12px; font-weight: 700;
          letter-spacing: .13em; text-transform: uppercase; color: var(--accent-text);
          margin-bottom: 16px;
        }
        .pz-header h1 { font-size: clamp(30px, 4vw, 44px); font-weight: 700; letter-spacing: -.03em; line-height: 1.08; max-width: 18ch; }
        .pz-updated { font-size: 13.5px; color: var(--ink-3); margin-top: 18px; }
        .pz-lead { font-size: 16px; line-height: 1.75; color: var(--ink-2); max-width: 62ch; margin-top: 24px; }
        .pz-scope {
          margin-top: 32px; padding: 20px 22px; border-radius: 16px;
          background: rgba(245,130,31,.07); border: 1px solid rgba(245,130,31,.2);
          display: flex; gap: 14px; align-items: flex-start;
        }
        .pz-scope svg { flex-shrink: 0; margin-top: 2px; color: var(--accent-text); }
        .pz-scope p { font-size: 14px; line-height: 1.65; color: var(--ink-2); }
        .pz-scope b { color: var(--ink); }

        .pz-content { padding: 12px 0 20px; background: var(--white); }
        .pz-sec { padding: 30px 0; border-top: 1px solid var(--line); }
        .pz-sec:first-child { border-top: none; }
        .pz-n {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 28px; height: 28px; padding: 0 8px; border-radius: 999px;
          background: rgba(245,130,31,.12); color: var(--accent-text);
          font-size: 12px; font-weight: 700; margin-bottom: 12px;
        }
        .pz-sec h2 { font-size: 18.5px; font-weight: 700; letter-spacing: -.015em; color: var(--ink); margin-bottom: 10px; }
        .pz-sec p { font-size: 15px; line-height: 1.8; color: var(--ink-2); }
        .pz-sec p + p { margin-top: 10px; }
        .pz-sec ul { margin: 10px 0 0; padding-left: 20px; }
        .pz-sec li { font-size: 15px; line-height: 1.75; color: var(--ink-2); margin-bottom: 6px; }
        .pz-sec b { color: var(--ink); }

        .pz-contact {
          margin: 44px 0 0; border-radius: 24px;
          background: var(--velo-azul), var(--graphite);
          padding: 40px 38px; color: #fff;
          display: flex; flex-wrap: wrap; gap: 28px; align-items: center; justify-content: space-between;
        }
        .pz-contact h3 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .pz-contact p { font-size: 14px; color: rgba(255,255,255,.62); max-width: 40ch; }
        .pz-contact-links { display: flex; flex-direction: column; gap: 10px; }
        .pz-contact-links a {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 14.5px; font-weight: 700; color: #fff;
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14);
          border-radius: 12px; padding: 11px 16px;
          transition: background-color .2s ease;
        }
        .pz-contact-links a:hover { background: rgba(255,255,255,.14); }

        .pz-footer { margin-top: 64px; background: var(--velo-azul), var(--graphite); color: #fff; padding: 48px 0 28px; }
        .pz-footer-inner { display: flex; flex-direction: column; gap: 18px; }
        .pz-footer-desc { font-size: 13px; line-height: 1.7; color: rgba(255,255,255,.48); max-width: 52ch; }
        .pz-footer-links { display: flex; gap: 22px; flex-wrap: wrap; }
        .pz-footer-links a { font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,.7); }
        .pz-footer-links a:hover { color: #fff; }
        .pz-footer-legal { margin-top: 10px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.1); font-size: 12px; color: rgba(255,255,255,.34); }

        @media (max-width: 640px) {
          .pz-nav-back { display: none; }
          .pz-header h1 { max-width: none; }
          .pz-contact { padding: 30px 24px; }
        }
      `}</style>
    </div>
  )
}
