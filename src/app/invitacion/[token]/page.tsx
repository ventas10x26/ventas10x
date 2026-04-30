// Ruta destino: src/app/invitacion/[token]/page.tsx
// Página pública que muestra info de la invitación y botón para aceptar/registrar.

import { InvitacionClient } from '@/components/InvitacionClient'

export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <InvitacionClient token={token} />
}
