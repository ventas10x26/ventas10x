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

const SUGERENCIAS = [
  'Campaña de bienvenida para nuevos usuarios',
  'Recordatorio a usuarios con trial a punto de vencer',
  'Anuncio de nueva feature: red social Ventas10x',
  'Reactivación para usuarios inactivos',
  'Felicitaciones a vendedores con deals cerrados este mes',
]

function formatFecha(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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

  const generar = async () => {
    if (!instruccion.trim() || generando) return
    const texto = instruccion.trim()
    setInstruccion('')
    setGenerando(true)
    setHistorial(prev => [...prev, { role: 'user', text: texto }])

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `Eres un experto en email marketing para Ventas10x, plataforma SaaS de ventas para Latinoamérica.

Genera el contenido completo de una campaña. Responde ÚNICAMENTE con JSON válido sin backticks:
{
  "nombre": "Nombre corto de la campaña",
  "asunto": "Asunto del email atractivo max 60 chars",
  "cuerpo_email": "Cuerpo en texto plano, profesional y cercano, 3-4 párrafos, sin saludo inicial, con CTA claro al final",
  "mensaje_wa": "Mensaje WhatsApp max 300 chars con {{nombre}}, emoji relevante y link https://ventas10x.co/dashboard",
  "explicacion": "Una línea con la estrategia de esta campaña"
}

Tono: profesional pero cercano, motivador, español latinoamericano.`,
          messages: [{ role: 'user', content: texto }]
        })
      })

      const data = await res.json()
      const rawText = data.content?.[0]?.text || ''

      try {
        const parsed = JSON.parse(rawText)
        setHistorial(prev => [...prev,
          { role: 'ai', text: `✅ ¡Listo! Generé "${parsed.nombre}".\n\n💡 ${parsed.explicacion}\n\nRevisa y ajusta los campos abajo antes de guardar.` }
        ])
        onGenerar({
          nombre: parsed.nombre,
          asunto: parsed.asunto,
          cuerpoEmail: parsed.cuerpo_email,
          mensajeWa: parsed.mensaje_wa,
        })
        setGenerado(true)
      } catch {
        setHistorial(prev => [...prev,
          { role: 'ai', text: '⚠️ Error procesando respuesta. Intenta con más detalles sobre la campaña.' }
        ])
      }
    } catch {
      setHistorial(prev => [...prev,
        { role: 'ai', text: '❌ Error de conexión. Intenta de nuevo.' }
      ])
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

      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '14px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          placeholder="Ej: Recordatorio para usuarios con trial vencido esta semana..."
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

  const toggleSeleccion = (id: string) => setSeleccionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleTodos = () => seleccionados.length === vendedoresFiltrados.length ? setSeleccionados([]) : setSeleccionados(vendedoresFiltrados.map(v => v.id))

  const handleGenerarIA = (data: { nombre: string; asunto: string; cuerpoEmail: string; mensajeWa: string }) => {
    setNombre(data.nombre); setAsunto(data.asunto); setCuerpoEmail(data.cuerpoEmail); setMensajeWa(data.mensajeWa)
  }

  const guardarCampana = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    try {
      const destIds = filtroFiltro === 'seleccionados' ? seleccionados : []
      const res = await fetch('/api/admin/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, asunto, cuerpo_email: cuerpoEmail, mensaje_wa: mensajeWa, canal, destinatarios_ids: destIds, destinatarios_filtro: filtroFiltro, programada_para: programarPara || null }),
      })
      const data = await res.json()
      if (data.ok) { setCampanas(prev => [data.campana, ...prev]); setVista('lista'); resetForm() }
    } finally { setGuardando(false) }
  }

  const enviarCampana = async (campanaId: string) => {
    setEnviando(campanaId); setWaLinks([]); setResultado(null)
    try {
      const res = await fetch(`/api/admin/campanas/${campanaId}/enviar`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setResultado({ enviados: data.enviados, errores: data.errores })
        setWaLinks(data.wa_links || [])
        setCampanas(prev => prev.map(c => c.id === campanaId ? { ...c, estado: 'enviada', total_enviados: data.enviados } : c))
      }
    } finally { setEnviando(null) }
  }

  const resetForm = () => {
    setNombre(''); setAsunto(''); setCuerpoEmail(''); setMensajeWa('')
    setProgramarPara(''); setSeleccionados([]); setCanal('ambos'); setFiltroFiltro('seleccionados')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: DARK, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>📣 Campañas</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', marginTop: '2px' }}>Envía mensajes a vendedores seleccionados · Solo superadmin</div>
        </div>
        <button onClick={() => { setVista(vista === 'nueva' ? 'lista' : 'nueva'); resetForm() }} style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
          {vista === 'nueva' ? '← Ver lista' : '+ Nueva campaña'}
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>

        {resultado && (
          <div style={{ marginBottom: '20px', padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, color: '#15803d' }}>Campaña enviada</div>
              <div style={{ fontSize: '13px', color: '#16a34a' }}>{resultado.enviados} enviados · {resultado.errores} errores</div>
            </div>
            {waLinks.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Links WhatsApp:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                  {waLinks.map((link, i) => <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#16a34a', wordBreak: 'break-all' }}>{link}</a>)}
                </div>
              </div>
            )}
            <button onClick={() => setResultado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>×</button>
          </div>
        )}

        {vista === 'lista' ? (
          campanas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📣</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>No hay campañas aún</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {campanas.map(c => (
                <div key={c.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{c.nombre}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: `${ESTADO_COLORS[c.estado]}20`, color: ESTADO_COLORS[c.estado] }}>{c.estado.toUpperCase()}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{CANAL_LABELS[c.canal]}</span>
                    </div>
                    {c.asunto && <div style={{ fontSize: '13px', color: '#64748b' }}>Asunto: {c.asunto}</div>}
                    {c.programada_para && <div style={{ fontSize: '12px', color: '#f59e0b' }}>⏰ {formatFecha(c.programada_para)}</div>}
                    {c.enviada_at && <div style={{ fontSize: '12px', color: '#22c55e' }}>✓ Enviada: {formatFecha(c.enviada_at)}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {[{ label: 'Dest.', val: c.total_destinatarios, color: '#3b82f6' }, { label: 'Enviados', val: c.total_enviados, color: '#22c55e' }, { label: 'Errores', val: c.total_errores, color: '#ef4444' }].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {c.estado !== 'enviada' && (
                    <button onClick={() => enviarCampana(c.id)} disabled={enviando === c.id} style={{ padding: '10px 20px', background: enviando === c.id ? '#e2e8f0' : ORANGE, color: enviando === c.id ? '#94a3b8' : '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: enviando === c.id ? 'default' : 'pointer' }}>
                      {enviando === c.id ? 'Enviando...' : '🚀 Enviar ahora'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <AgenteIA onGenerar={handleGenerarIA} />

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
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Vacío = envío inmediato</div>
                  </div>
                </div>
              </div>

              {(canal === 'email' || canal === 'ambos') && (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>📧 Email</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Asunto</label>
                      <input value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Asunto del email" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>Cuerpo del email</label>
                      <textarea value={cuerpoEmail} onChange={e => setCuerpoEmail(e.target.value)} rows={8} placeholder="Usa el agente IA para generar el contenido automáticamente ✨" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>
              )}

              {(canal === 'whatsapp' || canal === 'ambos') && (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>💬 WhatsApp</h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>Usa {'{{nombre}}'} para personalizar.</div>
                  <textarea value={mensajeWa} onChange={e => setMensajeWa(e.target.value)} rows={5} placeholder={`Hola {{nombre}} 👋\n\nTe escribimos desde Ventas10x...`} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px', alignSelf: 'start' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>👥 Destinatarios</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Filtro rápido</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[{ key: 'seleccionados', label: '☑️ Manual' }, { key: 'todos', label: '🌐 Todos' }, { key: 'plan_trial', label: '⏳ Trial' }, { key: 'plan_starter', label: '🟢 Starter' }, { key: 'plan_pro', label: '⭐ Pro' }].map(f => (
                    <button key={f.key} onClick={() => setFiltroFiltro(f.key)} style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', background: filtroFiltro === f.key ? DARK : '#f1f5f9', color: filtroFiltro === f.key ? '#fff' : '#64748b' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filtroFiltro === 'seleccionados' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar vendedor..." style={{ flex: 1, padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={toggleTodos} style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {seleccionados.length === vendedoresFiltrados.length ? 'Deselec. todos' : 'Sel. todos'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '380px', overflowY: 'auto' }}>
                    {vendedoresFiltrados.map(v => {
                      const nombreV = [v.nombre, v.apellido].filter(Boolean).join(' ') || 'Sin nombre'
                      const sel = seleccionados.includes(v.id)
                      return (
                        <div key={v.id} onClick={() => toggleSeleccion(v.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', background: sel ? `${ORANGE}08` : '#f8fafc', border: `1px solid ${sel ? ORANGE + '40' : '#f1f5f9'}` }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${sel ? ORANGE : '#cbd5e1'}`, background: sel ? ORANGE : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 900 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{nombreV}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.email || 'Sin email'}{v.whatsapp ? ` · ${v.whatsapp}` : ''}</div>
                          </div>
                          {v.industria && <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>{v.industria}</span>}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>{seleccionados.length} de {vendedores.length} seleccionados</div>
                </>
              ) : (
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  Se enviará a todos los vendedores del filtro <strong>{filtroFiltro}</strong>.
                </div>
              )}

              <button onClick={guardarCampana} disabled={guardando || !nombre.trim()} style={{ marginTop: '20px', width: '100%', padding: '14px', background: nombre.trim() ? DARK : '#e2e8f0', color: nombre.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: nombre.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                {guardando ? 'Guardando...' : '💾 Guardar campaña'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
