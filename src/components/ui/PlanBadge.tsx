interface PlanBadgeProps {
  plan: string
  estado: string
  diasRestantes?: number
  onUpgrade?: () => void
}

export function PlanBadge({ plan, estado, diasRestantes, onUpgrade }: PlanBadgeProps) {
  if (estado === 'trial') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
          <span className="text-amber-500 text-lg">⏰</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-amber-800">
            Trial gratuito · {diasRestantes} día{diasRestantes !== 1 ? 's' : ''} restante{diasRestantes !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-amber-600">Acceso completo durante el trial. Elige un plan para continuar.</div>
        </div>
        {onUpgrade && (
          <button onClick={onUpgrade} className="text-xs font-bold px-3 py-1.5 bg-amber-400 text-amber-900 rounded-lg hover:bg-amber-500 transition-colors whitespace-nowrap">
            Elegir plan →
          </button>
        )}
      </div>
    )
  }

  if (estado === 'activo') {
    const nombres: Record<string, string> = { core: 'Core', pro: 'Pro', teams: 'Teams' }
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-200 mb-6">
        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
          <span className="text-green-500 text-lg">✓</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-green-800">Plan {nombres[plan] || plan} activo</div>
        </div>
        {onUpgrade && (
          <button onClick={onUpgrade} className="text-xs font-semibold text-green-700 hover:underline">
            Gestionar
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 mb-6">
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-700">Plan Gratuito · Funciones limitadas</div>
        <div className="text-xs text-gray-500">Máx 10 leads · Sin catálogo IA</div>
      </div>
      {onUpgrade && (
        <button onClick={onUpgrade} className="text-xs font-bold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
          Actualizar →
        </button>
      )}
    </div>
  )
}
