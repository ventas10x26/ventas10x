// Ruta destino: src/components/fenix/FenixClarity.tsx
// Mapa de calor + grabaciones de sesión para la landing de Fenix, vía
// Microsoft Clarity (gratis, sin límite de tráfico). Mismo patrón que
// GoogleAnalytics.tsx (Script de next/script), pero scoped solo a esta
// página -- un heatmap no tiene sentido en el resto de Ventas10x, y no hay
// razón para cargar el script ahí.
//
// El ID de proyecto no es secreto (viaja igual en el HTML del script), pero
// se deja en env var y no hardcodeado para poder activarlo sin un deploy
// de código: si NEXT_PUBLIC_CLARITY_ID no está configurada, el componente
// no renderiza nada -- no rompe la página mientras tanto.
'use client'
import Script from 'next/script'

export function FenixClarity() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_ID
  if (!projectId) return null

  return (
    <Script id="fenix-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
          t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
          y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", "${projectId}");
      `}
    </Script>
  )
}
