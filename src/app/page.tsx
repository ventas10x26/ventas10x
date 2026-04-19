import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ fontFamily:"var(--font-jakarta,'Plus Jakarta Sans',system-ui,sans-serif)", background:'#0a1628', minHeight:'100vh', color:'#fff' }}>

      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 2rem', borderBottom:'1px solid rgba(255,255,255,.07)', position:'sticky', top:0, zIndex:50, background:'rgba(10,22,40,.95)', backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <svg width="36" height="36" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/><circle cx="41" cy="11" r="5" fill="rgba(255,255,255,0.2)"/><path d="M38.5 13.5L43.5 8.5M43.5 8.5H40M43.5 8.5V12" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontWeight:800, fontSize:'20px', letterSpacing:'-.02em', fontFamily:"var(--font-jakarta,'Plus Jakarta Sans',sans-serif)" }}>Ventas<span style={{ color:'#FF6B2B' }}>10x</span></span>
        </div>
        <div style={{ display:'flex', gap:'2rem', alignItems:'center' }}>
          <a href="#como-funciona" style={{ fontSize:'14px', color:'rgba(255,255,255,.5)', textDecoration:'none' }}>Cómo funciona</a>
          <a href="#precios" style={{ fontSize:'14px', color:'rgba(255,255,255,.5)', textDecoration:'none' }}>Precios</a>
          <Link href="/auth/login" style={{ fontSize:'14px', color:'rgba(255,255,255,.7)', textDecoration:'none', fontWeight:500 }}>Ingresar</Link>
          <Link href="/auth/register" style={{ background:'#FF6B2B', color:'#fff', padding:'8px 20px', borderRadius:'10px', fontSize:'14px', fontWeight:700, textDecoration:'none' }}>
            Empezar gratis →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'7rem 2rem 5rem', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,107,43,.1)', border:'1px solid rgba(255,107,43,.25)', borderRadius:'20px', padding:'6px 16px', marginBottom:'2rem', fontSize:'13px', color:'#FF8C42', fontWeight:600 }}>
          ⚡ 14 días gratis · Sin tarjeta de crédito · Configuración en 48h
        </div>
        <h1 style={{ fontSize:'clamp(40px,7vw,80px)', fontWeight:900, fontFamily:"var(--font-jakarta,'Plus Jakarta Sans',sans-serif)", lineHeight:1.02, letterSpacing:'-.04em', marginBottom:'1.5rem' }}>
          Tu proceso de ventas,<br/><span style={{ color:'#FF6B2B' }}>automatizado.</span> Por fin.
        </h1>
        <p style={{ fontSize:'18px', color:'rgba(255,255,255,.5)', lineHeight:1.75, maxWidth:'560px', margin:'0 auto 2.5rem' }}>
          Landing page personalizada, catálogo IA, WhatsApp automático y pipeline visual. El sistema de ventas que los vendedores de Latam necesitaban.
        </p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap', marginBottom:'3rem' }}>
          <Link href="/auth/register" style={{ background:'#FF6B2B', color:'#fff', padding:'16px 36px', borderRadius:'14px', fontSize:'16px', fontWeight:700, textDecoration:'none' }}>
            Crear cuenta gratis →
          </Link>
          <a href="#como-funciona" style={{ background:'rgba(255,255,255,.07)', color:'#fff', padding:'16px 36px', borderRadius:'14px', fontSize:'16px', fontWeight:500, textDecoration:'none', border:'1px solid rgba(255,255,255,.1)' }}>
            Ver demo ↓
          </a>
        </div>
        {/* Social proof */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', fontSize:'13px', color:'rgba(255,255,255,.35)' }}>
          <div style={{ display:'flex' }}>
            {['#FF6B2B','#185FA5','#1D9E75','#EF9F27'].map((c,i) => (
              <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:c, border:'2px solid #0a1628', marginLeft: i > 0 ? -8 : 0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700 }}>
                {['R','J','C','M'][i]}
              </div>
            ))}
          </div>
          +200 vendedores activos en Latam
        </div>
      </div>

      {/* STATS */}
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 2rem 5rem', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'16px' }}>
        {[
          { n:'68%', l:'menos leads perdidos', c:'#FF6B2B' },
          { n:'3.4x', l:'más cierres en 90 días', c:'#fff' },
          { n:'48h', l:'setup completo', c:'#fff' },
          { n:'30s', l:'respuesta automática al lead', c:'#1D9E75' },
        ].map((s,i) => (
          <div key={i} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'16px', padding:'1.5rem', textAlign:'center' }}>
            <div style={{ fontSize:'40px', fontWeight:900, color:s.c, letterSpacing:'-.03em', marginBottom:'4px' }}>{s.n}</div>
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,.4)', lineHeight:1.4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* CÓMO FUNCIONA */}
      <div id="como-funciona" style={{ maxWidth:'900px', margin:'0 auto', padding:'5rem 2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
          <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#FF6B2B', marginBottom:'.75rem' }}>Cómo funciona</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, letterSpacing:'-.03em', fontFamily:"var(--font-jakarta,'Plus Jakarta Sans',sans-serif)" }}>Configura en 3 pasos.<br/>Vende desde el día 1.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'20px' }}>
          {[
            { n:'01', t:'Crea tu landing', d:'Personaliza tu página con foto, productos y colores. La IA extrae tus productos de un PDF automáticamente.', icon:'◈' },
            { n:'02', t:'Comparte el enlace', d:'Pública tu URL en redes sociales, WhatsApp o Meta Ads. Los leads llenan el formulario y tú recibes la alerta.', icon:'🔗' },
            { n:'03', t:'El sistema trabaja solo', d:'El lead recibe un SMS en 30 segundos. Tú recibes un WhatsApp. El lead entra automáticamente a tu pipeline.', icon:'⚡' },
          ].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'20px', padding:'2rem', position:'relative', overflow:'hidden' }}>
              <div style={{ fontSize:'64px', fontWeight:900, color:'rgba(255,107,43,.1)', position:'absolute', top:'-10px', right:'16px', lineHeight:1, letterSpacing:'-.04em' }}>{s.n}</div>
              <div style={{ fontSize:'28px', marginBottom:'1rem' }}>{s.icon}</div>
              <div style={{ fontWeight:700, fontSize:'17px', marginBottom:'.625rem' }}>{s.t}</div>
              <div style={{ fontSize:'14px', color:'rgba(255,255,255,.45)', lineHeight:1.7 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ background:'rgba(255,255,255,.02)', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)', padding:'5rem 2rem' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#FF6B2B', marginBottom:'.75rem' }}>Funciones</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, letterSpacing:'-.03em', fontFamily:"var(--font-jakarta,'Plus Jakarta Sans',sans-serif)" }}>Todo lo que necesitas.<br/>Nada que no necesitas.</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'16px' }}>
            {[
              { icon:'◈', t:'Landing personalizada', d:'Tu página con foto, productos, colores de marca y formulario de leads. Lista en minutos.', badge:'Incluido' },
              { icon:'✦', t:'Catálogo IA', d:'Sube tu PDF o imagen y la IA extrae nombres, precios y descripciones automáticamente.', badge:'IA' },
              { icon:'💬', t:'WhatsApp + SMS automático', d:'El lead recibe un SMS al instante. Tú recibes una notificación en WhatsApp.', badge:'Automático' },
              { icon:'⊟', t:'Pipeline Kanban', d:'Arrastra prospectos entre etapas. Nuevo → Contactado → Interesado → Cerrado.', badge:'Visual' },
              { icon:'📊', t:'Dashboard de métricas', d:'Leads recibidos, leads cerrados y días de trial en tiempo real.', badge:'Tiempo real' },
              { icon:'🔒', t:'Control de acceso por plan', d:'Cada vendedor ve solo sus datos. Tú ves todo desde el panel de admin.', badge:'Seguro' },
            ].map((f,i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'16px', padding:'1.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(255,107,43,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{f.icon}</div>
                  <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 8px', borderRadius:'20px', background:'rgba(255,107,43,.15)', color:'#FF8C42' }}>{f.badge}</span>
                </div>
                <div style={{ fontWeight:700, fontSize:'15px', marginBottom:'.5rem' }}>{f.t}</div>
                <div style={{ fontSize:'13px', color:'rgba(255,255,255,.4)', lineHeight:1.65 }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTORES */}
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'5rem 2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#FF6B2B', marginBottom:'.75rem' }}>Sectores</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, letterSpacing:'-.03em', fontFamily:"var(--font-jakarta,'Plus Jakarta Sans',sans-serif)" }}>Hecho para vendedores<br/>de cualquier industria</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'12px' }}>
          {[
            { icon:'🚗', t:'Automotriz' },
            { icon:'🏠', t:'Inmobiliaria' },
            { icon:'🛡️', t:'Seguros' },
            { icon:'💻', t:'Tecnología' },
            { icon:'🏥', t:'Salud' },
            { icon:'📦', t:'Distribución' },
            { icon:'🎓', t:'Educación' },
            { icon:'🏗️', t:'Construcción' },
          ].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'12px', padding:'1.25rem', textAlign:'center' }}>
              <div style={{ fontSize:'28px', marginBottom:'.5rem' }}>{s.icon}</div>
              <div style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,.7)' }}>{s.t}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIOS */}
      <div style={{ background:'rgba(255,255,255,.02)', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)', padding:'5rem 2rem' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#FF6B2B', marginBottom:'.75rem' }}>Testimonios</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, letterSpacing:'-.03em', fontFamily:"var(--font-jakarta,'Plus Jakarta Sans',sans-serif)" }}>Lo que dicen los vendedores</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'16px' }}>
            {[
              { q:'Antes perdía el 70% de mis leads porque no respondía a tiempo. Ahora el sistema les escribe en 30 segundos y yo solo cierro.', n:'Carlos M.', r:'Vendedor automotriz · Medellín', c:'#FF6B2B' },
              { q:'Subí mi catálogo de seguros en PDF y en 2 minutos ya tenía todos mis productos en mi landing. Increíble lo de la IA.', n:'Sandra P.', r:'Asesora de seguros · Bogotá', c:'#185FA5' },
              { q:'El pipeline Kanban me cambió la vida. Ahora sé exactamente en qué etapa está cada prospecto y cuándo seguirle.', n:'Andrés V.', r:'Asesor inmobiliario · Cali', c:'#1D9E75' },
            ].map((t,i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'16px', padding:'1.75rem' }}>
                <div style={{ fontSize:'28px', color:t.c, marginBottom:'1rem', lineHeight:1 }}>"</div>
                <p style={{ fontSize:'14px', color:'rgba(255,255,255,.7)', lineHeight:1.75, marginBottom:'1.25rem', fontStyle:'italic' }}>{t.q}</p>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:t.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700 }}>
                    {t.n[0]}
                  </div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:700 }}>{t.n}</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.35)' }}>{t.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRECIOS */}
      <div id="precios" style={{ maxWidth:'1000px', margin:'0 auto', padding:'5rem 2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
          <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#FF6B2B', marginBottom:'.75rem' }}>Precios</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, letterSpacing:'-.03em', fontFamily:"var(--font-jakarta,'Plus Jakarta Sans',sans-serif)" }}>Sin contratos. Sin sorpresas.<br/>Cancela cuando quieras.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'16px', alignItems:'start' }}>
          {[
            { n:'Gratuito', p:'$0', per:'/mes', d:'Para empezar', features:['Landing page activa','Hasta 10 leads','Sin catálogo IA'], cta:'Empezar gratis', featured:false, href:'/auth/register' },
            { n:'Core', p:'$119.900', per:'/mes COP', d:'Para el vendedor individual', features:['Leads ilimitados','Catálogo IA','WhatsApp automático','Soporte prioritario'], cta:'Activar Core', featured:false, href:'/auth/register' },
            { n:'Pro', p:'$279.900', per:'/mes COP', d:'Para escalar tus ventas', features:['Todo Core incluido','CRM + Pipeline visual','Automatización 7 touchpoints','Reporte semanal automático','Integración Meta Ads'], cta:'Activar Pro', featured:true, href:'/auth/register' },
            { n:'Teams', p:'$599.900', per:'/mes COP', d:'Para equipos de ventas', features:['Todo Pro incluido','Hasta 10 vendedores','Dashboard gerencial','Gestor de cuenta dedicado','White label disponible'], cta:'Contactar', featured:false, href:'/auth/register' },
          ].map((p,i) => (
            <div key={i} style={{ background: p.featured ? 'rgba(255,107,43,.1)' : 'rgba(255,255,255,.04)', border: p.featured ? '2px solid #FF6B2B' : '1px solid rgba(255,255,255,.07)', borderRadius:'20px', padding:'1.75rem', position:'relative' }}>
              {p.featured && <div style={{ position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'#FF6B2B', color:'#fff', fontSize:'10px', fontWeight:700, padding:'3px 14px', borderRadius:'20px', whiteSpace:'nowrap' }}>Más popular</div>}
              <div style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,.4)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'.5rem' }}>{p.n}</div>
              <div style={{ fontSize:'32px', fontWeight:900, letterSpacing:'-.03em', color: p.featured ? '#FF6B2B' : '#fff', lineHeight:1 }}>{p.p}</div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,.35)', marginBottom:'.5rem' }}>{p.per}</div>
              <div style={{ fontSize:'13px', color:'rgba(255,255,255,.4)', marginBottom:'1.25rem' }}>{p.d}</div>
              <div style={{ borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:'1rem', marginBottom:'1.25rem' }}>
                {p.features.map((f,j) => (
                  <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'13px', color:'rgba(255,255,255,.65)', padding:'4px 0' }}>
                    <span style={{ color:'#1D9E75', flexShrink:0, marginTop:'1px' }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Link href={p.href} style={{ display:'block', textAlign:'center', padding:'11px', borderRadius:'10px', background: p.featured ? '#FF6B2B' : 'rgba(255,255,255,.07)', color:'#fff', fontSize:'13px', fontWeight:700, textDecoration:'none', border: p.featured ? 'none' : '1px solid rgba(255,255,255,.15)' }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <p style={{ textAlign:'center', fontSize:'13px', color:'rgba(255,255,255,.3)', marginTop:'1.5rem' }}>
          Todos los planes incluyen 14 días de prueba gratuita · Garantía de devolución 30 días
        </p>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'0 2rem 5rem' }}>
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <h2 style={{ fontSize:'clamp(24px,3vw,36px)', fontWeight:900, letterSpacing:'-.03em', fontFamily:"var(--font-jakarta,'Plus Jakarta Sans',sans-serif)" }}>Preguntas frecuentes</h2>
        </div>
        {[
          { q:'¿Qué pasa cuando termina el trial?', a:'Tu cuenta pasa automáticamente al plan Gratuito — landing activa con hasta 10 leads. Para leads ilimitados y catálogo IA, elige un plan de pago.' },
          { q:'¿Funciona para cualquier sector?', a:'Sí. Ventas10x está diseñado para vendedores B2C y B2B de cualquier industria — carros, seguros, inmuebles, tecnología, salud y más.' },
          { q:'¿Necesito saber programar?', a:'No. La configuración es 100% visual. En 48 horas tienes tu landing activa, catálogo cargado y automatización funcionando.' },
          { q:'¿Puedo cancelar cuando quiera?', a:'Sí. Sin contrato de permanencia. Cancela desde tu dashboard con 1 clic. Te devolvemos los días no utilizados si cancelaste un plan anual.' },
          { q:'¿Los leads son míos?', a:'Completamente tuyos. Si cambias de plataforma o cancelas, te llevas todos tus datos. Nunca vendemos ni compartimos tu información.' },
        ].map((f,i) => (
          <div key={i} style={{ borderBottom:'1px solid rgba(255,255,255,.07)', padding:'1.25rem 0' }}>
            <div style={{ fontWeight:600, fontSize:'15px', color:'#fff', marginBottom:'.5rem' }}>{f.q}</div>
            <div style={{ fontSize:'14px', color:'rgba(255,255,255,.45)', lineHeight:1.7 }}>{f.a}</div>
          </div>
        ))}
      </div>

      {/* CTA FINAL */}
      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'0 2rem 7rem', textAlign:'center' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(255,107,43,.15),rgba(24,95,165,.15))', border:'1px solid rgba(255,107,43,.2)', borderRadius:'24px', padding:'3.5rem 2rem' }}>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, letterSpacing:'-.03em', marginBottom:'1rem' }}>
            ¿Listo para multiplicar tus ventas?
          </h2>
          <p style={{ color:'rgba(255,255,255,.45)', fontSize:'15px', marginBottom:'2rem', lineHeight:1.7 }}>
            Únete a los vendedores de Latam que ya automatizan su prospección. 14 días gratis, sin tarjeta de crédito.
          </p>
          <Link href="/auth/register" style={{ background:'#FF6B2B', color:'#fff', padding:'16px 48px', borderRadius:'14px', fontSize:'17px', fontWeight:700, textDecoration:'none', display:'inline-block' }}>
            Comenzar 14 días gratis →
          </Link>
          <p style={{ fontSize:'12px', color:'rgba(255,255,255,.25)', marginTop:'1rem' }}>Sin tarjeta · Configuración en 48h · Cancela cuando quieras</p>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,.07)', padding:'2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem', maxWidth:'1100px', margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <svg width="24" height="24" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
          <span style={{ fontSize:'14px', fontWeight:700, color:'rgba(255,255,255,.5)' }}>Ventas10x © 2026</span>
        </div>
        <div style={{ display:'flex', gap:'1.5rem' }}>
          {['Privacidad','Términos','Contacto'].map(l => (
            <a key={l} href="#" style={{ fontSize:'13px', color:'rgba(255,255,255,.3)', textDecoration:'none' }}>{l}</a>
          ))}
        </div>
      </div>

    </div>
  )
}
