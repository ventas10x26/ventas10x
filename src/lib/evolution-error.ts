// Ruta destino: src/lib/evolution-error.ts
//
// Clasifica los errores que devuelve Evolution API al intentar enviar un
// mensaje de WhatsApp, para poder reaccionar distinto según la causa real:
//
// - numero_invalido: el número de destino no tiene WhatsApp registrado
//   (Evolution responde "exists":false). Es un problema de ESE lead
//   puntual -- se marca en fenix_leads.telefono_invalido.
// - conexion_caida: la sesión de WhatsApp del negocio se desconectó del
//   lado de Evolution API ("Connection Closed", socket cerrado, timeout).
//   Es un problema global que afecta a TODOS los envíos, no de un lead en
//   particular -- hay que reconectar el WhatsApp desde el panel
//   (Agente de cobro → Avanzado), no marcar leads como inválidos.
// - otro: cualquier otro fallo (rate limit, error interno de Evolution, etc).

export type TipoErrorEvolution = 'numero_invalido' | 'conexion_caida' | 'otro'

export function clasificarErrorEvolution(mensaje: string): TipoErrorEvolution {
  if (/"exists":\s*false/i.test(mensaje)) return 'numero_invalido'
  if (/connection closed|connection reset|econnrefused|econnreset|etimedout|socket hang up|timeout/i.test(mensaje)) return 'conexion_caida'
  return 'otro'
}

export function mensajeAmigableEvolution(tipo: TipoErrorEvolution): string {
  switch (tipo) {
    case 'numero_invalido':
      return 'Este número no tiene WhatsApp registrado.'
    case 'conexion_caida':
      return 'La conexión de WhatsApp del negocio se cayó del lado de Evolution API. Ve a "Agente de cobro → Avanzado" y reconéctala escaneando el código QR de nuevo -- no es un problema de este lead en particular, afecta todos los envíos hasta que se reconecte.'
    default:
      return 'No se pudo enviar el mensaje por WhatsApp.'
  }
}
