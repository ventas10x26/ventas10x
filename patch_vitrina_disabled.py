# patch_vitrina_disabled.py — deshabilita el filtro de Vitrina cuando hay un
# asesor seleccionado, y muestra su sede en gris en vez de dejar la eleccion
# del usuario sin efecto en silencio.
#
# Correr desde la raiz del repo:   python patch_vitrina_disabled.py
#
# POR QUE. calcularDemoFiltrado en datos.ts fija la sede efectiva a la del
# asesor cuando hay uno elegido ("const sedeEfectiva = asesor ? asesor.sede :
# f.sede"), sin importar lo que diga el dropdown de Vitrina. La regla de
# negocio es correcta -- un asesor pertenece a una sede, filtrar "Asesor 03 en
# Sede Sur" no tiene sentido -- pero el panel no lo comunicaba: el dropdown
# seguia abierto y clickeable, y el usuario veia que los numeros no se movian
# sin saber por que.
#
# Este patch NO toca la logica de calculo (esta bien como esta). Solo hace que
# la interfaz refleje la regla que ya existe: con un asesor activo, Vitrina se
# ve fija y en gris, mostrando la sede de ese asesor.
#
# Toca un solo archivo (src/app/pulse/demo/page.tsx). Idempotente.

import io, os, sys

RUTA = os.path.join("src", "app", "pulse", "demo", "page.tsx")

if not os.path.exists(RUTA):
    sys.exit(f"No encuentro {RUTA}. Corre este script desde la raiz del repo.")

s = io.open(RUTA, encoding="utf-8").read()
original = s

if "disabled?: boolean" in s:
    sys.exit("El patch ya esta aplicado. Nada que hacer.")

# ── 1) SelectFiltro acepta un prop `disabled` ──────────────────────────────
VIEJA_FIRMA = """function SelectFiltro({ valor, onChange, opciones }: {
  valor: string
  onChange: (v: string) => void
  opciones: { id: string; label: string }[]
}) {
  const [abierto, setAbierto] = useState(false)"""
NUEVA_FIRMA = """function SelectFiltro({ valor, onChange, opciones, disabled, disabledLabel }: {
  valor: string
  onChange: (v: string) => void
  opciones: { id: string; label: string }[]
  // Vitrina se deshabilita cuando hay un asesor elegido: la sede efectiva pasa
  // a ser la del asesor (ver calcularDemoFiltrado en datos.ts) y dejar el
  // dropdown clickeable haria creer que la eleccion tiene efecto cuando no lo
  // tiene.
  disabled?: boolean
  disabledLabel?: string
}) {
  const [abierto, setAbierto] = useState(false)"""
assert s.count(VIEJA_FIRMA) == 1, "No encontre la firma de SelectFiltro."
s = s.replace(VIEJA_FIRMA, NUEVA_FIRMA, 1)

# El boton no abre la lista si esta deshabilitado, y el texto muestra la
# etiqueta fija en vez del valor del filtro (que en ese estado no gobierna nada).
VIEJO_BOTON = """      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          width: '100%', padding: 0, border: 'none', background: 'transparent',
          fontSize: '14px', fontWeight: 600, color: INK, fontFamily: FONT_BODY,
          cursor: 'pointer', textAlign: 'left', minWidth: 0,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {actual?.label ?? '—'}
        </span>
        {/* El color va por style y no por atributo: en atributo de presentación, var() no
            es confiable en todos los navegadores. */}
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, color: DIM, transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>"""
NUEVO_BOTON = """      <button
        type="button"
        onClick={() => { if (!disabled) setAbierto(a => !a) }}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-disabled={disabled}
        disabled={disabled}
        title={disabled ? 'Fijada por el asesor seleccionado' : undefined}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          width: '100%', padding: 0, border: 'none', background: 'transparent',
          fontSize: '14px', fontWeight: 600, color: disabled ? MUTED : INK, fontFamily: FONT_BODY,
          cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left', minWidth: 0,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {disabled ? (disabledLabel ?? actual?.label ?? '—') : (actual?.label ?? '—')}
        </span>
        {/* Con el filtro fijo, la flecha se reemplaza por un candado: la forma
            distinta evita que alguien confunda "sin opciones abajo" con
            "deshabilitado", que son dos estados distintos. */}
        {disabled ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        ) : (
          /* El color va por style y no por atributo: en atributo de presentación, var() no
              es confiable en todos los navegadores. */
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, color: DIM, transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>"""
assert s.count(VIEJO_BOTON) == 1, "No encontre el boton de SelectFiltro."
s = s.replace(VIEJO_BOTON, NUEVO_BOTON, 1)

# ── 2) Uso en Vitrina: deshabilitado cuando hay asesor, mostrando su sede ───
VIEJO_USO = """        <CampoFiltro titulo="Vitrina">
          <SelectFiltro
            valor={filtros.sede}
            onChange={v => setFiltro('sede', v as SedeId)}
            opciones={SEDES_OPCIONES.map(s => ({ id: s.id, label: s.label }))}
          />
        </CampoFiltro>"""
NUEVO_USO = """        <CampoFiltro titulo="Vitrina">
          <SelectFiltro
            valor={filtros.sede}
            onChange={v => setFiltro('sede', v as SedeId)}
            opciones={SEDES_OPCIONES.map(s => ({ id: s.id, label: s.label }))}
            disabled={filtros.asesor !== 'todos'}
            disabledLabel={SEDES_OPCIONES.find(s => s.id === sedeEfectiva)?.label}
          />
        </CampoFiltro>"""
assert s.count(VIEJO_USO) == 1, "No encontre el uso de SelectFiltro para Vitrina."
s = s.replace(VIEJO_USO, NUEVO_USO, 1)

# ── 3) BarraFiltros necesita recibir sedeEfectiva para poder mostrarla ─────
VIEJA_PROPS_TIPO = """  filtros: FiltrosDemo
  setFiltro: <K extends keyof FiltrosDemo>(k: K, v: FiltrosDemo[K]) => void
  onLimpiar: () => void
  onActualizar: () => void
  mostrarPantallaCompleta: boolean
  tema: Tema
  onTema: () => void
}) {"""
NUEVA_PROPS_TIPO = """  filtros: FiltrosDemo
  setFiltro: <K extends keyof FiltrosDemo>(k: K, v: FiltrosDemo[K]) => void
  onLimpiar: () => void
  onActualizar: () => void
  mostrarPantallaCompleta: boolean
  tema: Tema
  onTema: () => void
  sedeEfectiva: SedeId
}) {"""
assert s.count(VIEJA_PROPS_TIPO) == 1, "No encontre el tipo de props de BarraFiltros."
s = s.replace(VIEJA_PROPS_TIPO, NUEVA_PROPS_TIPO, 1)

VIEJA_PROPS_DESTR = """function BarraFiltros({
  seccion, oportunidades, sync, filtros, setFiltro, onLimpiar, onActualizar, mostrarPantallaCompleta,
  tema, onTema,
}: {"""
NUEVA_PROPS_DESTR = """function BarraFiltros({
  seccion, oportunidades, sync, filtros, setFiltro, onLimpiar, onActualizar, mostrarPantallaCompleta,
  tema, onTema, sedeEfectiva,
}: {"""
assert s.count(VIEJA_PROPS_DESTR) == 1, "No encontre la desestructuracion de props de BarraFiltros."
s = s.replace(VIEJA_PROPS_DESTR, NUEVA_PROPS_DESTR, 1)

# ── 4) Pasar sedeEfectiva al invocar BarraFiltros ──────────────────────────
VIEJA_LLAMADA = """            <BarraFiltros
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
NUEVA_LLAMADA = """            <BarraFiltros
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
              sedeEfectiva={sedeEfectiva}
            />
            )}"""
assert s.count(VIEJA_LLAMADA) == 1, "No encontre la llamada a BarraFiltros."
s = s.replace(VIEJA_LLAMADA, NUEVA_LLAMADA, 1)

assert s != original
io.open(RUTA, "w", encoding="utf-8").write(s)
print("OK - page.tsx parcheado.")
print("Con un asesor seleccionado, Vitrina queda fija y en gris, mostrando su sede.")
print("Revisa con: git diff")
