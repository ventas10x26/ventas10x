import Link from 'next/link'
import BotIASection from '@/components/landing/BotIASection'
import KitDigitalSection from '@/components/landing/KitDigitalSection'
import DashboardIASection from '@/components/landing/DashboardIASection'

const DARK = '#0f1c2e'
const SOFT = '#f4f6f9'

export default function HomePage() {
  return (
    <div style={{ fontFamily:"var(--font-jakarta,'Plus Jakarta Sans',system-ui,sans-serif)", background:DARK, minHeight:'100vh', color:'#fff' }}>

      {/* NAV — dark sticky */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.1rem 2rem', borderBottom:'1px solid rgba(255,255,255,.07)', position:'sticky', top:0, zIndex:50, background:'rgba(15,28,46,.97)', backdropFilter:'blur(14px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <svg width="34" height="34" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
          <span style={{ fontWeight:800, fontSize:'19px', letterSpacing:'-.02em' }}>Ventas<span style={{ color:'#FF6B2B' }}>10x</span></span>
        </div>
        <div style={{ display:'flex', gap:'1.75rem', alignItems:'center' }}>
          {['#como-funciona:Cómo funciona','#bot-ia:Bot IA','#sectores:Sectores','#precios:Precios'].map(item => {
            const [href, label] = item.split(':')
            return <a key={href} href={href} style={{ fontSize:'14px', color:'rgba(255,255,255,.72)', textDecoration:'none', fontWeight:500 }}>{label}</a>
          })}
          <Link href="/auth/login" style={{ fontSize:'14px', color:'rgba(255,255,255,.72)', textDecoration:'none', fontWeight:500 }}>Ingresar</Link>
          <Link href="/auth/register" style={{ background:'#FF6B2B', color:'#fff', padding:'9px 22px', borderRadius:'10px', fontSize:'14px', fontWeight:700, textDecoration:'none' }}>
            Probar gratis →
          </Link>
        </div>
      </nav>

      {/* ── DARK: HERO ── */}
      <div style={{ background:DARK, padding:'7rem 2rem 5rem' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,107,43,.12)', border:'1px solid rgba(255,107,43,.3)', borderRadius:'20px', padding:'6px 16px', marginBottom:'2rem', fontSize:'13px', color:'#FF8C42', fontWeight:600 }}>
            ⚡ 14 días gratis · Sin tarjeta · Configuración en 48h
          </div>
          <h1 style={{ fontSize:'clamp(36px,5.5vw,68px)', fontWeight:800, lineHeight:1.02, letterSpacing:'-.05em', marginBottom:'1.5rem' }}>
            Prospecta con estrategia.<br/><span style={{ color:'#FF6B2B' }}>Vende con ventaja.</span>
          </h1>
          <p style={{ fontSize:'clamp(17px,1.8vw,22px)', color:'rgba(255,255,255,.6)', fontWeight:400, maxWidth:'540px', lineHeight:1.8, marginBottom:'2.5rem' }}>
            Para asesores, equipos y empresas que quieren más cierres con menos fricción. La IA prospeta, tú decides.
          </p>
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
            <Link href="/auth/register" style={{ background:'#FF6B2B', color:'#fff', padding:'16px 38px', borderRadius:'14px', fontSize:'17px', fontWeight:700, textDecoration:'none', display:'inline-block' }}>
              Crear cuenta gratis →
            </Link>
            <a href="#como-funciona" style={{ background:'rgba(255,255,255,.07)', color:'#fff', padding:'16px 38px', borderRadius:'14px', fontSize:'17px', fontWeight:600, textDecoration:'none', display:'inline-block', border:'1px solid rgba(255,255,255,.12)' }}>
              Ver cómo funciona ↓
            </a>
          </div>
          <p style={{ fontSize:'13px', color:'rgba(255,255,255,.5)' }}>+200 vendedores activos · Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </div>

      <DashboardIASection />

      {/* ── TICKER: INDUSTRIAS (dark) ── */}
      <div style={{ background:'rgba(255,255,255,.03)', borderTop:'1px solid rgba(255,255,255,.07)', borderBottom:'1px solid rgba(255,255,255,.07)', overflow:'hidden', padding:'1.1rem 0' }}>
        <div style={{ display:'flex', gap:'0', animation:'ticker 28s linear infinite', width:'max-content' }}>
          {[...Array(2)].map((_, rep) => (
            <div key={rep} style={{ display:'flex', gap:'0' }}>
              {[
                { icon:'🚗', label:'Automotriz' },
                { icon:'🏠', label:'Inmobiliaria' },
                { icon:'👗', label:'Retail' },
                { icon:'🍔', label:'Alimentos' },
                { icon:'💊', label:'Salud' },
                { icon:'🛠️', label:'Servicios' },
                { icon:'💻', label:'Tecnología' },
                { icon:'🎓', label:'Educación' },
                { icon:'🏋️', label:'Fitness' },
                { icon:'✈️', label:'Turismo' },
              ].map(s => (
                <div key={s.label + rep} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 2rem', borderRight:'1px solid rgba(255,255,255,.07)', whiteSpace:'nowrap' }}>
                  <span style={{ fontSize:'18px' }}>{s.icon}</span>
                  <span style={{ fontSize:'14px', fontWeight:600, color:'rgba(255,255,255,.72)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── SOFT: STATS + CÓMO FUNCIONA ── */}
      <div style={{ background:SOFT, color:'#111827' }}>

        {/* Stats */}
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'4rem 2rem 0', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'2rem', textAlign:'center' }}>
          {[
            { n:'10x', label:'más respuestas con bot IA' },
            { n:'48h', label:'configuración completa' },
            { n:'+200', label:'vendedores en Latam' },
            { n:'$0', label:'tarjeta para empezar' },
          ].map(s => (
            <div key={s.n} style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:'16px', padding:'1.75rem', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize:'clamp(32px,4vw,48px)', fontWeight:900, color:'#FF6B2B', letterSpacing:'-.03em' }}>{s.n}</div>
              <div style={{ fontSize:'14px', color:'#6b7280', marginTop:'6px', fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cómo funciona */}
        <div id="como-funciona" style={{ maxWidth:'1100px', margin:'0 auto', padding:'5rem 2rem' }}>
          <div style={{ marginBottom:'3rem' }}>
            <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.12em', color:'#FF6B2B', marginBottom:'1rem', textTransform:'uppercase' }}>Cómo funciona</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-.03em', color:'#111827' }}>De cero a ventas en 3 pasos</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'2rem' }}>
            {[
              { n:'01', title:'Crea tu catálogo IA', desc:'Sube texto, imagen, Excel, PDF o CSV. La IA genera tu catálogo profesional en segundos.' },
              { n:'02', title:'Activa tu Bot IA', desc:'Configura tu bot por industria. Responde prospectos en WhatsApp 24/7 y cierra más.' },
              { n:'03', title:'Gestiona tu pipeline', desc:'Visualiza cada oportunidad, sigue cada lead y automatiza los seguimientos.' },
            ].map(s => (
              <div key={s.n} style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:'20px', padding:'2rem', boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
                <div style={{ fontSize:'38px', fontWeight:900, color:'rgba(255,107,43,.25)', marginBottom:'1rem', letterSpacing:'-.04em' }}>{s.n}</div>
                <h3 style={{ fontSize:'19px', fontWeight:800, marginBottom:'.75rem', letterSpacing:'-.02em', color:'#111827' }}>{s.title}</h3>
                <p style={{ fontSize:'17px', color:'#6b7280', lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'3rem' }}>
            <Link href="/auth/register" style={{ background:'#FF6B2B', color:'#fff', padding:'15px 36px', borderRadius:'12px', fontSize:'16px', fontWeight:700, textDecoration:'none', display:'inline-block' }}>
              Empieza gratis en 2 minutos →
            </Link>
          </div>
        </div>
      </div>

      {/* ── DARK: BOT IA ── */}
      <KitDigitalSection />

      <BotIASection />

      {/* ── SOFT: CATÁLOGO IA ── */}
      <div id="catalogo-ia" style={{ background:SOFT, color:'#111827' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'6rem 2rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.12em', color:'#FF6B2B', marginBottom:'1rem', textTransform:'uppercase' }}>Catálogo IA</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-.03em', color:'#111827', marginBottom:'1.25rem' }}>Sube lo que tengas.<br/>La IA hace el resto.</h2>
            <p style={{ fontSize:'20px', color:'#4b5563', lineHeight:1.6, marginBottom:'2rem', fontWeight:400 }}>
              Texto, foto, Excel, CSV o PDF. Ventas10x convierte cualquier formato en tu catálogo digital profesional en segundos.
            </p>
            <Link href="/auth/register" style={{ background:'#FF6B2B', color:'#fff', padding:'14px 30px', borderRadius:'12px', fontSize:'15px', fontWeight:700, textDecoration:'none', display:'inline-block' }}>
              Ver mi catálogo en acción →
            </Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            {[
              { icon:'📄', format:'PDF', desc:'Listas de precios y fichas técnicas' },
              { icon:'📊', format:'Excel / CSV', desc:'Tu base de datos de productos' },
              { icon:'🖼️', format:'Imagen', desc:'Foto y la IA extrae la info' },
              { icon:'✍️', format:'Texto libre', desc:'Escribe o pega la descripción' },
            ].map(f => (
              <div key={f.format} style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:'16px', padding:'1.25rem', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                <div style={{ fontSize:'28px', marginBottom:'.5rem' }}>{f.icon}</div>
                <div style={{ fontSize:'14px', fontWeight:700, marginBottom:'.25rem', color:'#111827' }}>{f.format}</div>
                <div style={{ fontSize:'12px', color:'#4b5563', lineHeight:1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DARK: SECTORES animados ── */}
      <div id="sectores" style={{ background:DARK, borderTop:'1px solid rgba(255,255,255,.07)', borderBottom:'1px solid rgba(255,255,255,.07)', overflow:'hidden' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'6rem 2rem 3rem' }}>
          <div style={{ marginBottom:'3.5rem' }}>
            <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.12em', color:'#FF6B2B', marginBottom:'1rem', textTransform:'uppercase' }}>Sectores</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-.03em', color:'#fff' }}>Hecho para tu industria</h2>
            <p style={{ fontSize:'20px', color:'rgba(255,255,255,.72)', marginTop:'.75rem', maxWidth:'560px', lineHeight:1.7, fontWeight:400 }}>
              El bot IA se entrena con el lenguaje y las variables de cada sector.
            </p>
          </div>
        </div>

        {/* Fila 1 — izquierda */}
        <div style={{ overflow:'hidden', marginBottom:'1.25rem', paddingLeft:'2rem' }}>
          <div style={{ display:'flex', gap:'1.25rem', animation:'sectoresLeft 35s linear infinite', width:'max-content' }}>
            {[...Array(3)].map((_, rep) =>
              [
                { icon:'🚗', sector:'Automotriz', desc:'Concesionarios, talleres, flotas' },
                { icon:'🏠', sector:'Inmobiliaria', desc:'Proyectos, arriendos, usados' },
                { icon:'👗', sector:'Retail', desc:'Ropa, calzado, accesorios' },
                { icon:'🍔', sector:'Alimentos', desc:'Restaurantes, dark kitchens' },
                { icon:'💊', sector:'Salud', desc:'Clínicas, farmacias, bienestar' },
              ].map(s => (
                <div key={`${s.sector}-${rep}`} style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:'20px', padding:'1.75rem', minWidth:'230px', boxShadow:'0 1px 6px rgba(0,0,0,.05)', flexShrink:0 }}>
                  <div style={{ fontSize:'34px', marginBottom:'1rem' }}>{s.icon}</div>
                  <div style={{ fontSize:'18px', fontWeight:800, marginBottom:'.5rem', color:'#111827' }}>{s.sector}</div>
                  <div style={{ fontSize:'16px', color:'#4b5563', lineHeight:1.6, fontWeight:400 }}>{s.desc}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fila 2 — derecha */}
        <div style={{ overflow:'hidden', paddingLeft:'2rem', marginBottom:'5rem' }}>
          <div style={{ display:'flex', gap:'1.25rem', animation:'sectoresRight 35s linear infinite', width:'max-content' }}>
            {[...Array(3)].map((_, rep) =>
              [
                { icon:'🛠️', sector:'Servicios', desc:'Construcción, consultoría, IT' },
                { icon:'💻', sector:'Tecnología', desc:'SaaS, apps, agencias digitales' },
                { icon:'🎓', sector:'Educación', desc:'Cursos, academias, coachings' },
                { icon:'🏋️', sector:'Fitness', desc:'Gimnasios, entrenadores, wellness' },
                { icon:'✈️', sector:'Turismo', desc:'Agencias, hoteles, tours' },
              ].map(s => (
                <div key={`${s.sector}-${rep}`} style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:'20px', padding:'1.75rem', minWidth:'230px', boxShadow:'0 1px 6px rgba(0,0,0,.05)', flexShrink:0 }}>
                  <div style={{ fontSize:'34px', marginBottom:'1rem' }}>{s.icon}</div>
                  <div style={{ fontSize:'18px', fontWeight:800, marginBottom:'.5rem', color:'#111827' }}>{s.sector}</div>
                  <div style={{ fontSize:'16px', color:'#4b5563', lineHeight:1.6, fontWeight:400 }}>{s.desc}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── SOFT: TESTIMONIOS ── */}
      <div style={{ background:SOFT, color:'#111827' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'6rem 2rem' }}>
          <div style={{ marginBottom:'3rem' }}>
            <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.12em', color:'#FF6B2B', marginBottom:'1rem', textTransform:'uppercase' }}>Testimonios</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-.03em', color:'#111827' }}>Lo que dicen nuestros vendedores</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'1.5rem' }}>
            {[
              { name:'Carlos M.', role:'Concesionario Toyota · Bogotá', text:'El bot IA triplicó mis respuestas en WhatsApp. Antes perdía leads por no contestar rápido. Ahora el bot los atiende y yo solo cierro.' },
              { name:'Ana S.', role:'Inmobiliaria · Medellín', text:'Subí mi Excel de propiedades y en 10 minutos tenía el catálogo listo. Nunca pensé que fuera tan fácil actualizar precios.' },
              { name:'Miguel R.', role:'Tienda de ropa · Lima', text:'El pipeline visual me cambió la vida. Sé exactamente en qué etapa está cada cliente y cuándo hacer el seguimiento.' },
            ].map(t => (
              <div key={t.name} style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:'20px', padding:'2rem', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                <div style={{ fontSize:'28px', color:'#FF6B2B', marginBottom:'1rem', fontWeight:900, lineHeight:1 }}>"</div>
                <p style={{ fontSize:'20px', color:'#374151', lineHeight:1.7, fontWeight:400, marginBottom:'1.5rem' }}>{t.text}</p>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#FF6B2B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:800, color:'#fff', flexShrink:0 }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:700, color:'#111827' }}>{t.name}</div>
                    <div style={{ fontSize:'14px', color:'#4b5563' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DashboardIASection />

      {/* ── DARK: PRECIOS ── */}
      <div id="precios" style={{ background:DARK }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'6rem 2rem' }}>
          <div style={{ marginBottom:'3.5rem' }}>
            <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.12em', color:'#FF6B2B', marginBottom:'1rem', textTransform:'uppercase' }}>Precios</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-.03em' }}>Simple. Sin sorpresas.</h2>
            <p style={{ fontSize:'20px', color:'rgba(255,255,255,.6)', marginTop:'.75rem', fontWeight:400 }}>Empieza gratis 14 días. Sin tarjeta de crédito.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem' }}>
            {[
              { plan:'Starter', price:'$19.900', period:'/mes', desc:'Para asesores independientes que quieren empezar.', features:['Catálogo IA (hasta 50 productos)','Bot IA básico por WhatsApp','Pipeline visual','1 usuario'], cta:'Probar 14 días gratis', highlight:false },
              { plan:'Pro', price:'$39.900', period:'/mes', desc:'Para equipos que quieren escalar sus ventas.', features:['Catálogo IA ilimitado','Bot IA avanzado por industria','Pipeline + automatizaciones','Hasta 5 usuarios','Soporte prioritario'], cta:'Probar 14 días gratis', highlight:true },
              { plan:'Enterprise', price:'Cotiza', period:'', desc:'Para empresas con necesidades personalizadas.', features:['Todo lo de Pro','Usuarios ilimitados','Integraciones custom','Gestor de cuenta dedicado','SLA garantizado'], cta:'Hablar con ventas', highlight:false },
            ].map(p => (
              <div key={p.plan} style={{ background: p.highlight ? 'rgba(255,107,43,.1)' : 'rgba(255,255,255,.04)', border: p.highlight ? '1px solid rgba(255,107,43,.45)' : '1px solid rgba(255,255,255,.08)', borderRadius:'20px', padding:'2rem', position:'relative' }}>
                {p.highlight && <div style={{ position:'absolute', top:'-13px', left:'50%', transform:'translateX(-50%)', background:'#FF6B2B', color:'#fff', fontSize:'11px', fontWeight:700, padding:'4px 16px', borderRadius:'20px', letterSpacing:'.06em', whiteSpace:'nowrap' }}>MÁS POPULAR</div>}
                <div style={{ fontSize:'17px', fontWeight:800, marginBottom:'.5rem' }}>{p.plan}</div>
                <div style={{ marginBottom:'1rem', display:'flex', alignItems:'baseline', gap:'4px' }}>
                  <span style={{ fontSize:'42px', fontWeight:900, letterSpacing:'-.03em' }}>{p.price}</span>
                  <span style={{ fontSize:'14px', color:'rgba(255,255,255,.5)' }}>{p.period}</span>
                </div>
                <p style={{ fontSize:'20px', color:'rgba(255,255,255,.72)', marginBottom:'1.5rem', lineHeight:1.7, fontWeight:400 }}>{p.desc}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'.7rem', marginBottom:'2rem' }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                      <span style={{ color:'#FF6B2B', flexShrink:0, fontWeight:700 }}>✓</span>
                      <span style={{ fontSize:'16px', color:'rgba(255,255,255,.72)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/auth/register" style={{ display:'block', textAlign:'center', background: p.highlight ? '#FF6B2B' : 'rgba(255,255,255,.08)', color:'#fff', padding:'13px', borderRadius:'12px', fontSize:'14px', fontWeight:700, textDecoration:'none' }}>
                  {p.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SOFT: FAQ ── */}
      <div style={{ background:SOFT, color:'#111827' }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', padding:'6rem 2rem' }}>
          <div style={{ marginBottom:'3rem' }}>
            <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.12em', color:'#FF6B2B', marginBottom:'1rem', textTransform:'uppercase' }}>FAQ</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-.03em', color:'#111827' }}>Preguntas frecuentes</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {[
              { q:'¿Necesito tarjeta de crédito para empezar?', a:'No. Los 14 días de prueba son completamente gratis y sin tarjeta. Solo te pedimos un email.' },
              { q:'¿Cuánto tarda la configuración?', a:'Prometemos configuración en 48 horas. La mayoría de los usuarios están activos en menos de 24h.' },
              { q:'¿Funciona con mi WhatsApp actual?', a:'Sí. Nos integramos con WhatsApp Business API. Te guiamos en el proceso de conexión paso a paso.' },
              { q:'¿Puedo cancelar cuando quiera?', a:'Absolutamente. Sin penalizaciones ni contratos mínimos. Cancelas con un clic desde tu cuenta.' },
              { q:'¿En qué países está disponible?', a:'Operamos en toda Latam: Colombia, México, Perú, Chile, Argentina y más.' },
            ].map((f, i) => (
              <details key={i} style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:'14px', padding:'1.25rem 1.5rem', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
                <summary style={{ fontSize:'18px', fontWeight:700, cursor:'pointer', listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'center', color:'#111827' }}>
                  {f.q} <span style={{ color:'#4b5563', fontSize:'20px', fontWeight:400 }}>+</span>
                </summary>
                <p style={{ fontSize:'20px', color:'#4b5563', marginTop:'1rem', lineHeight:1.7, fontWeight:400 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* ── DARK: CTA FINAL ── */}
      <div style={{ background:DARK, borderTop:'1px solid rgba(255,255,255,.07)', padding:'7rem 2rem' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr auto', gap:'4rem', alignItems:'center' }}>
          <div>
            <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800, letterSpacing:'-.04em', marginBottom:'1.25rem', lineHeight:1.05 }}>
              Empieza hoy.<br/><span style={{ color:'#FF6B2B' }}>14 días completamente gratis.</span>
            </h2>
            <p style={{ color:'rgba(255,255,255,.72)', fontSize:'16px', lineHeight:1.7, maxWidth:'480px' }}>
              Sin tarjeta de crédito. Sin compromisos. Configúrate en 48h y empieza a prospectar con IA desde el primer día.
            </p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem', alignItems:'flex-start', flexShrink:0 }}>
            <Link href="/auth/register" style={{ background:'#FF6B2B', color:'#fff', padding:'18px 44px', borderRadius:'14px', fontSize:'18px', fontWeight:700, textDecoration:'none', display:'inline-block', whiteSpace:'nowrap' }}>
              Crear cuenta gratis →
            </Link>
            <Link href="/auth/login" style={{ color:'rgba(255,255,255,.6)', fontSize:'14px', textDecoration:'none', fontWeight:500, textAlign:'center', display:'block' }}>
              Ya tengo cuenta → Ingresar
            </Link>
            <p style={{ fontSize:'12px', color:'rgba(255,255,255,.4)', margin:0 }}>Sin tarjeta · 48h setup · Cancela cuando quieras</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background:'#080e1a', borderTop:'1px solid rgba(255,255,255,.06)', padding:'2.5rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem', maxWidth:'100%' }}>
        <div style={{ maxWidth:'1100px', width:'100%', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <svg width="22" height="22" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
            <span style={{ fontSize:'14px', fontWeight:700, color:'rgba(255,255,255,.5)' }}>Ventas10x © 2026</span>
          </div>
          <div style={{ display:'flex', gap:'2rem' }}>
            {['Privacidad','Términos','Contacto'].map(l => (
              <a key={l} href="#" style={{ fontSize:'13px', color:'rgba(255,255,255,.4)', textDecoration:'none', fontWeight:500 }}>{l}</a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes sectoresLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        @keyframes sectoresRight {
          0% { transform: translateX(-33.33%); }
          100% { transform: translateX(0); }
        }
      `}</style>

    </div>
  )
}
