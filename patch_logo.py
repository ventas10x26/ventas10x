# patch_logo.py — conecta el header de las landings con el componente PulseLogo.
#
# Correr desde la raiz del repo:   python patch_logo.py
#
# Afecta a /pulse, /pulse/concesionario y /pulse/asesor, que comparten el mismo
# header (PulseHeader vive en src/app/pulse/_shared/sections.tsx).
#
# Toca un solo archivo y hace dos cosas:
#   1. importa PulseLogo
#   2. reemplaza el isotipo viejo (onda simple) + el <span>Pulse Motor</span>
#      por <PulseLogo />, y ajusta el gap de 10px a 9px (el mark nuevo mide
#      26px, no 22px)
#
# El componente ya esta en el repo (src/components/pulse/PulseLogo.tsx), asi que
# este script solo lo enchufa. Cada paso valida su ancla con assert antes de
# escribir: si el archivo cambio o el patch ya se aplico, falla o sale sin tocar
# nada. Es idempotente.

import io, os, sys

RUTA = os.path.join("src", "app", "pulse", "_shared", "sections.tsx")

if not os.path.exists(RUTA):
    sys.exit(f"No encuentro {RUTA}. Corre este script desde la raiz del repo.")

if not os.path.exists(os.path.join("src", "components", "pulse", "PulseLogo.tsx")):
    sys.exit("Falta src/components/pulse/PulseLogo.tsx. Corre 'git pull' primero.")

s = io.open(RUTA, encoding="utf-8").read()
original = s

if "PulseLogo" in s:
    sys.exit("El patch ya esta aplicado. Nada que hacer.")

# 1) Import — anclado en el primer import del archivo para no depender del orden
# exacto del bloque, que cambia seguido.
i = s.index("\nimport ")
s = s[:i] + "\nimport { PulseLogo } from '@/components/pulse/PulseLogo'" + s[i:]

# 2) Lockup del header
VIEJO = '''        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12h4l2.5-7 4 14 2.5-7H21" />
        </svg>
        <span style={{ fontSize:'16px', fontWeight:800, fontFamily:F_DISPLAY, color:'var(--panel-ink)' }}>Pulse Motor</span>'''

assert s.count(VIEJO) == 1, "No encontre el lockup viejo del header (o hay mas de uno)."
s = s.replace(VIEJO, "        <PulseLogo />", 1)

# El gap de 10px estaba calibrado para el icono de 22px.
VIEJO_GAP = """<a href="/pulse" style={{ display:'flex', alignItems:'center', gap:'10px', textDecoration:'none' }}>
        <PulseLogo />"""
NUEVO_GAP = """<a href="/pulse" style={{ display:'flex', alignItems:'center', gap:'9px', textDecoration:'none' }}>
        <PulseLogo />"""
assert s.count(VIEJO_GAP) == 1, "No encontre el wrapper <a> del logo en el header."
s = s.replace(VIEJO_GAP, NUEVO_GAP, 1)

assert s != original
io.open(RUTA, "w", encoding="utf-8").write(s)
print("OK - sections.tsx parcheado.")
print("Afecta el header de /pulse, /pulse/concesionario y /pulse/asesor.")
print("Revisa con: git diff")
