'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const INDUSTRIAS = [
  { icon: '🚗', label: 'Automotriz' },
  { icon: '🏠', label: 'Inmobiliaria' },
  { icon: '👗', label: 'Retail' },
  { icon: '🍔', label: 'Alimentos' },
  { icon: '💊', label: 'Salud' },
  { icon: '🛠️', label: 'Servicios' },
  { icon: '💻', label: 'Tecnología' },
  { icon: '🎓', label: 'Educación' },
  { icon: '🏋️', label: 'Fitness' },
  { icon: '✈️', label: 'Turismo' },
]

const STEPS = ['Bienvenida', 'Tu perfil', 'Tu Bot IA', '¡Listo!']

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [botId, setBotId] = useState<string | null>(null)
  const [profile, setProfile] = useState({
    empresa: '',
    industria: '',
    whatsapp: '',
  })
  const [bot, setBot] = useState({
    nombre: '',
    tono: 'amigable',
    bienvenida: '',
    productos: '',
  })

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid #e5e7eb', fontSize: '15px', fontFamily: 'inherit',
    outline: 'none', background: '#fff', color: '#111827',
    boxSizing: 'border-box' as const,
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('profiles').update({
        empresa: profile.empresa,
        industria: profile.industria,
        whatsapp: profile.whatsapp,
      } as Record<string, string>).eq('id', user.id)

      setStep(2)
    } finally {
      setSaving(false)
    }
  }

  const saveBot = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch('/api/bot-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: bot.nombre || `Bot de ${profile.empresa || 'mi empresa'}`,
          empresa: profile.empresa,
          industria: profile.industria,
          tono: bot.tono,
          bienvenida: bot.bienvenida || `¡Hola! Soy el asistente de ${profile.empresa}. ¿En qué puedo ayudarte?`,
          productos: bot.productos,
          faqs: '',
          whatsapp: profile.whatsapp,
        }),
      })
      const data = await res.json()
      if (data.bot?.id) setBotId(data.bot.id)
      setStep(3)
    } finally {
      setSaving(false)
    }
  }

  const finish = () => router.push('/dashboard')

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1c2e',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '1rem',
      fontFamily: "var(--font-jakarta,'Plus Jakarta Sans',system-ui,sans-serif)",
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
        <svg width="36" height="36" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
        <span style={{ fontWeight: 800, fontSize: '20px', color: '#fff' }}>Ventas<span style={{ color: '#FF6B2B' }}>10x</span></span>
      </div>

      {/* Stepper */}
      {step > 0 && step < 3 && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '0' }}>
          {STEPS.slice(1, 3).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: i + 1 < step ? '#FF6B2B' : i + 1 === step ? '#FF6B2B' : 'rgba(255,255,255,.15)',
                  color: i + 1 <= step ? '#fff' : 'rgba(255,255,255,.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1 < step ? '✓' : i + 2}
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: i + 1 === step ? '#FF6B2B' : 'rgba(255,255,255,.4)', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < 1 && <div style={{ width: '60px', height: '2px', background: i + 1 < step ? '#FF6B2B' : 'rgba(255,255,255,.15)', margin: '0 8px', marginBottom: '18px' }} />}
            </div>
          ))}
        </div>
      )}

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '2.5rem',
        width: '100%', maxWidth: '520px',
        boxShadow: '0 25px 60px rgba(0,0,0,.4)',
      }}>

        {/* PASO 0 — Bienvenida */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '1rem' }}>🎉</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', marginBottom: '.75rem', letterSpacing: '-.02em' }}>
              ¡Bienvenido a Ventas10x!
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '2rem', lineHeight: 1.7 }}>
              En menos de 3 minutos tendrás tu Bot IA configurado y listo para prospectar en WhatsApp 24/7.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '2rem', textAlign: 'left' }}>
              {[
                { icon: '👤', text: 'Configura tu perfil de asesor' },
                { icon: '🤖', text: 'Crea tu Bot IA personalizado' },
                { icon: '🔗', text: 'Obtén tu link para compartir' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f9fafb', borderRadius: '12px', padding: '12px 16px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#374151' }}>{item.text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ width: '100%', background: '#FF6B2B', color: '#fff', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
              Empezar configuración →
            </button>
          </div>
        )}

        {/* PASO 1 — Perfil */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '.5rem' }}>Tu perfil de asesor</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.75rem' }}>Esta información personaliza tu bot y tu landing page.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Nombre de tu empresa o negocio</label>
                <input style={inputStyle} placeholder="ej. Concesionario Kia Bogotá" value={profile.empresa} onChange={e => setProfile(p => ({ ...p, empresa: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>¿Cuál es tu industria?</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '.75rem' }}>
                  {INDUSTRIAS.map(ind => (
                    <div key={ind.label} onClick={() => setProfile(p => ({ ...p, industria: ind.label }))} style={{
                      border: profile.industria === ind.label ? '2px solid #FF6B2B' : '1px solid #e5e7eb',
                      borderRadius: '12px', padding: '10px', textAlign: 'center', cursor: 'pointer',
                      background: profile.industria === ind.label ? '#fff7f3' : '#fff',
                      transition: 'all .15s',
                    }}>
                      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{ind.icon}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: profile.industria === ind.label ? '#FF6B2B' : '#374151' }}>{ind.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>WhatsApp de contacto</label>
                <input style={inputStyle} placeholder="+57 300 000 0000" value={profile.whatsapp} onChange={e => setProfile(p => ({ ...p, whatsapp: e.target.value }))} />
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving || !profile.empresa.trim() || !profile.industria}
              style={{ width: '100%', background: profile.empresa && profile.industria ? '#FF6B2B' : '#e5e7eb', color: profile.empresa && profile.industria ? '#fff' : '#9ca3af', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginTop: '1.5rem', opacity: saving ? .7 : 1 }}>
              {saving ? 'Guardando...' : 'Continuar →'}
            </button>
          </div>
        )}

        {/* PASO 2 — Bot IA */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '.5rem' }}>Configura tu Bot IA</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.75rem' }}>Tu bot prospectará en WhatsApp 24/7. Puedes mejorarlo después.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Nombre del bot</label>
                <input style={inputStyle} placeholder={`ej. Asistente ${profile.empresa || 'de ventas'}`} value={bot.nombre} onChange={e => setBot(b => ({ ...b, nombre: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Tono de comunicación</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  {[
                    { value: 'profesional', label: '👔 Profesional' },
                    { value: 'amigable', label: '😊 Amigable' },
                    { value: 'dinamico', label: '⚡ Dinámico' },
                    { value: 'consultivo', label: '🎯 Consultivo' },
                  ].map(t => (
                    <div key={t.value} onClick={() => setBot(b => ({ ...b, tono: t.value }))} style={{
                      border: bot.tono === t.value ? '2px solid #FF6B2B' : '1px solid #e5e7eb',
                      borderRadius: '10px', padding: '10px 14px', cursor: 'pointer',
                      background: bot.tono === t.value ? '#fff7f3' : '#fff',
                      fontSize: '14px', fontWeight: 600,
                      color: bot.tono === t.value ? '#FF6B2B' : '#374151',
                      textAlign: 'center', transition: 'all .15s',
                    }}>
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>
                  Describe tus productos o servicios
                  <span style={{ fontWeight: 400, color: '#9ca3af' }}> (puedes completar después)</span>
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                  placeholder={`ej. Vendemos vehículos ${profile.industria === 'Automotriz' ? 'Kia nuevos desde $22,000 USD. Financiación disponible.' : 'y ofrecemos servicios de...'}`}
                  value={bot.productos}
                  onChange={e => setBot(b => ({ ...b, productos: e.target.value }))}
                />
              </div>
            </div>
            <button
              onClick={saveBot}
              disabled={saving}
              style={{ width: '100%', background: '#FF6B2B', color: '#fff', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginTop: '1.5rem', opacity: saving ? .7 : 1 }}>
              {saving ? 'Creando bot...' : '🤖 Crear mi Bot IA →'}
            </button>
            <button onClick={() => setStep(3)} style={{ width: '100%', background: 'transparent', color: '#9ca3af', border: 'none', padding: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '.5rem' }}>
              Saltar por ahora →
            </button>
          </div>
        )}

        {/* PASO 3 — Listo */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '1rem' }}>🚀</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '.75rem', letterSpacing: '-.02em' }}>
              ¡Todo listo!
            </h1>
            <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '2rem', lineHeight: 1.7 }}>
              Tu cuenta está configurada y tu bot está activo. Comparte el link con tus prospectos y empieza a recibir leads.
            </p>

            {botId && (
              <div style={{ background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>🔗 Link de tu Bot IA</div>
                <div style={{ fontSize: '14px', color: '#1d4ed8', fontWeight: 600, wordBreak: 'break-all', marginBottom: '10px' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/bot/${botId}` : `/bot/${botId}`}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/bot/${botId}`)}
                  style={{ background: '#FF6B2B', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  Copiar link
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              {[
                { icon: '✅', text: 'Bot IA configurado y activo' },
                { icon: '✅', text: 'Landing page personalizada lista' },
                { icon: '✅', text: 'Pipeline de ventas disponible' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                  <span>{item.icon}</span><span>{item.text}</span>
                </div>
              ))}
            </div>

            <button onClick={finish} style={{ width: '100%', background: '#FF6B2B', color: '#fff', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
              Ir a mi dashboard →
            </button>
          </div>
        )}
      </div>

      {step === 0 && (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.3)', marginTop: '1.5rem' }}>
          ¿Ya tienes cuenta? <Link href="/auth/login" style={{ color: '#FF6B2B', textDecoration: 'none', fontWeight: 600 }}>Ingresar</Link>
        </p>
      )}
    </div>
  )
}
