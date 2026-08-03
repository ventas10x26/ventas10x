# patch_demo_enlaces.py — enlace compartible por modulo + encabezado propio de Matriculas.
#
# Correr desde la raiz del repo:   python patch_demo_enlaces.py
#
# Toca un solo archivo (src/app/pulse/demo/page.tsx) y hace cuatro cosas:
#
#   1. La seccion activa viaja en la URL (?seccion=funnel), asi cada modulo
#      tiene su propio enlace: Resumen, Funnel CRM, Asesores, Integralidad,
#      Vitrinas y Matriculas. Al abrir la pagina se lee de la query.
#   2. Boton "Copiar enlace" en la barra lateral, que copia la URL de la vista
#      que se esta viendo.
#   3. En Matriculas se reemplaza la barra de filtros por un encabezado propio:
#      esos filtros (vitrina, asesor, periodo, origen, categoria) no mueven nada
#      en ese modulo, y el subtitulo decia "Embudo de conversion", que es de otra
#      seccion. Se conserva el toggle de tema, que vivia dentro de esa barra.
#   4. La navegacion lateral pasa a usar el helper que actualiza la URL.
#
# Cada paso valida su ancla con assert antes de escribir: si el archivo cambio o
# el patch ya se aplico, falla o sale sin tocar nada. Es idempotente.

import io, os, sys

RUTA = os.path.join("src", "app", "pulse", "demo", "page.tsx")

if not os.path.exists(RUTA):
    sys.exit(f"No encuentro {RUTA}. Corre este script desde la raiz del repo.")

s = io.open(RUTA, encoding="utf-8").read()
original = s

if "irASeccion" in s:
    sys.exit("El patch ya esta aplicado. Nada que hacer.")

if "ModuloMatriculas" not in s:
    sys.exit("Falta aplicar patch_demo_matriculas.py primero (no encuentro ModuloMatriculas).")

# ── 1) Estado y helpers ────────────────────────────────────────────────────
ANCLA_STATE = "  const [seccion, setSeccion] = useState<SeccionId>('resumen')"
assert s.count(ANCLA_STATE) == 1, "No encontre el useState de seccion."
s = s.replace(ANCLA_STATE, ANCLA_STATE + """
  const [copiado, setCopiado] = useState(false)

  // La seccion activa viaja en la URL para que cada modulo se pueda compartir
  // por separado. Se usa replaceState y no pushState a proposito: el boton
  // "atras" del navegador debe sacar del demo, no recorrer una por una las
  // pestanas que el visitante miro.
  const irASeccion = (id: SeccionId) => {
    setSeccion(id)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('seccion', id)
      window.history.replaceState(null, '', url)
    } catch { /* si el navegador bloquea history, la vista igual cambia */ }
  }

  const copiarEnlace = () => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('seccion', seccion)
      navigator.clipboard.writeText(url.toString())
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 1800)
    } catch { /* sin permiso de portapapeles: queda copiar de la barra de direcciones */ }
  }""", 1)

# ── 2) Lectura de la seccion desde la query al montar ──────────────────────
ANCLA_QUERY = "    } catch { /* si no se puede leer la query, se muestra la página completa */ }"
assert s.count(ANCLA_QUERY) == 1, "No encontre el bloque que lee ?vista de la query."
s = s.replace(ANCLA_QUERY, ANCLA_QUERY + """
    try {
      const q = new URLSearchParams(window.location.search).get('seccion')
      if (q && SECCIONES.some(x => x.id === q)) setSeccion(q as SeccionId)
    } catch { /* sin query legible: arranca en Resumen */ }""", 1)

# ── 3) Navegacion lateral: usa el helper que actualiza la URL ──────────────
VIEJO_NAV = "onClick={() => setSeccion(s.id)}"
assert s.count(VIEJO_NAV) == 1, "No encontre el onClick de la navegacion lateral."
s = s.replace(VIEJO_NAV, "onClick={() => irASeccion(s.id)}", 1)

# ── 4) Boton de copiar enlace en la barra lateral ──────────────────────────
# Va sobre la nota de datos simulados, que es el pie del sidebar. El sidebar es
# oscuro en los dos temas (ver comentario en page.tsx), por eso los colores van
# literales y no por var(--pm-*).
ANCLA_PIE = """            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', fontSize: '11px', color: '#93A3C4', lineHeight: 1.5 }}>"""
NUEVO_PIE = """            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <button
                onClick={copiarEnlace}
                className="pm-demo-nav"
                title="Copiar el enlace de esta vista"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '9px 10px', marginBottom: '8px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                  color: copiado ? '#2DD4BF' : '#93A3C4', cursor: 'pointer',
                  fontSize: '11.5px', fontWeight: 600, fontFamily: FONT_BODY, textAlign: 'left',
                }}
              >
                {copiado ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
                )}
                {copiado ? 'Enlace copiado' : 'Copiar enlace'}
              </button>
              <div style={{ padding: '10px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', fontSize: '11px', color: '#93A3C4', lineHeight: 1.5 }}>"""
assert s.count(ANCLA_PIE) == 1, "No encontre el pie de la barra lateral."
s = s.replace(ANCLA_PIE, NUEVO_PIE, 1)

# ── 5) Encabezado propio para Matriculas ───────────────────────────────────
ANCLA_BARRA = """            <BarraFiltros
              seccion={SECCIONES.find(s => s.id === seccion)?.label ?? ''}
              oportunidades={d.totales.oportunidades}
              sync={sync}
              filtros={filtros}
              setFiltro={setFiltro}
              onLimpiar={() => setFiltros(FILTROS_INICIALES)}
              onActualizar={() => setSync(horaCorta())}
              mostrarPantallaCompleta={!soloPanel}
              tema={tema}
              onTema={alternarTema}
            />"""
NUEVO_BARRA = """            {/* Matriculas no comparte los filtros del resto del panel: vitrina,
                asesor, periodo, origen y categoria no mueven nada en ese modulo,
                y una barra de controles que no hace nada es peor que no ponerla.
                Se conserva el toggle de tema, que vivia dentro de esa barra. */}
            {seccion === 'matriculas' ? (
              <div style={{ background: CARD, borderBottom: `1px solid ${LINE}`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: FONT, fontSize: '16px', fontWeight: 800, color: INK, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1.15 }}>
                    Matrículas
                  </div>
                  <div style={{ fontSize: '12px', color: DIM }}>
                    De pedido a placa · Panel de demostración
                  </div>
                </div>
                <BotonTema tema={tema} onTema={alternarTema} />
              </div>
            ) : (
            <BarraFiltros
              seccion={SECCIONES.find(s => s.id === seccion)?.label ?? ''}
              oportunidades={d.totales.oportunidades}
              sync={sync}
              filtros={filtros}
              setFiltro={setFiltro}
              onLimpiar={() => setFiltros(FILTROS_INICIALES)}
              onActualizar={() => setSync(horaCorta())}
              mostrarPantallaCompleta={!soloPanel}
              tema={tema}
              onTema={alternarTema}
            />
            )}"""
assert s.count(ANCLA_BARRA) == 1, "No encontre la llamada a BarraFiltros."
s = s.replace(ANCLA_BARRA, NUEVO_BARRA, 1)

assert s != original
io.open(RUTA, "w", encoding="utf-8").write(s)
print("OK - page.tsx parcheado.")
print("Enlaces por modulo: ?seccion=resumen | funnel | asesores | integralidad | vitrinas | matriculas")
print("Revisa con: git diff")
