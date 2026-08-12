# patch_demo_metadata.py — separa /pulse/demo en servidor + cliente, para que
# pueda tener su propio titulo/descripcion/canonical (Next.js no lo permite en
# un componente de cliente, y esta pagina entera es 'use client').
#
# Correr desde la raiz del repo:   python patch_demo_metadata.py
#
# No retypea el archivo: lo COPIA programaticamente a DemoClient.tsx (cero
# riesgo de error de transcripcion en un archivo de 1300+ lineas) y solo
# ajusta el nombre de la funcion exportada. page.tsx se reemplaza por un
# wrapper de servidor liviano.

import io, os, re, sys

RUTA_VIEJA = os.path.join("src", "app", "pulse", "demo", "page.tsx")
RUTA_CLIENTE = os.path.join("src", "app", "pulse", "demo", "DemoClient.tsx")

if not os.path.exists(RUTA_VIEJA):
    sys.exit(f"No encuentro {RUTA_VIEJA}. Corre este script desde la raiz del repo.")

if os.path.exists(RUTA_CLIENTE):
    sys.exit("El patch ya esta aplicado (DemoClient.tsx ya existe). Nada que hacer.")

contenido = io.open(RUTA_VIEJA, encoding="utf-8").read()

# Solo se renombra la funcion exportada (DemoPage -> DemoClient) y se agrega
# una nota. Ni una otra linea cambia: es una copia, no una reescritura.
ANCLA = "export default function DemoPage() {"
if contenido.count(ANCLA) != 1:
    sys.exit("No encontre 'export default function DemoPage()' — el archivo cambio de forma inesperada, avisa antes de seguir.")

nota = (
    "// Este componente era antes 'page.tsx' completo, copiado aca sin cambiar\n"
    "// ninguna linea de contenido o comportamiento (solo el nombre de la funcion).\n"
    "// page.tsx ahora es un componente de servidor liviano que declara metadata\n"
    "// propia de esta pagina y renderiza este componente.\n"
    "export default function DemoClient() {"
)
contenido_cliente = contenido.replace(ANCLA, nota, 1)
io.open(RUTA_CLIENTE, "w", encoding="utf-8").write(contenido_cliente)

nuevo_page = '''// src/app/pulse/demo/page.tsx
// Componente de servidor — ver el mismo patron y motivo en
// src/app/pulse/concesionario/page.tsx. Este archivo se genero copiando
// page.tsx a DemoClient.tsx sin cambios (ver patch_demo_metadata.py).

import type { Metadata } from 'next'
import DemoClient from './DemoClient'

export const metadata: Metadata = {
  title: 'Demo del panel 360\\u00b0 para concesionarios',
  description: 'Mir\\u00e1 en vivo c\\u00f3mo se ve el embudo, la integralidad y las matr\\u00edculas de tu concesionario en un solo panel. Dejaste tus datos y entr\\u00e1 con datos de muestra.',
  alternates: { canonical: 'https://pulsemotor.co/pulse/demo' },
  openGraph: {
    title: 'Demo del panel 360\\u00b0 para concesionarios | Pulse Motor',
    description: 'Mir\\u00e1 en vivo c\\u00f3mo se ve el embudo, la integralidad y las matr\\u00edculas de tu concesionario en un solo panel.',
    url: 'https://pulsemotor.co/pulse/demo',
    siteName: 'Pulse Motor',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Demo del panel 360\\u00b0 para concesionarios | Pulse Motor',
    description: 'Mir\\u00e1 en vivo c\\u00f3mo se ve el embudo, la integralidad y las matr\\u00edculas de tu concesionario en un solo panel.',
  },
}

export default function DemoPage() {
  return <DemoClient />
}
'''
io.open(RUTA_VIEJA, "w", encoding="utf-8").write(nuevo_page)

print("OK - DemoClient.tsx creado (copia exacta), page.tsx reemplazado por wrapper de servidor.")
print("Revisa con: git diff --stat")
