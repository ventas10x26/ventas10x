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
      temperature: 0,
      system: `Sos un analista de datos que ayuda a cruzar hojas de Excel/CSV de un concesionario de autos (ventas, retomas, financiación, pólizas, asesores, inventario, etc.) dentro de DataBridge, una herramienta de Pulse Motor.

Un algoritmo automático ya cruzó nombres de campo (coincidencia exacta, substring, tokens compartidos) y valores repetidos entre columnas. El usuario sospecha que faltan relaciones reales que ese algoritmo simple no detecta — por ejemplo un campo numérico "Vend" en una hoja que en realidad es el mismo código que "ID_Asesor" en otra, o "Ubic." que corresponde a "Sede".

Te paso el esquema completo (campos + muestra de valores reales de cada hoja) y las relaciones ya detectadas. El usuario te dice en qué fijarte. Proponé un par campoA/campoB SOLO si tenés evidencia real de una de estas dos formas:
1. Overlap de valores: varios de los valores de muestra de un campo aparecen literalmente entre los valores de muestra del otro campo (mismos IDs, códigos, emails, VINs, etc.).
2. Incompatibilidad de tipo/semántica descartada: los dos campos son del mismo tipo de dato conceptual (dos identificadores, dos emails, dos fechas, etc.) — NUNCA propongas un par entre campos de naturaleza distinta (ej. una cédula/ID numérico contra un email, un nombre contra una fecha) aunque aparezcan en la misma fila por coincidencia.

Nunca inventes una relación para "tener algo que mostrar". Es preferible devolver "encontradas" vacío a proponer un cruce sin sentido.

CONSISTENCIA OBLIGATORIA: "encontradas" y "explicacion" tienen que decir exactamente lo mismo. Si tu "explicacion" dice que no hay nada nuevo o que ya estaba cubierto, "encontradas" va vacío — nunca dejes un par en "encontradas" que tu propia explicación contradice o descarta.

Respondé ÚNICAMENTE con JSON válido, sin texto antes ni después, con esta forma exacta:
{"encontradas": [{"tablaA": "...", "campoA": "...", "tablaB": "...", "campoB": "...", "razon": "..."}], "explicacion": "1-2 oraciones en español, tono directo, dirigidas al usuario"}

Usá exactamente los nombres de hoja y de campo tal como aparecen en el esquema (son sensibles a mayúsculas/tildes).`,
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
    const tipoDe = (tabla: string, campo: string): string | null => {
      const sheet = sheets.find(s => s.name === tabla)
      return sheet?.fields.find(f => f.name === campo)?.tipo ?? null
    }
    const fieldExists = (tabla: string, campo: string) => tipoDe(tabla, campo) !== null
    // Defensa adicional a la instrucción del prompt: email y fecha son tipos muy distintivos que
    // nunca deberían cruzarse con un tipo distinto (evita falsos positivos tipo cédula↔email).
    const tiposCompatibles = (tipoA: string | null, tipoB: string | null) => {
      if (!tipoA || !tipoB) return true
      if (tipoA === tipoB) return true
      const distintivos = new Set(['email', 'fecha'])
      if (distintivos.has(tipoA) || distintivos.has(tipoB)) return false
      return true
    }
    const encontradas = (parsed.encontradas || []).filter(r =>
      r.tablaA !== r.tablaB
      && fieldExists(r.tablaA, r.campoA) && fieldExists(r.tablaB, r.campoB)
      && tiposCompatibles(tipoDe(r.tablaA, r.campoA), tipoDe(r.tablaB, r.campoB))
    )

    return NextResponse.json({ ok: true, encontradas, explicacion: parsed.explicacion || '' })
  } catch (e) {
    console.error('[databridge/evaluar-relacion] error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
