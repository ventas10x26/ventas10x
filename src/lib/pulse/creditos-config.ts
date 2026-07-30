// ═══════════════════════════════════════════════════════
// CONFIGURACIÓN CENTRAL DE CRÉDITOS — COBRO POR RESULTADO
// Importar desde cualquier parte de la app
// ═══════════════════════════════════════════════════════
//
// MODELO: el concesionario no paga por el trabajo del agente, paga por el
// resultado que ese trabajo produce. Responder mensajes, hacer follow-up y
// calificar leads es gratis — el agente puede conversar todo lo que necesite.
// El crédito se descuenta solo cuando el lead llega a una etapa que vale plata:
// una cita agendada (test drive) o una venta cerrada.
//
// Por qué: un director comercial entiende "me cobran por cita", no "me cobran
// por mensaje". Cobrar por mensaje castiga al agente que conversa más para
// cerrar mejor, y le traslada al cliente un costo que no controla.
//
// ⚠️ PRECIOS: los valores de COSTO y PACKS son decisión comercial, no técnica.
// Este bloque es el único lugar donde se tocan — no hay precios hardcodeados
// en el webhook ni en la página de pricing.

export const CREDITOS_CONFIG = {
  // Créditos iniciales al registrarse
  BIENVENIDA: 500,

  // Equivalencia en pesos. Define el precio de los packs y lo que se le muestra
  // al usuario como "esta cita te costó $X".
  COP_POR_CREDITO: 200,

  // Costo de cada acción, en créditos.
  //
  // Todo lo que es MEDIO cuesta 0 (el agente trabaja gratis).
  // Solo el RESULTADO se cobra.
  COSTO: {
    // ── Medios: gratis ──────────────────────────────────────────
    MENSAJE_RESPONDIDO:  0,
    FOLLOWUP_ENVIADO:    0,
    CONECTAR_WHATSAPP:   0,
    CONFIGURAR_AGENTE:   0,
    VOZ_MUESTRA:         0,

    // ── Resultados: se cobran ───────────────────────────────────
    CITA_AGENDADA:     100,  // el lead llegó a "Test Drive" — $20.000
    VENTA_CERRADA:     250,  // el lead llegó a "Cerrado"    — $50.000
  },

  // Saldo mínimo para que el agente siga activo. Como los mensajes ya no se
  // cobran, hace falta un piso: sin esto, una cuenta en cero conversaría
  // indefinidamente gratis y recién fallaría al momento de cobrar el resultado,
  // que es el peor momento para avisarle a alguien que no tiene saldo.
  RESERVA_MINIMA: 0,

  // Bonus por tiempo si no ha pagado
  BONUS: {
    DIAS_14_A_30:  100,  // gracia extendida
    DIAS_30_A_60:  50,   // reactivación
    DIAS_MAS_60:   200,  // "tu agente te extraña"
  },

  // Umbrales de alerta. Referidos al costo de un resultado, no a un número
  // suelto: "no te alcanza para la próxima cita" es accionable, "te quedan
  // 100 créditos" no dice nada.
  ALERTA_BAJO:    300,   // ~3 citas
  ALERTA_CRITICO: 100,   // ~1 cita
} as const

export type AccionCredito = keyof typeof CREDITOS_CONFIG.COSTO

// Acciones que representan un resultado de negocio y se cobran una sola vez por
// lead. Si un lead vuelve a "Test Drive" después de haber pasado por ahí, no se
// cobra de nuevo — mover tarjetas en el kanban no puede costar plata.
export const ACCIONES_FACTURABLES = ['CITA_AGENDADA', 'VENTA_CERRADA'] as const

// Mapa etapa del pipeline → acción facturable. La etapa es la que ya usa
// PulsePipelineKanban; no se inventa un evento nuevo que nadie emite.
export const ETAPA_A_ACCION: Record<string, AccionCredito> = {
  test_drive: 'CITA_AGENDADA',
  cerrado:    'VENTA_CERRADA',
}

// ── Packs de créditos ─────────────────────────────────────────────────────────
// Reemplazan la membresía mensual: se compra saldo, se consume por resultado, no
// vence. El pack de 500 conserva el precio y el link de Bold que ya existían
// para el plan de $99.000, así que no hay que crear nada para venderlo.
//
// ⚠️ Los otros dos packs necesitan su propio link de pago creado en el panel de
// Bold. Mientras `bold_link` sea null, la página de pricing los muestra
// deshabilitados en vez de mandar al usuario a un checkout con el monto errado.
export interface PackCreditos {
  id: string
  creditos: number
  precio_cop: number
  bold_link: string | null
  destacado?: boolean
  etiqueta?: string
}

export const PACKS: PackCreditos[] = [
  {
    id: 'arranque',
    creditos: 500,
    precio_cop: 99_000,
    bold_link: 'https://checkout.bold.co/payment/LNK_PGTSIHASWV',
    etiqueta: 'Para empezar',
  },
  {
    id: 'concesionario',
    creditos: 2_500,
    precio_cop: 450_000,
    bold_link: null,
    destacado: true,
    etiqueta: 'El más usado',
  },
  {
    id: 'grupo',
    creditos: 10_000,
    precio_cop: 1_600_000,
    bold_link: null,
    etiqueta: 'Multi-sede',
  },
]

// Los packs sin link propio de Bold no quedan muertos: caen a WhatsApp con el
// pedido ya escrito. Es preferible cerrar la venta a mano que mostrarle al
// cliente un botón apagado, y muy preferible a mandarlo a un checkout cuyo monto
// no es el del pack que eligió.
export const WHATSAPP_VENTAS = '573004339418'

export function enlaceDePack(pack: PackCreditos): string {
  if (pack.bold_link) return pack.bold_link
  const texto = `Hola, quiero cargar el pack de ${pack.creditos.toLocaleString('es-CO')} créditos (${formatearCop(pack.precio_cop)}) en Pulse Motor.`
  return `https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent(texto)}`
}

export function creditosACop(creditos: number): number {
  return creditos * CREDITOS_CONFIG.COP_POR_CREDITO
}

export function formatearCop(valor: number): string {
  return '$' + valor.toLocaleString('es-CO')
}

// Etiquetas legibles para el log
export const ACCION_LABEL: Record<string, string> = {
  registro:            '🎁 Bienvenida',
  mensaje_respondido:  '💬 Mensaje respondido',
  followup_enviado:    '🔁 Follow-up enviado',
  cita_agendada:       '📅 Cita agendada',
  venta_cerrada:       '🏆 Venta cerrada',
  voz_muestra:         '🎤 Voz generada',
  bonus_reactivacion:  '⚡ Bonus reactivación',
  bonus_tiempo:        '🎁 Bonus por tiempo',
  pago_completado:     '✅ Créditos acreditados',
}
