// Ruta destino: src/components/admin/FenixDeudoresClient.tsx
//
// Dos formas de cargar casos de deudor a fenix_clientes_deuda:
// 1. Pegar texto libre (una nota, un mensaje, una descripción informal) y
//    que la IA lo convierta en registros estructurados.
// 2. Subir un Excel o CSV con la cartera que un cliente entregó -- se
//    parsea en el navegador con xlsx (ya es dependencia del proyecto, no
//    hace falta ninguna librería nueva) y se mapean columnas por nombres
//    comunes (nombre, teléfono, cédula, empresa, monto, etc.).
//
// En ambos casos el resultado es un preview EDITABLE antes de guardar --
// nunca se inserta directo a la base de datos sin que un humano lo revise,
// ni el texto de la IA ni las filas del archivo.
//
// Si llega desde el botón "Crear como deudor" de una conversación puntual
// (/admin/fenix/conversaciones), trae prefillTelefono + conversacionId: al
// guardar, además de crear el registro, reclasifica esa conversación a
// tipo='deudor' (lo hace el propio endpoint POST).
//
// Toggle "Agente" en Casos cargados:
// - Nunca contactado (agente_activo=false) -> clic aprueba (si hace falta)
//   y dispara POST .../iniciar-agente, que manda la plantilla de WhatsApp
//   pre-aprobada del primer contacto.
// - Ya contactado (agente_activo=true) -> clic pausa/reanuda la IA sobre la
//   conversación ya abierta (PATCH .../fenix-conversaciones/[id], mismo
//   mecanismo que usa el panel de Conversaciones), sin reenviar la
//   plantilla.
'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'

type RegistroDeuda = {
  nombre_deudor: string | null
  telefono: string | null
  documento_identidad: string | null
  empresa_deudora: string | null
  cliente_encarga: string | null
  monto: number | null
  notas: string | null
}

type ClienteDeuda = RegistroDeuda & {
  id: string
  estado: string
  estado_aprobacion: 'pendiente' | 'aprobado' | 'rechazado'
  agente_activo: boolean
  primer_contacto_en: string | null
  origen: string
  conversacion_id: string | null
  bot_pausado: boolean | null
  created_at: string
}

const ACCENT = '#F5821F'
const CAMPOS: { key: keyof RegistroDeuda; label: string; tipo: 'text' | 'number' }[] = [
  { key: 'nombre_deudor', label: 'Nombre', tipo: 'text' },
  { key: 'telefono', label: 'Teléfono', tipo: 'text' },
  { key: 'documento_identidad', label: 'Documento', tipo: 'text' },
  { key: 'empresa_deudora', label: 'Empresa deudora', tipo: 'text' },
  { key: 'cliente_encarga', label: 'Cliente que encarga', tipo: 'text' },
  { key: 'monto', label: 'Monto', tipo: 'number' },
  { key: 'notas', label: 'Notas', tipo: 'text' },
]

// Alias de encabezados de Excel/CSV -> campo del registro. Todo en
// minúsculas y sin espacios extra para la comparación.
const ALIAS_COLUMNAS: Record<string, keyof RegistroDeuda> = {
  'nombre': 'nombre_deudor', 'nombre_deudor': 'nombre_deudor', 'deudor': 'nombre_deudor', 'nombre del deudor': 'nombre_deudor',
  'telefono': 'telefono', 'teléfono': 'telefono', 'celular': 'telefono', 'whatsapp': 'telefono', 'numero': 'telefono', 'número': 'telefono',
  'documento': 'documento_identidad', 'cedula': 'documento_identidad', 'cédula': 'documento_identidad', 'nit': 'documento_identidad', 'documento_identidad': 'documento_identidad', 'identificacion': 'documento_identidad', 'identificación': 'documento_identidad',
  'empresa': 'empresa_deudora', 'empresa_deudora': 'empresa_deudora', 'razon social': 'empresa_deudora', 'razón social': 'empresa_deudora',
  'cliente': 'cliente_encarga', 'cliente_encarga': 'cliente_encarga', 'encarga': 'cliente_encarga', 'acreedor': 'cliente_encarga',
  'monto': 'monto', 'valor': 'monto', 'deuda': 'monto', 'saldo': 'monto',
  'notas': 'notas', 'observaciones': 'notas', 'nota': 'notas',
}

function registroVacio(): RegistroDeuda {
  return { nombre_deudor: null, telefono: null, documento_identidad: null, empresa_deudora: null, cliente_encarga: null, monto: null, notas: null }
}

function formatFecha(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function FenixDeudoresClient({
  initialRegistros,
  prefillTelefono,
  conversacionId,
}: {
  initialRegistros: ClienteDeuda[]
  prefillTelefono?: string
  conversacionId?: string
}) {
  const [registros, setRegistros] = useState<ClienteDeuda[]>(initialRegistros)
  const [tab, setTab] = useState<'texto' | 'archivo'>('texto')
  const [texto, setTexto] = useState(prefillTelefono ? `Teléfono: ${prefillTelefono}\n` : '')
  const [preview, setPreview] = useState<RegistroDeuda[]>([])
  const [origenPreview, setOrigenPreview] = useState<'texto_ia' | 'excel' | 'csv'>('texto_ia')
  const [analizando, setAnalizando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [agenteBusyId, setAgenteBusyId] = useState<string | null>(null)

  async function analizarTexto() {
    if (!texto.trim()) return
    setAnalizando(true)
    setError(null)
    setExito(null)
    try {
      const res = await fetch('/api/admin/fenix-deudores/parse-texto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo analizar')
      if (!data.registros || data.registros.length === 0) {
        setError('La IA no identificó ningún caso de deudor en ese texto. Revísalo y prueba de nuevo, o agrega una fila manual abajo.')
        setPreview([registroVacio()])
      } else {
        setPreview(data.registros)
      }
      setOrigenPreview('texto_ia')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo analizar el texto')
    } finally {
      setAnalizando(false)
    }
  }

  function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setExito(null)
    setNombreArchivo(file.name)
    const esCsv = file.name.toLowerCase().endsWith('.csv')

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const workbook = esCsv
          ? XLSX.read(data as string, { type: 'string' })
          : XLSX.read(data as ArrayBuffer, { type: 'array' })
        const hoja = workbook.Sheets[workbook.SheetNames[0]]
        const filas: Record<string, unknown>[] = XLSX.utils.sheet_to_json(hoja, { defval: null })

        if (filas.length === 0) {
          setError('El archivo no tiene filas de datos.')
          return
        }

        const mapeadas: RegistroDeuda[] = filas.map((fila) => {
          const registro = registroVacio()
          for (const [colOriginal, valor] of Object.entries(fila)) {
            const colNormalizada = colOriginal.trim().toLowerCase()
            const campo = ALIAS_COLUMNAS[colNormalizada]
            if (!campo || valor === null || valor === undefined || valor === '') continue
            if (campo === 'monto') {
              const n = typeof valor === 'number' ? valor : Number(String(valor).replace(/[^\d.-]/g, ''))
              registro.monto = Number.isNaN(n) ? null : n
            } else if (campo === 'telefono') {
              registro.telefono = String(valor).replace(/\D/g, '') || null
            } else {
              registro[campo] = String(valor).trim()
            }
          }
          return registro
        })

        setPreview(mapeadas)
        setOrigenPreview(esCsv ? 'csv' : 'excel')
      } catch (err) {
        console.error(err)
        setError('No se pudo leer el archivo -- confirma que sea un .xlsx, .xls o .csv válido.')
      }
    }
    if (esCsv) reader.readAsText(file)
    else reader.readAsArrayBuffer(file)
  }

  function actualizarCampo(index: number, campo: keyof RegistroDeuda, valor: string) {
    setPreview((prev) => prev.map((r, i) => {
      if (i !== index) return r
      if (campo === 'monto') {
        const n = Number(valor.replace(/[^\d.-]/g, ''))
        return { ...r, monto: valor.trim() === '' ? null : (Number.isNaN(n) ? r.monto : n) }
      }
      return { ...r, [campo]: valor.trim() === '' ? null : valor }
    }))
  }

  function eliminarFila(index: number) {
    setPreview((prev) => prev.filter((_, i) => i !== index))
  }

  function agregarFilaVacia() {
    setPreview((prev) => [...prev, registroVacio()])
  }

  async function guardarRegistros() {
    if (preview.length === 0) return
    setGuardando(true)
    setError(null)
    setExito(null)
    try {
      const res = await fetch('/api/admin/fenix-deudores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registros: preview, origen: origenPreview, conversacion_id: conversacionId || null }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo guardar')
      setExito(`Se guardaron ${data.insertados} caso(s) de deudor.${conversacionId ? ' La conversación quedó reclasificada como deudor.' : ''}`)
      setPreview([])
      setTexto('')
      setNombreArchivo(null)
      const listaRes = await fetch('/api/admin/fenix-deudores')
      const listaData = await listaRes.json()
      if (listaRes.ok) setRegistros(listaData.registros || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function toggleAgente(row: ClienteDeuda) {
    setAgenteBusyId(row.id)
    setError(null)
    setExito(null)
    try {
      if (!row.agente_activo) {
        // Primera activación: aprueba si hace falta y dispara el primer contacto.
        if (row.estado_aprobacion !== 'aprobado') {
          const resAprobar = await fetch(`/api/admin/fenix-deudores/${row.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado_aprobacion: 'aprobado' }),
          })
          const dataAprobar = await resAprobar.json()
          if (!resAprobar.ok) throw new Error(dataAprobar.error || 'No se pudo aprobar el caso')
        }
        const res = await fetch(`/api/admin/fenix-deudores/${row.id}/iniciar-agente`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo activar el agente')
        setRegistros((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...data.deudor, bot_pausado: false } : r)))
        setExito(`Se activó el agente y se envió el primer contacto a ${row.nombre_deudor || 'este deudor'}.`)
      } else {
        // Ya contactado: pausa o reanuda la IA sobre la conversación abierta.
        if (!row.conversacion_id) throw new Error('Este caso no tiene una conversación asociada todavía.')
        const nuevoPausado = !row.bot_pausado
        const res = await fetch(`/api/admin/fenix-conversaciones/${row.conversacion_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bot_pausado: nuevoPausado }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el agente')
        setRegistros((prev) => prev.map((r) => (r.id === row.id ? { ...r, bot_pausado: nuevoPausado } : r)))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el agente')
    } finally {
      setAgenteBusyId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '24px clamp(16px, 4vw, 32px)', maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, marginBottom: '4px' }}>
            Fénix Consultores
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Cartera · Casos de deudor</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            Carga los casos que un cliente empresarial entrega para gestión de cobro -- pegando el detalle en texto libre, o subiendo el Excel/CSV de la cartera.
          </p>
        </div>

        {conversacionId && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}40`, fontSize: '13px', color: '#92400e' }}>
            📱 Creando este caso a partir de la conversación con <b>{prefillTelefono}</b> -- al guardar, esa conversación queda reclasificada como deudor.
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '13px', color: '#dc2626' }}>
            {error}
          </div>
        )}
        {exito && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '13px', color: '#15803d' }}>
            ✅ {exito}
          </div>
        )}

        {/* Tabs de importación */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            {([{ key: 'texto', label: '✏️ Pegar texto' }, { key: 'archivo', label: '📄 Subir Excel o CSV' }] as const).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                fontSize: '13px', fontWeight: 700, padding: '8px 14px', borderRadius: '9px',
                background: tab === t.key ? '#0f172a' : '#f1f5f9', color: tab === t.key ? '#fff' : '#64748b',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'texto' ? (
            <div>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Pega acá el detalle -- por ejemplo: 'Juan Pérez, cédula 1234567, debe $2.500.000 a Almacenes XYZ, teléfono 3001234567, deuda de 6 meses'"
                rows={6}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0',
                  fontSize: '13.5px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
              <button onClick={analizarTexto} disabled={analizando || !texto.trim()} style={{
                marginTop: '10px', padding: '10px 20px', borderRadius: '10px', border: 'none',
                background: analizando || !texto.trim() ? '#e2e8f0' : ACCENT, color: analizando || !texto.trim() ? '#94a3b8' : '#fff',
                fontWeight: 700, fontSize: '13.5px', cursor: analizando || !texto.trim() ? 'default' : 'pointer', fontFamily: 'inherit',
              }}>
                {analizando ? 'Analizando con IA…' : '🤖 Analizar con IA'}
              </button>
            </div>
          ) : (
            <div>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={manejarArchivo} style={{ fontSize: '13px' }} />
              {nombreArchivo && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Archivo cargado: {nombreArchivo}</p>}
              <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '8px' }}>
                Columnas reconocidas: nombre, teléfono, documento/cédula/NIT, empresa, cliente (quien encarga el cobro), monto/valor, notas. El orden no importa.
              </p>
            </div>
          )}
        </div>

        {/* Preview editable */}
        {preview.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', marginBottom: '20px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Revisa antes de guardar ({preview.length} {preview.length === 1 ? 'caso' : 'casos'})
              </h2>
              <button onClick={agregarFilaVacia} style={{ fontSize: '12px', fontWeight: 600, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer' }}>
                + Agregar fila
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
              <thead>
                <tr>
                  {CAMPOS.map((c) => (
                    <th key={c.key} style={{ textAlign: 'left', fontSize: '11px', color: '#94a3b8', fontWeight: 700, padding: '4px 6px', borderBottom: '1px solid #e2e8f0' }}>
                      {c.label}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i}>
                    {CAMPOS.map((c) => (
                      <td key={c.key} style={{ padding: '4px 6px', borderBottom: '1px solid #f1f5f9' }}>
                        <input
                          value={r[c.key] ?? ''}
                          onChange={(e) => actualizarCampo(i, c.key, e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                      </td>
                    ))}
                    <td style={{ padding: '4px 6px' }}>
                      <button onClick={() => eliminarFila(i)} title="Eliminar fila" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={guardarRegistros} disabled={guardando} style={{
              marginTop: '14px', padding: '10px 22px', borderRadius: '10px', border: 'none',
              background: guardando ? '#e2e8f0' : '#15803d', color: guardando ? '#94a3b8' : '#fff',
              fontWeight: 700, fontSize: '13.5px', cursor: guardando ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>
              {guardando ? 'Guardando…' : `💾 Guardar ${preview.length} ${preview.length === 1 ? 'caso' : 'casos'}`}
            </button>
          </div>
        )}

        {/* Lista de casos ya guardados */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
            Casos cargados ({registros.length})
          </h2>
          {registros.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Todavía no hay casos cargados.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                <thead>
                  <tr>
                    {['Nombre', 'Teléfono', 'Empresa', 'Monto', 'Cliente', 'Estado', 'Agente', 'Origen', 'Creado'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: '#94a3b8', fontWeight: 700, padding: '6px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const busy = agenteBusyId === r.id
                    let label = 'Activar'
                    let bg = '#f1f5f9'
                    let fg = '#64748b'
                    if (r.agente_activo && r.bot_pausado) {
                      label = '⏸ Pausado'
                      bg = '#fef3c7'
                      fg = '#92400e'
                    } else if (r.agente_activo) {
                      label = '🟢 Activo'
                      bg = '#dcfce7'
                      fg = '#15803d'
                    }
                    return (
                      <tr key={r.id}>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>{r.nombre_deudor || '—'}</td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>{r.telefono || '—'}</td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>{r.empresa_deudora || '—'}</td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>{r.monto != null ? `$${r.monto.toLocaleString('es-CO')}` : '—'}</td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>{r.cliente_encarga || '—'}</td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: `${ACCENT}18`, color: ACCENT }}>{r.estado}</span>
                        </td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                          <button
                            onClick={() => toggleAgente(r)}
                            disabled={busy}
                            title={r.agente_activo ? (r.bot_pausado ? 'Reanudar el agente' : 'Pausar el agente') : 'Activar el agente (envía el primer contacto)'}
                            style={{
                              fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                              background: bg, color: fg, border: 'none',
                              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'inherit',
                            }}
                          >
                            {busy ? '…' : label}
                          </button>
                        </td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '11.5px', color: '#94a3b8' }}>{r.origen}</td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '11.5px', color: '#94a3b8' }}>{formatFecha(r.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
