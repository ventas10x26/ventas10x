# patch_cobertura.py — reencuadra la seccion "Por que Pulse Motor" de
# /pulse/concesionario hacia el objetivo 360.
#
# Correr desde la raiz del repo:   python patch_cobertura.py
#
# POR QUE. El titular vendia cobertura de un canal ("la cobertura que tu WhatsApp
# nunca tuvo"). Para un dueno de concesionario, WhatsApp es por donde pasa la
# conversacion, no el negocio: cubrir horas no es un objetivo, es un medio.
#
# Lo interesante es que el panel de la derecha YA contaba la historia correcta
# —retoma, financiacion, poliza ejecutandose a distintas horas—, solo que el
# texto hablaba de otra cosa. Este patch alinea el texto con lo que el panel ya
# muestra, y completa el panel con la cuarta linea que le faltaba.
#
# Toca un solo archivo (src/app/pulse/_shared/sections.tsx). Idempotente.

import io, os, sys

RUTA = os.path.join("src", "app", "pulse", "_shared", "sections.tsx")

if not os.path.exists(RUTA):
    sys.exit(f"No encuentro {RUTA}. Corre este script desde la raiz del repo.")

s = io.open(RUTA, encoding="utf-8").read()
original = s

if "sin ofrecer. <span" in s or "Ninguna línea se queda" in s:
    sys.exit("El patch ya esta aplicado. Nada que hacer.")

# ── 1) Bullets ─────────────────────────────────────────────────────────────
# Los tres primeros pasan a ser lineas de margen. Canal y despliegue no
# desaparecen —cierran riesgo en comite— pero bajan al final: son condiciones,
# no la propuesta.
VIEJO_BULLETS = """export const POR_QUE = [
  'Responde en segundos, no en horas',
  'Cotiza financiación y pólizas sin transferir la conversación',
  'Aprende el tono y los precios de tu concesionario',
  'Corre en tu WhatsApp Business de siempre, sin número nuevo',
  'Deja registro auditable de cada decisión que toma',
  'Se despliega en días, no en meses',
]"""
NUEVO_BULLETS = """export const POR_QUE = [
  'Cotiza financiación y póliza en la misma conversación, sin transferir a otra área',
  'Tasa la retoma y la deja registrada, para que el usado no se vaya a otro lado',
  'Propone accesorios sobre el modelo que el cliente ya eligió',
  'Responde en segundos a cualquier hora, para que la oportunidad no se enfríe',
  'Deja registro auditable de cada decisión, por sede y por asesor',
  'Corre en tu WhatsApp Business de siempre y se despliega en días, no en meses',
]"""
assert s.count(VIEJO_BULLETS) == 1, "No encontre el arreglo POR_QUE."
s = s.replace(VIEJO_BULLETS, NUEVO_BULLETS, 1)

# ── 2) Panel: las cuatro lineas, una por franja ────────────────────────────
# "Cita agendada" era la unica franja que no correspondia a una linea de margen.
# Se reemplaza por accesorios, y asi el panel muestra las cuatro completas.
VIEJO_COB = """// ─── Cobertura 24/7 — mismo lenguaje visual del timeline/bitácora, aplicado a franjas horarias ───
export const COBERTURA = [
  { rango:'00:00 – 06:00', evento:'Retoma tasada · Sedán 2020' },
  { rango:'06:00 – 12:00', evento:'Cita agendada · Test drive' },
  { rango:'12:00 – 18:00', evento:'Financiación pre-aprobada · 48m' },
  { rango:'18:00 – 24:00', evento:'Póliza cotizada · Todo riesgo' },
]"""
NUEVO_COB = """// ─── Las cuatro líneas de margen, una por franja horaria — mismo lenguaje visual
// del timeline/bitácora. Cada franja muestra una línea distinta a propósito: el
// panel tiene que dejar ver que ninguna de las cuatro depende del horario del
// equipo, no solo que "hay actividad de noche" ───
export const COBERTURA = [
  { rango:'00:00 – 06:00', evento:'Retoma tasada · Sedán 2020' },
  { rango:'06:00 – 12:00', evento:'Accesorios ofrecidos · Kit de seguridad' },
  { rango:'12:00 – 18:00', evento:'Financiación pre-aprobada · 48m' },
  { rango:'18:00 – 24:00', evento:'Póliza cotizada · Todo riesgo' },
]"""
assert s.count(VIEJO_COB) == 1, "No encontre el arreglo COBERTURA."
s = s.replace(VIEJO_COB, NUEVO_COB, 1)

# ── 3) Encabezado ──────────────────────────────────────────────────────────
VIEJO_KICKER = '<p className="kicker">Por qué Pulse Motor</p>'
NUEVO_KICKER = '<p className="kicker">Las cinco líneas, sin horario</p>'
assert s.count(VIEJO_KICKER) == 1, "No encontre el kicker de la seccion."
s = s.replace(VIEJO_KICKER, NUEVO_KICKER, 1)

VIEJO_H2 = """            La cobertura que tu WhatsApp <span className="grad-blue">nunca tuvo.</span>"""
NUEVO_H2 = """            Ninguna línea se queda sin ofrecer. <span className="grad-blue">A ninguna hora.</span>"""
assert s.count(VIEJO_H2) == 1, "No encontre el titular de la seccion."
s = s.replace(VIEJO_H2, NUEVO_H2, 1)

VIEJO_SUB = "No reemplaza a tu equipo — cubre las horas y los picos que tu equipo no puede."
NUEVO_SUB = "No reemplaza a tu equipo. Se ocupa de que la financiación, la póliza, el accesorio y la retoma se ofrezcan siempre — también cuando la vitrina está cerrada."
assert s.count(VIEJO_SUB) == 1, "No encontre el subtitulo de la seccion."
s = s.replace(VIEJO_SUB, NUEVO_SUB, 1)

# ── 4) Cabecera y estado del panel ─────────────────────────────────────────
VIEJO_HEAD = "<span>Cobertura · 24/7/365</span>"
NUEVO_HEAD = "<span>Líneas 360° · 24/7</span>"
assert s.count(VIEJO_HEAD) == 1, "No encontre la cabecera del panel."
s = s.replace(VIEJO_HEAD, NUEVO_HEAD, 1)

# "Cubierto" describe una franja horaria; "Ofrecida" describe la linea, que es
# lo que ahora dice cada fila.
VIEJO_OK = "✓ Cubierto"
NUEVO_OK = "✓ Ofrecida"
assert s.count(VIEJO_OK) == 1, "No encontre la etiqueta de estado del panel."
s = s.replace(VIEJO_OK, NUEVO_OK, 1)

assert s != original
io.open(RUTA, "w", encoding="utf-8").write(s)
print("OK - sections.tsx parcheado.")
print("Afecta la seccion de cobertura en /pulse/concesionario.")
print("Revisa con: git diff")
