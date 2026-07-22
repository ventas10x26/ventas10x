// src/app/api/pulse/databridge/evaluar-relacion/route.ts
// Evalúa a fondo (con IA) una posible relación entre hojas de DataBridge que el
// matching por nombre/token no detectó — el usuario describe qué cruzar y Claude
// razona sobre los nombres de campo y una muestra de valores reales.

import { NextRequest, NextResponse } from 'next/server'

interface SheetSummary {
  name: string
  fields: { name: string; tipo: string; muestras: string[] }[]
}

interface RelacionEncontrada {
  tablaA: string
  campoA: string
  tablaB: string
  campoB: string
  razon: string
}

export async function POST(req: NextRequest) {
  try {
    const { mensaje, sheets, relacionesExistentes } = await req.json() as {
      mensaje: string
      sheets: SheetSummary[]
      relacionesExistentes: { a: string; b: string; matches: { fieldA: string; fieldB: string }[] }[]
    }

    if (!mensaje?.trim()) return NextResponse.json({ error: 'mensaje requerido' }, { status: 400 })
    if (!Array.isArray(sheets) || sheets.length < 2) return NextResponse.json({ error: 'se necesitan al menos 2 hojas cargadas' }, { status: 400 })

    const esquema = sheets.map(s =>
      `### ${s.name}\n` + s.fields.map(f => `- ${f.name} (${f.tipo}): ${f.muestras.join(' | ') || 'sin muestras'}`).join('\n')
    ).join('\n\n')

    const existentes = relacionesExistentes.length
      ? relacionesExistentes.map(r => `${r.a} ↔ ${r.b}: ` + r.matches.map(m => `${m.fieldA}=${m.fieldB}`).join(', ')).join('\n')
      : '(ninguna detectada todavía)'

    const { anthropic, CLAUDE_MODEL } = await import('@/lib/anthropic')

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: `Sos un analista de datos que ayuda a cruzar hojas de Excel/CSV de un concesionario de autos (ventas, retomas, financiación, pólizas, asesores, inventario, etc.) dentro de DataBridge, una herramienta de Pulse Motor.

Un algoritmo automático ya cruzó nombres de campo (coincidencia exacta, substring, tokens compartidos) y valores repetidos entre columnas. El usuario sospecha que faltan relaciones reales que ese algoritmo simple no detecta — por ejemplo un campo numérico "Vend" en una hoja que en realidad es el mismo código que "ID_Asesor" en otra, o "Ubic." que corresponde a "Sede".

Te paso el esquema completo (campos + muestra de valores reales de cada hoja) y las relaciones ya detectadas. El usuario te dice en qué fijarte. Buscá relaciones REALES basándote en los valores de muestra (¿aparecen los mismos códigos/nombres/IDs en ambas columnas, aunque el nombre de campo sea distinto?), no solo en similitud de nombre. Si los valores de muestra no alcanzan para confirmar pero el patrón es plausible, igual proponela con una razón honesta sobre el nivel de certeza.

Respondé ÚNICAMENTE con JSON válido, sin texto antes ni después, con esta forma exacta:
{"encontradas": [{"tablaA": "...", "campoA": "...", "tablaB": "...", "campoB": "...", "razon": "..."}], "explicacion": "1-2 oraciones en español, tono directo, dirigidas al usuario"}

Usá exactamente los nombres de hoja y de campo tal como aparecen en el esquema (son sensibles a mayúsculas/tildes). Si no encontrás nada nuevo y razonable, "encontradas" va vacío y "explicacion" dice por qué (ej. no hay valores en común, o ya estaba cubierta).`,
      messages: [
        { role: 'user', content: `ESQUEMA:\n${esquema}\n\nRELACIONES YA DETECTADAS:\n${existentes}\n\nPEDIDO DEL USUARIO:\n${mensaje.trim()}` },
      ],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    let parsed: { encontradas: RelacionEncontrada[]; explicacion: string }
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    } catch {
      return NextResponse.json({ ok: true, encontradas: [], explicacion: raw.slice(0, 400) || 'No pude interpretar la respuesta, intentá reformular el pedido.' })
    }

    // Validar contra el esquema real — nunca confiar en nombres que el modelo pudo inventar.
    const fieldExists = (tabla: string, campo: string) => {
      const sheet = sheets.find(s => s.name === tabla)
      return !!sheet && sheet.fields.some(f => f.name === campo)
    }
    const encontradas = (parsed.encontradas || []).filter(r =>
      r.tablaA !== r.tablaB && fieldExists(r.tablaA, r.campoA) && fieldExists(r.tablaB, r.campoB)
    )

    return NextResponse.json({ ok: true, encontradas, explicacion: parsed.explicacion || '' })
  } catch (e) {
    console.error('[databridge/evaluar-relacion] error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
