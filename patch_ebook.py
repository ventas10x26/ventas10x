# patch_ebook.py — monta el modal del ebook en todo /pulse.
#
# Correr desde la raiz del repo:   python patch_ebook.py
#
# Toca un solo archivo (src/app/pulse/layout.tsx). Montarlo en el layout y no en
# cada landing cubre todo el sitio con una sola edicion, y no se olvida al
# agregar paginas nuevas. El propio componente decide donde NO mostrarse
# (/pulse/demo y rutas de aplicacion), asi la exclusion vive en un solo lugar.
#
# El componente y el endpoint ya estan en el repo. Idempotente.

import io, os, sys

RUTA = os.path.join("src", "app", "pulse", "layout.tsx")

if not os.path.exists(RUTA):
    sys.exit(f"No encuentro {RUTA}. Corre este script desde la raiz del repo.")

if not os.path.exists(os.path.join("src", "components", "pulse", "PulseEbookGate.tsx")):
    sys.exit("Falta src/components/pulse/PulseEbookGate.tsx. Corre 'git pull' primero.")

s = io.open(RUTA, encoding="utf-8").read()
original = s

if "PulseEbookGate" in s:
    sys.exit("El patch ya esta aplicado. Nada que hacer.")

# 1) Import — anclado en el primer import del archivo.
i = s.index("\nimport ")
s = s[:i] + "\nimport { PulseEbookGate } from '@/components/pulse/PulseEbookGate'" + s[i:]

# 2) Montaje, justo despues de {children}.
ANCLA = "      {children}\n    </div>"
NUEVO = "      {children}\n\n      {/* El modal decide solo en que rutas mostrarse y con que disparador. */}\n      <PulseEbookGate />\n    </div>"
assert s.count(ANCLA) == 1, "No encontre el cierre del layout ({children} seguido de </div>)."
s = s.replace(ANCLA, NUEVO, 1)

assert s != original
io.open(RUTA, "w", encoding="utf-8").write(s)
print("OK - layout.tsx parcheado. El modal queda montado en todo /pulse.")
print("Revisa con: git diff")
