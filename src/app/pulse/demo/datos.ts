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

export const formatearNumero = (n: number) => new Intl.NumberFormat('es-CO').format(n)
export const formatearPct = (n: number) => `${Math.round(n * 100)}%`
export const formatearMillones = (n: number) =>
  n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(1)}B`
    : `$${Math.round(n / 1_000_000)}M`
