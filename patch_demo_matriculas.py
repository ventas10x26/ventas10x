# patch_demo_matriculas.py — enchufa las dos piezas nuevas al panel demo.
#
# Correr desde la raiz del repo:   python patch_demo_matriculas.py
#
# Reemplaza a patch_matriculas.py: si ya corriste aquel, este detecta lo que
# falta y aplica solo la parte pendiente.
#
# Toca un solo archivo (src/app/pulse/demo/page.tsx):
#
#   A. Seccion "Matriculas" en el menu lateral
#      1. import de ModuloMatriculas
#      2. 'matriculas' en el tipo SeccionId
#      3. entrada en el arreglo SECCIONES (despues de Vitrinas)
#      4. bloque de render
#
#   B. Franja de cierre pedido->placa al pie del panel Integralidad 360
#      5. import de CierreIntegralidad
#      6. montaje dentro del <Panel> de Integralidad
#
# Los dos componentes ya estan en el repo. Cada paso valida su ancla con assert
# antes de escribir: si el archivo cambio, falla y NO deja el archivo a medias.
# Las dos partes son independientes y el script es idempotente.

import io, os, sys

RUTA = os.path.join("src", "app", "pulse", "demo", "page.tsx")

if not os.path.exists(RUTA):
    sys.exit(f"No encuentro {RUTA}. Corre este script desde la raiz del repo.")

s = io.open(RUTA, encoding="utf-8").read()
original = s
hechos = []

# ══ A. Seccion Matriculas ═══════════════════════════════════════════════════
if "ModuloMatriculas" not in s:
    ANCLA_IMPORT = "} from './datos'"
    assert s.count(ANCLA_IMPORT) == 1, "No encontre el import de ./datos."
    s = s.replace(ANCLA_IMPORT, ANCLA_IMPORT + "\nimport ModuloMatriculas from './ModuloMatriculas'", 1)

    VIEJO_TIPO = "type SeccionId = 'resumen' | 'funnel' | 'asesores' | 'integralidad' | 'vitrinas'"
    NUEVO_TIPO = VIEJO_TIPO + " | 'matriculas'"
    assert s.count(VIEJO_TIPO) == 1, "No encontre el tipo SeccionId."
    s = s.replace(VIEJO_TIPO, NUEVO_TIPO, 1)

    # Va despues de Vitrinas: el menu sigue el recorrido de la venta, y la
    # matricula es el ultimo paso, cuando la unidad ya salio de la vitrina.
    VIEJO_MENU = "  { id: 'vitrinas',     label: 'Vitrinas',          icono: '⌂' },\n]"
    NUEVO_MENU = (
        "  { id: 'vitrinas',     label: 'Vitrinas',          icono: '⌂' },\n"
        "  { id: 'matriculas',   label: 'Matrículas',        icono: '▤' },\n]"
    )
    assert s.count(VIEJO_MENU) == 1, "No encontre el final del arreglo SECCIONES."
    s = s.replace(VIEJO_MENU, NUEVO_MENU, 1)

    ANCLA_RENDER = "            {seccion === 'asesores' && ("
    assert s.count(ANCLA_RENDER) == 1, "No encontre el bloque de render de 'asesores'."
    s = s.replace(
        ANCLA_RENDER,
        "            {seccion === 'matriculas' && (\n"
        "              <div style={{ marginBottom: '16px' }}>\n"
        "                <ModuloMatriculas />\n"
        "              </div>\n"
        "            )}\n"
        "\n" + ANCLA_RENDER,
        1,
    )
    hechos.append("seccion Matriculas")

# ══ B. Franja de cierre en Integralidad 360 ═════════════════════════════════
if "CierreIntegralidad" not in s:
    ANCLA_IMPORT_B = "} from './datos'"
    assert s.count(ANCLA_IMPORT_B) == 1, "No encontre el import de ./datos."
    s = s.replace(ANCLA_IMPORT_B, ANCLA_IMPORT_B + "\nimport CierreIntegralidad from './CierreIntegralidad'", 1)

    # Se monta justo antes de cerrar el <Panel> de Integralidad: el cierre del div
    # que envuelve el map de las cuatro lineas, seguido de </Panel>.
    ANCLA_PANEL = """              ))}
            </div>
          </Panel>
        </div>
            )}

            {(seccion === 'resumen' || seccion === 'vitrinas') && ("""
    NUEVO_PANEL = """              ))}
            </div>
            <CierreIntegralidad pedidos={d.totales.pedidos} matriculas={d.totales.matriculas} roe={d.totales.roe} />
          </Panel>
        </div>
            )}

            {(seccion === 'resumen' || seccion === 'vitrinas') && ("""
    assert s.count(ANCLA_PANEL) == 1, "No encontre el cierre del panel de Integralidad 360."
    s = s.replace(ANCLA_PANEL, NUEVO_PANEL, 1)
    hechos.append("franja de cierre en Integralidad 360")

if not hechos:
    sys.exit("Todo ya estaba aplicado. Nada que hacer.")

assert s != original
io.open(RUTA, "w", encoding="utf-8").write(s)
print("OK - aplicado: " + ", ".join(hechos))
print("Revisa con: git diff")
