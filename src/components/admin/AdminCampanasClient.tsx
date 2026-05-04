// Ruta destino: src/components/admin/AdminCampanasClient.tsx
'use client'
import { useState } from 'react'

const DARK = '#0f1c2e'
const ORANGE = '#FF6B2B'

type Vendedor = {
  id: string
  nombre: string | null
  apellido: string | null
  empresa: string | null
  slug: string | null
  industria: string | null
  whatsapp: string | null
  email: string | null
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

function formatFecha(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

type Props = {
  vendedores: Vendedor[]
  campanasIniciales: Campana[]
}

export function AdminCampanasClient({ vendedores, campanasIniciales }: Props) {
  const [campanas, setCampanas] = useState<Campana[]>(campanasIniciales)
  const [vista, setVista] = useState<'lista' | 'nueva'>('lista')
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [filtroFiltro, setFiltroFiltro] = useState<string>('seleccionados')
  const [busqueda, setBusqueda] = useState('')
  const [canal, setCanal] = useState<'email' | 'whatsapp' | 'ambos'>('ambos')
  const [nombre, setNombre] = useState('')
  const [asunto, setAsunto] = useState('')
  const [cuerpoEmail, setCuerpoEmail] = useState('')
  const [mensajeWa, setMensajeWa] = useState('')
  const [programarPara, setProgramarPara] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [waLinks, setWaLinks] = useState<string[]>([])
  const [resultado, setResultado] = useState<{ enviados: number; errores: number } | null>(null)

  const vendedoresFiltrados = vendedores.filter(v => {
    const q = busqueda.toLowerCase()
    const n = [v.nombre, v.apellido, v.empresa, v.email].filter(Boolean).join(' ').toLowerCase()
    return n.includes(q)
  })

  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleTodos = () => {
    if (seleccionados.length === vendedoresFiltrados.length) setSeleccionados([])
    else setSeleccionados(vendedoresFiltrados.map(v => v.id))
  }

  const guardarCampana = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    try {
      const destIds = filtroFiltro === 'seleccionados' ? seleccionados : []
      const res = await fetch('/api/admin/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, asunto, cuerpo_email: cuerpoEmail, mensaje_wa: mensajeWa,
          canal, destinatarios_ids: destIds,
          destinatarios_filtro: filtroFiltro,
          programada_para: programarPara || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setCampanas(prev => [data.campana, ...prev])
        setVista('lista')
        resetForm()
      }
    } finally {
      setGuardando(false)
    }
  }

  const enviarCampana = async (campanaId: string) => {
    setEnviando(campanaId)
    setWaLinks([])
    setResultado(null)
    try {
      const res = await fetch(`/api/admin/campanas/${campanaId}/enviar`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setResultado({ enviados: data.enviados, errores: data.errores })
        setWaLinks(data.wa_links || [])
        setCampanas(prev => prev.map(c => c.id === campanaId ? { ...c, estado: 'enviada', total_enviados: data.enviados } : c))
      }
    } finally {
      setEnviando(null)
    }
  }

  const resetForm = () => {
    setNombre(''); setAsunto(''); setCuerpoEmail(''); setMensajeWa('')
    setProgramarPara(''); setSeleccionados([]); setCanal('ambos')
    setFiltroFiltro('seleccionados')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: DARK, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>📣 Campañas</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', marginTop: '2px' }}>
            Envía mensajes a vendedores seleccionados · Solo superadmin
          </div>
        </div>
        <button
          onClick={() => { setVista(vista === 'nueva' ? 'lista' : 'nueva'); resetForm() }}
          style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
        >
          {vista === 'nueva' ? '← Ver lista' : '+ Nueva campaña'}
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>

        {/* Resultado del último envío */}
        {resultado && (
          <div style={{ marginBottom: '20px', padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, color: '#15803d' }}>Campaña enviada</div>
              <div style={{ fontSize: '13px', color: '#16a34a' }}>{resultado.enviados} enviados · {resultado.errores} errores</div>
            </div>
            {waLinks.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Links WhatsApp para envío manual:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                  {waLinks.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#16a34a', wordBreak: 'break-all' }}>{link}</a>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setResultado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>×</button>
          </div>
        )}

        {vista === 'lista' ? (
          <>
            {/* Lista de campañas */}
            {campanas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📣</div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>No hay campañas aún</div>
                <div style={{ fontSize: '14px', marginTop: '4px' }}>Crea tu primera campaña para comunicarte con los vendedores</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {campanas.map(c => (
                  <div key={c.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{c.nombre}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: `${ESTADO_COLORS[c.estado]}20`, color: ESTADO_COLORS[c.estado] }}>
                          {c.estado.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{CANAL_LABELS[c.canal]}</span>
                      </div>
                      {c.asunto && <div style={{ fontSize: '13px', color: '#64748b' }}>Asunto: {c.asunto}</div>}
                      {c.programada_para && <div style={{ fontSize: '12px', color: '#f59e0b' }}>⏰ Programada: {formatFecha(c.programada_para)}</div>}
                      {c.enviada_at && <div style={{ fontSize: '12px', color: '#22c55e' }}>✓ Enviada: {formatFecha(c.enviada_at)}</div>}
                    </div>

                    {/* Stats */}
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

                    {/* Acción */}
                    {c.estado !== 'enviada' && (
                      <button
                        onClick={() => enviarCampana(c.id)}
                        disabled={enviando === c.id}
                        style={{ padding: '10px 20px', background: enviando === c.id ? '#e2e8f0' : ORANGE, color: enviando === c.id ? '#94a3b8' : '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: enviando === c.id ? 'default' : 'pointer' }}
                      >
                        {enviando === c.id ? 'Enviando...' : '🚀 Enviar ahora'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ── FORMULARIO NUEVA CAMPAÑA ── */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            {/* Col izquierda — configuración */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>⚙️ Configuración</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Nombre de la campaña *</label>
                    <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Recordatorio trial vencido" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Canal</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['email', 'whatsapp', 'ambos'] as const).map(c => (
                        <button key={c} onClick={() => setCanal(c)} style={{ flex: 1, padding: '9px', borderRadius: '10px', border: '1px solid', borderColor: canal === c ? ORANGE : '#e2e8f0', background: canal === c ? `${ORANGE}10` : '#fff', color: canal === c ? ORANGE : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          {CANAL_LABELS[c]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Programar envío (opcional)</label>
                    <input type="datetime-local" value={programarPara} onChange={e => setProgramarPara(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Vacío = envío inmediato al hacer clic en "Enviar"</div>
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
                      <input value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Ej: Novedades de tu plataforma Ventas10x" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Cuerpo del email</label>
                      <textarea value={cuerpoEmail} onChange={e => setCuerpoEmail(e.target.value)} rows={8} placeholder="Escribe el contenido del email. Puedes usar saltos de línea. El nombre del vendedor se agrega automáticamente en el saludo." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {(canal === 'whatsapp' || canal === 'ambos') && (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>💬 WhatsApp</h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>Usa {'{{nombre}}'} para personalizar. Se generarán links para envío manual o vía Twilio.</div>
                  <textarea value={mensajeWa} onChange={e => setMensajeWa(e.target.value)} rows={5} placeholder={`Hola {{nombre}} 👋\n\nTe escribimos desde Ventas10x con una novedad importante...`} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>

            {/* Col derecha — destinatarios */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>👥 Destinatarios</h3>

              {/* Filtro rápido */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Filtro rápido</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'seleccionados', label: '☑️ Selección manual' },
                    { key: 'todos', label: '🌐 Todos' },
                    { key: 'plan_trial', label: '⏳ Trial' },
                    { key: 'plan_starter', label: '🟢 Starter' },
                    { key: 'plan_pro', label: '⭐ Pro' },
                  ].map(f => (
                    <button key={f.key} onClick={() => setFiltroFiltro(f.key)} style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', background: filtroFiltro === f.key ? DARK : '#f1f5f9', color: filtroFiltro === f.key ? '#fff' : '#64748b' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buscador y lista */}
              {filtroFiltro === 'seleccionados' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar vendedor..." style={{ flex: 1, padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={toggleTodos} style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {seleccionados.length === vendedoresFiltrados.length ? 'Deselec. todos' : 'Sel. todos'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
                    {vendedoresFiltrados.map(v => {
                      const nombre = [v.nombre, v.apellido].filter(Boolean).join(' ') || 'Sin nombre'
                      const seleccionado = seleccionados.includes(v.id)
                      return (
                        <div
                          key={v.id}
                          onClick={() => toggleSeleccion(v.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', background: seleccionado ? `${ORANGE}08` : '#f8fafc', border: `1px solid ${seleccionado ? ORANGE + '40' : '#f1f5f9'}`, transition: 'all 0.15s' }}
                        >
                          <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${seleccionado ? ORANGE : '#cbd5e1'}`, background: seleccionado ? ORANGE : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {seleccionado && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 900 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{nombre}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {v.email || 'Sin email'} {v.whatsapp ? `· ${v.whatsapp}` : ''}
                            </div>
                          </div>
                          {v.industria && <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>{v.industria}</span>}
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
                    {seleccionados.length} de {vendedores.length} seleccionados
                  </div>
                </>
              )}

              {filtroFiltro !== 'seleccionados' && (
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  Se enviará a todos los vendedores del filtro <strong>{filtroFiltro}</strong> al momento de enviar.
                </div>
              )}

              {/* Botón guardar */}
              <button
                onClick={guardarCampana}
                disabled={guardando || !nombre.trim()}
                style={{ marginTop: '20px', width: '100%', padding: '14px', background: nombre.trim() ? DARK : '#e2e8f0', color: nombre.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: nombre.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}
              >
                {guardando ? 'Guardando...' : '💾 Guardar campaña'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
