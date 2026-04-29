// Ruta destino: src/components/dashboard/landing-editor/BloqueCTAyBadge.tsx

'use client'

type Props = {
  badge_promo: string
  cta_principal_texto: string
  cta_principal_microcopy: string
  onChange: (campo: 'badge_promo' | 'cta_principal_texto' | 'cta_principal_microcopy', valor: string) => void
}

export function BloqueCTAyBadge({
  badge_promo,
  cta_principal_texto,
  cta_principal_microcopy,
  onChange,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Configura el botón principal de acción y el badge que aparece arriba del título.
      </p>

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1">
          Badge promocional
          <span className="font-normal text-xs text-gray-500 ml-2">
            (aparece sobre el título — déjalo vacío si no lo necesitas)
          </span>
        </label>
        <input
          value={badge_promo}
          onChange={(e) => onChange('badge_promo', e.target.value)}
          maxLength={80}
          className="input"
          placeholder="Disponible esta semana · 30% OFF"
        />
        <div className="text-xs text-gray-500 mt-1">{badge_promo.length}/80</div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1">
          Texto del botón principal *
        </label>
        <input
          value={cta_principal_texto}
          onChange={(e) => onChange('cta_principal_texto', e.target.value)}
          maxLength={50}
          className="input"
          placeholder="Reservar mi cita"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1">
          Microcopy debajo del botón
          <span className="font-normal text-xs text-gray-500 ml-2">
            (reduce ansiedad: tiempo de respuesta, sin compromiso, etc.)
          </span>
        </label>
        <input
          value={cta_principal_microcopy}
          onChange={(e) => onChange('cta_principal_microcopy', e.target.value)}
          maxLength={120}
          className="input"
          placeholder="Te respondo en 5 min por WhatsApp"
        />
        <div className="text-xs text-gray-500 mt-1">{cta_principal_microcopy.length}/120</div>
      </div>
    </div>
  )
}
