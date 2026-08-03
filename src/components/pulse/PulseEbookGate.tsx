'use client'

// Ruta destino: src/components/pulse/PulseEbookGate.tsx
//
// Modal de descarga del ebook "Rentabilidad por unidad".
//
// CUÁNDO APARECE — y por qué no al cargar la página. Un modal que interrumpe
// antes de que el visitante sepa qué es Pulse Motor se cierra por reflejo, y
// además Google penaliza los interstitials intrusivos en móvil. Se dispara con
// lo primero que ocurra de estas tres señales, que ya implican interés:
//   · scroll del 50% de la página
//   · intención de salida (el cursor se va hacia la barra del navegador)
//   · 25 segundos en la página
// En móvil no hay exit intent, así que ahí gobiernan el scroll y el tiempo.
//
// Una vez por sesión. Y nunca más, si ya dejó los datos: volver a pedirle el
// correo a alguien que ya lo dio es la forma más rápida de quemar un lead propio.
//
// NO APARECE en /pulse/demo ni en rutas de aplicación: el demo ya es una
// superficie de conversión y taparlo con un modal es pelearse con uno mismo.
//
// EL LADO IZQUIERDO ES UN GRÁFICO, NO UN TEXTO. La primera versión listaba tres
// fugas en prosa: unas 120 palabras que nadie lee en un modal. Ahora el
// argumento lo hace la imagen —cinco barras, una sola encendida— y el texto
// bajó a una cifra, cinco etiquetas y una pregunta. La barra apagada comunica
// "esto lo estás dejando" más rápido de lo que puede hacerlo un párrafo.
//
// La pregunta final es deliberada: no afirma que el concesionario esté
// perdiendo esas cuatro líneas —no lo sabemos— sino que lo invita a responderse
// si las está cobrando. Afirmarlo sería una promesa sin sustento; preguntarlo
// es lo que hace que quiera el documento.
//
// EL MODAL NO SIGUE EL TEMA DE LA PÁGINA. Todos sus colores van literales y no
// por var(--bg-0/--ink). Dos motivos: los campos heredaban el fondo del tema y
// en modo oscuro quedaban casi del mismo color que el panel —invisibles como
// campos—, y una portada editorial que cambia de piel según el tema deja de ser
// una portada. El modal es su propia superficie, igual en ambos temas.

import { useCallback, useEffect, useRef, useState } from 'react'

const VISTO_SESION = 'pulse-ebook-visto'
const YA_DESCARGO = 'pulse-ebook-descargado'
const RUTA_PDF = '/pulse/rentabilidad-por-unidad.pdf'
const NOMBRE_ARCHIVO = 'Pulse Motor - Rentabilidad por unidad.pdf'

const EXCLUIDAS = ['/pulse/demo', '/pulse/agente', '/pulse/admin', '/pulse/login', '/pulse/signup', '/pulse/onboarding']

// La primera va encendida porque es la única que todo concesionario cobra
// siempre: el vehículo. Las otras cuatro son las que se dejan.
const LINEAS = [
  { label: 'Vehículo nuevo', activa: true },
  { label: 'Financiación', activa: false },
  { label: 'Seguro todo riesgo', activa: false },
  { label: 'Accesorios', activa: false },
  { label: 'Retomas', activa: false },
]

export function PulseEbookGate() {
  const [abierto, setAbierto] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'listo' | 'error'>('idle')
  const [error, setError] = useState('')
  const [datos, setDatos] = useState({ concesionario: '', nombre: '', email: '', cargo: '' })
  const primerCampo = useRef<HTMLInputElement>(null)
  // Ref además del estado: los listeners se registran una sola vez y necesitan
  // leer el valor actual sin volver a suscribirse en cada render.
  const yaMostrado = useRef(false)

  const abrir = useCallback(() => {
    if (yaMostrado.current) return
    yaMostrado.current = true
    try { sessionStorage.setItem(VISTO_SESION, '1') } catch { /* sin storage */ }
    setAbierto(true)
  }, [])

  useEffect(() => {
    try {
      const ruta = window.location.pathname
      if (EXCLUIDAS.some(r => ruta.startsWith(r))) return
      if (localStorage.getItem(YA_DESCARGO) === '1') return
      if (sessionStorage.getItem(VISTO_SESION) === '1') return
    } catch { /* sin storage: se muestra igual, es el comportamiento seguro */ }

    const porTiempo = window.setTimeout(abrir, 25000)

    const porScroll = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight
      if (alto > 0 && window.scrollY / alto > 0.5) abrir()
    }

    // Exit intent: solo cuenta si el cursor sale por arriba. Salir por los
    // costados suele ser alguien yendo a otra ventana, no abandonando.
    const porSalida = (e: MouseEvent) => {
      if (e.clientY <= 0) abrir()
    }

    window.addEventListener('scroll', porScroll, { passive: true })
    document.addEventListener('mouseleave', porSalida)
    return () => {
      window.clearTimeout(porTiempo)
      window.removeEventListener('scroll', porScroll)
      document.removeEventListener('mouseleave', porSalida)
    }
  }, [abrir])

  useEffect(() => {
    if (!abierto) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('keydown', tecla)
    primerCampo.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  if (!abierto) return null

  const set = (k: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos(prev => ({ ...prev, [k]: e.target.value }))

  function descargar() {
    const a = document.createElement('a')
    a.href = RUTA_PDF
    a.download = NOMBRE_ARCHIVO
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEstado('enviando'); setError('')
    try {
      const res = await fetch('/api/pulse/ebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No pudimos registrar tus datos')
      try { localStorage.setItem(YA_DESCARGO, '1') } catch { /* sin storage */ }
      setEstado('listo')
      // La descarga arranca en el acto, en la misma pantalla. Si el archivo solo
      // llegara por correo, buena parte de la gente pondría un correo falso.
      descargar()
    } catch (err) {
      setEstado('error')
      setError(err instanceof Error ? err.message : 'No pudimos registrar tus datos')
    }
  }

  return (
    <div
      className="pm-ebook-fondo"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pm-ebook-titulo"
      onClick={e => { if (e.target === e.currentTarget) setAbierto(false) }}
    >
      <div className="pm-ebook-caja">
        <button className="pm-ebook-x" onClick={() => setAbierto(false)} aria-label="Cerrar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* ── Portada ─────────────────────────────────────────────────────── */}
        <div className="pm-ebook-izq">
          {/* Marca de canto, como el número de edición de una revista. Es lo que
              hace leer el panel como una portada y no como un banner. */}
          <span className="pm-ebook-canto" aria-hidden="true">DOCUMENTO 01 · CONCESIONARIOS</span>

          <div className="pm-ebook-cifra" aria-hidden="true">
            <span className="pm-ebook-5">5</span>
            <span className="pm-ebook-cifra-txt">
              líneas de margen<br /><em>por una sola venta</em>
            </span>
          </div>

          <ul className="pm-ebook-barras">
            {LINEAS.map(l => (
              <li key={l.label} className={l.activa ? 'on' : ''}>
                <span className="pm-ebook-b" />
                <span className="pm-ebook-l">{l.label}</span>
              </li>
            ))}
          </ul>

          <h2 id="pm-ebook-titulo" className="pm-ebook-preg">
            ¿Cuántas está<br />cobrando<span>?</span>
          </h2>
        </div>

        {/* ── Formulario ──────────────────────────────────────────────────── */}
        <div className="pm-ebook-der">
          {estado === 'listo' ? (
            <div className="pm-ebook-ok">
              <div className="pm-ebook-check" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <h3>La descarga ya arrancó</h3>
              <p>Si tu navegador la bloqueó, bajala de nuevo acá.</p>
              <button type="button" onClick={descargar} className="pm-ebook-btn">Descargar otra vez</button>
              <button type="button" onClick={() => setAbierto(false)} className="pm-ebook-link">Seguir navegando</button>
            </div>
          ) : (
            <form onSubmit={enviar}>
              <p className="pm-ebook-eyebrow">5 páginas · PDF</p>
              <h3 className="pm-ebook-h3">Descargalo completo</h3>

              <label htmlFor="eb-conc">Concesionario</label>
              <input id="eb-conc" ref={primerCampo} required value={datos.concesionario} onChange={set('concesionario')} placeholder="Nombre del concesionario" />

              <label htmlFor="eb-nom">Tu nombre</label>
              <input id="eb-nom" required value={datos.nombre} onChange={set('nombre')} placeholder="Nombre y apellido" />

              <label htmlFor="eb-mail">Correo</label>
              <input id="eb-mail" required type="email" value={datos.email} onChange={set('email')} placeholder="correo@concesionario.com" />

              <label htmlFor="eb-cargo">Cargo <span>(opcional)</span></label>
              <input id="eb-cargo" value={datos.cargo} onChange={set('cargo')} placeholder="Gerente comercial" />

              {estado === 'error' && <p className="pm-ebook-error">{error}</p>}

              <button type="submit" disabled={estado === 'enviando'} className="pm-ebook-btn">
                {estado === 'enviando' ? 'Preparando…' : 'Descargar ahora'}
              </button>

              <p className="pm-ebook-legal">Sin teléfono. Se abre en el acto.</p>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .pm-ebook-fondo {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(6, 9, 16, .78); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: pm-ebook-fade .22s ease-out;
        }
        @keyframes pm-ebook-fade { from { opacity: 0 } to { opacity: 1 } }

        .pm-ebook-caja {
          position: relative; display: grid; grid-template-columns: 1.08fr .92fr;
          width: 100%; max-width: 840px; max-height: 92vh; overflow-y: auto;
          background: #0E1626; border-radius: 18px;
          box-shadow: 0 34px 90px rgba(0,0,0,.55);
          animation: pm-ebook-in .3s cubic-bezier(.2,.7,.3,1);
        }
        @keyframes pm-ebook-in { from { opacity: 0; transform: translateY(18px) scale(.98) } to { opacity: 1; transform: none } }

        .pm-ebook-x {
          position: absolute; top: 12px; right: 12px; z-index: 3;
          background: rgba(255,255,255,.16); border: none; border-radius: 8px;
          color: #fff; cursor: pointer; padding: 6px; display: flex; line-height: 0;
        }
        .pm-ebook-x:hover { background: rgba(255,255,255,.3) }

        /* ── Portada ─────────────────────────────────────────────────────── */
        .pm-ebook-izq {
          position: relative; overflow: hidden;
          background:
            radial-gradient(120% 90% at 100% 0%, #2B4C86 0%, transparent 58%),
            radial-gradient(90% 70% at 0% 100%, #1B3563 0%, transparent 62%),
            linear-gradient(155deg, #16233C 0%, #111C31 52%, #1A2C4E 100%);
          color: #fff;
          padding: 34px 30px 30px; border-radius: 18px 0 0 18px;
          display: flex; flex-direction: column; justify-content: center;
        }
        .pm-ebook-izq::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: repeating-linear-gradient(135deg, rgba(255,255,255,.055) 0 1px, transparent 1px 7px);
        }
        .pm-ebook-izq::after {
          content: ''; position: absolute; width: 300px; height: 300px; right: -110px; top: -100px;
          background: radial-gradient(circle, rgba(59,130,246,.5) 0%, transparent 66%);
          pointer-events: none;
        }
        .pm-ebook-izq > * { position: relative; z-index: 1 }

        .pm-ebook-canto {
          position: absolute; top: 26px; right: 14px; z-index: 1;
          writing-mode: vertical-rl;
          font-family: var(--font-mono), monospace; font-size: 8.5px; font-weight: 500;
          letter-spacing: 2.2px; text-transform: uppercase; color: rgba(255,255,255,.46);
        }

        .pm-ebook-cifra { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 26px }
        .pm-ebook-5 {
          font-family: var(--font-oswald), var(--font-display), sans-serif;
          font-size: 116px; font-weight: 700; line-height: .78; letter-spacing: -.04em;
          color: #60A5FA; flex-shrink: 0;
          text-shadow: 0 0 42px rgba(59,130,246,.55);
        }
        .pm-ebook-cifra-txt {
          font-family: var(--font-display), var(--font-inter), sans-serif;
          font-size: 19px; font-weight: 700; line-height: 1.22; letter-spacing: -.02em;
          color: #fff; padding-top: 12px;
        }
        .pm-ebook-cifra-txt em { font-style: italic; font-weight: 500; color: #A9BAD6 }

        .pm-ebook-barras { list-style: none; margin: 0 0 26px; padding: 0; display: grid; gap: 9px }
        .pm-ebook-barras li { display: flex; align-items: center; gap: 12px }
        .pm-ebook-b {
          width: 78px; height: 9px; border-radius: 2px; flex-shrink: 0;
          border: 1px dashed rgba(255,255,255,.42); background: rgba(255,255,255,.05);
        }
        .pm-ebook-barras li.on .pm-ebook-b {
          border: none; background: linear-gradient(90deg, #60A5FA, #2563EB);
          box-shadow: 0 0 20px rgba(96,165,250,.7);
        }
        .pm-ebook-l { font-size: 12px; color: rgba(255,255,255,.66); letter-spacing: .1px }
        .pm-ebook-barras li.on .pm-ebook-l { color: #fff; font-weight: 600 }

        .pm-ebook-preg {
          font-family: var(--font-oswald), var(--font-display), sans-serif;
          font-size: 40px; font-weight: 600; line-height: .98; letter-spacing: -.015em;
          text-transform: uppercase; color: #fff; margin: 0;
        }
        .pm-ebook-preg span { color: #60A5FA }

        /* ── Formulario ──────────────────────────────────────────────────────
           El panel es un escalón más oscuro que los campos, no al revés. Con el
           campo más oscuro que su fondo el formulario se lee como una lista de
           huecos; con el campo elevado se lee como algo para llenar. */
        .pm-ebook-der {
          padding: 34px 30px; display: flex; flex-direction: column; justify-content: center;
          background: #0B1220; border-radius: 0 18px 18px 0;
        }
        .pm-ebook-eyebrow {
          font-family: var(--font-mono), monospace; font-size: 9.5px; font-weight: 500;
          letter-spacing: 1.4px; text-transform: uppercase; color: #60A5FA; margin: 0 0 7px;
        }
        .pm-ebook-h3 {
          font-family: var(--font-display), var(--font-inter), sans-serif;
          font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -.02em;
        }

        .pm-ebook-der label {
          display: block; font-size: 11px; font-weight: 600; color: #93A3BE;
          margin-bottom: 5px; margin-top: 13px;
        }
        .pm-ebook-der label span { font-weight: 400; color: #64748B }

        .pm-ebook-der input {
          width: 100%; box-sizing: border-box; padding: 11px 13px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,.13); background: #182338; color: #F1F5FB;
          font-size: 13.5px; font-family: inherit; outline: none;
          transition: border-color .15s ease, background .15s ease, box-shadow .15s ease;
        }
        .pm-ebook-der input::placeholder { color: #7A8AA6 }
        .pm-ebook-der input:hover { background: #1D2A42; border-color: rgba(255,255,255,.2) }
        /* El foco no solo cambia el borde: agrega un halo. En un formulario de
           cuatro campos seguidos, el borde solo no alcanza para saber dónde
           está parado el cursor. */
        .pm-ebook-der input:focus {
          background: #1D2A42; border-color: #60A5FA;
          box-shadow: 0 0 0 3px rgba(96,165,250,.22);
        }
        /* Chrome pinta el autocompletado de amarillo y rompe el panel entero. */
        .pm-ebook-der input:-webkit-autofill,
        .pm-ebook-der input:-webkit-autofill:focus {
          -webkit-text-fill-color: #F1F5FB;
          -webkit-box-shadow: 0 0 0 1000px #1D2A42 inset;
          caret-color: #F1F5FB;
        }

        .pm-ebook-btn {
          width: 100%; margin-top: 20px; padding: 13px; border-radius: 9px; border: none;
          background: linear-gradient(135deg, #3B82F6, #2563EB); color: #fff;
          font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
          box-shadow: 0 6px 18px rgba(37,99,235,.35);
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .pm-ebook-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(37,99,235,.5) }
        .pm-ebook-btn:disabled { opacity: .7; cursor: default; transform: none }

        .pm-ebook-link {
          width: 100%; margin-top: 10px; background: none; border: none; cursor: pointer;
          color: #93A3BE; font-size: 12.5px; font-family: inherit; text-decoration: underline;
        }
        .pm-ebook-legal { font-size: 10.5px; color: #7F8FAE; margin: 10px 0 0; text-align: center }
        .pm-ebook-error {
          margin: 12px 0 0; font-size: 12px; color: #FCA5A5;
          background: rgba(220,38,38,.14); border: 1px solid rgba(248,113,113,.38);
          border-radius: 8px; padding: 9px 11px; line-height: 1.45;
        }

        .pm-ebook-ok { text-align: center }
        .pm-ebook-check {
          width: 46px; height: 46px; margin: 0 auto 14px; border-radius: 50%;
          background: rgba(45,212,191,.14); color: #2DD4BF;
          display: flex; align-items: center; justify-content: center;
        }
        .pm-ebook-ok h3 { font-family: var(--font-display), var(--font-inter), sans-serif; font-size: 19px; font-weight: 800; color: #fff; margin: 0 0 6px }
        .pm-ebook-ok p { font-size: 12.5px; color: #93A3BE; margin: 0; line-height: 1.5 }

        .pm-ebook-fondo :focus-visible { outline: 2px solid #60A5FA; outline-offset: 2px }

        /* En pantalla angosta la portada se achica pero no se elimina: es la que
           hace el argumento. Lo que se recorta es su respiro, no su contenido. */
        @media (max-width: 720px) {
          .pm-ebook-caja { grid-template-columns: 1fr; max-height: 94vh }
          .pm-ebook-izq { border-radius: 18px 18px 0 0; padding: 26px 22px 22px }
          .pm-ebook-der { border-radius: 0 0 18px 18px; padding: 24px 22px }
          .pm-ebook-5 { font-size: 82px }
          .pm-ebook-cifra-txt { font-size: 16px; padding-top: 8px }
          .pm-ebook-cifra { margin-bottom: 20px }
          .pm-ebook-barras { margin-bottom: 20px; gap: 7px }
          .pm-ebook-preg { font-size: 30px }
          .pm-ebook-canto { display: none }
        }
        @media (prefers-reduced-motion: reduce) {
          .pm-ebook-fondo, .pm-ebook-caja { animation: none }
          .pm-ebook-btn:hover { transform: none }
        }
      `}</style>
    </div>
  )
}
