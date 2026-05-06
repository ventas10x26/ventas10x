// Ruta destino: src/components/dashboard/VendedorCampanasClient.tsx
'use client'
import { useState, useEffect, useRef } from 'react'

const DARK = '#0f1c2e'
const ORANGE = '#FF6B2B'

type Producto = { id: string; nombre: string; imagen_principal: string | null; precio: string | null }
type Contacto = { id: string; nombre: string | null; email: string | null; whatsapp: string | null; empresa: string | null; fuente: string }
type Campana = {
  id: string; nombre: string; canal: string; estado: string
  asunto: string | null; cuerpo_email: string | null; mensaje_wa: string | null
  total_destinatarios: number; total_enviados: number
  programada_para: string | null; enviada_at: string | null; created_at: string
  productos: Producto | null
}

const CANAL_LABELS: Record<string, string> = { email: '📧 Email', whatsapp: '💬 WhatsApp', ambos: '📧💬 Ambos' }
const ESTADO_COLORS: Record<string, string> = { borrador: '#94a3b8', programada: '#f59e0b', enviada: '#22c55e', error: '#ef4444' }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

type Props = {
  vendedorId: string
  nombreVendedor: string
  slug: string
  productos: Producto[]
}

export function VendedorCampanasClient({ vendedorId, nombreVendedor, slug, productos }: Props) {
  const [vista, setVista] = useState<'campanas' | 'contactos' | 'nueva'>('campanas')
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [selContactos, setSelContactos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [waLinks, setWaLinks] = useState<string[]>([])
  const [resultado, setResultado] = useState<{ enviados: number } | null>(null)
  const [generandoIA, setGenerandoIA] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form nueva campaña
  const [nombre, setNombre] = useState('')
  const [canal, setCanal] = useState<'email' | 'whatsapp' | 'ambos'>('ambos')
  const [asunto, setAsunto] = useState('')
  const [cuerpoEmail, setCuerpoEmail] = useState('')
  const [mensajeWa, setMensajeWa] = useState('')
  const [productoId, setProductoId] = useState('')
  const [programarPara, setProgramarPara] = useState('')

  // Form contacto manual
  const [formContacto, setFormContacto] = useState({ nombre: '', email: '', whatsapp: '', empresa: '' })
  const [guardandoContacto, setGuardandoContacto] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const landingUrl = `https://ventas10x.co/u/${slug}`

  const cargar = async () => {
    setLoading(true)
    const [c, ct] = await Promise.all([
      fetch('/api/dashboard/campanas').then(r => r.json()),
      fetch('/api/dashboard/campanas?tipo=contactos').then(r => r.json()),
    ])
    setCampanas(c.campanas || [])
    setContactos(ct.contactos || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const contactosFiltrados = contactos.filter(c => {
    const q = busqueda.toLowerCase()
    return !q || [c.nombre, c.email, c.whatsapp, c.empresa].some(v => v?.toLowerCase().includes(q))
  })

  const agregarContacto = async () => {
    if (!formContacto.nombre.trim()) return
    setGuardandoContacto(true)
    try {
      await fetch('/api/dashboard/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'agregar_contacto', ...formContacto }),
      })
      setFormContacto({ nombre: '', email: '', whatsapp: '', empresa: '' })
      await cargar()
    } finally { setGuardandoContacto(false) }
  }

  const importarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/['"]/g, ''))
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = vals[i] || '' })
      return {
        nombre: obj.nombre || obj.name || '',
        email: obj.email || obj.correo || '',
        whatsapp: obj.whatsapp || obj.celular || obj.telefono || obj.phone || '',
        empresa: obj.empresa || obj.company || '',
      }
    }).filter(r => r.nombre || r.email || r.whatsapp)

    await fetch('/api/dashboard/campanas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'importar_csv', contactos: rows }),
    })
    await cargar()
    if (fileRef.current) fileRef.current.value = ''
  }

  const generarConIA = async () => {
    if (generandoIA) return
    setGenerandoIA(true)
    try {
      const productoSeleccionado = productos.find(p => p.id === productoId)
      const instruccion = `Genera una campaña de ventas para ${nombreVendedor}. 
      ${productoSeleccionado ? `Producto destacado: ${productoSeleccionado.nombre}${productoSeleccionado.precio ? ` · Precio: ${productoSeleccionado.precio}` : ''}` : ''}
      Link de la página: ${landingUrl}
      Canal: ${canal}`

      const res = await fetch('/api/dashboard/campanas/generar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruccion }),
      })
      const data = await res.json()
      if (data.ok) {
        if (!nombre) setNombre(data.nombre || '')
        setAsunto(data.asunto || '')
        setCuerpoEmail(data.cuerpo_email || '')
        setMensajeWa(data.mensaje_wa || '')
      }
    } finally { setGenerandoIA(false) }
  }

  const crearCampana = async () => {
    if (!nombre.trim()) return
    setLoading(true)
    try {
      await fetch('/api/dashboard/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'crear_campana', nombre, canal, asunto, cuerpo_email: cuerpoEmail,
          mensaje_wa: mensajeWa, producto_id: productoId || null,
          contacto_ids: selContactos, programada_para: programarPara || null,
        }),
      })
      await cargar()
      setVista('campanas')
      resetForm()
    } finally { setLoading(false) }
  }

  const enviarCampana = async (campanaId: string) => {
    if (selContactos.length === 0) { alert('Selecciona al menos un contacto'); return }
    setEnviando(campanaId); setWaLinks([]); setResultado(null)
    try {
      const res = await fetch('/api/dashboard/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'enviar_campana', campana_id: campanaId, contacto_ids: selContactos }),
      })
      const data = await res.json()
      if (data.ok) {
        setResultado({ enviados: data.enviados })
        setWaLinks(data.wa_links || [])
        await cargar()
      }
    } finally { setEnviando(null) }
  }

  const resetForm = () => {
    setNombre(''); setAsunto(''); setCuerpoEmail(''); setMensajeWa('')
    setProductoId(''); setProgramarPara(''); setSelContactos([])
    setCanal('ambos')
  }

  const toggleContacto = (id: string) => setSelContactos(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: DARK, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>📣 Mis Campañas</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', marginTop: '2px' }}>Envía emails y WhatsApp a tus contactos</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['campanas', 'contactos', 'nueva'] as const).map(v => (
            <button key={v} onClick={() => setVista(v)} style={{ padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: vista === v ? ORANGE : 'rgba(255,255,255,.1)', color: '#fff' }}>
              {v === 'campanas' ? '📋 Campañas' : v === 'contactos' ? '👥 Contactos' : '+ Nueva campaña'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>

        {/* Resultado */}
        {resultado && (
          <div style={{ marginBottom: '20px', padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>✅</span>
            <div style={{ fontWeight: 700, color: '#15803d' }}>{resultado.enviados} emails enviados</div>
            {waLinks.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Links WhatsApp:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '100px', overflowY: 'auto' }}>
                  {waLinks.map((l, i) => <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#16a34a', wordBreak: 'break-all' }}>{l}</a>)}
                </div>
              </div>
            )}
            <button onClick={() => setResultado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>×</button>
          </div>
        )}

        {/* VISTA CAMPAÑAS */}
        {vista === 'campanas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
            <div>
              {campanas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📣</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Sin campañas aún</div>
                  <button onClick={() => setVista('nueva')} style={{ marginTop: '12px', padding: '11px 24px', background: ORANGE, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                    Crear primera campaña →
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {campanas.map(c => (
                    <div key={c.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{c.nombre}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: `${ESTADO_COLORS[c.estado] || '#94a3b8'}20`, color: ESTADO_COLORS[c.estado] || '#94a3b8' }}>{c.estado.toUpperCase()}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{CANAL_LABELS[c.canal]}</span>
                        {c.productos && <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600 }}>📦 {c.productos.nombre}</span>}
                      </div>
                      {c.asunto && <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Asunto: {c.asunto}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {[{ l: 'Dest.', v: c.total_destinatarios, c: '#3b82f6' }, { l: 'Enviados', v: c.total_enviados, c: '#22c55e' }].map(s => (
                          <div key={s.l} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: s.c }}>{s.v}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.l}</div>
                          </div>
                        ))}
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>{timeAgo(c.created_at)}</div>
                        {c.estado !== 'enviada' && (
                          <button onClick={() => enviarCampana(c.id)} disabled={enviando === c.id || selContactos.length === 0}
                            style={{ padding: '9px 18px', background: enviando === c.id || selContactos.length === 0 ? '#e2e8f0' : ORANGE, color: enviando === c.id || selContactos.length === 0 ? '#94a3b8' : '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                            {enviando === c.id ? 'Enviando...' : selContactos.length === 0 ? 'Selecciona contactos →' : `🚀 Enviar a ${selContactos.length}`}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selector de contactos */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '18px', alignSelf: 'start', position: 'sticky', top: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>👥 Seleccionar destinatarios</div>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '10px', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{selContactos.length} seleccionados</span>
                <button onClick={() => setSelContactos(selContactos.length === contactosFiltrados.length ? [] : contactosFiltrados.map(c => c.id))} style={{ fontSize: '11px', color: ORANGE, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {selContactos.length === contactosFiltrados.length ? 'Deselec. todos' : 'Sel. todos'}
                </button>
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {contactosFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                    Sin contactos. <button onClick={() => setVista('contactos')} style={{ color: ORANGE, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Agregar →</button>
                  </div>
                ) : contactosFiltrados.map(c => {
                  const sel = selContactos.includes(c.id)
                  return (
                    <div key={c.id} onClick={() => toggleContacto(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: sel ? `${ORANGE}08` : '#f8fafc', border: `1px solid ${sel ? ORANGE + '30' : '#f1f5f9'}` }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${sel ? ORANGE : '#cbd5e1'}`, background: sel ? ORANGE : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sel && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre || 'Sin nombre'}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{c.email || c.whatsapp || ''}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* VISTA CONTACTOS */}
        {vista === 'contactos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
            {/* Lista */}
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar contacto..." style={{ flex: 1, padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', minWidth: '150px' }} />
                <div style={{ fontSize: '13px', color: '#94a3b8', alignSelf: 'center' }}>{contactosFiltrados.length} contactos</div>
              </div>

              {contactosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>Sin contactos</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Agrega manualmente o importa un CSV</div>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        {['Nombre', 'Email', 'WhatsApp', 'Empresa', 'Fuente'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contactosFiltrados.map((c, i) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{c.nombre || '—'}</td>
                          <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b' }}>{c.email || '—'}</td>
                          <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b' }}>{c.whatsapp || '—'}</td>
                          <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b' }}>{c.empresa || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: c.fuente === 'csv' ? '#eff6ff' : '#f0fdf4', color: c.fuente === 'csv' ? '#3b82f6' : '#16a34a' }}>
                              {c.fuente === 'csv' ? '📊 CSV' : '✏️ Manual'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Panel agregar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Agregar manual */}
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>✏️ Agregar contacto</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'nombre', label: 'Nombre *', placeholder: 'Juan García', type: 'text' },
                    { key: 'email', label: 'Email', placeholder: 'juan@email.com', type: 'email' },
                    { key: 'whatsapp', label: 'WhatsApp', placeholder: '+57 300 000 0000', type: 'tel' },
                    { key: 'empresa', label: 'Empresa', placeholder: 'Empresa SAS', type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={formContacto[f.key as keyof typeof formContacto]}
                        onChange={e => setFormContacto(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                  ))}
                  <button onClick={agregarContacto} disabled={guardandoContacto || !formContacto.nombre.trim()}
                    style={{ padding: '11px', background: formContacto.nombre.trim() ? DARK : '#e2e8f0', color: formContacto.nombre.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {guardandoContacto ? 'Guardando...' : '+ Agregar'}
                  </button>
                </div>
              </div>

              {/* Importar CSV */}
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>📊 Importar CSV/Excel</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.6 }}>
                  El archivo debe tener columnas: <strong>nombre, email, whatsapp, empresa</strong>
                </div>
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={importarCSV} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '11px', background: '#f1f5f9', color: '#374151', border: '1px dashed #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  📂 Seleccionar archivo CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VISTA NUEVA CAMPAÑA */}
        {vista === 'nueva' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Agente IA */}
              <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${ORANGE}25`, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${ORANGE}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✨</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Generar con IA</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Selecciona canal y producto, la IA crea el contenido</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {(['email', 'whatsapp', 'ambos'] as const).map(c => (
                    <button key={c} onClick={() => setCanal(c)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', borderColor: canal === c ? ORANGE : '#e2e8f0', background: canal === c ? `${ORANGE}10` : '#fff', color: canal === c ? ORANGE : '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      {c === 'email' ? '📧' : c === 'whatsapp' ? '💬' : '📧💬'} {c}
                    </button>
                  ))}
                </div>
                {productos.length > 0 && (
                  <select value={productoId} onChange={e => setProductoId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', marginBottom: '12px', fontFamily: 'inherit', color: '#374151' }}>
                    <option value="">— Sin producto específico —</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}{p.precio ? ` · ${p.precio}` : ''}</option>)}
                  </select>
                )}
                <button onClick={generarConIA} disabled={generandoIA}
                  style={{ width: '100%', padding: '11px', background: generandoIA ? '#e2e8f0' : ORANGE, color: generandoIA ? '#94a3b8' : '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {generandoIA ? '✨ Generando...' : '✨ Generar contenido con IA'}
                </button>
              </div>

              {/* Config */}
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>⚙️ Configuración</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Nombre *</label>
                    <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Promo Picanto Mayo" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Programar envío (opcional)</label>
                    <input type="datetime-local" value={programarPara} onChange={e => setProgramarPara(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Email */}
              {(canal === 'email' || canal === 'ambos') && (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>📧 Email</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Asunto</label>
                      <input value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Asunto del email" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Cuerpo</label>
                      <textarea value={cuerpoEmail} onChange={e => setCuerpoEmail(e.target.value)} rows={6} placeholder="Usa IA o escribe el contenido..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {(canal === 'whatsapp' || canal === 'ambos') && (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>💬 WhatsApp</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>Usa {'{{nombre}}'} y {'{{link}}'} para personalizar</div>
                  <textarea value={mensajeWa} onChange={e => setMensajeWa(e.target.value)} rows={4} placeholder={`Hola {{nombre}} 👋\n\nTe comparto mi catálogo: {{link}}`} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              )}

              <button onClick={crearCampana} disabled={loading || !nombre.trim()}
                style={{ padding: '14px', background: nombre.trim() ? DARK : '#e2e8f0', color: nombre.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Guardando...' : '💾 Guardar campaña'}
              </button>
            </div>

            {/* Preview producto + selector contactos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Preview producto */}
              {productoId && (() => {
                const p = productos.find(pr => pr.id === productoId)
                return p ? (
                  <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Producto destacado</div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {p.imagen_principal && <img src={p.imagen_principal} alt="" style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />}
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{p.nombre}</div>
                        {p.precio && <div style={{ fontSize: '16px', fontWeight: 800, color: ORANGE }}>{p.precio}</div>}
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <a href={`${landingUrl}#catalogo`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Ver en landing →</a>
                    </div>
                  </div>
                ) : null
              })()}

              {/* Selector destinatarios */}
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>👥 Destinatarios</div>
                  <button onClick={() => setSelContactos(selContactos.length === contactos.length ? [] : contactos.map(c => c.id))} style={{ fontSize: '11px', color: ORANGE, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {selContactos.length === contactos.length ? 'Deselec.' : 'Sel. todos'}
                  </button>
                </div>
                {contactos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                    Sin contactos. <button onClick={() => setVista('contactos')} style={{ color: ORANGE, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Agregar →</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                    {contactos.map(c => {
                      const sel = selContactos.includes(c.id)
                      return (
                        <div key={c.id} onClick={() => toggleContacto(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: sel ? `${ORANGE}08` : '#f8fafc', border: `1px solid ${sel ? ORANGE + '30' : '#f1f5f9'}` }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${sel ? ORANGE : '#cbd5e1'}`, background: sel ? ORANGE : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {sel && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{c.nombre || 'Sin nombre'}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{c.email || c.whatsapp || ''}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#94a3b8' }}>{selContactos.length} de {contactos.length} seleccionados</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
