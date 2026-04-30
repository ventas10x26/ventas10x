// Ruta destino: src/components/dashboard/MetricasLandingCard.tsx
// Card que muestra métricas de la landing del usuario en el dashboard.

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Metricas = {
  visitasHoy: number
  visitas7d: number
  visitas30d: number
  dias14: { dia: string; count: number }[]
  topCiudades: { nombre: string; count: number }[]
  topReferrers: { nombre: string; count: number }[]
  dispositivos: { mobile: number; desktop: number; tablet: number }
}

export function MetricasLandingCard() {
  const [data, setData] = useState<Metricas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/metricas-landing')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setData(d as Metricas)
        else setError(d.error || 'Error al cargar')
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-bold text-gray-900">Visitas a tu landing</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-bold text-gray-900">Visitas a tu landing</h3>
        </div>
        <div className="text-sm text-gray-500">
          {error || 'No se pudieron cargar las métricas'}
        </div>
      </div>
    )
  }

  const sinDatos = data.visitas30d === 0
  const maxBar = Math.max(1, ...data.dias14.map((d) => d.count))
  const totalDispositivos =
    data.dispositivos.mobile + data.dispositivos.desktop + data.dispositivos.tablet

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-bold text-gray-900">Visitas a tu landing</h3>
        </div>
        <Link
          href="/dashboard/landing-editor"
          className="text-xs font-semibold text-orange-600 hover:text-orange-700"
        >
          Editar landing →
        </Link>
      </div>

      {sinDatos ? (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center">
          <div className="text-4xl mb-2">📡</div>
          <div className="text-sm font-semibold text-gray-800 mb-1">
            Sin visitas todavía
          </div>
          <div className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
            Comparte tu link en WhatsApp, Instagram o donde tus clientes te encuentren.
            Aquí verás cuántas personas visitan tu landing.
          </div>
        </div>
      ) : (
        <>
          {/* ── Cards de números ── */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Stat label="Hoy" value={data.visitasHoy} highlight />
            <Stat label="7 días" value={data.visitas7d} />
            <Stat label="30 días" value={data.visitas30d} />
          </div>

          {/* ── Mini-gráfica de barras (14 días) ── */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-5">
            <div className="text-xs font-semibold text-gray-600 mb-2">
              Últimos 14 días
            </div>
            <div className="flex items-end gap-1 h-16">
              {data.dias14.map((d, i) => {
                const height = (d.count / maxBar) * 100
                const esHoy = i === data.dias14.length - 1
                return (
                  <div
                    key={d.dia}
                    className="flex-1 flex flex-col items-center justify-end group relative"
                    title={`${d.dia}: ${d.count} visitas`}
                  >
                    <div
                      className={`w-full rounded-t-sm transition-colors ${
                        esHoy ? 'bg-orange-500' : 'bg-gray-300 group-hover:bg-gray-400'
                      }`}
                      style={{ height: `${Math.max(2, height)}%` }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Lista de fuentes y ciudades ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {data.topReferrers.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                  🔗 Cómo te encuentran
                </div>
                <div className="space-y-1.5">
                  {data.topReferrers.map((r) => (
                    <div key={r.nombre} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{r.nombre}</span>
                      <span className="text-gray-400 text-xs font-mono">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.topCiudades.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                  📍 Ciudades
                </div>
                <div className="space-y-1.5">
                  {data.topCiudades.map((c) => (
                    <div key={c.nombre} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{c.nombre}</span>
                      <span className="text-gray-400 text-xs font-mono">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Barra de dispositivos ── */}
          {totalDispositivos > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-600 mb-2">📱 Dispositivos</div>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                <div
                  className="bg-orange-500"
                  style={{ width: `${(data.dispositivos.mobile / totalDispositivos) * 100}%` }}
                  title={`Mobile: ${data.dispositivos.mobile}`}
                />
                <div
                  className="bg-blue-500"
                  style={{ width: `${(data.dispositivos.desktop / totalDispositivos) * 100}%` }}
                  title={`Desktop: ${data.dispositivos.desktop}`}
                />
                <div
                  className="bg-purple-500"
                  style={{ width: `${(data.dispositivos.tablet / totalDispositivos) * 100}%` }}
                  title={`Tablet: ${data.dispositivos.tablet}`}
                />
              </div>
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span>📱 Mobile {Math.round((data.dispositivos.mobile / totalDispositivos) * 100)}%</span>
                <span>💻 Desktop {Math.round((data.dispositivos.desktop / totalDispositivos) * 100)}%</span>
                {data.dispositivos.tablet > 0 && (
                  <span>📟 Tablet {Math.round((data.dispositivos.tablet / totalDispositivos) * 100)}%</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-3 text-center ${
        highlight ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
      }`}
    >
      <div
        className={`text-2xl font-bold tracking-tight ${
          highlight ? 'text-orange-600' : 'text-gray-900'
        }`}
      >
        {value}
      </div>
      <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
