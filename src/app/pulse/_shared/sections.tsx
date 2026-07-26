'use client'

// ─── Módulo compartido entre /pulse (home), /pulse/concesionario y /pulse/asesor ───
// Contiene los tokens/datos/secciones reusables entre la home (que ahora termina en
// "Segmentos") y las dos landings dedicadas por segmento — ver skill pulsemotor-design.

import { useState, useEffect, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useReveal } from '@/hooks/useReveal'
import { useCountUp } from '@/hooks/useCountUp'
import { PULSE_DEMO_OPEN_EVENT } from '@/components/pulse/PulseStickyDemoWidget'

export const F_DISPLAY = "var(--font-display), sans-serif"
export const F_MONO    = "var(--font-mono), monospace"
export const F_BODY    = "var(--font-inter), sans-serif"

export type NavItem = { label: string; href: string }
export type PulseTheme = 'soft' | 'dark'

const THEME_STORAGE_KEY = 'pulse-theme'

// ─── Timeline de tool-calls (elemento de firma) — traza real de ejecución del agente ───
export const TOOL_CALLS = [
  { fn:'tasar_retoma',          ms:18, chip:'#FB7185' }, // Retomas
  { fn:'calcular_financiacion', ms:12, chip:'#A78BFA' }, // Financiación
  { fn:'cotizar_poliza',        ms:9,  chip:'#818CF8' }, // Pólizas
  { fn:'reservar_inventario',   ms:7,  chip:'#4C8DFF' }, // Vehículos nuevos
]

// ─── Diferenciadores reales del producto (no prueba social — todavía en lanzamiento,
// sin logos de clientes que mostrar) — un solo chip ámbar, no la paleta multicolor de
// Ecosistema/Cumplimiento, ver "Chips de categoría" en tokens.md ───
export const DIFERENCIADORES = [
  { num:'01', icon:'▶',  titulo:'Ejecuta, no solo conversa',      desc:'Cada cotización y cada tasación es una acción ejecutada y registrada — no una respuesta genérica de chatbot.' },
  { num:'02', icon:'🗂', titulo:'Entiende tu inventario solo',     desc:'Subís tu Excel o DMS y DataBridge arma el mapa de tablas automáticamente, sin escribir una línea de SQL.' },
  { num:'03', icon:'💬', titulo:'Vive en el WhatsApp que ya usás', desc:'Sin número nuevo, sin app aparte: el mismo WhatsApp Business de tu concesionario o tu número personal.' },
  { num:'04', icon:'💳', titulo:'Precio simple, sin sorpresas',    desc:'Cobrás por plan, no por lead — sin costos ocultos ni contratos de permanencia.' },
]

export const POR_QUE = [
  'Responde en segundos, no en horas',
  'Cotiza financiación y pólizas sin transferir la conversación',
  'Aprende el tono y los precios de tu concesionario',
  'Corre en tu WhatsApp Business de siempre, sin número nuevo',
  'Deja registro auditable de cada decisión que toma',
  'Se despliega en días, no en meses',
]

// ─── Cobertura 24/7 — mismo lenguaje visual del timeline/bitácora, aplicado a franjas horarias ───
export const COBERTURA = [
  { rango:'00:00 – 06:00', evento:'Retoma tasada · Sedán 2020' },
  { rango:'06:00 – 12:00', evento:'Cita agendada · Test drive' },
  { rango:'12:00 – 18:00', evento:'Financiación pre-aprobada · 48m' },
  { rango:'18:00 – 24:00', evento:'Póliza cotizada · Todo riesgo' },
]

// Chips de color decorativos por categoría (estilo Platzi) — solo para íconos de grids
// catalogados, nunca para texto/CTA/fondo de sección. Ver "Chips de categoría" en tokens.md.
export const CUMPLIMIENTO = [
  { icon:'🔒', label:'Cifrado end-to-end', chip:'#4C8DFF' },
  { icon:'✅', label:'WhatsApp Business API verificado', chip:'#2DD4BF' },
  { icon:'🌎', label:'Datos alojados en LatAm', chip:'#A78BFA' },
  { icon:'📋', label:'Cumplimiento Habeas Data (Ley 1581)', chip:'#FB7185' },
  { icon:'🧾', label:'Auditoría exportable', chip:'#818CF8' },
  { icon:'🔑', label:'Control de acceso por rol', chip:'#F2A93B' },
]

// ─── Ecosistema 360° — catálogo de puntos de fricción cubiertos, no pasos secuenciales ───
export const ECOSISTEMA = [
  { num:'01', icon:'🚗', titulo:'Vehículos nuevos', desc:'Inventario en vivo y todas las versiones cotizadas en segundos.', chip:'#4C8DFF' },
  { num:'02', icon:'%',  titulo:'Financiación',     desc:'Simulaciones y pre-aprobaciones con aliados bancarios integrados.', chip:'#A78BFA' },
  { num:'03', icon:'＋', titulo:'Accesorios',        desc:'Upselling contextual según modelo, uso y perfil del comprador.', chip:'#2DD4BF' },
  { num:'04', icon:'⇄',  titulo:'Retomas',           desc:'Tasación asistida por IA con histórico de mercado y estado real.', chip:'#FB7185' },
  { num:'05', icon:'🛡', titulo:'Pólizas',           desc:'Todo riesgo y colisión cotizadas y emitidas dentro del mismo flujo.', chip:'#818CF8' },
]

// Dos líneas de negocio nuevas (ver skill pulsemotor-strategy, sección 3) — deliberadamente
// separadas de ECOSISTEMA en vez de sumarlas como celda 06/07: todavía no tienen tabla en
// Supabase ni chip propio, así que se presentan como incorporación reciente ("Nuevo"), no como
// parte igual de asentada que las cinco de arriba. Solo se renderizan si EcosistemaSection
// recibe showNuevo (hoy: /pulse/concesionario).
export const ECOSISTEMA_NUEVO = [
  { icon:'📡', titulo:'Monitoreo satelital', desc:'Telemetría del vehículo enfocada en seguridad — localización y alerta ante robo o siniestro.' },
  { icon:'🔌', titulo:'Wallbox y carga de emergencia', desc:'Cargador para casa y cargador portátil de emergencia, cotizados junto al vehículo eléctrico o híbrido.' },
]

// ─── Insumos del prototipo (DataBridge) — de dónde nace el modelo de datos de cada
// concesionario. Ver skill pulsemotor-strategy, sección 8: son las mismas fuentes que
// DataBridge (/pulse/databridge) ya sabe mapear, agrupadas por momento del journey en vez
// de listadas planas — más legible que un grid de 10 celdas idénticas. ───
export const INSUMOS_GRUPOS = [
  { label:'Antes de vender',        items:['Asesores por sede', 'Preventas', 'Oportunidades (CRM)'] },
  { label:'En la negociación',      items:['Cotizaciones y citas', 'Pedidos y anticipos', 'Solicitudes de crédito'] },
  { label:'Cierre e integralidad',  items:['Facturación', 'Matrículas y RUNT', 'Pólizas', 'Retomas', 'Accesorios'] },
]

// ─── Los dos segmentos — usado tanto por la card de /pulse (home) como por el hero
// de la landing dedicada de cada uno (/pulse/concesionario, /pulse/asesor) ───
export const SEGMENTS = [
  {
    slug:'concesionario' as const,
    tag:'Enterprise', tagColor:'amber' as const, titulo:'Concesionario', subtitulo:'Fuerza de ventas · Inventario multi-punto',
    desc:'Orquesta decenas de asesores, integra tu DMS y captura cada oportunidad — incluso las que llegan a las 2 AM.',
    bullets:['Subís tu DMS o Excel — la IA arma el diagrama de tablas automáticamente (DataBridge)', 'Panel director con atribución 360° por asesor', 'Ruteo inteligente de leads por sucursal o stock', 'Auditoría completa de conversaciones y compliance'],
    cta:'Explorar plan Enterprise', href:'/pulse/concesionario', ctaClass:'pm-btn-outline', diagram:true, chat:false, liveStat:'+180 concesionarios activos',
  },
  {
    slug:'asesor' as const,
    tag:'Pro', tagColor:'green' as const, titulo:'Vendedor individual', subtitulo:'Asesor independiente · Alto volumen',
    desc:'Tu copiloto personal en WhatsApp. Cotiza, retoma y cierra sin depender del área de crédito.',
    bullets:['Copiloto integrado a tu WhatsApp Business', 'Cotización de póliza y financiación en segundos', 'Agenda automática de citas y test drives', 'Cobra desde $49 USD/mes — sin costos por lead'],
    cta:'Ver plan para asesor individual', href:'/pulse/asesor', ctaClass:'pm-btn', diagram:false, chat:true, liveStat:'+500 asesores conectados',
  },
]

// ─── Preview de DataBridge (/pulse/databridge): mini diagrama de tablas detectadas por IA ───
export const DB_NODES = [
  { id:'leads',         label:'leads',         x:50, y:10, chip:'#4C8DFF' },
  { id:'clientes',      label:'clientes',      x:86, y:34, chip:'#2DD4BF' },
  { id:'inventario',    label:'inventario',    x:70, y:74, chip:'#A78BFA' },
  { id:'financiacion',  label:'financiación',  x:30, y:74, chip:'#FB7185' },
  { id:'polizas',       label:'pólizas',       x:14, y:34, chip:'#818CF8' },
]
export const DB_LINKS: [string,string][] = [
  ['leads','clientes'], ['leads','polizas'], ['leads','inventario'],
  ['clientes','inventario'], ['inventario','financiacion'], ['financiacion','polizas'],
]

export const PRICING_PLANS = {
  individual: [
    {
      nombre:'Starter', precio:'$49', periodo:'/mes', para:'Para asesores que están empezando',
      bullets:['Copiloto en tu WhatsApp Business', 'Cotización de financiación y pólizas', 'Hasta 100 leads/mes', 'Soporte por chat'],
      cta:'Empezar gratis 14 días', href:'/pulse/signup', destacado:false,
    },
    {
      nombre:'Pro', precio:'$99', periodo:'/mes', para:'Para alto volumen, sin límites',
      bullets:['Todo lo de Starter', 'Leads ilimitados', 'Agenda automática de test drives', 'Reportes de conversión semanales'],
      cta:'Empezar gratis 14 días', href:'/pulse/signup', destacado:true,
    },
  ],
  concesionario: [
    {
      nombre:'Team', precio:'$199', periodo:'/mes', para:'Hasta 5 asesores',
      bullets:['Panel director con atribución por asesor', 'Ruteo inteligente de leads', 'Integración WhatsApp Business', 'Auditoría de conversaciones'],
      cta:'Solicitar acceso', href:'/pulse/databridge', destacado:false,
    },
    {
      nombre:'Enterprise', precio:'A medida', periodo:'', para:'6 a 50+ asesores',
      bullets:['Todo lo de Team', 'Integración con tu DMS (Siigo, SAP)', 'HubSpot / Salesforce nativo', 'Onboarding dedicado y SLA'],
      cta:'Hablar con ventas', href:'/pulse/databridge', destacado:true,
    },
  ],
} as const

export const STATS_V2 = [
  { val:'147', delta:'+12%', label:'Leads atendidos hoy' },
  { val:'38',  delta:'+11%', label:'Retomas tasadas' },
  { val:'24',  delta:'+14%', label:'Pólizas cotizadas' },
  { val:'89%', delta:'+5pt', label:'Cierre asistido' },
]

export const AUDIT_LOG = [
  { time:'14:22:41', evento:'Nuevo lead · SUV Híbrida',            canal:'WhatsApp',           estado:'Bajo cierre',  ok:false },
  { time:'13:51:03', evento:'Retoma valorada · Sedán 2019',        canal:'Portal web',         estado:'Tasado',       ok:true  },
  { time:'14:09:12', evento:'Póliza todo riesgo cotizada',         canal:'Chat DMS',           estado:'Enviado',      ok:true  },
  { time:'14:19:55', evento:'Financiación pre-aprobada · 72m',     canal:'Aliado bancario',    estado:'Aprobado',     ok:true  },
  { time:'14:18:07', evento:'Cita agendada · Test drive',          canal:'Concesionario Norte',estado:'Confirmado',   ok:true  },
  { time:'14:17:16', evento:'Cross-sell · Kit accesorios tech',    canal:'Ecommerce #1843',    estado:'Cerrado',      ok:true  },
]

export const INTEGRACIONES = [
  { name:'WhatsApp Business',    chip:'#4C8DFF' },
  { name:'Siigo · SAP DMS',      chip:'#818CF8' },
  { name:'Aliados financieros',  chip:'#A78BFA' },
  { name:'Aseguradoras LATAM',   chip:'#FB7185' },
  { name:'Portal de accesorios', chip:'#2DD4BF' },
  { name:'HubSpot · Salesforce', chip:'#4C8DFF' },
]

export const TESTIMONIOS_V2 = [
  { seg:'Concesionario · 32 agentes', texto:'El agente configuró la financiación y la póliza de un cliente a las 2 AM. El lunes a las 8 AM solo tuvimos que imprimir el contrato.', nombre:'Ricardo Mendoza', cargo:'Gerente Comercial · Grupo Andina' },
  { seg:'Vendedor individual · Medellín', texto:'Cerré tres retomas en una semana yo solo. Antes eso me tomaba un mes coordinando con crédito y seguros.', nombre:'Laura Betancur', cargo:'Asesora Comercial · Independiente' },
]

// ─── Hooks compartidos ───

export function useUsuarioLogueado() {
  const [usuarioLogueado, setUsuarioLogueado] = useState<string | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUsuarioLogueado(data.user.email ?? data.user.id)
    })
  }, [])
  return usuarioLogueado
}

// Tema claro (soft, default) / oscuro — toggle persistido en localStorage y compartido
// por las 3 páginas públicas de Pulse Motor (home, concesionario, asesor). El estado
// inicial siempre es 'soft' (coincide con el render del servidor); localStorage se lee
// recién en el efecto para no romper la hidratación.
export function usePulseTheme() {
  const [theme, setTheme] = useState<PulseTheme>('soft')
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'soft') setTheme(stored)
  }, [])
  const toggleTheme = () => {
    setTheme(prev => {
      const next: PulseTheme = prev === 'soft' ? 'dark' : 'soft'
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
      return next
    })
  }
  return { theme, toggleTheme }
}

// Scroll-spy: resalta en el nav la sección local (href que empieza con "#") que cruza
// el centro del viewport. Los items con href absoluto (a otra página) se ignoran.
export function useSectionScrollSpy(navItems: NavItem[]) {
  const [activeId, setActiveId] = useState('')
  useEffect(() => {
    const ids = navItems.filter(i => i.href.startsWith('#')).map(i => i.href.slice(1))
    const els = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (!els.length) return
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(entry => { if (entry.isIntersecting) setActiveId(entry.target.id) }) },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  return activeId
}

// ─── Componentes de presentación pequeños ───

export function SegIcon({ variant }: { variant: 'amber' | 'green' }) {
  const color = variant === 'amber' ? 'var(--amber)' : 'var(--green)'
  return variant === 'amber' ? (
    // Red hub-and-spoke: eco del esquema de DataBridge (multi-sucursal)
    <svg width="52" height="52" viewBox="0 0 56 56" fill="none" stroke={color} strokeWidth="1.4" aria-hidden="true">
      <circle cx="28" cy="14" r="5" /><circle cx="12" cy="36" r="5" /><circle cx="44" cy="36" r="5" /><circle cx="28" cy="48" r="4" />
      <path d="M28 19v25M24.5 16.7 14 32.5M31.5 16.7 42 32.5" />
    </svg>
  ) : (
    // Burbuja de chat con líneas de texto: copiloto en WhatsApp
    <svg width="52" height="52" viewBox="0 0 56 56" fill="none" stroke={color} strokeWidth="1.4" aria-hidden="true">
      <path d="M10 14h36a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H24l-8 8v-8h-6a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z" />
      <path d="M18 24h20M18 31h13" strokeLinecap="round" />
    </svg>
  )
}

export function DataBridgeMiniDiagram() {
  return (
    <div style={{ position:'relative', height:'150px', padding:'14px' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} aria-hidden="true">
        {DB_LINKS.map(([a,b],i) => {
          const na = DB_NODES.find(n=>n.id===a)!, nb = DB_NODES.find(n=>n.id===b)!
          return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="var(--panel-line)" strokeWidth="0.6" strokeDasharray="2,2" />
        })}
      </svg>
      {DB_NODES.map(n => (
        <div key={n.id} style={{ position:'absolute', left:`${n.x}%`, top:`${n.y}%`, transform:'translate(-50%,-50%)', display:'flex', alignItems:'center', gap:'5px', background:'var(--panel-bg-2)', border:`1px solid ${n.chip}66`, borderRadius:'4px', padding:'4px 8px', fontFamily:F_MONO, fontSize:'10px', color:'var(--panel-ink)', whiteSpace:'nowrap' }}>
          <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:n.chip, flexShrink:0 }} />{n.label}
        </div>
      ))}
    </div>
  )
}

export function SchemaPreview() {
  return (
    <div className="panel" style={{ marginBottom:'22px' }}>
      <div className="panel-head"><span>DataBridge · Esquema detectado</span><span style={{ color:'var(--green)' }}>✓ 5 tablas</span></div>
      <DataBridgeMiniDiagram />
    </div>
  )
}

// ─── Preview de conversación real (sin marco de celular) — ver regla dura 2 de la skill ───
export const WA_MESSAGES = [
  { from:'lead',  text:'Hola! Me interesa el Rio 2024, ¿tienen para financiar a 48 meses?' },
  { from:'agent', text:'Con tu perfil la cuota estimada es $980.000/mes a 48 meses. ¿Te armo la póliza también?' },
  { from:'lead',  text:'Sí, dale' },
  { from:'agent', text:'Póliza todo riesgo: $145.000/mes. ¿Agendamos la firma esta semana?' },
] as const

export function WhatsAppMiniPreview({ active }: { active: boolean }) {
  return (
    <div className="panel" style={{ marginBottom:'22px' }}>
      <div className="panel-head"><span>WhatsApp Business · Copiloto activo</span><span style={{ color:'var(--green)' }}>● en vivo</span></div>
      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
        {WA_MESSAGES.map((m,i) => (
          <div key={i} className={`reveal wa-bubble wa-${m.from}${active?' in':''}`} style={{ transitionDelay:`${i*220}ms` }}>
            {m.text}
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatCell({ val, delta, label, active, delayMs }: { val: string; delta: string; label: string; active: boolean; delayMs: number }) {
  const displayed = useCountUp(val, active)
  return (
    <div className={`reveal stat-cell${active?' in':''}`} style={{ transitionDelay:`${delayMs}ms` }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
        <span className="grad-amber" style={{ fontFamily:F_DISPLAY, fontSize:'32px', fontWeight:800 }}>{displayed}</span>
        <span style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--green)' }}>{delta}</span>
      </div>
      <div style={{ fontSize:'12px', color:'var(--ink-dim)', marginTop:'4px' }}>{label}</div>
    </div>
  )
}

// ─── Header / Footer compartidos ───

export function ThemeToggle({ theme, onToggle }: { theme: PulseTheme; onToggle: () => void }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      className="theme-toggle"
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z" /></svg>
      )}
    </button>
  )
}

export function PulseHeader({ navItems, activeSection, usuarioLogueado, theme, onToggleTheme }: { navItems: NavItem[]; activeSection?: string; usuarioLogueado: string | null; theme: PulseTheme; onToggleTheme: () => void }) {
  return (
    <header style={{ position:'sticky', top:0, zIndex:100, padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:'1280px', margin:'0 auto', background:'var(--header-bg)', backdropFilter:'blur(10px)', borderBottom:'1px solid var(--line)' }}>
      <a href="/pulse" style={{ display:'flex', alignItems:'center', gap:'10px', textDecoration:'none' }}>
        <div style={{ width:'10px', height:'10px', background:'var(--amber)', borderRadius:'2px' }} />
        <span style={{ fontSize:'16px', fontWeight:800, fontFamily:F_DISPLAY, color:'var(--ink)' }}>Pulse Motor</span>
      </a>
      <nav style={{ display:'flex', alignItems:'center', gap:'28px' }} className="pm-nav">
        {navItems.map(item => (
          <a key={item.href} href={item.href} style={{ fontSize:'13px', textDecoration:'none' }} className={`pm-nav-link${activeSection && item.href === `#${activeSection}` ?' active':''}`}>{item.label}</a>
        ))}
      </nav>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        {usuarioLogueado ? (
          <a href="/pulse/agente" className="pm-btn" style={{ width:'auto', display:'inline-flex', textDecoration:'none', padding:'10px 18px', fontSize:'13px' }}>Mi agente<span className="btn-arrow">→</span></a>
        ) : (
          <>
            <a href="/pulse/login" className="pm-btn pm-btn-ghost" style={{ width:'auto', display:'inline-flex', textDecoration:'none', padding:'9px 16px', fontSize:'12px' }}>Login</a>
            <a href="/pulse/signup" className="pm-btn" style={{ width:'auto', display:'inline-flex', textDecoration:'none', padding:'9px 18px', fontSize:'12px' }}>Ser agente<span className="btn-arrow">→</span></a>
          </>
        )}
      </div>
    </header>
  )
}

export function PulseFooter() {
  return (
    <footer id="pulse-footer" style={{ borderTop:'1px solid var(--line)' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'64px 24px 32px' }}>
        <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:'32px', marginBottom:'48px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'10px', height:'10px', background:'var(--amber)', borderRadius:'2px' }} />
              <span style={{ fontSize:'15px', fontWeight:800, fontFamily:F_DISPLAY, color:'var(--ink)' }}>Pulse Motor</span>
            </div>
            <p style={{ fontSize:'13px', color:'var(--ink-dim)', lineHeight:1.6, maxWidth:'26ch' }}>Agentes autónomos que orquestan la venta automotriz 360° en LatAm.</p>
          </div>
          <div className="footer-col">
            <h4>Plataforma</h4>
            <a href="/pulse#segmentos">Segmentos</a>
            <a href="/pulse/concesionario">Concesionarios</a>
            <a href="/pulse/asesor">Asesor individual</a>
          </div>
          <div className="footer-col">
            <h4>Producto</h4>
            <a href="/pulse/signup">Ser agente</a>
            <a href="/pulse/databridge">DataBridge</a>
            <a href="/pulse/login">Iniciar sesión</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="/terminos">Términos</a>
            <a href="/privacidad">Privacidad</a>
            <a href="/seguridad">Seguridad</a>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', paddingTop:'24px', borderTop:'1px solid var(--line)', fontSize:'12px', color:'var(--ink-dim)', fontFamily:F_MONO }}>
          <span>Pulse Motor · © 2026 · LatAm HQ</span>
          <a href="https://linkedin.com" style={{ color:'var(--ink-dim)', textDecoration:'none' }}>LinkedIn</a>
        </div>
      </div>
    </footer>
  )
}

// ─── Secciones reusables entre home y las landings de segmento ───

export function DiferenciadoresSection() {
  const header = useReveal<HTMLDivElement>()
  const grid = useReveal<HTMLDivElement>()
  return (
    <section style={{ padding:'72px 24px', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
        <div ref={header.ref} className={`reveal${header.inView?' in':''}`} style={{ textAlign:'center', marginBottom:'44px' }}>
          <p className="kicker" style={{ justifyContent:'center', display:'flex' }}>Lo que nos hace distintos</p>
          <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
            No es un chatbot más. <span className="grad-amber">Es un agente que ejecuta.</span>
          </h2>
          <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'560px', margin:'0 auto', lineHeight:1.6 }}>
            Cuatro diferencias que se notan desde el primer lead — no promesas genéricas de IA.
          </p>
        </div>

        <div ref={grid.ref} className="grid-shared eco-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:'40px' }}>
          {DIFERENCIADORES.map((d,i) => (
            <div key={d.num} className={`reveal eco-cell${grid.inView?' in':''}`} style={{ transitionDelay:`${i*90}ms` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                <span className="eco-icon" style={{ fontSize:'17px', width:'36px', height:'36px', borderRadius:'8px', display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(242,169,59,0.13)', border:'1px solid rgba(242,169,59,0.35)' }}>{d.icon}</span>
                <span style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--ink-dim)' }}>{d.num}</span>
              </div>
              <h3 style={{ fontSize:'15px', fontWeight:700, fontFamily:F_DISPLAY, marginBottom:'6px', color:'var(--ink)' }}>{d.titulo}</h3>
              <p style={{ fontSize:'12px', color:'var(--ink-dim)', lineHeight:1.5 }}>{d.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'20px', flexWrap:'wrap' }}>
          <p style={{ fontSize:'15px', color:'var(--ink)' }}>Mirá al agente resolver un lead real en una demo de 20 minutos.</p>
          <button onClick={() => window.dispatchEvent(new Event(PULSE_DEMO_OPEN_EVENT))} className="pm-btn" style={{ width:'auto', display:'inline-flex', padding:'11px 22px', fontSize:'13px' }}>Agendar una demo<span className="btn-arrow">→</span></button>
        </div>
      </div>
    </section>
  )
}

// De dónde nace el prototipo de cada concesionario — las fuentes que DataBridge ya sabe
// mapear (ver skill pulsemotor-strategy, sección 8), agrupadas por momento del journey en
// vez de listadas como un grid de 10 celdas idénticas: más legible, y evita repetir por
// quinta vez la misma anatomía de grid-icon-card que ya usan Diferenciadores/Ecosistema/
// Integraciones/Cumplimiento en esta misma página.
export function InsumosSection() {
  const header = useReveal<HTMLDivElement>()
  const grupos = useReveal<HTMLDivElement>()
  return (
    <section style={{ padding:'72px 24px', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
      <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
        <div ref={header.ref} className={`reveal${header.inView?' in':''}`} style={{ textAlign:'center', marginBottom:'40px' }}>
          <p className="kicker" style={{ justifyContent:'center', display:'flex' }}>Cómo empieza</p>
          <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
            No arrancás de cero. <span className="grad-amber">Arrancás de lo que ya tenés.</span>
          </h2>
          <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'620px', margin:'0 auto', lineHeight:1.6 }}>
            El prototipo de tu concesionario nace de las bases que tu equipo ya usa a diario — CRM, ERP, Google Sheets, SharePoint o Excel de cada sede. Las subís a DataBridge y el agente empieza a entender tu operación real, sin migrar nada.
          </p>
        </div>

        <div ref={grupos.ref} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px', marginBottom:'32px' }} className="insumos-grid">
          {INSUMOS_GRUPOS.map((g,gi) => (
            <div key={g.label} className={`reveal${grupos.inView?' in':''}`} style={{ border:'1px solid var(--line)', borderRadius:'8px', padding:'22px 20px', transitionDelay:`${gi*100}ms` }}>
              <p style={{ fontFamily:F_MONO, fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', color:'var(--amber)', fontWeight:700, margin:'0 0 14px' }}>{g.label}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {g.items.map(item => (
                  <span key={item} style={{ fontFamily:F_MONO, fontSize:'11.5px', color:'var(--ink)', background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:'999px', padding:'6px 12px', lineHeight:1.3 }}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'20px', flexWrap:'wrap' }}>
          <p style={{ fontSize:'15px', color:'var(--ink)' }}>DataBridge detecta el esquema solo y arma tu panel — sin escribir una línea de SQL.</p>
          <a href="/pulse/databridge" className="pm-btn" style={{ width:'auto', display:'inline-flex', padding:'11px 22px', fontSize:'13px', textDecoration:'none' }}>Probar con tus datos<span className="btn-arrow">→</span></a>
        </div>
      </div>
    </section>
  )
}

// Embudo ilustrativo del método — cifras de ejemplo redondeadas para explicar la forma del
// embudo, no datos reales de ningún concesionario o marca específica (ver skill
// pulsemotor-strategy: la integralidad 360° es transversal al sector, nunca se exhiben datos
// ni PI de un cliente puntual en la landing pública).
export const EMBUDO_ETAPAS = [
  { etapa:'Oportunidades', valor:100, conv:null as string | null },
  { etapa:'Citas',         valor:55,  conv:'55% agenda' },
  { etapa:'Show Up',       valor:38,  conv:'70% asiste' },
  { etapa:'Cotizaciones',  valor:30,  conv:'79% cotiza' },
  { etapa:'Pedidos',       valor:12,  conv:'40% cierra' },
  { etapa:'Matrículas',    valor:9,   conv:'75% matricula' },
]

export function EmbudoSection() {
  const header = useReveal<HTMLDivElement>()
  const funnel = useReveal<HTMLDivElement>()
  const loop = useReveal<HTMLDivElement>()
  const max = EMBUDO_ETAPAS[0].valor
  return (
    <section style={{ padding:'72px 24px', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
      <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
        <div ref={header.ref} className={`reveal${header.inView?' in':''}`} style={{ textAlign:'center', marginBottom:'40px' }}>
          <p className="kicker" style={{ justifyContent:'center', display:'flex' }}>Cómo funciona</p>
          <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
            Un embudo que se mide <span className="grad-amber">en cada etapa.</span>
          </h2>
          <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'560px', margin:'0 auto', lineHeight:1.6 }}>
            Desde el primer contacto hasta la matrícula — sin importar la marca que vendas, el método es el mismo. Ejemplo ilustrativo:
          </p>
        </div>

        <div ref={funnel.ref} style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'48px' }}>
          {EMBUDO_ETAPAS.map((e,i) => (
            <div key={e.etapa} className={`reveal${funnel.inView?' in':''}`} style={{ display:'grid', gridTemplateColumns:'130px 1fr 120px', alignItems:'center', gap:'16px', transitionDelay:`${i*90}ms` }}>
              <span style={{ fontSize:'14px', fontWeight:700, color:'var(--ink)', textAlign:'right' }}>{e.etapa}</span>
              <div style={{ position:'relative', height:'32px', background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:'6px', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, bottom:0, left:0, right:`${funnel.inView ? 100 - (e.valor / max) * 100 : 100}%`, background:'var(--grad-amber)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:'10px', transition:`right .8s var(--ease-out-expo) ${i*90}ms` }}>
                  <span style={{ fontFamily:F_MONO, fontSize:'12px', fontWeight:700, color:'#1a1204' }}>{e.valor}</span>
                </div>
              </div>
              <span style={{ fontFamily:F_MONO, fontSize:'12px', color:'var(--ink-dim)' }}>{e.conv ?? 'base'}</span>
            </div>
          ))}
        </div>

        <div ref={loop.ref} className={`reveal${loop.inView?' in':''}`} style={{ textAlign:'center' }}>
          <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'520px', margin:'0 auto 20px', lineHeight:1.6 }}>
            La venta no termina en la matrícula — la integralidad 360° existe para retener al cliente hasta su próxima compra.
          </p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flexWrap:'wrap', gap:'0' }}>
            {['Venta', 'Mantenimiento', 'Renovación'].map((etapa, i) => (
              <div key={etapa} style={{ display:'flex', alignItems:'center' }}>
                <div style={{ background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:'8px', padding:'14px 20px', textAlign:'center', minWidth:'130px' }}>
                  <span style={{ fontSize:'14px', fontWeight:700, color:'var(--ink)' }}>{etapa}</span>
                </div>
                {i < 2 && <span style={{ color:'var(--amber-dim)', fontSize:'18px', padding:'0 12px' }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function PorQueSection() {
  const porQueText = useReveal<HTMLDivElement>()
  const coberturaPanel = useReveal<HTMLDivElement>()
  return (
    <section style={{ maxWidth:'1280px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
      <div className="hero-grid" style={{ display:'flex', gap:'56px', alignItems:'center' }}>
        <div ref={porQueText.ref} className={`reveal${porQueText.inView?' in':''}`} style={{ flex:'1', minWidth:'320px' }}>
          <p className="kicker">Por qué Pulse Motor</p>
          <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
            La cobertura que tu WhatsApp <span className="grad-amber">nunca tuvo.</span>
          </h2>
          <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'480px', lineHeight:1.6, marginBottom:'22px' }}>No reemplaza a tu equipo — cubre las horas y los picos que tu equipo no puede.</p>
          <div>
            {POR_QUE.map(b => <div key={b} className="seg-check"><span className="mark">✓</span><span>{b}</span></div>)}
          </div>
        </div>

        <div ref={coberturaPanel.ref} className={`reveal${coberturaPanel.inView?' in':''}`} style={{ flex:'1', minWidth:'320px', maxWidth:'460px' }}>
          <div className="panel">
            <div className="panel-head"><span>Cobertura · 24/7/365</span><span style={{ color:'var(--green)' }}>Activo</span></div>
            {COBERTURA.map((c,i) => (
              <div key={c.rango} className={`log-row log-row-data${coberturaPanel.inView?' in':''}`} style={{ gridTemplateColumns:'130px 1fr 100px', transitionDelay:`${i*90}ms` }}>
                <span className="log-time">{c.rango}</span>
                <span className="log-evento">{c.evento}</span>
                <span style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--green)', textAlign:'right' }}>✓ Cubierto</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function EcosistemaSection({ showNuevo = false }: { showNuevo?: boolean } = {}) {
  const ecoHeader = useReveal<HTMLDivElement>()
  const ecoGrid = useReveal<HTMLDivElement>()
  const ecoNuevo = useReveal<HTMLDivElement>()
  return (
    <section id="ecosistema" style={{ maxWidth:'1280px', margin:'0 auto', padding:'72px 24px' }}>
      <div ref={ecoHeader.ref} className={`reveal${ecoHeader.inView?' in':''}`} style={{ textAlign:'center', marginBottom:'44px' }}>
        <p className="kicker" style={{ justifyContent:'center', display:'flex' }}>Ecosistema 360°</p>
        <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(30px,4vw,52px)', fontWeight:800, letterSpacing:'-.5px', lineHeight:1.1, marginBottom:'14px', color:'var(--ink)' }}>
          No es solo el auto. Es todo lo que rodea la venta.
        </h2>
        <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'560px', margin:'0 auto', lineHeight:1.6 }}>
          Cada punto de fricción — versión, cuota, seguro, retoma — resuelto por el agente dentro de la misma conversación con el cliente.
        </p>
      </div>
      <div ref={ecoGrid.ref} className="grid-shared eco-grid" style={{ gridTemplateColumns:'repeat(5,1fr)' }}>
        {ECOSISTEMA.map((e,i) => (
          <div key={e.num} className={`reveal eco-cell${ecoGrid.inView?' in':''}`} style={{ transitionDelay:`${i*90}ms` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
              <span className="eco-icon" style={{ fontSize:'17px', width:'36px', height:'36px', borderRadius:'8px', display:'inline-flex', alignItems:'center', justifyContent:'center', background:`${e.chip}22`, border:`1px solid ${e.chip}55` }}>{e.icon}</span>
              <span style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--ink-dim)' }}>{e.num}</span>
            </div>
            <h3 style={{ fontSize:'15px', fontWeight:700, fontFamily:F_DISPLAY, marginBottom:'6px', color:'var(--ink)' }}>{e.titulo}</h3>
            <p style={{ fontSize:'12px', color:'var(--ink-dim)', lineHeight:1.5 }}>{e.desc}</p>
          </div>
        ))}
      </div>

      {/* Líneas de negocio recién sumadas — deliberadamente fuera del grid-shared de arriba
          (sin tabla/chip propio todavía, ver skill pulsemotor-strategy sección 3): se marcan
          "Nuevo" en vez de mezclarse como una celda 06/07 más, para no prometer una madurez
          de producto que todavía no tienen. */}
      {showNuevo && (
        <div ref={ecoNuevo.ref} style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px', marginTop:'16px' }} className="eco-nuevo-grid">
          {ECOSISTEMA_NUEVO.map((e,i) => (
            <div key={e.titulo} className={`reveal${ecoNuevo.inView?' in':''}`} style={{ transitionDelay:`${i*90}ms`, display:'flex', gap:'14px', alignItems:'flex-start', border:'1px dashed var(--line)', borderRadius:'8px', padding:'18px 20px' }}>
              <span style={{ fontSize:'20px', flexShrink:0 }}>{e.icon}</span>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                  <h3 style={{ fontSize:'14px', fontWeight:700, fontFamily:F_DISPLAY, color:'var(--ink)', margin:0 }}>{e.titulo}</h3>
                  <span style={{ fontFamily:F_MONO, fontSize:'10px', fontWeight:700, color:'var(--amber)', border:'1px solid var(--amber-dim)', borderRadius:'3px', padding:'1px 6px', letterSpacing:'.5px' }}>NUEVO</span>
                </div>
                <p style={{ fontSize:'12px', color:'var(--ink-dim)', lineHeight:1.5, margin:0 }}>{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function ActividadEnVivoSection() {
  const activityHeader = useReveal<HTMLDivElement>()
  const statsReveal = useReveal<HTMLDivElement>()
  const auditLog = useReveal<HTMLDivElement>()
  return (
    <section className="section-live" style={{ borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
    <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'72px 24px' }}>
      <div ref={activityHeader.ref} className={`reveal${activityHeader.inView?' in':''}`} style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'36px', flexWrap:'wrap', gap:'16px' }}>
        <div>
          <p className="kicker">Actividad en vivo</p>
          <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'10px', color:'var(--ink)' }}>Cada evento del turno, registrado.</h2>
          <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'480px', lineHeight:1.6 }}>Timeline auditable de todo lo que el agente decide, cotiza y cierra — sin puntos ciegos.</p>
        </div>
        <span className="badge"><span className="live-dot on-gradient" />Live · +7 hoy</span>
      </div>

      <div ref={statsReveal.ref} className="grid-shared stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:'1px' }}>
        {STATS_V2.map((s,i) => <StatCell key={s.label} val={s.val} delta={s.delta} label={s.label} active={statsReveal.inView} delayMs={i*90} />)}
      </div>

      <div ref={auditLog.ref} className="panel" style={{ marginTop:'24px', boxShadow:'0 1px 2px rgba(0,0,0,0.3)' }}>
        <div className="log-row" style={{ padding:'12px 18px', fontFamily:F_MONO, fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', color:'var(--ink-dim)', opacity:1, transform:'none' }}>
          <span>Timestamp</span><span>Evento</span><span className="log-canal">Canal</span><span className="log-estado">Estado</span>
        </div>
        {AUDIT_LOG.map((row,i) => (
          <div key={i} className={`log-row log-row-data${auditLog.inView?' in':''}`} style={{ transitionDelay:`${i*70}ms` }}>
            <span className="log-time">{row.time}</span>
            <span className="log-evento">{row.evento}</span>
            <span className="log-canal">{row.canal}</span>
            <span className={`log-estado ${row.ok?'ok':'pend'}`}>{row.estado}</span>
          </div>
        ))}
      </div>
    </div>
    </section>
  )
}

export function IntegracionesSection() {
  const integHeader = useReveal<HTMLDivElement>()
  const integGrid = useReveal<HTMLDivElement>()
  return (
    <section className="section-dim" style={{ borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
    <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'72px 24px' }}>
      <div ref={integHeader.ref} className={`reveal${integHeader.inView?' in':''}`} style={{ marginBottom:'32px' }}>
        <p className="kicker">Integraciones nativas</p>
        <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'10px', color:'var(--ink)' }}>Vive dentro de tu stack, no encima.</h2>
        <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'520px', lineHeight:1.6, marginBottom:'18px' }}>El agente lee inventario, dispara cotizaciones y sincroniza el CRM sin exportaciones ni copiar-pegar.</p>
        <a href="/pulse/pricing" className="link-arrow" style={{ fontSize:'13px', color:'var(--amber)', textDecoration:'none', fontFamily:F_MONO }}>Ver todas las integraciones<span className="btn-arrow">→</span></a>
      </div>
      <div ref={integGrid.ref} className="grid-shared integ-grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        {INTEGRACIONES.map((it,i) => (
          <div key={it.name} className={`reveal integ-item${integGrid.inView?' in':''}`} style={{ transitionDelay:`${i*80}ms`, display:'flex', alignItems:'center', gap:'12px' }}>
            <div className="integ-icon" style={{ width:'32px', height:'32px', borderRadius:'6px', border:`1px solid ${it.chip}55`, background:`${it.chip}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>🔗</div>
            <span style={{ fontSize:'13px', color:'var(--ink)' }}>{it.name}</span>
          </div>
        ))}
      </div>
    </div>
    </section>
  )
}

export function CumplimientoSection() {
  const cumpleHeader = useReveal<HTMLDivElement>()
  const cumpleGrid = useReveal<HTMLDivElement>()
  return (
    <section style={{ maxWidth:'1280px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
      <div ref={cumpleHeader.ref} className={`reveal${cumpleHeader.inView?' in':''}`} style={{ marginBottom:'32px' }}>
        <p className="kicker">Cumplimiento y seguridad</p>
        <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'10px', color:'var(--ink)' }}>Tu operación, protegida de punta a punta.</h2>
        <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'520px', lineHeight:1.6 }}>El agente opera dentro de tu stack sin exponer datos de clientes fuera de tu control.</p>
      </div>
      <div ref={cumpleGrid.ref} className="grid-shared integ-grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        {CUMPLIMIENTO.map((c,i) => (
          <div key={c.label} className={`reveal integ-item${cumpleGrid.inView?' in':''}`} style={{ transitionDelay:`${i*80}ms`, display:'flex', alignItems:'center', gap:'12px' }}>
            <div className="integ-icon" style={{ width:'32px', height:'32px', borderRadius:'6px', border:`1px solid ${c.chip}55`, background:`${c.chip}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>{c.icon}</div>
            <span style={{ fontSize:'13px', color:'var(--ink)' }}>{c.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function TestimoniosSection({ testimonios, headline }: { testimonios: readonly { seg: string; texto: string; nombre: string; cargo: string }[]; headline: string }) {
  const testiHeader = useReveal<HTMLDivElement>()
  const testiGrid = useReveal<HTMLDivElement>()
  const multi = testimonios.length > 1
  return (
    <section className="section-dim-2" style={{ borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
    <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'72px 24px' }}>
      <div ref={testiHeader.ref} className={`reveal${testiHeader.inView?' in':''}`} style={{ marginBottom:'44px' }}>
        <p className="kicker">Lo dicen quienes ya lo usan</p>
        <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, color:'var(--ink)' }}>
          {headline}
        </h2>
      </div>
      <div ref={testiGrid.ref} className="testi-grid" style={{ display:'grid', gridTemplateColumns: multi ? '1fr 1fr' : '1fr', gap:'24px', maxWidth: multi ? undefined : '560px' }}>
        {testimonios.map((t,i) => (
          <div key={t.nombre} className={`quote-card reveal${testiGrid.inView?' in':''}`} style={{ transitionDelay:`${i*150}ms` }}>
            <p className="kicker">{t.seg}</p>
            <p style={{ fontSize:'16px', color:'var(--ink)', lineHeight:1.6, margin:'12px 0 18px' }}>"{t.texto}"</p>
            <div style={{ fontSize:'13px' }}>
              <div style={{ fontWeight:700, color:'var(--ink)' }}>{t.nombre}</div>
              <div style={{ color:'var(--ink-dim)', fontSize:'12px' }}>{t.cargo}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </section>
  )
}

export function PreciosSection({ initialSegment, showToggle }: { initialSegment: 'individual' | 'concesionario'; showToggle: boolean }) {
  const [pricingSegment, setPricingSegment] = useState<'individual'|'concesionario'>(initialSegment)
  const ctaFinal = useReveal<HTMLDivElement>()
  const pricingGrid = useReveal<HTMLDivElement>()
  return (
    <section id="precios" className="cta-spotlight" style={{ maxWidth:'1000px', margin:'0 auto', padding:'80px 24px 100px', textAlign:'center', scrollMarginTop:'80px' }}>
      <div ref={ctaFinal.ref} className={`reveal${ctaFinal.inView?' in':''}`} style={{ marginBottom:'40px' }}>
        <p className="kicker" style={{ justifyContent:'center', display:'flex' }}>Precios</p>
        <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-.5px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
          Elegí el plan para <span className="grad-amber">tu forma de vender.</span>
        </h2>
        <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'480px', margin:'0 auto 32px', lineHeight:1.6 }}>Sin costos por lead. Sin implementación oculta. Cobrás por resultado, no por promesas.</p>
        {showToggle && (
          <div className="pricing-toggle" role="tablist" aria-label="Segmento de precios">
            <button type="button" role="tab" aria-selected={pricingSegment==='individual'} className={pricingSegment==='individual'?'active':''} onClick={() => setPricingSegment('individual')}>Vendedor individual</button>
            <button type="button" role="tab" aria-selected={pricingSegment==='concesionario'} className={pricingSegment==='concesionario'?'active':''} onClick={() => setPricingSegment('concesionario')}>Concesionario</button>
          </div>
        )}
      </div>

      <div ref={pricingGrid.ref} className="seg-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
        {PRICING_PLANS[pricingSegment].map((plan,i) => (
          <div key={plan.nombre} className={`price-card reveal${pricingGrid.inView?' in':''}${plan.destacado?' destacado':''}`} style={{ transitionDelay:`${i*140}ms` }}>
            {plan.destacado && <span className="badge-rec">Recomendado</span>}
            <h3 style={{ fontSize:'19px', fontWeight:800, fontFamily:F_DISPLAY, color:'var(--ink)' }}>{plan.nombre}</h3>
            <div className="precio-row">
              <span className="precio-num">{plan.precio}</span>
              {plan.periodo && <span className="precio-per">{plan.periodo}</span>}
            </div>
            <p style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--ink-dim)', marginBottom:'18px' }}>{plan.para}</p>
            <div style={{ marginBottom:'22px' }}>
              {plan.bullets.map(b => <div key={b} className="seg-check"><span className="mark">✓</span><span>{b}</span></div>)}
            </div>
            <a href={plan.href} className={plan.destacado?'pm-btn':'pm-btn-outline'} style={{ display:'inline-flex', width:'auto', textDecoration:'none', padding:'11px 20px', fontSize:'13px', borderRadius:'6px' }}>{plan.cta}<span className="btn-arrow">→</span></a>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Formulario de contacto B2B — usado por el widget flotante (compact) y por
// ContactoVentasSection (completo). Envía a /api/pulse/lead-widget, que guarda el
// lead y notifica por WhatsApp — no inventa un mecanismo nuevo, sigue el mismo patrón
// que ya usa Fenix Consultores en este repo (Supabase + CallMeBot best-effort). ───
type PulseLeadStatus = 'idle' | 'loading' | 'ok' | 'error'

function IconLockSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function PulseLeadForm({ compact = false, onSuccess }: { compact?: boolean; onSuccess?: () => void }) {
  const [status, setStatus] = useState<PulseLeadStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const form = e.currentTarget
    const mensajeEl = form.elements.namedItem('mensaje') as HTMLTextAreaElement | null
    const data = {
      nombre: (form.elements.namedItem('nombre') as HTMLInputElement).value.trim(),
      empresa: (form.elements.namedItem('empresa') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      telefono: (form.elements.namedItem('telefono') as HTMLInputElement).value.trim(),
      mensaje: mensajeEl?.value.trim() || '',
    }
    try {
      const res = await fetch('/api/pulse/lead-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo enviar el formulario')
      setStatus('ok')
      form.reset()
      onSuccess?.()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  if (status === 'ok') {
    return (
      <div style={{ textAlign:'center', padding:'2rem 0' }}>
        <div style={{ width:'52px', height:'52px', borderRadius:'50%', margin:'0 auto 1rem', background:'rgba(62,207,126,0.12)', border:'1px solid rgba(62,207,126,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <div style={{ fontSize:'17px', fontWeight:800, fontFamily:F_DISPLAY, color:'var(--ink)', marginBottom:'8px' }}>Solicitud recibida</div>
        <div style={{ fontSize:'14px', color:'var(--ink-dim)', lineHeight:1.6 }}>Un especialista de Pulse Motor te escribe por WhatsApp muy pronto.</div>
      </div>
    )
  }

  const gap = compact ? '10px' : '14px'
  const rowCols = compact ? '1fr' : '1fr 1fr'

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap, textAlign:'left' }}>
      <div style={{ display:'grid', gridTemplateColumns:rowCols, gap }} className="pulse-form-row">
        <div>
          <label className="pulse-lead-label" htmlFor="nombre">Nombre *</label>
          <input id="nombre" name="nombre" required className="pm-input" placeholder="Tu nombre" />
        </div>
        <div>
          <label className="pulse-lead-label" htmlFor="empresa">Concesionario (opcional)</label>
          <input id="empresa" name="empresa" className="pm-input" placeholder="Si aplica" />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:rowCols, gap }} className="pulse-form-row">
        <div>
          <label className="pulse-lead-label" htmlFor="email">Correo *</label>
          <input id="email" name="email" type="email" required className="pm-input" placeholder="tu@correo.com" />
        </div>
        <div>
          <label className="pulse-lead-label" htmlFor="telefono">WhatsApp *</label>
          <input id="telefono" name="telefono" type="tel" required className="pm-input" placeholder="+57 300 000 0000" />
        </div>
      </div>
      {!compact && (
        <div>
          <label className="pulse-lead-label" htmlFor="mensaje">¿En qué podemos ayudarte?</label>
          <textarea id="mensaje" name="mensaje" rows={3} className="pm-input" style={{ resize:'vertical' }} placeholder="Ruteo de leads, integración con mi DMS, precios para mi equipo..." />
        </div>
      )}
      {status === 'error' && <div style={{ fontSize:'13px', color:'var(--red)' }}>{errorMsg}</div>}
      <button type="submit" disabled={status === 'loading'} className="pm-btn" style={{ padding: compact ? '12px' : '14px', cursor: status === 'loading' ? 'default' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? 'Enviando…' : compact ? 'Enviar' : 'Hablar con un especialista'}<span className="btn-arrow">→</span>
      </button>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'11px', color:'var(--ink-dim)' }}>
        <IconLockSmall /> Tus datos están protegidos y no se comparten con terceros
      </div>
    </form>
  )
}

function IconChatBubble() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

// ─── Widget flotante — visible al salir del hero, oculto cerca del footer (donde ya
// vive ContactoVentasSection con el mismo formulario completo). Arranca minimizado
// como una pill, sigue el tema soft/dark de la página (a diferencia de los paneles
// "pantalla de producto", esta es una pieza de marketing, no una captura del agente). ───
export function PulseStickyWidget() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('plataforma')
    const footer = document.getElementById('pulse-footer')
    if (!hero) return

    let heroVisible = true
    let footerVisible = false
    const update = () => setVisible(!heroVisible && !footerVisible)

    const heroObserver = new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; update() }, { threshold: 0 })
    heroObserver.observe(hero)

    let footerObserver: IntersectionObserver | undefined
    if (footer) {
      footerObserver = new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; update() }, { threshold: 0.1 })
      footerObserver.observe(footer)
    }

    return () => { heroObserver.disconnect(); footerObserver?.disconnect() }
  }, [])

  if (!visible) return null

  return (
    <div className="pulse-widget" style={{ position:'fixed', bottom:'20px', right:'20px', zIndex:60, maxWidth: expanded ? '360px' : undefined, width: expanded ? 'calc(100vw - 40px)' : undefined, maxHeight: expanded ? '85vh' : undefined, overflowY: expanded ? 'auto' : 'visible' }}>
      {expanded ? (
        <div className="panel pulse-widget-card" style={{ position:'relative', padding:'22px' }}>
          <button onClick={() => setExpanded(false)} aria-label="Minimizar" className="pulse-widget-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', flexShrink:0, background:'rgba(242,169,59,0.14)', border:'1px solid var(--amber-dim)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--amber)' }}>
              <IconChatBubble />
            </div>
            <div>
              <div className="kicker" style={{ marginBottom:0 }}>Pulse Motor</div>
              <h3 style={{ fontSize:'17px', fontWeight:800, fontFamily:F_DISPLAY, color:'var(--ink)' }}>Hablar con ventas</h3>
            </div>
          </div>
          <PulseLeadForm compact />
        </div>
      ) : (
        <button onClick={() => setExpanded(true)} aria-label="Abrir formulario de contacto" className="pm-btn pulse-widget-bubble">
          <span className="pulse-widget-ring" aria-hidden="true" />
          <span className="pulse-widget-bubble-icon"><IconChatBubble /></span>
          Hablar con ventas
        </button>
      )}
    </div>
  )
}

// ─── Sección final antes del footer en las 2 landings de segmento — mismo patrón que
// el CTA de contacto de Fenix Consultores (headline + teléfono/WhatsApp directo + stat
// de confianza + formulario completo), adaptado al sistema ámbar/negro de Pulse Motor. ───
export function ContactoVentasSection({ segmento }: { segmento: 'concesionario' | 'asesor' }) {
  const reveal = useReveal<HTMLDivElement>()
  const stat = segmento === 'concesionario' ? '+180 concesionarios activos' : '+500 asesores conectados'
  return (
    <section id="hablar-con-ventas" style={{ padding:'1rem 24px 6rem' }}>
      <div ref={reveal.ref} className={`reveal seg-grid${reveal.inView?' in':''}`} style={{
        maxWidth:'1100px', margin:'0 auto', position:'relative', overflow:'hidden',
        border:'1px solid var(--amber-dim)', borderRadius:'20px', padding:'3rem',
        boxShadow:'var(--shadow-lg)',
        display:'grid', gridTemplateColumns:'minmax(260px, 1fr) minmax(300px, 1.1fr)', gap:'2.5rem', alignItems:'start',
      }}>
        <div style={{ position:'absolute', top:'-160px', left:'5%', width:'440px', height:'440px', borderRadius:'50%', background:'radial-gradient(circle, rgba(242,169,59,0.16) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
            <p className="kicker" style={{ marginBottom:0 }}>Para ventas</p>
            <span className="badge" style={{ padding:'4px 11px', fontSize:'11px' }}><span className="live-dot" />{stat}</span>
          </div>
          <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(26px,3.2vw,42px)', fontWeight:800, letterSpacing:'-.015em', lineHeight:1.15, marginBottom:'1.1rem', color:'var(--ink)' }}>
            Hable con <span className="grad-amber">un especialista de Pulse Motor</span>
          </h2>
          <p style={{ fontSize:'15px', color:'var(--ink-dim)', lineHeight:1.8, marginBottom:'2rem' }}>
            Cuéntenos cómo vende hoy su equipo y le mostramos cómo desplegar el agente en su WhatsApp Business en días, no en meses.
          </p>
          <a href="https://wa.me/573004339418" target="_blank" rel="noopener noreferrer" className="pm-btn-outline" style={{ display:'inline-flex', width:'auto', padding:'13px 22px', fontSize:'13px', borderRadius:'999px', textDecoration:'none' }}>
            <IconChatBubble /> +57 300 433 9418
          </a>
        </div>
        <div className="panel" style={{ padding:'26px' }}>
          <PulseLeadForm />
        </div>
      </div>
    </section>
  )
}

// ─── Hoja de estilos compartida — un solo bloque que las 3 páginas (/pulse,
// /pulse/concesionario, /pulse/asesor) montan una vez cada una ───
export function PulseStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      /* ── Tema: soft (claro, default) / dark ──
         :root define los valores soft — el fallback global mientras cualquiera de las 3
         páginas públicas de Pulse Motor está montada. .pulse-theme-root[data-theme='dark']
         reescribe esos mismos nombres de variable solo dentro del wrapper de la página
         cuando el usuario alterna a oscuro con el botón del header (ThemeToggle). Los
         paneles "pantalla de producto" (timeline del hero, preview de DataBridge, preview
         de WhatsApp, panel de Cobertura, tabla de auditoría) usan un set de variables
         --panel-* aparte que NUNCA cambia con el tema — son dispositivos que siempre se
         ven como una captura real del producto, no parte del lienzo de la página. */
      /* :root Y .pulse-theme-root reciben los mismos valores soft explícitamente (no solo
         :root con .pulse-theme-root heredando): layout.tsx envuelve estas páginas en su
         propio .pulse-root con tokens oscuros FIJOS para el dashboard autenticado, y al ser
         un ancestro más cercano que :root, .pulse-theme-root heredaría esos oscuros si no
         los redeclarara acá directamente encima suyo. */
      :root, .pulse-theme-root {
        --bg-0:#FDFBF7; --bg-1:#FFFFFF; --bg-2:#F5F1E9; --bg-3:#F7F3EC; --bg-4:#F1EAE0; --line:#E7E0D2;
        --ink:#1A1712; --ink-dim:#726B5E;
        --amber:#F2A93B; --amber-2:#C9770B; --amber-dim:#8A6423; --green:#3ECF7E; --red:#E5484D;
        --grad-amber: linear-gradient(135deg, var(--amber), var(--amber-2));
        --green-2:#0F3D2B;
        --grad-green: linear-gradient(135deg, var(--green-2), var(--green));
        --ease-out-expo: cubic-bezier(.16,1,.3,1);

        --panel-bg:#14120F; --panel-bg-2:#1B1815; --panel-line:#2A2620; --panel-ink:#F3EFE7; --panel-ink-dim:#9B958A;

        --header-bg: rgba(253,251,247,0.85);
        --shadow-lg: 0 20px 40px rgba(30,24,15,0.10), 0 6px 14px rgba(30,24,15,0.06);
        --shadow-sm: 0 1px 2px rgba(30,24,15,0.05);
        --seg-wash-amber: linear-gradient(165deg, rgba(242,169,59,0.16) 0%, rgba(242,169,59,0.05) 44%, var(--bg-1) 80%);
        --seg-wash-green: linear-gradient(165deg, rgba(62,207,126,0.16) 0%, rgba(62,207,126,0.05) 44%, var(--bg-1) 80%);
        --seg-badge-border: var(--line); --seg-badge-ink: var(--ink-dim);
        --seg-badge-dot: var(--green); --seg-badge-dot-shadow: rgba(62,207,126,0.55);
        --seg-hover-ink: var(--ink);
        --hero-mesh: radial-gradient(560px circle at 6% -12%, rgba(242,169,59,0.14), transparent 62%), radial-gradient(560px circle at 97% -12%, rgba(62,207,126,0.12), transparent 62%);
      }
      .pulse-theme-root[data-theme='dark'] {
        --bg-0:#0B0D0C; --bg-1:#14120F; --bg-2:#1B1815; --bg-3:#241F1A; --bg-4:#2D2721; --line:#2A2620;
        --ink:#F3EFE7; --ink-dim:#9B958A;

        --header-bg: rgba(11,13,12,0.85);
        --shadow-lg: 0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3);
        --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
        --seg-wash-amber: linear-gradient(165deg, rgba(242,169,59,0.8) 0%, rgba(242,169,59,0.32) 44%, var(--bg-1) 80%);
        --seg-wash-green: linear-gradient(165deg, rgba(62,207,126,0.8) 0%, rgba(62,207,126,0.32) 44%, var(--bg-1) 80%);
        --seg-badge-border: rgba(255,255,255,0.35); --seg-badge-ink: #fff;
        --seg-badge-dot: #fff; --seg-badge-dot-shadow: rgba(255,255,255,0.55);
        --seg-hover-ink: #fff;
        --hero-mesh: none;
      }
      body { background: var(--bg-0); }
      ::selection { background:rgba(242,169,59,0.35); color:#fff; }
      .pulse-theme-root { background-color:var(--bg-0); background-image:var(--hero-mesh); background-repeat:no-repeat; transition:background-color .3s ease; }

      /* ── Ritmo de fondo entre secciones: tonos oscuros graduados + un momento en vivo ──
         Los componentes ya leen todo su color de estas variables, así que alcanza con
         redefinirlas en el ancestro de cada sección — cascadean solas al resto del árbol. */
      .section-dim {
        background: var(--bg-2);
        --bg-1: var(--bg-3);
      }
      .section-dim-2 {
        background: var(--bg-3);
        --bg-1: var(--bg-4);
      }
      /* Momento "en vivo": eleva el verde de estado a degradé de sección — no es un hue nuevo,
         es la misma semántica de "activo/en vivo" ya usada en el punto pulsante, ahora a escala hero.
         Las celdas/paneles flotan como vidrio esmerilado oscuro encima del degradé (mismo patrón que
         usa el ámbar en el hero), así el contenido interno sigue leyendo con los tokens normales. */
      .section-live {
        background: var(--grad-green);
        --bg-1: rgba(6,20,14,0.55); --bg-2: rgba(6,20,14,0.75); --line: rgba(255,255,255,0.16);
        --ink: #FFFFFF; --ink-dim: rgba(255,255,255,0.72);
      }

      .grad-amber { background-image:var(--grad-amber); -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-fill-color:transparent; }

      .guard-sweep { position:relative; }
      .guard-sweep::before {
        content:''; position:absolute; inset:-60%; z-index:-1; border-radius:50%; pointer-events:none;
        background: conic-gradient(from 0deg, transparent 0deg, rgba(242,169,59,0.18) 18deg, transparent 50deg);
        animation: guardSweep 9s linear infinite;
      }
      @keyframes guardSweep { to { transform: rotate(360deg); } }

      .pm-input { width:100%; padding:13px 16px; border-radius:6px; border:1.5px solid var(--line); background:rgba(255,255,255,0.02); color:var(--ink); font-size:15px; font-family:${F_BODY}; outline:none; transition:border-color .15s, box-shadow .15s; }
      .pm-input:focus { border-color:var(--amber-dim); box-shadow:0 0 0 3px rgba(242,169,59,0.16); }
      .pm-input::placeholder { color:var(--ink-dim); }

      .pulse-lead-label { display:block; font-size:12px; font-weight:600; color:var(--ink-dim); margin-bottom:6px; }
      @media(max-width:560px){ .pulse-form-row{ grid-template-columns:1fr!important; } }

      .pulse-widget { animation:pulseWidgetIn .5s var(--ease-out-expo); }
      .pulse-widget-bubble { position:relative; width:auto; display:inline-flex; align-items:center; gap:10px; padding:14px 22px 14px 16px; border-radius:999px; }
      .pulse-widget-bubble-icon { width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,0.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .pulse-widget-ring { position:absolute; inset:0; border-radius:999px; box-shadow:0 0 0 0 rgba(242,169,59,0.55); animation:pulseWidgetRing 2.4s ease-out infinite; pointer-events:none; }
      .pulse-widget-card { position:relative; }
      .pulse-widget-close { position:absolute; top:14px; right:14px; background:none; border:none; color:var(--ink-dim); cursor:pointer; padding:4px; display:flex; transition:color .15s ease; }
      .pulse-widget-close:hover { color:var(--ink); }
      @keyframes pulseWidgetIn { from{ opacity:0; transform:translateY(24px); } to{ opacity:1; transform:translateY(0); } }
      @keyframes pulseWidgetRing { 0%{ box-shadow:0 0 0 0 rgba(242,169,59,0.55); } 70%{ box-shadow:0 0 0 14px transparent; } 100%{ box-shadow:0 0 0 0 transparent; } }
      @media (prefers-reduced-motion: reduce) {
        .pulse-widget, .pulse-widget-ring { animation:none; }
      }

      .pm-btn { width:100%; padding:14px; border-radius:6px; border:1px solid var(--amber); background:var(--amber); color:#1a1204; font-size:14px; font-weight:700; cursor:pointer; font-family:${F_DISPLAY}; transition:background-color .15s, transform .15s, box-shadow .15s; }
      .pm-btn:hover:not(:disabled) { background:#ffc266; border-color:#ffc266; transform:translateY(-1px); box-shadow:0 4px 16px rgba(242,169,59,0.35); }
      .pm-btn:disabled { opacity:.5; cursor:not-allowed; }
      .pm-btn-ghost { background:transparent; border:1px solid var(--line); color:var(--ink); transition:border-color .15s, background-color .15s, transform .15s; }
      .pm-btn-ghost:hover:not(:disabled) { border-color:var(--ink-dim); background:rgba(255,255,255,0.04); transform:translateY(-1px); }
      .pm-btn-outline { background:transparent; border:1.5px solid var(--amber-dim); color:var(--amber); transition:border-color .2s ease, background-color .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease; }
      .pm-btn-outline:hover:not(:disabled) { border-color:var(--amber); background:rgba(242,169,59,0.08); color:var(--ink); transform:translateY(-1px); box-shadow:0 4px 16px rgba(242,169,59,0.2); }

      .btn-arrow { display:inline-block; margin-left:6px; transition:transform .2s var(--ease-out-expo); }
      a:hover .btn-arrow, button:hover .btn-arrow { transform:translateX(4px); }

      .link-arrow { display:inline-flex; align-items:center; }

      .badge { display:inline-flex; align-items:center; gap:10px; border:1px solid var(--line); border-radius:3px; padding:6px 12px; font-family:${F_MONO}; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:var(--ink-dim); }
      .live-dot { width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 0 0 rgba(62,207,126,0.6); animation:livePulse 2s ease infinite; flex-shrink:0; }
      @keyframes livePulse { 0%{box-shadow:0 0 0 0 rgba(62,207,126,0.55)} 70%{box-shadow:0 0 0 6px rgba(62,207,126,0)} 100%{box-shadow:0 0 0 0 rgba(62,207,126,0)} }
      /* Sobre el degradé verde (siempre verde, sin importar el tema) el punto verde se pierde
         — versión blanca fija para el badge "en vivo" de esa sección. */
      .live-dot.on-gradient { background:#fff; animation-name:livePulseWhite; }
      @keyframes livePulseWhite { 0%{box-shadow:0 0 0 0 rgba(255,255,255,0.55)} 70%{box-shadow:0 0 0 6px rgba(255,255,255,0)} 100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} }
      /* Variante para el badge de prueba social dentro del seg-card: ese fondo SÍ sigue el
         tema (wash intenso en dark, wash tenue en soft), así que el punto necesita adaptarse
         — blanco sobre el wash saturado de dark, verde normal sobre el wash tenue de soft. */
      .live-dot.on-tint { background:var(--seg-badge-dot); animation-name:livePulseTint; }
      @keyframes livePulseTint { 0%{box-shadow:0 0 0 0 var(--seg-badge-dot-shadow)} 70%{box-shadow:0 0 0 6px transparent} 100%{box-shadow:0 0 0 0 transparent} }

      .theme-toggle { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:50%; border:1px solid var(--line); background:transparent; color:var(--ink-dim); cursor:pointer; transition:border-color .15s ease, color .15s ease, background-color .15s ease; }
      .theme-toggle:hover { color:var(--ink); border-color:var(--ink-dim); background:rgba(128,128,128,0.08); }

      .kicker { display:inline-flex; align-items:center; gap:6px; font-family:${F_MONO}; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--amber); margin-bottom:14px; }

      .grid-shared { display:grid; gap:1px; background:var(--line); border:1px solid var(--line); border-radius:6px; overflow:hidden; box-shadow:var(--shadow-sm); }
      .grid-shared > * { background:var(--bg-1); padding:24px; transition:background-color .25s ease; backdrop-filter:blur(10px); }

      .reveal { opacity:0; transform:translateY(28px) scale(.98); transition:opacity .8s var(--ease-out-expo), transform .8s var(--ease-out-expo); }
      .reveal.in { opacity:1; transform:translateY(0) scale(1); }

      .panel { border:1px solid var(--panel-line); border-radius:6px; overflow:hidden; box-shadow:0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3); background:var(--panel-bg); backdrop-filter:blur(10px); }
      .panel-head { display:flex; align-items:center; justify-content:space-between; padding:12px 18px; border-bottom:1px solid var(--panel-line); font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--panel-ink-dim); }
      .wa-bubble { max-width:82%; padding:8px 12px; font-size:12.5px; line-height:1.5; font-family:${F_BODY}; border-radius:10px; }
      .wa-lead { align-self:flex-start; background:var(--panel-bg-2); color:var(--panel-ink); border-bottom-left-radius:2px; }
      .wa-agent { align-self:flex-end; background:var(--grad-green); color:#04150c; font-weight:600; border-bottom-right-radius:2px; }
      .log-row { display:grid; grid-template-columns:90px 1fr 150px 120px; gap:16px; align-items:center; padding:13px 18px; border-bottom:1px solid var(--panel-line); font-size:13px; opacity:0; transform:translateY(6px); transition:opacity .5s ease, transform .5s ease; }
      .log-row:last-child { border-bottom:none; }
      .log-row.in { opacity:1; transform:translateY(0); }
      .log-time, .log-canal { font-family:${F_MONO}; color:var(--panel-ink-dim); font-size:12px; }
      .log-evento { color:var(--panel-ink); }
      .log-estado { font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:.5px; text-align:right; }
      .log-estado.ok { color:var(--green); }
      .log-estado.pend { color:var(--amber); }

      .tool-row { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-bottom:1px solid var(--panel-line); font-family:${F_MONO}; font-size:13px; opacity:0; transform:translateX(-8px); transition:opacity .4s ease, transform .4s ease; }
      .tool-row:last-child { border-bottom:none; }
      .tool-row.in { opacity:1; transform:translateX(0); }
      .tool-row .fn { color:var(--panel-ink); }
      .tool-row .ms { color:var(--panel-ink-dim); display:flex; align-items:center; gap:8px; }

      /* Pista de progreso del trámite: el auto avanza a medida que se ejecutan los tool-calls */
      .tool-road { position:relative; height:16px; margin:2px 18px 10px; }
      .tool-road::before { content:''; position:absolute; top:50%; left:2px; right:2px; height:0; border-top:2px dashed var(--panel-line); transform:translateY(-50%); }
      .tool-road-car { position:absolute; top:50%; font-size:15px; line-height:1; transform:translate(-50%,-50%); transition:left .5s var(--ease-out-expo); filter:drop-shadow(0 1px 2px rgba(0,0,0,.5)); }

      .seg-card { border:1px solid var(--line); border-radius:6px; padding:32px; background:var(--bg-1); transition:opacity .8s var(--ease-out-expo), transform .25s var(--ease-out-expo), box-shadow .25s ease, border-color .25s ease; display:block; text-decoration:none; }
      .seg-card:hover { transform:translateY(-8px) scale(1.03); box-shadow:var(--shadow-lg); }
      .seg-card-amber { position:relative; overflow:hidden; border:1.5px solid var(--amber-dim); background:var(--seg-wash-amber); }
      .seg-card-amber::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--grad-amber); }
      .seg-card-amber:hover { border-color:var(--amber); }
      .seg-card-green { position:relative; overflow:hidden; border:1.5px solid #1F7A4E; background:var(--seg-wash-green); }
      .seg-card-green::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--grad-green); }
      .seg-card-green:hover { border-color:var(--green); }
      .seg-card-icon { margin-bottom:20px; opacity:0.95; }
      .seg-card-title { font-size:24px; color:var(--ink); transition:font-size .25s var(--ease-out-expo), color .25s ease; }
      .seg-card-subtitle { font-size:11px; color:var(--ink-dim); transition:font-size .25s var(--ease-out-expo), color .25s ease; }
      .seg-card:hover .seg-card-title { font-size:28px; color:var(--seg-hover-ink); }
      .seg-card:hover .seg-card-subtitle { font-size:12px; color:var(--seg-hover-ink); }
      .seg-card-arrow { position:absolute; top:24px; right:24px; width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:700; line-height:1; transition:transform .25s var(--ease-out-expo); }
      .seg-card-amber .seg-card-arrow { color:var(--amber); border:2.5px solid var(--amber); background:rgba(242,169,59,0.08); }
      .seg-card-green .seg-card-arrow { color:var(--green); border:2.5px solid var(--green); background:rgba(62,207,126,0.08); }
      .seg-card:hover .seg-card-arrow { transform:translate(4px,-4px); }
      .seg-tag { display:inline-flex; font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:1px; padding:3px 10px; border-radius:3px; margin-bottom:16px; }
      .seg-tag.amber { color:var(--amber); border:1px solid var(--amber-dim); }
      .seg-tag.green { color:var(--green); border:1px solid rgba(62,207,126,0.4); }
      .seg-check { display:flex; gap:10px; align-items:baseline; padding:6px 0; font-size:13px; color:var(--ink-dim); }
      .seg-check .mark { color:var(--green); font-family:${F_MONO}; flex-shrink:0; }
      .seg-check-mark { display:inline-block; transition:transform .2s var(--ease-out-expo); }
      .seg-check:hover .seg-check-mark { transform:scale(1.4) rotate(-8deg); }

      .quote-card { border:1px solid var(--line); border-radius:6px; padding:28px; background:var(--bg-1); transition:opacity .8s var(--ease-out-expo), transform .25s var(--ease-out-expo), box-shadow .25s ease, border-color .25s ease; }
      .quote-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-lg); border-color:var(--line); }

      .eco-cell { transition:opacity .8s var(--ease-out-expo), transform .25s var(--ease-out-expo), background-color .25s ease; }
      .eco-cell:hover { transform:translateY(-4px); background:var(--bg-2); }
      .eco-icon { display:inline-block; transition:transform .25s var(--ease-out-expo); }
      .eco-cell:hover .eco-icon { transform:scale(1.18); }

      .integ-item { transition:opacity .8s var(--ease-out-expo), transform .2s var(--ease-out-expo); }
      .integ-item:hover { transform:translateY(-3px); }
      .integ-icon { transition:border-color .2s ease, color .2s ease; }
      .integ-item:hover .integ-icon { border-color:var(--amber-dim); color:var(--amber); }

      .stat-cell { transition:opacity .8s var(--ease-out-expo), transform .2s var(--ease-out-expo); }
      .stat-cell:hover { transform:translateY(-2px); }

      .log-row-data { transition:background-color .2s ease, opacity .5s ease, transform .5s ease; }
      .log-row-data:hover { background:var(--panel-bg-2); }

      .pm-nav-link { position:relative; padding-bottom:4px; color:var(--ink-dim); transition:color .2s ease; }
      .pm-nav-link::after { content:''; position:absolute; left:0; bottom:0; width:0; height:1px; background:var(--amber); transition:width .25s var(--ease-out-expo); }
      .pm-nav-link:hover { color:var(--ink); }
      .pm-nav-link:hover::after { width:100%; }
      .pm-nav-link.active { color:var(--amber); }
      .pm-nav-link.active::after { width:100%; }

      .scroll-cue { display:inline-flex; flex-direction:column; align-items:center; gap:6px; text-decoration:none; color:var(--ink-dim); font-family:${F_MONO}; font-size:11px; letter-spacing:.5px; text-transform:uppercase; animation:cueBounce 2.2s ease-in-out infinite; transition:color .2s ease; }
      .scroll-cue:hover { color:var(--amber); }
      @keyframes cueBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }

      .cta-spotlight { position:relative; }
      .cta-spotlight::before { content:''; position:absolute; inset:-60px -20px; z-index:-1; background:radial-gradient(ellipse 60% 70% at center, rgba(242,169,59,0.10), transparent 70%); pointer-events:none; }

      .pricing-toggle { display:inline-flex; border:1px solid var(--line); border-radius:8px; padding:4px; gap:4px; background:var(--bg-1); }
      .pricing-toggle button { border:none; background:transparent; color:var(--ink-dim); font-family:${F_BODY}; font-size:13px; font-weight:600; padding:9px 18px; border-radius:6px; cursor:pointer; transition:background-color .2s ease, color .2s ease; }
      .pricing-toggle button.active { background:var(--amber); color:#1a1204; }

      .price-card { border:1px solid var(--line); border-radius:6px; padding:32px; background:var(--bg-1); position:relative; text-align:left; transition:opacity .8s var(--ease-out-expo), transform .25s var(--ease-out-expo), box-shadow .25s ease, border-color .25s ease; }
      .price-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-lg); }
      .price-card.destacado { border-color:var(--amber-dim); box-shadow:var(--shadow-lg); }
      .price-card .badge-rec { position:absolute; top:-11px; left:32px; background:var(--amber); color:#1a1204; font-family:${F_MONO}; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:4px 10px; border-radius:3px; }
      .price-card .precio-row { display:flex; align-items:baseline; gap:6px; margin:12px 0 4px; }
      .price-card .precio-num { font-family:${F_DISPLAY}; font-size:36px; font-weight:800; color:var(--ink); }
      .price-card .precio-per { font-family:${F_MONO}; font-size:13px; color:var(--ink-dim); }

      @media(max-width:640px){
        .pricing-toggle{ width:100%; }
        .pricing-toggle button{ flex:1; }
      }

      .footer-col a { display:block; color:var(--ink-dim); text-decoration:none; font-size:13px; padding:5px 0; transition:color .15s ease; }
      .footer-col a:hover { color:var(--ink); }
      .footer-col h4 { font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--ink-dim); margin-bottom:12px; }
      @media(max-width:700px){
        .footer-grid{ grid-template-columns:1fr 1fr!important; }
      }

      @media (prefers-reduced-motion: reduce) {
        .live-dot, .guard-sweep::before { animation:none; }
        .log-row, .reveal, .tool-row { transition:none; opacity:1; transform:none; }
        .pm-btn:hover:not(:disabled) { transform:none; }
        .scroll-cue { animation:none; }
        .btn-arrow, .eco-cell, .eco-icon, .integ-item, .integ-icon, .quote-card, .stat-cell, .log-row-data, .pm-nav-link::after, .price-card, .seg-card, .seg-card-arrow, .seg-check-mark, .tool-road-car { transition:none; }
      }

      @media(max-width:700px){
        .pm-nav{display:none!important}
      }
      @media(max-width:900px){
        .hero-grid{flex-direction:column!important;align-items:center!important}
        .hero-grid>*{max-width:100%!important;width:100%!important}
        .eco-grid{grid-template-columns:1fr 1fr!important}
        .eco-nuevo-grid{grid-template-columns:1fr!important}
        .insumos-grid{grid-template-columns:1fr!important}
        .seg-grid{grid-template-columns:1fr!important}
        .stats-grid{grid-template-columns:1fr 1fr!important}
        .integ-grid{grid-template-columns:1fr 1fr!important}
        .testi-grid{grid-template-columns:1fr!important}
        .log-row{grid-template-columns:70px 1fr!important}
        .log-row .log-canal, .log-row .log-estado{display:none}
      }
    `}</style>
  )
}
