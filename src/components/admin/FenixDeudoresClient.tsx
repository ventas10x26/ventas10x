// Ruta destino: src/components/admin/FenixDeudoresClient.tsx
// Importación de deudores desde CSV + cola de aprobación manual antes de
// que el agente les mande el primer contacto (por plantilla, ver la ruta
// .../iniciar-agente). El parseo de CSV es manual (sin librerías nuevas)
// -- suficiente para un CSV simple exportado desde Excel/Sheets, con
// comillas para campos que traen comas.
'use client'

import { useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'

const ACCENT = '#F5821F'

type Deudor = {
  id: string
  nombre: string
  documento: string | null
  telefono: string
  empresa_acreedora: string | null
  monto_deuda: number | null
  fecha_vencimiento: string | null
  concepto: string | null
  numero_obligacion: string | null
  notas: string | null
  estado_aprobacion: 'pendiente' | 'aprobado' | 'rechazado'
  estado_gestion: string
  agente_activo: boolean
  primer_contacto_en: string | null
  created_at: string
}

type FilaCSV = {
  nombre: string
  documento?: string
  telefono: string
  empresa_acreedora?: string
  monto_deuda?: number | null
  fecha_vencimiento?: string | null
  concepto?: string
  numero_obligacion?: string
  notas?: string
}

const COLUMNAS_ESPERADAS = ['nombre', 'documento', 'telefono', 'empresa_acreedora', 'monto_deuda', 'fecha_vencimiento', 'concepto', 'numero_obligacion', 'notas']

// Parser de CSV sencillo: soporta comillas dobles y comas dentro de campos
// citados. No pretende cubrir todo el spec de CSV -- es suficiente para
// archivos exportados desde Excel/Sheets, que es el caso real de uso acá.
function parsearCSV(texto: string): string[][] {
  const filas: string[][] = []
  let fila: string[] = []
  let campo = ''
  let dentroComillas = false
  const limpio = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < limpio.length; i++) {
    const ch = limpio[i]
    if (dentroComillas) {
      if (ch === '"') {
        if (limpio[i + 1] === '"') { campo += '"'; i++ }
        else dentroComillas = false
      } else campo += ch
    } else {
      if (ch === '"') dentroComillas = true
      else if (ch === ',') { fila.push(campo); campo = '' }
      else if (ch === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = '' }
      else campo += ch
    }
  }
  if (campo.length > 0 || fila.length > 0) { fila.push(campo); filas.push(fila) }
  return filas.filter((f) => f.some((c) => c.trim() !== ''))
}

function normalizarMonto(v: string): number | null {
  const limpio = v.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(limpio)
  return Number.isNaN(n) ? null : n
}

function filasCSVaObjetos(filas: string[][]): { filas: FilaCSV[]; erroresEncabezado: string | null } {
  if (filas.length < 2) return { filas: [], erroresEncabezado: 'El archivo no tiene filas de datos.' }
  const encabezado = filas[0].map((h) => h.trim().toLowerCase())
  const faltantes = ['nombre', 'telefono'].filter((c) => !encabezado.includes(c))
  if (faltantes.length > 0) {
    return { filas: [], erroresEncabezado: `Faltan columnas obligatorias: ${faltantes.join(', ')}. Columnas esperadas: ${COLUMNAS_ESPERADAS.join(', ')}` }
  }
  const idx = (col: string) => encabezado.indexOf(col)
  const objetos: FilaCSV[] = filas.slice(1).map((f) => ({
    nombre: f[idx('nombre')]?.trim() || '',
    documento: idx('documento') >= 0 ? f[idx('documento')]?.trim() : undefined,
    telefono: f[idx('telefono')]?.trim() || '',
    empresa_acreedora: idx('empresa_acreedora') >= 0 ? f[idx('empresa_acreedora')]?.trim() : undefined,
    monto_deuda: idx('monto_deuda') >= 0 ? normalizarMonto(f[idx('monto_deuda')] || '') : null,
    fecha_vencimiento: idx('fecha_vencimiento') >= 0 ? (f[idx('fecha_vencimiento')]?.trim() || null) : null,
    concepto: idx('concepto') >= 0 ? f[idx('concepto')]?.trim() : undefined,
    numero_obligacion: idx('numero_obligacion') >= 0 ? f[idx('numero_obligacion')]?.trim() : undefined,
    notas: idx('notas') >= 0 ? f[idx('notas')]?.trim() : undefined,
  }))
  return { filas: objetos, erroresEncabezado: null }
}

function descargarPlantillaCSV() {
  const contenido = COLUMNAS_ESPERADAS.join(',') + '\n' +
    'Juan Pérez,79xxxxxx,573001234567,Almacenes XYZ,1500000,2026-06-15,Factura #445,OBL-2026-0445,Contactar en horario de tarde'
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla-deudores-fenix.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const inputStyle: CSSProperties = {
  padding: '8px 12px', borderRadius: 9, border: '1px solid #e2e8f0',
  fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff',
}

const ESTADO_APROBACION_COLOR: Record<string, string> = { pendiente: '#f59e0b', aprobado: '#22c55e', rechazado: '#ef4444' }
const ESTADO_GESTION_LABEL: Record<string, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', en_negociacion: 'En negociación',
  acuerdo: 'Acuerdo', pagado: 'Pagado', juridico: 'Jurídico', sin_respuesta: 'Sin respuesta',
}

export function FenixDeudoresClient({ initialDeudores }: { initialDeudores: Deudor[] }) {
  const [deudores, setDeudores] = useState<Deudor[]>(initialDeudores)
  const [filtro, setFiltro] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('todos')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [previewFilas, setPreviewFilas] = useState<FilaCSV[] | null>(null)
  const [erroresPreview, setErroresPreview] = useState<string | null>(null)
  const [importando, setImportando] = useState(false)
  const [procesandoId, setProcesandoId] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const filtrados = filtro === 'todos' ? deudores : deudores.filter((d) => d.estado_aprobacion === filtro)
  const conteo = {
    pendiente: deudores.filter((d) => d.estado_aprobacion === 'pendiente').length,
    aprobado: deudores.filter((d) => d.estado_aprobacion === 'aprobado').length,
    rechazado: deudores.filter((d) => d.estado_aprobacion === 'rechazado').length,
    activos: deudores.filter((d) => d.agente_activo).length,
  }

  function onArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setError('')
    setMensaje('')
    const lector = new FileReader()
    lector.onload = () => {
      const texto = String(lector.result || '')
      const { filas, erroresEncabezado } = filasCSVaObjetos(parsearCSV(texto))
      if (erroresEncabezado) { setErroresPreview(erroresEncabezado); setPreviewFilas(null); return }
      setErroresPreview(null)
      setPreviewFilas(filas)
    }
    lector.readAsText(archivo, 'utf-8')
  }

  async function confirmarImportacion() {
    if (!previewFilas || previewFilas.length === 0) return
    setImportando(true)
    setError('')
    setMensaje('')
    try {
      const res = await fetch('/api/admin/fenix-deudores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filas: previewFilas }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo importar')
      setMensaje(`✓ ${data.importados} deudores importados${data.omitidos ? ` · ${data.omitidos} omitidos por error de formato` : ''}`)
      setPreviewFilas(null)
      if (fileRef.current) fileRef.current.value = ''
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al importar')
    } finally {
      setImportando(false)
    }
  }

  async function recargar() {
    const res = await fetch('/api/admin/fenix-deudores')
    const data = await res.json()
    if (res.ok) setDeudores(data.deudores || [])
  }

  async function cambiarAprobacion(id: string, estado_aprobacion: 'aprobado' | 'rechazado') {
    setProcesandoId(id)
    setError('')
    try {
      const res = await fetch(`/api/admin/fenix-deudores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_aprobacion }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar')
      setDeudores((ds) => ds.map((d) => (d.id === id ? data.deudor : d)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar')
    } finally {
      setProcesandoId(null)
    }
  }

  async function aprobarSeleccionados() {
    for (const id of seleccionados) await cambiarAprobacion(id, 'aprobado')
    setSeleccionados(new Set())
  }

  async function iniciarAgente(id: string) {
    if (!confirm('Esto manda el primer mensaje real por WhatsApp (plantilla aprobada) a este deudor. ¿Continuar?')) return
    setProcesandoId(id)
    setError('')
    setMensaje('')
    try {
      const res = await fetch(`/api/admin/fenix-deudores/${id}/iniciar-agente`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar')
      setDeudores((ds) => ds.map((d) => (d.id === id ? data.deudor : d)))
      setMensaje('✓ Primer contacto enviado, agente activado')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar el agente')
    } finally {
      setProcesandoId(null)
    }
  }

  function toggleSeleccion(id: string) {
    setSeleccionados((s) => {
      const nuevo = new Set(s)
      if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id)
      return nuevo
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '24px clamp(16px, 4vw, 32px) 60px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
              Fénix Consultores
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Cartera de deudores</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', maxWidth: 520 }}>
              Importa deudores desde CSV, apruébalos y activa el agente de cobro para que les escriba el primer contacto.
            </p>
          </div>
          <Link href="/admin/fenix/agente" style={{
            padding: '9px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff',
            color: '#0f172a', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            🤖 Agente de cobro
          </Link>
        </div>

        {/* Métricas */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { label: 'Pendientes', valor: conteo.pendiente, color: '#f59e0b' },
            { label: 'Aprobados', valor: conteo.aprobado, color: '#22c55e' },
            { label: 'Rechazados', valor: conteo.rechazado, color: '#ef4444' },
            { label: 'Agente activo', valor: conteo.activos, color: ACCENT },
          ].map((m) => (
            <div key={m.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 18px', minWidth: 96 }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: m.color }}>{m.valor}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
          </div>
        )}
        {mensaje && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, color: '#16a34a' }}>
            {mensaje}
          </div>
        )}

        {/* Importar CSV */}
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: 14.5, fontWeight: 800, margin: 0, color: '#0f172a' }}>Importar deudores desde CSV</h2>
            <button onClick={descargarPlantillaCSV} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              ↓ Descargar plantilla CSV
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px' }}>
            Columnas: <code>{COLUMNAS_ESPERADAS.join(', ')}</code> — solo <strong>nombre</strong> y <strong>telefono</strong> son obligatorias.
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onArchivoSeleccionado} style={{ fontSize: 13 }} />

          {erroresPreview && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{erroresPreview}</p>}

          {previewFilas && previewFilas.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Vista previa — {previewFilas.length} fila{previewFilas.length !== 1 ? 's' : ''}
              </p>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, maxHeight: 260, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      {['Nombre', 'Teléfono', 'Empresa', 'Monto', 'Vence', 'Concepto'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', background: '#f7f6f4', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewFilas.slice(0, 50).map((f, i) => (
                      <tr key={i}>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f1f0ed' }}>{f.nombre || <span style={{ color: '#dc2626' }}>falta</span>}</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f1f0ed' }}>{f.telefono || <span style={{ color: '#dc2626' }}>falta</span>}</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f1f0ed' }}>{f.empresa_acreedora || '—'}</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f1f0ed' }}>{f.monto_deuda != null ? f.monto_deuda.toLocaleString('es-CO') : '—'}</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f1f0ed' }}>{f.fecha_vencimiento || '—'}</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f1f0ed', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.concepto || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewFilas.length > 50 && <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 6 }}>Mostrando 50 de {previewFilas.length}.</p>}
              <button
                onClick={confirmarImportacion}
                disabled={importando}
                style={{ marginTop: 12, padding: '10px 18px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, cursor: importando ? 'default' : 'pointer', opacity: importando ? 0.7 : 1, fontFamily: 'inherit' }}
              >
                {importando ? 'Importando…' : `Importar ${previewFilas.length} deudores (quedan pendientes de aprobación)`}
              </button>
            </div>
          )}
        </section>

        {/* Filtros + acciones masivas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {([
            { key: 'todos', label: 'Todos' },
            { key: 'pendiente', label: `Pendientes · ${conteo.pendiente}` },
            { key: 'aprobado', label: `Aprobados · ${conteo.aprobado}` },
            { key: 'rechazado', label: `Rechazados · ${conteo.rechazado}` },
          ] as const).map((f) => (
            <button key={f.key} onClick={() => setFiltro(f.key)} style={{
              fontSize: 11.5, fontWeight: 700, padding: '6px 12px', borderRadius: 999,
              background: filtro === f.key ? '#0f172a' : '#fff', color: filtro === f.key ? '#fff' : '#64748b',
              border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {f.label}
            </button>
          ))}
          {seleccionados.size > 0 && (
            <button onClick={aprobarSeleccionados} style={{
              fontSize: 11.5, fontWeight: 700, padding: '6px 12px', borderRadius: 999,
              background: '#22c55e18', color: '#16a34a', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ✓ Aprobar {seleccionados.size} seleccionados
            </button>
          )}
        </div>

        {/* Tabla */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['', 'Nombre', 'Teléfono', 'Empresa', 'Monto', 'Aprobación', 'Gestión', 'Agente', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#4a4a47', fontSize: 11, background: '#f7f6f4', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Sin deudores para este filtro.</td></tr>
                ) : filtrados.map((d) => (
                  <tr key={d.id}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f0ed' }}>
                      {d.estado_aprobacion === 'pendiente' && (
                        <input type="checkbox" checked={seleccionados.has(d.id)} onChange={() => toggleSeleccion(d.id)} />
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f0ed', fontWeight: 700, color: '#0f172a' }}>{d.nombre}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f0ed' }}>{d.telefono}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f0ed', color: '#64748b' }}>{d.empresa_acreedora || '—'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f0ed' }}>{d.monto_deuda != null ? `$${d.monto_deuda.toLocaleString('es-CO')}` : '—'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f0ed' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: `${ESTADO_APROBACION_COLOR[d.estado_aprobacion]}18`, color: ESTADO_APROBACION_COLOR[d.estado_aprobacion] }}>
                        {d.estado_aprobacion}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f0ed', color: '#64748b' }}>{ESTADO_GESTION_LABEL[d.estado_gestion] || d.estado_gestion}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f0ed' }}>
                      {d.agente_activo ? <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 12 }}>🟢 Activo</span> : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f0ed', whiteSpace: 'nowrap' }}>
                      {d.estado_aprobacion === 'pendiente' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button disabled={procesandoId === d.id} onClick={() => cambiarAprobacion(d.id, 'aprobado')} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: '#22c55e18', color: '#16a34a', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Aprobar</button>
                          <button disabled={procesandoId === d.id} onClick={() => cambiarAprobacion(d.id, 'rechazado')} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: '#ef444418', color: '#dc2626', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rechazar</button>
                        </div>
                      )}
                      {d.estado_aprobacion === 'aprobado' && !d.agente_activo && (
                        <button disabled={procesandoId === d.id} onClick={() => iniciarAgente(d.id)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {procesandoId === d.id ? '…' : '🤖 Iniciar agente'}
                          </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
