// Ruta destino: src/app/pulse/demo/datos.ts
//
// Datos 100% sintéticos para el demo público de /pulse/demo.
//
// REGLA DURA — no tocar sin leer esto:
// Ninguna cifra, nombre de sede, asesor, marca o modelo de acá puede provenir de un
// concesionario real. El marco estratégico (pulsemotor-strategy, §1.5) es explícito: el
// modelo de cómputo se replica entre clientes, los datos NUNCA. Este archivo existe para
// poder mostrar cómo se ve el sistema sin exponer la operación de nadie.
//
// En concreto, y a propósito:
//  · Las cifras NO reproducen las del panel piloto en producción — otra escala y otras tasas
//    de conversión en cada etapa, para que no se puedan inferir las reales por regla de tres.
//  · Las sedes son genéricas (Norte/Centro/Sur), sin ciudad ni dirección.
//  · Los asesores son alias ("Asesor 01"), no personas.
//  · No hay marca de vehículo ni nombres de modelo: solo segmentos de mercado, que es el
//    lenguaje agnóstico que pide el marco (§1, "no casarse con ninguna marca").

export type PeriodoId = '30d' | '90d' | '12m'
export type SedeId = 'todas' | 'norte' | 'centro' | 'sur'

export const PERIODOS: { id: PeriodoId; label: string; factor: number }[] = [
  { id: '30d', label: 'Últimos 30 días', factor: 0.095 },
  { id: '90d', label: 'Último trimestre', factor: 0.28 },
  { id: '12m', label: 'Últimos 12 meses', factor: 1 },
]

// Cada sede tiene su propio perfil de conversión — así el filtro dice algo real (una sede
// que agenda mucho pero cierra poco no es lo mismo que una que agenda poco y cierra bien)
// y no es el mismo dataset multiplicado por una constante.
interface PerfilSede {
  id: Exclude<SedeId, 'todas'>
  nombre: string
  oportunidades: number
  tasaCita: number       // citas / oportunidades
  tasaShowUp: number     // show up / citas
  tasaCotizacion: number // cotizaciones / oportunidades (hay varias por lead)
  tasaPedido: number     // pedidos / cotizaciones
  tasaMatricula: number  // matrículas / pedidos
  penetracion: { financiacion: number; polizas: number; retomas: number; accesorios: number }
}

const SEDES_BASE: PerfilSede[] = [
  {
    id: 'norte', nombre: 'Sede Norte', oportunidades: 1180,
    tasaCita: 0.47, tasaShowUp: 0.64, tasaCotizacion: 0.58, tasaPedido: 0.25, tasaMatricula: 0.43,
    penetracion: { financiacion: 0.61, polizas: 0.44, retomas: 0.35, accesorios: 0.66 },
  },
  {
    id: 'centro', nombre: 'Sede Centro', oportunidades: 860,
    tasaCita: 0.53, tasaShowUp: 0.71, tasaCotizacion: 0.64, tasaPedido: 0.21, tasaMatricula: 0.48,
    penetracion: { financiacion: 0.55, polizas: 0.38, retomas: 0.29, accesorios: 0.58 },
  },
  {
    id: 'sur', nombre: 'Sede Sur', oportunidades: 640,
    tasaCita: 0.41, tasaShowUp: 0.58, tasaCotizacion: 0.49, tasaPedido: 0.28, tasaMatricula: 0.38,
    penetracion: { financiacion: 0.49, polizas: 0.31, retomas: 0.24, accesorios: 0.51 },
  },
]

export const SEDES_OPCIONES: { id: SedeId; label: string }[] = [
  { id: 'todas', label: 'Todas las sedes' },
  ...SEDES_BASE.map(s => ({ id: s.id as SedeId, label: s.nombre })),
]

// Valor unitario promedio de cada línea de integralidad, en pesos colombianos. Son órdenes
// de magnitud plausibles del sector, no cifras tomadas de la operación de ningún cliente.
const VALOR_UNITARIO = {
  financiacion: 1_850_000,
  polizas: 620_000,
  retomas: 2_400_000,
  accesorios: 1_150_000,
}

export interface EtapaEmbudo {
  clave: string
  label: string
  valor: number
  /** Conversión respecto de la etapa que la alimenta. La primera no tiene. */
  conversion: number | null
  /** Qué etapa es la base de esa conversión — se muestra para que el % no quede ambiguo. */
  base: string | null
}

export interface LineaIntegralidad {
  clave: 'financiacion' | 'polizas' | 'retomas' | 'accesorios'
  label: string
  color: string
  unidades: number
  penetracion: number
  valor: number
}

export interface FilaSede {
  id: string
  nombre: string
  oportunidades: number
  matriculas: number
  conversion: number
}

export interface DatosDemo {
  embudo: EtapaEmbudo[]
  integralidad: LineaIntegralidad[]
  sedes: FilaSede[]
  segmentos: { label: string; share: number; unidades: number }[]
  totales: { oportunidades: number; showUp: number; pedidos: number; matriculas: number; roe: number }
}

// Share de matrículas por segmento de mercado — sin marca ni nombre de modelo.
const SEGMENTOS: { label: string; share: number }[] = [
  { label: 'SUV', share: 0.44 },
  { label: 'Sedán', share: 0.21 },
  { label: 'Hatchback', share: 0.18 },
  { label: 'Híbrido', share: 0.12 },
  { label: 'Eléctrico', share: 0.05 },
]

const r = (n: number) => Math.max(0, Math.round(n))

export function calcularDemo(sede: SedeId, periodo: PeriodoId): DatosDemo {
  const factor = PERIODOS.find(p => p.id === periodo)?.factor ?? 1
  const activas = sede === 'todas' ? SEDES_BASE : SEDES_BASE.filter(s => s.id === sede)

  // Se calcula sede por sede y recién después se suma: promediar las tasas primero daría
  // un total distinto al que se ve al filtrar cada sede, y el demo perdería coherencia.
  const porSede = activas.map(s => {
    const oportunidades = r(s.oportunidades * factor)
    const citas = r(oportunidades * s.tasaCita)
    const showUp = r(citas * s.tasaShowUp)
    const cotizaciones = r(oportunidades * s.tasaCotizacion)
    const pedidos = r(cotizaciones * s.tasaPedido)
    const matriculas = r(pedidos * s.tasaMatricula)
    return { perfil: s, oportunidades, citas, showUp, cotizaciones, pedidos, matriculas }
  })

  const sum = (k: 'oportunidades' | 'citas' | 'showUp' | 'cotizaciones' | 'pedidos' | 'matriculas') =>
    porSede.reduce((a, x) => a + x[k], 0)

  const oportunidades = sum('oportunidades')
  const citas = sum('citas')
  const showUp = sum('showUp')
  const cotizaciones = sum('cotizaciones')
  const pedidos = sum('pedidos')
  const matriculas = sum('matriculas')

  const pct = (a: number, b: number) => (b > 0 ? a / b : 0)

  const embudo: EtapaEmbudo[] = [
    { clave: 'oportunidades', label: 'Oportunidades', valor: oportunidades, conversion: null, base: null },
    { clave: 'citas', label: 'Citas agendadas', valor: citas, conversion: pct(citas, oportunidades), base: 'oportunidades' },
    { clave: 'showup', label: 'Show up', valor: showUp, conversion: pct(showUp, citas), base: 'citas' },
    // Ojo: hay varias cotizaciones por oportunidad, así que esta etapa no cuelga del show up.
    // Se mide contra oportunidades y se dice explícitamente para que el % no engañe.
    { clave: 'cotizaciones', label: 'Cotizaciones', valor: cotizaciones, conversion: pct(cotizaciones, oportunidades), base: 'oportunidades' },
    { clave: 'pedidos', label: 'Pedidos', valor: pedidos, conversion: pct(pedidos, cotizaciones), base: 'cotizaciones' },
    { clave: 'matriculas', label: 'Matrículas', valor: matriculas, conversion: pct(matriculas, pedidos), base: 'pedidos' },
  ]

  // Penetración ponderada por los pedidos de cada sede, no un promedio simple de porcentajes.
  const unidadesDe = (k: keyof PerfilSede['penetracion']) =>
    porSede.reduce((a, x) => a + r(x.pedidos * x.perfil.penetracion[k]), 0)

  const integralidad: LineaIntegralidad[] = ([
    { clave: 'financiacion', label: 'Financiación', color: '#7C3AED' },
    { clave: 'polizas', label: 'Pólizas', color: '#4F46E5' },
    { clave: 'retomas', label: 'Retomas', color: '#DB2777' },
    { clave: 'accesorios', label: 'Accesorios', color: '#0D9488' },
  ] as const).map(l => {
    const unidades = unidadesDe(l.clave)
    return {
      clave: l.clave,
      label: l.label,
      color: l.color,
      unidades,
      penetracion: pct(unidades, pedidos),
      valor: unidades * VALOR_UNITARIO[l.clave],
    }
  })

  const sedes: FilaSede[] = porSede.map(x => ({
    id: x.perfil.id,
    nombre: x.perfil.nombre,
    oportunidades: x.oportunidades,
    matriculas: x.matriculas,
    conversion: pct(x.matriculas, x.oportunidades),
  }))

  const segmentos = SEGMENTOS.map(s => ({ ...s, unidades: r(matriculas * s.share) }))

  return {
    embudo,
    integralidad,
    sedes,
    segmentos,
    totales: {
      oportunidades,
      showUp,
      pedidos,
      matriculas,
      roe: integralidad.reduce((a, l) => a + l.valor, 0),
    },
  }
}

// ── Panel: metas, asesores y serie diaria ────────────────────────────────────
//
// Rige la misma regla dura de arriba: nada de esto sale de la operación de nadie.
// Las metas son redondas a propósito (40%, 50%, 60%…) porque son objetivos de
// tablero, no mediciones; los asesores son alias numerados, nunca personas; y la
// serie diaria se genera con una secuencia determinística, no con Math.random(),
// para que el server y el cliente rendericen exactamente lo mismo.

export interface KpiDemo {
  clave: string
  label: string
  valor: number      // tasa lograda (0-1)
  meta: number       // objetivo (0-1)
  cumplimiento: number // valor / meta
  pie: string
}

export interface AsesorDemo {
  alias: string
  sede: string
  oportunidades: number
  citas: number
  matriculas: number
  conversion: number
  integralidad: number // líneas 360° vendidas por matrícula (0-4)
}

export interface PuntoDia {
  dia: number
  oportunidades: number
  citas: number
  cotizaciones: number
  matriculas: number
}

const METAS = {
  citas: 0.40,
  showUp: 0.50,
  cotizacion: 0.60,
  pedido: 0.22,
  matricula: 0.40,
  conversion: 0.08,
}

export function calcularKpis(d: DatosDemo): KpiDemo[] {
  const e = Object.fromEntries(d.embudo.map(x => [x.clave, x.valor])) as Record<string, number>
  const pct = (a: number, b: number) => (b > 0 ? a / b : 0)

  const filas: { clave: string; label: string; valor: number; meta: number; pie: string }[] = [
    { clave: 'citas',       label: 'Citas',        valor: pct(e.citas, e.oportunidades),   meta: METAS.citas,      pie: 'sobre oportunidades' },
    { clave: 'showup',      label: 'Show up',      valor: pct(e.showup, e.citas),          meta: METAS.showUp,     pie: 'sobre citas' },
    { clave: 'cotizacion',  label: 'Cotizaciones', valor: pct(e.cotizaciones, e.oportunidades), meta: METAS.cotizacion, pie: 'sobre oportunidades' },
    { clave: 'pedido',      label: 'Pedidos',      valor: pct(e.pedidos, e.cotizaciones),  meta: METAS.pedido,     pie: 'sobre cotizaciones' },
    { clave: 'matricula',   label: 'Matrículas',   valor: pct(e.matriculas, e.pedidos),    meta: METAS.matricula,  pie: 'sobre pedidos' },
    { clave: 'conversion',  label: 'Conversión',   valor: pct(e.matriculas, e.oportunidades), meta: METAS.conversion, pie: 'matrículas / oportunidades' },
  ]

  return filas.map(f => ({ ...f, cumplimiento: f.meta > 0 ? f.valor / f.meta : 0 }))
}

// Perfiles de asesor por sede. El número de alias por sede es fijo; lo que cambia
// con el filtro es cuáles se muestran, no quiénes son.
const ASESORES_BASE: { alias: string; sede: Exclude<SedeId, 'todas'>; peso: number; skillCita: number; skillCierre: number; integralidad: number }[] = [
  { alias: 'Asesor 01', sede: 'norte',  peso: 0.22, skillCita: 1.14, skillCierre: 1.18, integralidad: 2.6 },
  { alias: 'Asesor 02', sede: 'norte',  peso: 0.19, skillCita: 1.02, skillCierre: 0.94, integralidad: 2.1 },
  { alias: 'Asesor 03', sede: 'norte',  peso: 0.17, skillCita: 0.88, skillCierre: 1.06, integralidad: 1.7 },
  { alias: 'Asesor 04', sede: 'centro', peso: 0.24, skillCita: 1.21, skillCierre: 1.09, integralidad: 2.9 },
  { alias: 'Asesor 05', sede: 'centro', peso: 0.20, skillCita: 0.95, skillCierre: 0.87, integralidad: 1.9 },
  { alias: 'Asesor 06', sede: 'centro', peso: 0.16, skillCita: 1.07, skillCierre: 1.02, integralidad: 2.3 },
  { alias: 'Asesor 07', sede: 'sur',    peso: 0.26, skillCita: 1.11, skillCierre: 1.13, integralidad: 2.4 },
  { alias: 'Asesor 08', sede: 'sur',    peso: 0.21, skillCita: 0.91, skillCierre: 0.79, integralidad: 1.5 },
]

const NOMBRE_SEDE: Record<string, string> = {
  norte: 'Sede Norte', centro: 'Sede Centro', sur: 'Sede Sur',
}

export function calcularAsesores(sede: SedeId, periodo: PeriodoId): AsesorDemo[] {
  const factor = PERIODOS.find(p => p.id === periodo)?.factor ?? 1
  const activos = sede === 'todas' ? ASESORES_BASE : ASESORES_BASE.filter(a => a.sede === sede)

  return activos.map(a => {
    const perfil = SEDES_BASE.find(s => s.id === a.sede)!
    const oportunidades = r(perfil.oportunidades * factor * a.peso)
    const citas = r(oportunidades * perfil.tasaCita * a.skillCita)
    const cotizaciones = r(oportunidades * perfil.tasaCotizacion)
    const pedidos = r(cotizaciones * perfil.tasaPedido * a.skillCierre)
    const matriculas = r(pedidos * perfil.tasaMatricula)
    return {
      alias: a.alias,
      sede: NOMBRE_SEDE[a.sede],
      oportunidades,
      citas,
      matriculas,
      conversion: oportunidades > 0 ? matriculas / oportunidades : 0,
      integralidad: a.integralidad,
    }
  }).sort((x, y) => y.conversion - x.conversion)
}

// Secuencia determinística (LCG). Misma semilla → misma serie, en server y cliente.
function pseudo(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

export function serieDiaria(d: DatosDemo, sede: SedeId): PuntoDia[] {
  const dias = 30
  const semilla = 7919 + sede.length * 131
  const rnd = pseudo(semilla)
  const e = Object.fromEntries(d.embudo.map(x => [x.clave, x.valor])) as Record<string, number>

  // Pesos diarios con forma de semana laboral: los fines de semana caen, y hay un
  // repunte de cierre de mes. Sin esto la serie es una línea plana con ruido, que
  // no se parece en nada a cómo se mueve un mes comercial de verdad.
  const pesos = Array.from({ length: dias }, (_, i) => {
    const diaSemana = i % 7
    const finDeSemana = diaSemana === 5 || diaSemana === 6 ? 0.45 : 1
    const cierreDeMes = i >= dias - 4 ? 1.5 : 1
    return finDeSemana * cierreDeMes * (0.75 + rnd() * 0.5)
  })
  const total = pesos.reduce((a, b) => a + b, 0)

  return pesos.map((p, i) => {
    const q = p / total
    return {
      dia: i + 1,
      oportunidades: r(e.oportunidades * q),
      citas: r(e.citas * q),
      cotizaciones: r(e.cotizaciones * q),
      matriculas: r(e.matriculas * q),
    }
  })
}

// ── Origen de la oportunidad ─────────────────────────────────────────────────
//
// Toda oportunidad entra por una de dos puertas, y no hay una tercera:
//   · Walk-in  — la persona entró físicamente a la vitrina.
//   · Digital  — llegó por pauta en redes, por buscadores o por el sitio.
//
// La descomposición se calcula hacia atrás desde el total ya conocido: se reparte
// cada métrica y el digital queda como el resto (total − walk-in). Así la suma da
// exacta siempre, sin errores de redondeo que dejarían al panel diciendo que
// 1.129 + 1.552 = 2.680 cuando en realidad da 2.681.

export interface CanalDigital {
  clave: string
  label: string
  grupo: 'redes' | 'buscadores' | 'sitio'
  valor: number
  share: number
}

export interface OrigenDemo {
  walkin: { oportunidades: number; showUp: number; pedidos: number; matriculas: number; share: number }
  digital: { oportunidades: number; showUp: number; pedidos: number; matriculas: number; share: number }
  canales: CanalDigital[]
}

// Peso de cada canal dentro del tráfico digital. Suma 1.
const CANALES_DIGITALES: { clave: string; label: string; grupo: CanalDigital['grupo']; peso: number }[] = [
  { clave: 'instagram',  label: 'Instagram',           grupo: 'redes',       peso: 0.24 },
  { clave: 'facebook',   label: 'Facebook',            grupo: 'redes',       peso: 0.22 },
  { clave: 'whatsapp',   label: 'WhatsApp',            grupo: 'redes',       peso: 0.17 },
  { clave: 'tiktok',     label: 'TikTok',              grupo: 'redes',       peso: 0.11 },
  { clave: 'buscadores', label: 'Buscadores',          grupo: 'buscadores',  peso: 0.14 },
  { clave: 'formulario', label: 'Formulario del sitio', grupo: 'sitio',      peso: 0.08 },
  { clave: 'bot',        label: 'Bot del sitio',       grupo: 'sitio',       peso: 0.04 },
]

export const GRUPO_CANAL_LABEL: Record<CanalDigital['grupo'], string> = {
  redes: 'Pauta en redes sociales',
  buscadores: 'Buscadores',
  sitio: 'Sitio web propio',
}

// Share de walk-in sobre las oportunidades, por sede. Una vitrina sobre avenida
// recibe más tráfico de calle que una en un centro comercial cerrado.
const SHARE_WALKIN: Record<Exclude<SedeId, 'todas'>, number> = {
  norte: 0.40, centro: 0.34, sur: 0.47,
}

// El walk-in sobre-indexa a medida que se baja en el embudo: quien ya está parado
// frente al auto llega a la prueba y firma más que quien dejó un dato en un aviso.
// No es un supuesto neutro, así que queda escrito acá y no enterrado en la vista.
const VENTAJA_WALKIN = { showUp: 1.30, pedidos: 1.22, matriculas: 1.15 }

export function calcularOrigen(sede: SedeId, periodo: PeriodoId): OrigenDemo {
  const d = calcularDemo(sede, periodo)
  const activas = sede === 'todas' ? SEDES_BASE : SEDES_BASE.filter(s => s.id === sede)

  // Share de walk-in ponderado por el volumen de cada sede activa.
  const totalOpp = activas.reduce((a, s) => a + s.oportunidades, 0)
  const shareWalkin = totalOpp > 0
    ? activas.reduce((a, s) => a + s.oportunidades * SHARE_WALKIN[s.id], 0) / totalOpp
    : 0

  // Reparte una métrica entre las dos puertas, dándole al walk-in la ventaja que
  // corresponda a esa altura del embudo. El digital es siempre el resto.
  const repartir = (total: number, ventaja: number) => {
    const pesoW = shareWalkin * ventaja
    const pesoD = 1 - shareWalkin
    const share = pesoW + pesoD > 0 ? pesoW / (pesoW + pesoD) : 0
    const walkin = r(total * share)
    return { walkin, digital: total - walkin }
  }

  const opp = repartir(d.totales.oportunidades, 1)
  const su  = repartir(d.totales.showUp, VENTAJA_WALKIN.showUp)
  const ped = repartir(d.totales.pedidos, VENTAJA_WALKIN.pedidos)
  const mat = repartir(d.totales.matriculas, VENTAJA_WALKIN.matriculas)

  // Reparto por resto mayor (Hamilton). Redondear cada canal por su cuenta hacía que
  // la suma se desviara del total digital en 1 o 2 unidades según el filtro — el panel
  // mostraba siete canales que sumaban 1.616 debajo de un digital de 1.615. Acá se
  // reparten los enteros por piso y las unidades sobrantes van a los canales con mayor
  // parte fraccionaria, así la suma da exacta en cualquier combinación de filtros.
  const totalDigital = opp.digital
  const exactos = CANALES_DIGITALES.map(c => totalDigital * c.peso)
  const pisos = exactos.map(Math.floor)
  let sobrante = totalDigital - pisos.reduce((a, b) => a + b, 0)
  const orden = exactos
    .map((v, i) => ({ i, resto: v - Math.floor(v) }))
    .sort((a, b) => b.resto - a.resto || a.i - b.i)
  const asignados = [...pisos]
  for (const { i } of orden) {
    if (sobrante <= 0) break
    asignados[i] += 1
    sobrante -= 1
  }

  const canales: CanalDigital[] = CANALES_DIGITALES.map((c, i) => ({
    clave: c.clave,
    label: c.label,
    grupo: c.grupo,
    valor: asignados[i],
    share: c.peso,
  }))

  const den = d.totales.oportunidades || 1
  return {
    walkin: {
      oportunidades: opp.walkin, showUp: su.walkin, pedidos: ped.walkin, matriculas: mat.walkin,
      share: opp.walkin / den,
    },
    digital: {
      oportunidades: opp.digital, showUp: su.digital, pedidos: ped.digital, matriculas: mat.digital,
      share: opp.digital / den,
    },
    canales,
  }
}

export const formatearNumero = (n: number) => new Intl.NumberFormat('es-CO').format(n)
export const formatearPct = (n: number) => `${Math.round(n * 100)}%`
export const formatearMillones = (n: number) =>
  n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(1)}B`
    : `$${Math.round(n / 1_000_000)}M`
