'use client'

import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="w-full relative overflow-hidden bg-[#0f0f0f]">

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,107,43,0.15)_0%,transparent_70%)]" />

      {/* CONTENIDO */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24 flex flex-col items-center text-center">

        {/* Badge */}
        <div className="animate-fadeUp inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-sm font-semibold text-orange-500 border border-orange-500/30 bg-orange-500/10">
          ⚡ 14 días gratis · Sin tarjeta · Setup en 48h
        </div>

        {/* Headline */}
        <h1 className="animate-fadeUp-1 max-w-4xl text-white font-bold leading-[1.05] tracking-tight text-[clamp(42px,7vw,88px)]">
          Tu proceso de ventas,<br />
          <span className="text-orange-500">automatizado.</span> Por fin.
        </h1>

        {/* Sub */}
        <p className="animate-fadeUp-2 mt-6 mb-10 max-w-xl text-gray-400 text-[clamp(16px,2vw,19px)] leading-relaxed">
          Bot IA por industria, catálogo desde cualquier archivo, WhatsApp automático y pipeline visual.
        </p>

        {/* Buttons */}
        <div className="animate-fadeUp-3 flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth/register"
            className="px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:shadow-[0_8px_32px_rgba(255,107,43,0.4)] transition"
          >
            Crear cuenta gratis →
          </Link>

          <a
            href="#como-funciona"
            className="px-7 py-3.5 rounded-xl text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            Ver demo ↓
          </a>
        </div>

        {/* Social proof */}
        <div className="animate-fadeUp-4 flex items-center gap-3 mt-12">
          <div className="flex">
            {[
              { bg: '#e67e22', l: 'C' },
              { bg: '#2980b9', l: 'M' },
              { bg: '#27ae60', l: 'A' },
              { bg: '#8e44ad', l: 'S' },
            ].map((a, i) => (
              <span
                key={i}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-[#0f0f0f]"
                style={{ background: a.bg, marginLeft: i === 0 ? 0 : -8 }}
              >
                {a.l}
              </span>
            ))}
          </div>

          <span className="text-sm text-gray-400">
            <strong className="text-white">+200 vendedores activos</strong> en Latam
          </span>
        </div>

        {/* Stats */}
        <div className="animate-fadeUp-5 w-full max-w-3xl mt-16 rounded-2xl overflow-hidden border border-white/10 bg-white/5 grid grid-cols-2 md:grid-cols-4">

          {[
            { num: '68%', color: 'text-orange-500', label: 'menos leads perdidos' },
            { num: '3.4x', color: 'text-white', label: 'más cierres' },
            { num: '48h', color: 'text-white', label: 'setup completo' },
            { num: '30s', color: 'text-teal-400', label: 'respuesta automática' },
          ].map(s => (
            <div key={s.label} className="text-center py-8 px-4 bg-[#161616]">
              <div className={`text-3xl md:text-4xl font-bold ${s.color}`}>
                {s.num}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {s.label}
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  )
}