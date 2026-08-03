# patch_header_matriculas.py — devuelve el pill de estado y "Pantalla completa"
# al encabezado de Matriculas.
#
# Correr desde la raiz del repo:   python patch_header_matriculas.py
#
# Al reemplazar la barra de filtros por un encabezado propio, Matriculas perdio
# dos controles que si sirven en cualquier seccion: el pill con la hora de sync y
# el boton de pantalla completa. Este patch los devuelve.
#
# El pill NO muestra oportunidades: ese numero pertenece al embudo y no dice nada
# sobre matriculas. Muestra las cifras del propio modulo, que se exportan desde
# ModuloMatriculas.tsx para no duplicarlas en dos archivos.
#
# Toca dos archivos:
#   1. ModuloMatriculas.tsx  — exporta TOTAL_MATRICULADAS y TOTAL_REPRESADAS
#   2. page.tsx              — importa esos totales y arma el grupo de controles
#
# Cada paso valida su ancla con assert. Idempotente.

import io, os, sys

MOD = os.path.join("src", "app", "pulse", "demo", "ModuloMatriculas.tsx")
PAG = os.path.join("src", "app", "pulse", "demo", "page.tsx")

for r in (MOD, PAG):
    if not os.path.exists(r):
        sys.exit(f"No encuentro {r}. Corre este script desde la raiz del repo.")

# ══ 1) Exportar los totales del modulo ══════════════════════════════════════
m = io.open(MOD, encoding="utf-8").read()
if "TOTAL_MATRICULADAS" not in m:
    ANCLA = "type VistaId = 'compuerta' | 'calendario' | 'vitrinas'"
    assert m.count(ANCLA) == 1, "No encontre el tipo VistaId en ModuloMatriculas.tsx."
    m = m.replace(ANCLA, """// Totales del modulo. Se exportan para que el encabezado del panel los muestre
// sin duplicar las cifras en page.tsx: si manana cambian los datos sinteticos,
// el pill del encabezado cambia solo.
export const TOTAL_MATRICULADAS = MATRICULADAS.reduce((a, f) => a + f.total, 0)
export const TOTAL_REPRESADAS = ESTADOS.reduce((a, e) => a + e.total, 0)

""" + ANCLA, 1)
    io.open(MOD, "w", encoding="utf-8").write(m)
    print("OK - ModuloMatriculas.tsx: totales exportados")
else:
    print("-- ModuloMatriculas.tsx ya exportaba los totales")

# ══ 2) Encabezado de Matriculas en page.tsx ═════════════════════════════════
s = io.open(PAG, encoding="utf-8").read()
original = s

if "TOTAL_MATRICULADAS" in s:
    sys.exit("El encabezado ya esta parcheado. Nada que hacer.")

VIEJO_IMPORT = "import ModuloMatriculas from './ModuloMatriculas'"
NUEVO_IMPORT = "import ModuloMatriculas, { TOTAL_MATRICULADAS, TOTAL_REPRESADAS } from './ModuloMatriculas'"
assert s.count(VIEJO_IMPORT) == 1, "No encontre el import de ModuloMatriculas."
s = s.replace(VIEJO_IMPORT, NUEVO_IMPORT, 1)

VIEJO = """                <BotonTema tema={tema} onTema={alternarTema} />
              </div>
            ) : (
            <BarraFiltros"""

NUEVO = """                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <BotonTema tema={tema} onTema={alternarTema} />

                  {/* Mismo lugar y misma forma que el pill del resto del panel, pero
                      con las cifras de este modulo: poner "oportunidades" aca seria
                      mostrar un numero del embudo que no dice nada sobre matriculas. */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 13px', borderRadius: '999px', background: BLUE_SOFT, border: `1px solid ${BLUE_EDGE}` }}>
                    <span style={{ width: '7px', height: '7px', background: BLUE, flexShrink: 0 }} />
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: BLUE, letterSpacing: '0.3px' }}>
                      {formatearNumero(TOTAL_MATRICULADAS)} PUBLICADAS
                    </span>
                    <span style={{ fontSize: '11px', color: DIM }}>· {formatearNumero(TOTAL_REPRESADAS)} represadas</span>
                    {sync && <span style={{ fontSize: '11px', color: DIM }}>· sync {sync}</span>}
                  </div>

                  {!soloPanel && (
                    <a
                      href="/pulse/demo?vista=panel&seccion=matriculas"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pm-demo-accion"
                      title="Abrir el panel a pantalla completa, en una pestaña nueva"
                      style={{ ...accionBarra, textDecoration: 'none' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
                      </svg>
                      Pantalla completa
                    </a>
                  )}
                </div>
              </div>
            ) : (
            <BarraFiltros"""

assert s.count(VIEJO) == 1, "No encontre el BotonTema del encabezado de Matriculas."
s = s.replace(VIEJO, NUEVO, 1)

assert s != original
io.open(PAG, "w", encoding="utf-8").write(s)
print("OK - page.tsx: pill y pantalla completa devueltos a Matriculas")
print("Revisa con: git diff")
