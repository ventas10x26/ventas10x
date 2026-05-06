'use client'
import { useState, useEffect, useRef } from 'react'

const DARK = '#0f1c2e'
const ORANGE = '#FF6B2B'

type Contacto = {
  id: string
  nombre: string | null
  email: string | null
  whatsapp: string | null
  empresa: string | null
  fuente: string
}

type Producto = {
  id: string
  nombre: string
  imagen_principal: string | null
  precio: string | null
}

type Campana = {
  id: string
  nombre: string
  canal: string
  estado: string
  total_destinatarios: number
  total_enviados: number
  total_errores: number
  programada_para: string | null
  enviada_at: string | null
  created_at: string
  asunto: string | null
  mensaje_wa: string | null
  cuerpo_email?: string | null
  imagen_url?: string | null
}

const ESTADO_COLORS: Record<string, string> = {
  borrador: '#94a3b8',
  programada: '#f59e0b',
  enviando: '#3b82f6',
  enviada: '#22c55e',
  error: '#ef4444',
}

const CANAL_LABELS: Record<string, string> = {
  email: '📧 Email',
  whatsapp: '💬 WhatsApp',
  ambos: '📧💬 Ambos',
}

const SUGERENCIAS = [
  'Campaña de bienvenida para mis nuevos contactos',
  'Oferta especial de fin de mes para clientes',
  'Seguimiento a leads que no han respondido',
  'Anuncio de nuevo producto en mi catálogo',
  'Recordatorio de cita o reunión pendiente',
]

function formatFecha(d: string) {
  return new Date(d).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function AgenteIA({ onGenerar }: {
  onGenerar: (data: { nombre: string; asunto: string; cuerpoEmail: string; mensajeWa: string }) => void
}) {
  const [instruccion, setInstruccion] = useState('')
  const [generando, setGenerando] = useState(false)
  const [historial, setHistorial] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: '¡Hola! Soy tu agente de campañas ✨ Dime qué tipo de campaña quieres y te genero el contenido completo: nombre, asunto del email, cuerpo y mensaje de WhatsApp.' }
  ])
  const [generado, setGenerado] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [historial, generando])

  const generar = async () => {
    if (!instruccion.trim() || generando) return
    const texto = instruccion.trim()
    setInstruccion('')
    setGenerando(true)
    setHistorial(prev => [...prev, { role: 'user', text: texto }])

    try {
      const res = await fetch('/api/dashboard/campanas/generar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruccion: texto })
      })
      const data = await res.json()
      if (data.ok) {
        setHistorial(prev => [...prev, {
          role: 'ai',
          text: `✅ ¡Listo! Generé "${data.nombre}".\n\n💡 ${data.explicacion}\n\nRevisa y ajusta los campos abajo antes de guardar.`
        }])
        onGenerar({ nombre: data.nombre, asunto: data.asunto, cuerpoEmail: data.cuerpo_email, mensajeWa: data.mensaje_wa })
        setGenerado(true)
      } else {
        setHistorial(prev => [...prev, { role: 'ai', text: '⚠️ Error procesando respuesta. Intenta con más detalles sobre la campaña.' }])
      }
    } catch {
      setHistorial(prev => [...prev, { role: 'ai', text: '❌ Error de conexión. Intenta de nuevo.' }])
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${ORANGE}30`, padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${ORANGE}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✨</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Agente IA de Campañas</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Describe tu campaña y la genero automáticamente</div>
        </div>
        {generado && (
          <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#22c55e', background: '#f0fdf4', padding: '4px 10px', borderRadius: '999px' }}>
            ✓ Contenido generado
          </div>
        )}
      </div>

      <div ref={scrollRef} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '14px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {historial.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '9px 13px',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              background: msg.role === 'user' ? ORANGE : '#fff',
              color: msg.role === 'user' ? '#fff' : '#374151',
              fontSize: '13px', lineHeight: 1.55,
              border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none',
            }}>
              {msg.text.split('\n').map((line, j, arr) => (
                <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}
        {generando && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: ORANGE, animation: `iabounce .8s ${i * .15}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {historial.length === 1 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sugerencias</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {SUGERENCIAS.map(s => (
              <button key={s} onClick={() => setInstruccion(s)} style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={instruccion}
          onChange={e => setInstruccion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generar()}
          placeholder="Ej: Seguimiento a leads de la semana pasada..."
          disabled={generando}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={generar}
          disabled={generando || !instruccion.trim()}
          style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: instruccion.trim() && !generando ? ORANGE : '#e2e8f0', color: instruccion.trim() && !generando ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: '13px', cursor: instruccion.trim() && !generando ? 'pointer' : 'default' }}
        >
          {generando ? '...' : '✨ Generar'}
        </button>
      </div>
      <style>{`@keyframes iabounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  )
}

type Props = {
  vendedorId: string
  nombreVendedor: string
  slug: string
  productos: Producto[]
}

export function VendedorCampanasClient({ vendedorId: _vendedorId, nombreVendedor, slug: _slug, productos }: Props) {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [vista, setVista] = useState<'lista' | 'nueva' | 'contactos'>('lista')
  const [cargando, setCargando] = useState(true)

  // form nueva campaña
  const [nombre, setNombre] = useState('')
  const [canal, setCanal] = useState<'email' | 'whatsapp' | 'ambos'>('ambos')
  const [asunto, setAsunto] = useState('')
  const [cuerpoEmail, setCuerpoEmail] = useState('')
  const [mensajeWa, setMensajeWa] = useState('')
  const [programarPara, setProgramarPara] = useState('')
  const [productoId, setProductoId] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [selContactos, setSelContactos] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ enviados: number; waLinks: string[] } | null>(null)

  // form contacto
  const [formContacto, setFormContacto] = useState({ nombre: '', email: '', whatsapp: '', empresa: '' })
  const [guardandoContacto, setGuardandoContacto] = useState(false)
  const [csvTexto, setCsvTexto] = useState('')
  const [importando, setImportando] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/campanas').then(r => r.json()),
      fetch('/api/dashboard/campanas?tipo=contactos').then(r => r.json()),
    ]).then(([c, ct]) => {
      setCampanas(c.campanas || [])
      setContactos(ct.contactos || [])
    }).finally(() => setCargando(false))
  }, [])

  const contactosFiltrados = contactos.filter(c => {
    const q = busqueda.toLowerCase()
    return [c.nombre, c.email, c.whatsapp, c.empresa].filter(Boolean).join(' ').toLowerCase().includes(q)
  })

  const toggleContacto = (id: string) =>
    setSelContactos(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleTodos = () =>
    setSelContactos(selContactos.length === contactosFiltrados.length ? [] : contactosFiltrados.map(c => c.id))

  const handleGenerarIA = (data: { nombre: string; asunto: string; cuerpoEmail: string; mensajeWa: string }) => {
    setNombre(data.nombre); setAsunto(data.asunto); setCuerpoEmail(data.cuerpoEmail); setMensajeWa(data.mensajeWa)
  }

  const guardarCampana = async () => {
    if (!nombre.trim() || selContactos.length === 0) return
    setGuardando(true)
    try {
      const res = await fetch('/api/dashboard/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'crear_campana', nombre, canal, asunto, cuerpo_email: cuerpoEmail,
          mensaje_wa: mensajeWa, producto_id: productoId || null,
          imagen_url: imagenUrl || null,
          contacto_ids: selContactos, programada_para: programarPara || null,
        }),
      })
      const data = await res.json()
      if (data.ok) { setCampanas(prev => [data.campana, ...prev]); setVista('lista'); resetForm() }
    } finally { setGuardando(false) }
  }

  const enviarCampana = async (campanaId: string) => {
    setEnviando(campanaId); setResultado(null)
    try {
      const res = await fetch('/api/dashboard/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'enviar_campana', campana_id: campanaId, contacto_ids: selContactos }),
      })
      const data = await res.json()
      if (data.ok) {
        setResultado({ enviados: data.enviados, waLinks: data.wa_links || [] })
        setCampanas(prev => prev.map(c => c.id === campanaId ? { ...c, estado: 'enviada', total_enviados: data.enviados } : c))
      }
    } finally { setEnviando(null) }
  }

  const agregarContacto = async () => {
    if (!formContacto.nombre.trim()) return
    setGuardandoContacto(true)
    try {
      const res = await fetch('/api/dashboard/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'agregar_contacto', ...formContacto }),
      })
      const data = await res.json()
      if (data.ok) {
        setContactos(prev => [data.contacto, ...prev])
        setFormContacto({ nombre: '', email: '', whatsapp: '', empresa: '' })
      }
    } finally { setGuardandoContacto(false) }
  }

  const importarCSV = async () => {
    if (!csvTexto.trim()) return
    setImportando(true)
    try {
      const lines = csvTexto.trim().split('\n').slice(1) // skip header
      const rows = lines.map(l => {
        const [nombre, email, whatsapp, empresa] = l.split(',').map(s => s.trim())
        return { nombre, email, whatsapp, empresa }
      }).filter(r => r.nombre)
      const res = await fetch('/api/dashboard/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'importar_csv', contactos: rows }),
      })
      const data = await res.json()
      if (data.ok) {
        const ct = await fetch('/api/dashboard/campanas?tipo=contactos').then(r => r.json())
        setContactos(ct.contactos || [])
        setCsvTexto('')
      }
    } finally { setImportando(false) }
  }

  const subirImagen = async (file: File) => {
    setSubiendoImagen(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/dashboard/campanas/upload-imagen', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok) setImagenUrl(data.url)
    } finally { setSubiendoImagen(false) }
  }

  const resetForm = () => {
    setNombre(''); setAsunto(''); setCuerpoEmail(''); setMensajeWa('')
    setProgramarPara(''); setSelContactos([]); setCanal('ambos'); setProductoId(''); setImagenUrl('')
  }

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#94a3b8', fontSize: '14px' }}>
      Cargando campañas...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: DARK, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>📣 Mis Campañas</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', marginTop: '2px' }}>
            Envía emails y WhatsApp a tus contactos · {nombreVendedor}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setVista('contactos') }} style={{ background: vista === 'contactos' ? ORANGE : 'rgba(255,255,255,.1)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            👥 Contactos ({contactos.length})
          </button>
          <button onClick={() => { setVista(vista === 'nueva' ? 'lista' : 'nueva'); resetForm() }} style={{ background: vista === 'nueva' ? 'rgba(255,255,255,.15)' : ORANGE, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            {vista === 'nueva' ? '← Ver lista' : '+ Nueva campaña'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>

        {/* Resultado de envío */}
        {resultado && (
          <div style={{ marginBottom: '20px', padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#15803d' }}>Campaña enviada — {resultado.enviados} emails enviados</div>
              {resultado.waLinks.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Links WhatsApp (ábrelos uno a uno):</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                    {resultado.waLinks.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#16a34a' }}>WA #{i + 1} →</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setResultado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px' }}>×</button>
          </div>
        )}

        {/* ── VISTA CONTACTOS ── */}
        {vista === 'contactos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Agregar manual */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>➕ Agregar contacto</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'nombre', label: 'Nombre *', placeholder: 'Juan García' },
                  { key: 'email', label: 'Email', placeholder: 'juan@email.com' },
                  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+57 300 000 0000' },
                  { key: 'empresa', label: 'Empresa', placeholder: 'Empresa S.A.' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                    <input
                      value={formContacto[f.key as keyof typeof formContacto]}
                      onChange={e => setFormContacto(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <button onClick={agregarContacto} disabled={guardandoContacto || !formContacto.nombre.trim()} style={{ padding: '11px', background: formContacto.nombre.trim() ? DARK : '#e2e8f0', color: formContacto.nombre.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: formContacto.nombre.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                  {guardandoContacto ? 'Guardando...' : '✓ Agregar contacto'}
                </button>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>📂 Importar CSV</h4>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Formato: nombre,email,whatsapp,empresa (primera fila = encabezado)</div>
                <textarea
                  value={csvTexto}
                  onChange={e => setCsvTexto(e.target.value)}
                  rows={5}
                  placeholder={'nombre,email,whatsapp,empresa\nJuan García,juan@email.com,+573001234567,Empresa SA'}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <button onClick={importarCSV} disabled={importando || !csvTexto.trim()} style={{ marginTop: '8px', width: '100%', padding: '10px', background: csvTexto.trim() ? '#3b82f6' : '#e2e8f0', color: csvTexto.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: csvTexto.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                  {importando ? 'Importando...' : '📂 Importar CSV'}
                </button>
              </div>
            </div>

            {/* Lista contactos */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>👥 Mis contactos ({contactos.length})</h3>
              </div>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '12px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '480px', overflowY: 'auto' }}>
                {contactosFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                    Sin contactos aún. Agrega el primero →
                  </div>
                ) : contactosFiltrados.map(c => (
                  <div key={c.id} style={{ padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{c.nombre || 'Sin nombre'}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {[c.email, c.whatsapp, c.empresa].filter(Boolean).join(' · ')}
                    </div>
                    <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>fuente: {c.fuente}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VISTA LISTA ── */}
        {vista === 'lista' && (
          campanas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px', color: '#94a3b8' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📣</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>No hay campañas aún</div>
              <div style={{ fontSize: '14px', marginBottom: '24px' }}>Crea tu primera campaña y llega a tus contactos con email y WhatsApp</div>
              <button onClick={() => setVista('nueva')} style={{ padding: '12px 28px', background: ORANGE, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
                + Crear primera campaña
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {campanas.map(c => (
                <div key={c.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{c.nombre}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: `${ESTADO_COLORS[c.estado]}20`, color: ESTADO_COLORS[c.estado] }}>{c.estado.toUpperCase()}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{CANAL_LABELS[c.canal]}</span>
                    </div>
                    {c.asunto && <div style={{ fontSize: '13px', color: '#64748b' }}>Asunto: {c.asunto}</div>}
                    {c.programada_para && <div style={{ fontSize: '12px', color: '#f59e0b' }}>⏰ {formatFecha(c.programada_para)}</div>}
                    {c.enviada_at && <div style={{ fontSize: '12px', color: '#22c55e' }}>✓ Enviada: {formatFecha(c.enviada_at)}</div>}
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>{formatFecha(c.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {[
                      { label: 'Dest.', val: c.total_destinatarios, color: '#3b82f6' },
                      { label: 'Enviados', val: c.total_enviados, color: '#22c55e' },
                      { label: 'Errores', val: c.total_errores, color: '#ef4444' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setNombre(`Copia de ${c.nombre}`); setAsunto(c.asunto || ''); setCuerpoEmail(c.cuerpo_email || ''); setMensajeWa(c.mensaje_wa || ''); setVista('nueva') }}
                    style={{ padding: '10px 16px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    📋 Duplicar
                  </button>
                  {c.estado !== 'enviada' && (
                    <button onClick={() => enviarCampana(c.id)} disabled={enviando === c.id} style={{ padding: '10px 20px', background: enviando === c.id ? '#e2e8f0' : ORANGE, color: enviando === c.id ? '#94a3b8' : '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: enviando === c.id ? 'default' : 'pointer' }}>
                      {enviando === c.id ? 'Enviando...' : '🚀 Enviar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* ── VISTA NUEVA CAMPAÑA ── */}
        {vista === 'nueva' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Columna izquierda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <AgenteIA onGenerar={handleGenerarIA} />

              {/* Configuración */}
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>⚙️ Configuración</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Nombre *</label>
                    <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Oferta especial julio" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Canal</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['email', 'whatsapp', 'ambos'] as const).map(ch => (
                        <button key={ch} onClick={() => setCanal(ch)} style={{ flex: 1, padding: '9px', borderRadius: '10px', border: '1px solid', borderColor: canal === ch ? ORANGE : '#e2e8f0', background: canal === ch ? `${ORANGE}10` : '#fff', color: canal === ch ? ORANGE : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          {CANAL_LABELS[ch]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {productos.length > 0 && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Producto destacado (opcional)</label>
                      <select value={productoId} onChange={e => setProductoId(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                        <option value="">Sin producto</option>
                        {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}{p.precio ? ` — ${p.precio}` : ''}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Programar envío (opcional)</label>
                    <input type="datetime-local" value={programarPara} onChange={e => setProgramarPara(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Vacío = envío inmediato</div>
                  </div>
                </div>
              </div>

              {/* Email */}
              {(canal === 'email' || canal === 'ambos') && (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>📧 Email</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Asunto</label>
                      <input value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Asunto del email" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Imagen del email (opcional)</label>
                      {imagenUrl ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img src={imagenUrl} alt="preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                          <button onClick={() => setImagenUrl('')} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px', borderRadius: '10px', border: '2px dashed #e2e8f0', cursor: subiendoImagen ? 'default' : 'pointer', background: '#f8fafc' }}>
                          <span style={{ fontSize: '28px' }}>🖼️</span>
                          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{subiendoImagen ? 'Subiendo...' : 'Haz clic para subir imagen'}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>JPG, PNG, WEBP · máx 5MB</span>
                          <input type="file" accept="image/*" style={{ display: 'none' }} disabled={subiendoImagen} onChange={e => { const f = e.target.files?.[0]; if (f) subirImagen(f) }} />
                        </label>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Cuerpo del email</label>
                      <textarea value={cuerpoEmail} onChange={e => setCuerpoEmail(e.target.value)} rows={8} placeholder="Usa el agente IA para generar el contenido ✨" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {(canal === 'whatsapp' || canal === 'ambos') && (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>💬 WhatsApp</h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>Usa {'{{nombre}}'} para personalizar.</div>
                  <textarea value={mensajeWa} onChange={e => setMensajeWa(e.target.value)} rows={5} placeholder={`Hola {{nombre}} 👋\n\nTe escribimos desde ${nombreVendedor}...`} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>

            {/* Columna derecha — destinatarios */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px', alignSelf: 'start' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>👥 Destinatarios</h3>
                {selContactos.length > 0 && (
                  <span style={{ fontSize: '12px', color: ORANGE, fontWeight: 700, cursor: 'pointer' }} onClick={() => setSelContactos([])}>Deselec.</span>
                )}
              </div>

              {contactos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <div>Sin contactos.</div>
                  <button onClick={() => setVista('contactos')} style={{ marginTop: '12px', padding: '8px 16px', background: ORANGE, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    Agregar →
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar contacto..." style={{ flex: 1, padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={toggleTodos} style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {selContactos.length === contactosFiltrados.length ? 'Deselec. todos' : 'Sel. todos'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '380px', overflowY: 'auto' }}>
                    {contactosFiltrados.map(c => {
                      const sel = selContactos.includes(c.id)
                      return (
                        <div key={c.id} onClick={() => toggleContacto(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', background: sel ? `${ORANGE}08` : '#f8fafc', border: `1px solid ${sel ? ORANGE + '40' : '#f1f5f9'}` }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${sel ? ORANGE : '#cbd5e1'}`, background: sel ? ORANGE : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 900 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{c.nombre || 'Sin nombre'}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.email || 'Sin email'}{c.whatsapp ? ` · ${c.whatsapp}` : ''}
                            </div>
                          </div>
                          {c.empresa && <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>{c.empresa}</span>}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
                    {selContactos.length} de {contactos.length} seleccionados
                  </div>
                </>
              )}

              <button
                onClick={guardarCampana}
                disabled={guardando || !nombre.trim() || selContactos.length === 0}
                style={{ marginTop: '20px', width: '100%', padding: '14px', background: nombre.trim() && selContactos.length > 0 ? DARK : '#e2e8f0', color: nombre.trim() && selContactos.length > 0 ? '#fff' : '#94a3b8', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: nombre.trim() && selContactos.length > 0 ? 'pointer' : 'default', fontFamily: 'inherit' }}
              >
                {guardando ? 'Guardando...' : `💾 Guardar campaña${selContactos.length > 0 ? ` (${selContactos.length} dest.)` : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
