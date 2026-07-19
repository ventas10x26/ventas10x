// Tipos y helpers compartidos para el agente IA del asesor Pulse Motor.

export const PULSE_VOZ_BUCKET = 'pulse-agente-voz'
export const PULSE_VOZ_HISTORIAL_MAX = 40

export type PulseVozMuestra = {
  id: string
  created_at: string
  transcripcion: string
  duracion_seg: number
  storage_path: string | null
  origen?: 'onboarding' | 'agente'
  /** Entradas antiguas sin archivo de audio */
  solo_transcripcion?: boolean
}

export type PulseVozMuestraPublica = PulseVozMuestra & {
  audio_url: string | null
}

export type PulseAgentConfig = {
  perfil: string
  especializacion: string
  propuesta_valor: string
  primer_mensaje: string
  system_prompt: string
}

export type PulseAgentMetadata = {
  onboarding_demo?: boolean
  marca?: string
  whatsapp?: string
  estilo_venta?: string
  obstaculo?: string
  muestra_voz?: string
  duracion_voz_seg?: number | null
  manejo_objeciones?: string
  respuestas_tipo?: string
  agent_config?: PulseAgentConfig
  voz_historial?: PulseVozMuestra[]
  configured_at?: string
  updated_at?: string
  bot_activo?: boolean
}

export function slugEmailParaStorage(email: string): string {
  return email.trim().toLowerCase().replace(/@/g, '_at_').replace(/[^a-z0-9._-]/g, '_')
}

export function normalizarVozHistorial(raw: unknown): PulseVozMuestra[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x) => x && typeof x === 'object' && typeof (x as PulseVozMuestra).id === 'string')
    .map((x) => x as PulseVozMuestra)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export type PulseAgenteDTO = {
  agent_id: string | null
  email: string
  nombre: string
  marca: string
  whatsapp: string
  estilo_venta: string
  obstaculo: string
  muestra_voz: string
  duracion_voz_seg: number | null
  manejo_objeciones: string
  respuestas_tipo: string
  perfil: string
  especializacion: string
  propuesta_valor: string
  primer_mensaje: string
  system_prompt: string
  configured_at: string | null
  updated_at: string | null
  voz_historial: PulseVozMuestraPublica[]
  bot_activo: boolean
}

// Genérico y agnóstico de marca — Pulse Motor no se casa con ninguna marca de auto
// (ver skill pulsemotor-strategy). Solo se usa como placeholder antes de que el asesor
// complete el onboarding o regenere su config con IA con su marca real.
const DEFAULT_CONFIG: PulseAgentConfig = {
  perfil: 'Asesor de Ventas 🚗',
  especializacion: 'Portafolio de vehículos nuevos 🚗',
  propuesta_valor:
    'Responder leads de vehículos nuevos por WhatsApp con velocidad, claridad y enfoque en cerrar.',
  primer_mensaje:
    '¡Hola! Vi tu interés en un vehículo nuevo. Te puedo enviar ficha técnica o simular financiamiento al instante. ¿Te gustaría agendar un test drive?',
  system_prompt:
    'Eres un asesor de ventas de vehículos nuevos en Colombia. Tono cercano, profesional, sin inventar precios.',
}

export function metadataToDTO(
  row: { id: string; email: string; nombre: string; metadata?: unknown } | null,
  emailFallback: string
): PulseAgenteDTO | null {
  if (!row) return null
  const meta = (row.metadata && typeof row.metadata === 'object'
    ? row.metadata
    : {}) as PulseAgentMetadata
  const cfg = { ...DEFAULT_CONFIG, ...(meta.agent_config || {}) }

  return {
    agent_id: row.id,
    email: row.email || emailFallback,
    nombre: row.nombre || '',
    marca: meta.marca || '',
    whatsapp: meta.whatsapp || '',
    estilo_venta: meta.estilo_venta || '',
    obstaculo: meta.obstaculo || '',
    muestra_voz: meta.muestra_voz || '',
    duracion_voz_seg: meta.duracion_voz_seg ?? null,
    manejo_objeciones: meta.manejo_objeciones || '',
    respuestas_tipo: meta.respuestas_tipo || '',
    bot_activo: meta.bot_activo !== false,
    perfil: cfg.perfil,
    especializacion: cfg.especializacion,
    propuesta_valor: cfg.propuesta_valor,
    primer_mensaje: cfg.primer_mensaje,
    system_prompt: cfg.system_prompt,
    configured_at: meta.configured_at || null,
    updated_at: meta.updated_at || null,
    voz_historial: normalizarVozHistorial(meta.voz_historial).map((m) => ({
      ...m,
      audio_url: null,
    })),
  }
}

export function dtoToMetadata(
  dto: Partial<PulseAgenteDTO>,
  prev: PulseAgentMetadata = {}
): PulseAgentMetadata {
  const cfg: PulseAgentConfig = {
    perfil: dto.perfil ?? prev.agent_config?.perfil ?? DEFAULT_CONFIG.perfil,
    especializacion:
      dto.especializacion ?? prev.agent_config?.especializacion ?? DEFAULT_CONFIG.especializacion,
    propuesta_valor:
      dto.propuesta_valor ?? prev.agent_config?.propuesta_valor ?? DEFAULT_CONFIG.propuesta_valor,
    primer_mensaje:
      dto.primer_mensaje ?? prev.agent_config?.primer_mensaje ?? DEFAULT_CONFIG.primer_mensaje,
    system_prompt:
      dto.system_prompt ?? prev.agent_config?.system_prompt ?? DEFAULT_CONFIG.system_prompt,
  }

  return {
    ...prev,
    voz_historial: prev.voz_historial,
    marca: dto.marca ?? prev.marca,
    whatsapp: dto.whatsapp ?? prev.whatsapp,
    estilo_venta: dto.estilo_venta ?? prev.estilo_venta,
    obstaculo: dto.obstaculo ?? prev.obstaculo,
    muestra_voz: dto.muestra_voz ?? prev.muestra_voz,
    duracion_voz_seg:
      dto.duracion_voz_seg !== undefined ? dto.duracion_voz_seg : prev.duracion_voz_seg,
    manejo_objeciones: dto.manejo_objeciones ?? prev.manejo_objeciones,
    respuestas_tipo: dto.respuestas_tipo ?? prev.respuestas_tipo,
    agent_config: cfg,
    bot_activo: dto.bot_activo !== undefined ? dto.bot_activo : prev.bot_activo,
    updated_at: new Date().toISOString(),
  }
}

/** Prompt de sistema para generar respuestas a leads (WhatsApp). */
export function buildResponderSystemPrompt(
  meta: PulseAgentMetadata | null,
  vendedorNombre: string,
  vendedorMarca: string
): string {
  const cfg = meta?.agent_config
  const bloques: string[] = [
    `Eres el copiloto de WhatsApp de ${vendedorNombre}, asesor de ${vendedorMarca} en Colombia.`,
    'Redactás mensajes que el VENDEDOR envía en primera persona. NUNCA digas que eres IA.',
    'Tono cercano, profesional, colombiano. Máximo 4 líneas / 280 caracteres.',
    'Saludá por nombre, mencioná el modelo, cerrá con UNA pregunta. Máximo 1-2 emojis.',
    'NO inventes precios, promociones ni fechas específicas.',
  ]

  if (cfg?.system_prompt?.trim()) {
    bloques.push(`INSTRUCCIONES DEL ASESOR:\n${cfg.system_prompt.trim()}`)
  }
  if (meta?.muestra_voz?.trim()) {
    bloques.push(`TONO DE VOZ A IMITAR (muestra del asesor):\n"${meta.muestra_voz.trim()}"`)
  }
  if (meta?.estilo_venta?.trim()) {
    bloques.push(`ESTILO DE VENTA:\n${meta.estilo_venta.trim()}`)
  }
  if (meta?.obstaculo?.trim()) {
    bloques.push(`OBSTÁCULO A SUPERAR EN CADA LEAD:\n${meta.obstaculo.trim()}`)
  }
  if (meta?.manejo_objeciones?.trim()) {
    bloques.push(`MANEJO DE OBJECIONES:\n${meta.manejo_objeciones.trim()}`)
  }
  if (meta?.respuestas_tipo?.trim()) {
    bloques.push(`RESPUESTAS TIPO / GUIONES:\n${meta.respuestas_tipo.trim()}`)
  }
  if (cfg?.especializacion?.trim()) {
    bloques.push(`ESPECIALIZACIÓN: ${cfg.especializacion}`)
  }

  bloques.push(`Responde ÚNICAMENTE con JSON sin backticks:
{
  "mensaje": "texto listo para WhatsApp"
}`)

  return bloques.join('\n\n')
}
