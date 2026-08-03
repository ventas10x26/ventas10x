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
// Una vez por sesión. Y nunca más, en ningún dispositivo de esa persona, si ya
// dejó los datos: volver a pedirle el correo a alguien que ya lo dio es la forma
// más rápida de quemar un lead que ya era tuyo.
//
// NO APARECE en /pulse/demo ni en rutas de aplicación: el demo ya es una
// superficie de conversión y taparlo con un modal es pelearse con uno mismo.
//
// CONTENIDO — muestra las tres fugas del documento en vez de una lista de
// beneficios. Un gerente de concesionario se reconoce en al menos una de las
// tres en cinco segundos, y ese reconocimiento es lo que justifica dejar el
// correo. "Optimizá tu operación" no lo justifica.

import { useCallback, useEffect, useRef, useState } from 'react'

const VISTO_SESION = 'pulse-ebook-visto'
const YA_DESCARGO = 'pulse-ebook-descargado'
const RUTA_PDF = '/pulse/rentabilidad-por-unidad.pdf'
const NOMBRE_ARCHIVO = 'Pulse Motor - Rentabilidad por unidad.pdf'

// Rutas donde el modal no debe aparecer.
const EXCLUIDAS = ['/pulse/demo', '/pulse/agente', '/pulse/admin', '/pulse/login', '/pulse/signup', '/pulse/onboarding']

const FUGAS = [
  {
    color: '#DC2626',
    titulo: 'La respuesta que llegó tarde',
    texto: 'El interesado escribió a las 11:47 de la noche. El asesor lo vio a las 8 de la mañana, cuando ya había agendado con otro.',
  },
  {
    color: '#B45309',
    titulo: 'La línea que nadie ofreció',
    texto: 'Se vendió el vehículo, pero sin seguro, sin accesorios o con la retoma que se fue a otro lado. No hubo negativa del cliente: no se ofreció.',
  },
  {
    color: '#2563EB',
    titulo: 'La unidad que no llegó a placa',
    texto: 'Pedido firmado y anticipo recibido, pero la matrícula quedó detenida. Es venta hecha que todavía no se factura ni cuenta para el mes.',
  },
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
    // Guardas: ruta excluida, ya visto en esta sesión, o ya descargado alguna vez.
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

  // Bloquear el scroll de fondo y cerrar con Escape mientras está abierto.
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

        {/* Columna izquierda: la portada y las tres fugas */}
        <div className="pm-ebook-izq">
          <p className="pm-ebook-eyebrow">Documento · 5 páginas</p>
          <h2 id="pm-ebook-titulo" className="pm-ebook-h2">
            Usted sabe cuántas unidades vendió.<br />
            <span>¿Sabe cuánto margen dejó sobre la mesa?</span>
          </h2>
          <p className="pm-ebook-sub">
            Las tres fugas que casi ningún tablero muestra a tiempo, y qué hacen en su estado de resultados.
          </p>

          <ul className="pm-ebook-lista">
            {FUGAS.map(f => (
              <li key={f.titulo}>
                <span className="pm-ebook-barra" style={{ background: f.color }} />
                <div>
                  <strong>{f.titulo}</strong>
                  <span>{f.texto}</span>
                </div>
              </li>
            ))}
          </ul>

          <p className="pm-ebook-pie">
            Para gerencia general, comercial, operaciones y marca de concesionarios de vehículo nuevo.
          </p>
        </div>

        {/* Columna derecha: el formulario */}
        <div className="pm-ebook-der">
          {estado === 'listo' ? (
            <div className="pm-ebook-ok">
              <div className="pm-ebook-check" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <h3>La descarga ya arrancó</h3>
              <p>Si tu navegador la bloqueó, podés bajarla de nuevo acá abajo.</p>
              <button type="button" onClick={descargar} className="pm-ebook-btn">
                Descargar otra vez
              </button>
              <button type="button" onClick={() => setAbierto(false)} className="pm-ebook-link">
                Seguir navegando
              </button>
            </div>
          ) : (
            <form onSubmit={enviar}>
              <h3 className="pm-ebook-h3">Descargalo completo</h3>
              <p className="pm-ebook-nota">Se abre en el acto, sin esperar un correo.</p>

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
                {estado === 'enviando' ? 'Preparando…' : 'Descargar el documento'}
              </button>

              <p className="pm-ebook-legal">
                No pedimos teléfono. Usamos tu correo solo para enviarte este documento y contactarte una vez.
              </p>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .pm-ebook-fondo {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(6, 9, 16, .74); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: pm-ebook-fade .22s ease-out;
        }
        @keyframes pm-ebook-fade { from { opacity: 0 } to { opacity: 1 } }

        .pm-ebook-caja {
          position: relative; display: grid; grid-template-columns: 1.15fr .85fr;
          width: 100%; max-width: 860px; max-height: 92vh; overflow-y: auto;
          background: var(--bg-1, #fff); border-radius: 18px;
          box-shadow: 0 34px 90px rgba(0,0,0,.5);
          animation: pm-ebook-in .3s cubic-bezier(.2,.7,.3,1);
        }
        @keyframes pm-ebook-in { from { opacity: 0; transform: translateY(18px) scale(.98) } to { opacity: 1; transform: none } }

        .pm-ebook-x {
          position: absolute; top: 12px; right: 12px; z-index: 2;
          background: rgba(255,255,255,.16); border: none; border-radius: 8px;
          color: #fff; cursor: pointer; padding: 6px; display: flex; line-height: 0;
        }
        .pm-ebook-x:hover { background: rgba(255,255,255,.3) }

        .pm-ebook-izq {
          background: linear-gradient(160deg, #0B1120 0%, #131A2B 100%);
          padding: 30px 28px; border-radius: 18px 0 0 18px; color: #E6EBF5;
        }
        .pm-ebook-eyebrow {
          font-family: var(--font-mono), monospace; font-size: 10px; font-weight: 600;
          letter-spacing: 1.2px; text-transform: uppercase; color: #7DA9FF; margin: 0 0 12px;
        }
        .pm-ebook-h2 {
          font-family: var(--font-inter), sans-serif; font-size: 21px; font-weight: 800;
          line-height: 1.24; letter-spacing: -.02em; margin: 0 0 10px; color: #fff;
        }
        .pm-ebook-h2 span { color: #60A5FA }
        .pm-ebook-sub { font-size: 12.5px; line-height: 1.55; color: #93A3BE; margin: 0 0 20px }

        .pm-ebook-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px }
        .pm-ebook-lista li { display: flex; gap: 11px; align-items: stretch }
        .pm-ebook-barra { width: 3px; border-radius: 2px; flex-shrink: 0 }
        .pm-ebook-lista strong { display: block; font-size: 12.5px; color: #fff; margin-bottom: 3px }
        .pm-ebook-lista span { font-size: 11.5px; line-height: 1.5; color: #93A3BE }
        .pm-ebook-pie { font-size: 10.5px; color: #7F8FAE; margin: 20px 0 0; line-height: 1.5 }

        .pm-ebook-der { padding: 30px 28px; display: flex; flex-direction: column; justify-content: center }
        .pm-ebook-h3 { font-family: var(--font-inter), sans-serif; font-size: 18px; font-weight: 800; color: var(--ink); margin: 0 0 4px }
        .pm-ebook-nota { font-size: 12px; color: var(--ink-dim); margin: 0 0 18px }

        .pm-ebook-der label {
          display: block; font-size: 11.5px; font-weight: 600; color: var(--ink-dim);
          margin-bottom: 5px; margin-top: 12px;
        }
        .pm-ebook-der label span { font-weight: 400; opacity: .7 }
        .pm-ebook-der input {
          width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px;
          border: 1px solid var(--line); background: var(--bg-0, #fff); color: var(--ink);
          font-size: 13.5px; font-family: inherit; outline: none;
        }
        .pm-ebook-der input:focus { border-color: #2563EB }
        .pm-ebook-der input::placeholder { color: #94A3B8 }

        .pm-ebook-btn {
          width: 100%; margin-top: 18px; padding: 13px; border-radius: 9px; border: none;
          background: linear-gradient(135deg, #3B82F6, #2563EB); color: #fff;
          font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .pm-ebook-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(37,99,235,.42) }
        .pm-ebook-btn:disabled { opacity: .7; cursor: default; transform: none }

        .pm-ebook-link {
          width: 100%; margin-top: 10px; background: none; border: none; cursor: pointer;
          color: var(--ink-dim); font-size: 12.5px; font-family: inherit; text-decoration: underline;
        }
        .pm-ebook-legal { font-size: 10.5px; color: var(--ink-dim); line-height: 1.5; margin: 11px 0 0; text-align: center }
        .pm-ebook-error {
          margin: 12px 0 0; font-size: 12px; color: #DC2626;
          background: rgba(220,38,38,.08); border: 1px solid rgba(220,38,38,.25);
          border-radius: 8px; padding: 9px 11px; line-height: 1.45;
        }

        .pm-ebook-ok { text-align: center }
        .pm-ebook-check {
          width: 46px; height: 46px; margin: 0 auto 14px; border-radius: 50%;
          background: rgba(13,148,136,.12); color: #0D9488;
          display: flex; align-items: center; justify-content: center;
        }
        .pm-ebook-ok h3 { font-family: var(--font-inter), sans-serif; font-size: 18px; font-weight: 800; color: var(--ink); margin: 0 0 6px }
        .pm-ebook-ok p { font-size: 12.5px; color: var(--ink-dim); margin: 0; line-height: 1.5 }

        .pm-ebook-fondo :focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px }

        /* En pantalla angosta la columna oscura pasa arriba y se recorta a lo
           esencial: con las tres fugas completas el formulario queda debajo del
           pliegue y el modal deja de convertir. */
        @media (max-width: 720px) {
          .pm-ebook-caja { grid-template-columns: 1fr; max-height: 94vh }
          .pm-ebook-izq { border-radius: 18px 18px 0 0; padding: 24px 22px 20px }
          .pm-ebook-lista li:nth-child(n+3) { display: none }
          .pm-ebook-pie { display: none }
          .pm-ebook-der { padding: 22px }
        }
        @media (prefers-reduced-motion: reduce) {
          .pm-ebook-fondo, .pm-ebook-caja { animation: none }
          .pm-ebook-btn:hover { transform: none }
        }
      `}</style>
    </div>
  )
}
