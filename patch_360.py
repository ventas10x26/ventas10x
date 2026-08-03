# patch_360.py — reencuadra la seccion "Lo que nos hace distintos" de
# /pulse/concesionario hacia el objetivo 360.
#
# Correr desde la raiz del repo:   python patch_360.py
#
# POR QUE. La seccion se definia contra una categoria ("no es un chatbot mas")
# en vez de por el resultado. A un dueno de concesionario la comparacion con
# chatbots no le dice nada: el no esta evaluando chatbots, esta mirando su P&G.
# Y las cuatro tarjetas mezclaban capacidad tecnica (entiende tu inventario),
# canal (vive en WhatsApp) y comercial (precio simple) — tres planos distintos
# en una sola fila.
#
# Ahora las cuatro tarjetas son las cuatro lineas de margen que se adhieren a
# cada unidad. El vehiculo es la quinta y es la puerta de entrada, por eso queda
# en el titular y no en el grid: el grid de cuatro columnas pasa a servir al
# argumento en vez de obligar a inventar un cuarto diferenciador.
#
# Toca un solo archivo (src/app/pulse/_shared/sections.tsx). Idempotente.

import io, os, sys

RUTA = os.path.join("src", "app", "pulse", "_shared", "sections.tsx")

if not os.path.exists(RUTA):
    sys.exit(f"No encuentro {RUTA}. Corre este script desde la raiz del repo.")

s = io.open(RUTA, encoding="utf-8").read()
original = s

if "cinco líneas" in s and "DIFERENCIADORES" in s and "chatbot más" not in s:
    sys.exit("El patch ya esta aplicado. Nada que hacer.")

# ── 1) Las cuatro tarjetas ─────────────────────────────────────────────────
VIEJO_ARRAY = """export const DIFERENCIADORES = [
  { num:'01', icon:'▶',  titulo:'Ejecuta, no solo conversa',      desc:'Cada cotización y cada tasación es una acción ejecutada y registrada — no una respuesta genérica de chatbot.' },
  { num:'02', icon:'🗂', titulo:'Entiende tu inventario solo',     desc:'Subís tu Excel o DMS y DataBridge arma el mapa de tablas automáticamente, sin escribir una línea de SQL.' },
  { num:'03', icon:'💬', titulo:'Vive en el WhatsApp que ya usás', desc:'Sin número nuevo, sin app aparte: el mismo WhatsApp Business de tu concesionario o tu número personal.' },
  { num:'04', icon:'💳', titulo:'Precio simple, sin sorpresas',    desc:'Cobrás por plan, no por lead — sin costos ocultos ni contratos de permanencia.' },
]"""

NUEVO_ARRAY = """export const DIFERENCIADORES = [
  { num:'01', icon:'◧', titulo:'Financiación',       desc:'Cotiza el crédito dentro de la misma conversación, sin transferir al área ni perder al cliente en el traspaso.' },
  { num:'02', icon:'◈', titulo:'Seguro todo riesgo', desc:'Ofrece la póliza en el momento del cierre, que es cuando el cliente ya dijo que sí — no una semana después.' },
  { num:'03', icon:'✚', titulo:'Accesorios',         desc:'Propone el accesorio sobre el modelo que el cliente eligió, antes de que la unidad salga de la vitrina.' },
  { num:'04', icon:'⇄', titulo:'Retomas',            desc:'Toma los datos del usado y devuelve una tasación registrada, para que la retoma no se vaya a otro lado.' },
]"""

assert s.count(VIEJO_ARRAY) == 1, "No encontre el arreglo DIFERENCIADORES."
s = s.replace(VIEJO_ARRAY, NUEVO_ARRAY, 1)

# El comentario de encima describia el arreglo viejo.
VIEJO_COMENT = """// ─── Diferenciadores reales del producto (no prueba social — todavía en lanzamiento,
// sin logos de clientes que mostrar) — un solo chip ámbar, no la paleta multicolor de
// Ecosistema/Cumplimiento, ver "Chips de categoría" en tokens.md ───"""
NUEVO_COMENT = """// ─── Las cuatro líneas de margen que se adhieren a cada unidad vendida.
//
// El vehículo nuevo es la quinta y no está acá a propósito: es la puerta de
// entrada, la que todo concesionario cobra siempre, y por eso vive en el titular.
// Las que mueven el P&G son estas cuatro, porque no exigen un lead más — exigen
// no dejar la línea sin ofrecer en la unidad que ya se vendió.
//
// Un solo chip ámbar, no la paleta multicolor de Ecosistema/Cumplimiento, ver
// "Chips de categoría" en tokens.md ───"""
assert s.count(VIEJO_COMENT) == 1, "No encontre el comentario de DIFERENCIADORES."
s = s.replace(VIEJO_COMENT, NUEVO_COMENT, 1)

# ── 2) Encabezado de la seccion ────────────────────────────────────────────
VIEJO_KICKER = '<p className="kicker" style={{ justifyContent:\'center\', display:\'flex\' }}>Lo que nos hace distintos</p>'
NUEVO_KICKER = '<p className="kicker" style={{ justifyContent:\'center\', display:\'flex\' }}>El negocio completo, no una parte</p>'
assert s.count(VIEJO_KICKER) == 1, "No encontre el kicker de la seccion."
s = s.replace(VIEJO_KICKER, NUEVO_KICKER, 1)

VIEJO_H2 = """            No es un chatbot más. <span className="grad-blue">Es un agente que ejecuta.</span>"""
NUEVO_H2 = """            El vehículo es la primera línea. <span className="grad-blue">Faltan cuatro.</span>"""
assert s.count(VIEJO_H2) == 1, "No encontre el titular de la seccion."
s = s.replace(VIEJO_H2, NUEVO_H2, 1)

VIEJO_SUB = "            Cuatro diferencias que se notan desde el primer lead — no promesas genéricas de IA."
NUEVO_SUB = "            Cada unidad que sale de tu vitrina puede cargar cinco líneas de margen. El agente trabaja las cuatro que suelen quedarse sin ofrecer, y el tablero te muestra cuántas cobraste."
assert s.count(VIEJO_SUB) == 1, "No encontre el subtitulo de la seccion."
s = s.replace(VIEJO_SUB, NUEVO_SUB, 1)

assert s != original
io.open(RUTA, "w", encoding="utf-8").write(s)
print("OK - sections.tsx parcheado.")
print("Afecta la seccion de diferenciadores en /pulse/concesionario.")
print("Revisa con: git diff")
