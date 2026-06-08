// ═══════════════════════════════════════════════════════
// CONFIGURACIÓN CENTRAL DE CRÉDITOS
// Importar desde cualquier parte de la app
// ═══════════════════════════════════════════════════════

export const CREDITOS_CONFIG = {
  // Créditos iniciales al registrarse
  BIENVENIDA: 500,

  // Costo de cada acción
  COSTO: {
    MENSAJE_RESPONDIDO:  2,
    FOLLOWUP_ENVIADO:    5,
    CITA_AGENDADA:       10,
    VOZ_MUESTRA:         20,
    CONECTAR_WHATSAPP:   0,   // gratis siempre
    CONFIGURAR_AGENTE:   0,   // gratis siempre
  },

  // Bonus por tiempo si no ha pagado
  BONUS: {
    DIAS_14_A_30:  100,  // gracia extendida
    DIAS_30_A_60:  50,   // reactivación
    DIAS_MAS_60:   200,  // "tu agente te extraña"
  },

  // Umbrales de alerta
  ALERTA_BAJO:    100,   // mostrar advertencia amarilla
  ALERTA_CRITICO: 30,    // mostrar advertencia roja
} as const

export type AccionCredito = keyof typeof CREDITOS_CONFIG.COSTO

// Etiquetas legibles para el log
export const ACCION_LABEL: Record<string, string> = {
  registro:            '🎁 Bienvenida',
  mensaje_respondido:  '💬 Mensaje respondido',
  followup_enviado:    '🔁 Follow-up enviado',
  cita_agendada:       '📅 Cita agendada',
  voz_muestra:         '🎤 Voz generada',
  bonus_reactivacion:  '⚡ Bonus reactivación',
  bonus_tiempo:        '🎁 Bonus por tiempo',
  pago_completado:     '✅ Plan activado',
}
