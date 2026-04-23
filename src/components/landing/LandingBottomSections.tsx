'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ───────────────────────────── SECTORES ───────────────────────────── */

const sectores = [
  {
    emoji: '🚗',
    tag: 'Automotriz',
    title: 'Concesionarios y vendedores de carros',
    desc: 'La IA lee tu ficha técnica en PDF o Excel y genera el catálogo automáticamente.',
    features: [
      { label: 'Catálogo desde PDF', highlight: true },
      { label: 'Comparador de versiones' },
      { label: 'WhatsApp en 30 seg' },
      { label: 'Pipeline por modelo' },
    ],
  },
  {
    emoji: '🏠',
    tag: 'Inmobiliaria',
    title: 'Asesores y constructoras',
    desc: 'Sube tu brochure o Excel y genera tu catálogo automáticamente.',
    features: [
      { label: 'Catálogo automático', highlight: true },
      { label: 'Filtros por precio' },
      { label: 'Alertas WhatsApp' },
      { label: 'Leads por proyecto' },
    ],
  },
]

export function SectoresSection() {
  return (
    <section className="w-full bg-[var(--light-bg2)] border-y border-[var(--light-border)]">
      <div className="max-w-6xl mx-auto px-6 py-24">

        <div className="text-center mb-16">
          <div className="text-xs uppercase mb-4 text-[var(--orange)]">Sectores</div>

          <h2 className="text-[clamp(32px,5vw,54px)] font-bold text-[var(--light-text)]">
            Hecho para industrias reales
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {sectores.map(s => (
            <div key={s.tag} className="p-8 rounded-2xl border bg-[var(--light-card)] hover:shadow-lg transition">
              <div className="text-3xl mb-3">{s.emoji}</div>
              <h3 className="font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{s.desc}</p>

              <div className="flex flex-wrap gap-2">
                {s.features.map(f => (
                  <span key={f.label} className="text-xs px-3 py-1 rounded-full bg-gray-100">
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ───────────────────────────── TESTIMONIOS ───────────────────────────── */

export function TestimoniosSection() {
  return (
    <section className="w-full bg-[var(--light-bg)]">
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">

        <h2 className="text-4xl font-bold mb-16">
          Lo que dicen los vendedores
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="p-6 border rounded-2xl bg-white">
              <p className="text-sm mb-4">
                "Esto cambió completamente mi proceso de ventas"
              </p>
              <div className="text-xs text-gray-500">Usuario {i}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ───────────────────────────── PRECIOS ───────────────────────────── */

export function PreciosSection() {
  return (
    <section className="w-full bg-[var(--light-bg)]">
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">

        <h2 className="text-4xl font-bold mb-16">
          Precios simples
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="p-8 border rounded-2xl">
            <h3 className="font-bold mb-2">Gratis</h3>
            <p>$0</p>
          </div>

          <div className="p-8 border rounded-2xl border-orange-500">
            <h3 className="font-bold mb-2">Pro</h3>
            <p>$119.900</p>
          </div>

          <div className="p-8 border rounded-2xl">
            <h3 className="font-bold mb-2">Team</h3>
            <p>$599.900</p>
          </div>

        </div>

      </div>
    </section>
  )
}

/* ───────────────────────────── FAQ ───────────────────────────── */

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  const faqs = [
    { q: '¿Funciona para cualquier sector?', a: 'Sí, totalmente.' },
    { q: '¿Necesito programar?', a: 'No.' },
  ]

  return (
    <section className="w-full bg-[var(--light-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-24">

        <h2 className="text-3xl font-bold mb-12">FAQ</h2>

        {faqs.map((f, i) => (
          <div key={i} className="mb-4">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left font-semibold"
            >
              {f.q}
            </button>

            {open === i && (
              <p className="text-sm mt-2 text-gray-500">{f.a}</p>
            )}
          </div>
        ))}

      </div>
    </section>
  )
}

/* ───────────────────────────── CTA ───────────────────────────── */

export function CTASection() {
  return (
    <section className="w-full bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-28 text-center">

        <h2 className="text-4xl font-bold mb-6">
          Empieza hoy mismo
        </h2>

        <Link href="/auth/register" className="bg-orange-500 px-6 py-3 rounded-xl">
          Crear cuenta →
        </Link>

      </div>
    </section>
  )
}

/* ───────────────────────────── FOOTER ───────────────────────────── */

export function LandingFooter() {
  return (
    <footer className="w-full bg-black text-gray-400">
      <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between">

        <div className="text-white font-bold">
          Ventas<span className="text-orange-500">10x</span>
        </div>

        <div className="flex gap-6">
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
        </div>

      </div>
    </footer>
  )
}