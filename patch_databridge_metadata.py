# patch_databridge_metadata.py — separa /pulse/databridge en servidor + cliente,
# mismo motivo y mismo patron que patch_demo_metadata.py.
#
# Correr desde la raiz del repo:   python patch_databridge_metadata.py
#
# No retypea el archivo (es el mas grande de los cuatro, ~1800 lineas): lo
# COPIA programaticamente a DataBridgeClient.tsx y solo renombra la funcion
# exportada. page.tsx se reemplaza por un wrapper de servidor liviano.

import io, os, sys

RUTA_VIEJA = os.path.join("src", "app", "pulse", "databridge", "page.tsx")
RUTA_CLIENTE = os.path.join("src", "app", "pulse", "databridge", "DataBridgeClient.tsx")

if not os.path.exists(RUTA_VIEJA):
    sys.exit(f"No encuentro {RUTA_VIEJA}. Corre este script desde la raiz del repo.")

if os.path.exists(RUTA_CLIENTE):
    sys.exit("El patch ya esta aplicado (DataBridgeClient.tsx ya existe). Nada que hacer.")

contenido = io.open(RUTA_VIEJA, encoding="utf-8").read()

ANCLA = "export default function DataBridgePage() {"
if contenido.count(ANCLA) != 1:
    sys.exit("No encontre 'export default function DataBridgePage()' — el archivo cambio de forma inesperada, avisa antes de seguir.")

nota = (
    "// Este componente era antes 'page.tsx' completo, copiado aca sin cambiar\n"
    "// ninguna linea de contenido o comportamiento (solo el nombre de la funcion).\n"
    "// page.tsx ahora es un componente de servidor liviano que declara metadata\n"
    "// propia de esta pagina y renderiza este componente.\n"
    "export default function DataBridgeClient() {"
)
contenido_cliente = contenido.replace(ANCLA, nota, 1)
io.open(RUTA_CLIENTE, "w", encoding="utf-8").write(contenido_cliente)

nuevo_page = '''// src/app/pulse/databridge/page.tsx
// Componente de servidor — ver el mismo patron y motivo en
// src/app/pulse/concesionario/page.tsx. Este archivo se genero copiando
// page.tsx a DataBridgeClient.tsx sin cambios (ver patch_databridge_metadata.py).

import type { Metadata } from 'next'
import DataBridgeClient from './DataBridgeClient'

export const metadata: Metadata = {
  title: 'DataBridge 360\\u00b0: conect\\u00e1 tus datos sin escribir SQL',
  description: 'Sub\\u00ed tu Excel, CRM o DMS y DataBridge arma el modelo de datos con sus relaciones autom\\u00e1ticamente. Probalo gratis, sin tarjeta.',
  alternates: { canonical: 'https://pulsemotor.co/pulse/databridge' },
  openGraph: {
    title: 'DataBridge 360\\u00b0: conect\\u00e1 tus datos sin escribir SQL | Pulse Motor',
    description: 'Sub\\u00ed tu Excel, CRM o DMS y DataBridge arma el modelo de datos con sus relaciones autom\\u00e1ticamente.',
    url: 'https://pulsemotor.co/pulse/databridge',
    siteName: 'Pulse Motor',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DataBridge 360\\u00b0: conect\\u00e1 tus datos sin escribir SQL | Pulse Motor',
    description: 'Sub\\u00ed tu Excel, CRM o DMS y DataBridge arma el modelo de datos con sus relaciones autom\\u00e1ticamente.',
  },
}

export default function DataBridgePage() {
  return <DataBridgeClient />
}
'''
io.open(RUTA_VIEJA, "w", encoding="utf-8").write(nuevo_page)

print("OK - DataBridgeClient.tsx creado (copia exacta), page.tsx reemplazado por wrapper de servidor.")
print("Revisa con: git diff --stat")
