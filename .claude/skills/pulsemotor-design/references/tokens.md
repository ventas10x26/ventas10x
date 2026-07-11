# Tokens de diseño — Pulse Motor

## Color

| Token | Hex | Uso |
|---|---|---|
| `--bg-0` | `#0B0D0C` | Fondo base de página |
| `--bg-1` | `#14120F` | Paneles, cards, timeline |
| `--bg-2` | `#1B1815` | Elevación secundaria / hover |
| `--line` | `#2A2620` | Bordes, divisores, grids compartidos |
| `--ink` | `#F3EFE7` | Texto principal (blanco cálido) |
| `--ink-dim` | `#9B958A` | Texto secundario, labels |
| `--amber` | `#F2A93B` | Acento único de marca |
| `--amber-2` | `#C9770B` | Extremo oscuro del degradé tonal ámbar (nunca solo) |
| `--amber-dim` | `#8A6423` | Variante apagada del acento |
| `--green` | `#3ECF7E` | EXCLUSIVO para activo/en vivo/aprobado |
| `--green-2` | `#0F3D2B` | Extremo oscuro del degradé de "Actividad en vivo" (nunca solo) |
| `--red` | `#E5484D` | Errores, costos negativos |

Degradé de énfasis (cifras clave, palabra de énfasis en titulares, CTA primario):
```css
--grad-amber: linear-gradient(135deg, var(--amber), var(--amber-2));
```

Degradé de "momento en vivo" (fondo de sección, ver "Ritmo de fondo entre secciones" más abajo — nunca para texto ni como acento suelto):
```css
--grad-green: linear-gradient(135deg, var(--green-2), var(--green));
```

### Chips de categoría (excepción acotada, a pedido explícito del usuario)

Inspirados en el grid multicolor de categorías de Platzi. Un color decorativo distinto por ítem, **solo** en el fondo/borde del ícono de grids catalogados (Ecosistema 360°, Cumplimiento y seguridad) — nunca en texto, CTAs, badges de estado ni fondo de sección, que siguen siendo ámbar/verde/neutro.

| Uso | Hex |
|---|---|
| Vehículos nuevos / Cifrado | `#4C8DFF` (azul) |
| Financiación / Datos LatAm | `#A78BFA` (violeta) |
| Accesorios / WhatsApp API | `#2DD4BF` (teal) |
| Retomas / Habeas Data | `#FB7185` (rosa) |
| Pólizas / Auditoría | `#818CF8` (índigo) |

Se aplica como fondo translúcido + borde sobre el propio color, usando sufijos de alpha en hex de 8 dígitos:
```css
background: ${chip}22;  /* ~13% opacidad */
border: 1px solid ${chip}55;  /* ~33% opacidad */
```

## Tipografía

| Rol | Familia | Peso | Case |
|---|---|---|---|
| H1 hero / H2 sección | Inter | 700–800 | **Minúscula/mixta**, nunca uppercase |
| Timeline / timestamps / nombres de función (`tasar_retoma`) | IBM Plex Mono | 400–500 | según corresponda |
| Tags / kickers / labels de sección | IBM Plex Mono | 500 | uppercase, letter-spacing |
| Cuerpo / UI | Inter | 400–600 | mixta |

Cargadas con `next/font/google` en `src/app/pulse/layout.tsx` (autohospedadas, no runtime):

```tsx
import { Oswald, IBM_Plex_Mono, Inter } from 'next/font/google'
const oswald = Oswald({ subsets:['latin'], weight:['500','600','700'], variable:'--font-oswald', display:'swap' })
const ibmPlexMono = IBM_Plex_Mono({ subsets:['latin'], weight:['400','500'], variable:'--font-mono', display:'swap' })
const inter = Inter({ subsets:['latin'], weight:['400','500','600','700','800'], variable:'--font-inter', display:'swap' })
// className={`pulse-root ${oswald.variable} ${ibmPlexMono.variable} ${inter.variable}`} en el wrapper del layout
```

Consumidas como `fontFamily: "var(--font-inter), sans-serif"` (nunca el string literal `'Inter'`). Oswald sigue cargado por retrocompatibilidad con otras páginas de `/pulse/**`, pero **la home ya no lo usa para titulares** — el arquetipo "copiloto 360°" usa Inter bold en minúscula, no la condensada uppercase de la iteración "turno/guardia".

## Espaciado y forma

- Radio: 3px (tags) → 6px (paneles) → 8px (bloques grandes). Nunca más de 8px.
- Secciones: `padding: 120px 6vw` desktop, ~64px mobile.
- Grids catalogados comparten borde 1px entre celdas:

```css
.grid{ display:grid; grid-template-columns:repeat(5,1fr); gap:1px; background:var(--line); border:1px solid var(--line); }
.grid > *{ background:var(--bg-1); }
```

- **No repetir la misma composición en secciones consecutivas**: alternar grid catalogado (01–05), split de 2 segment cards, stats+tabla, grid de integraciones, testimonios.

## Ritmo de fondo entre secciones

La home ya no es 100% negro parejo. Se alterna en este orden fijo (hero → footer):

| Sección | Fondo | Tarjetas/celdas |
|---|---|---|
| Hero, logos, ecosistema, segmentos | `--bg-0` `#0B0D0C` | `--bg-1` `#14120F` |
| **Actividad en vivo** | `--grad-green` (degradé `#0F3D2B → #3ECF7E`, único momento no-negro) | vidrio esmerilado `rgba(6,20,14,.55)` |
| Integraciones nativas | `--bg-2` `#1B1815` | `--bg-3` `#241F1A` |
| Testimonios | `--bg-3` `#241F1A` | `--bg-4` `#2D2721` |
| Precios | `--bg-0` `#0B0D0C` + spotlight ámbar | `--bg-1` (price-cards) |

Se implementa con clases de scope (`.section-dim`, `.section-dim-2`, `.section-live`) que redefinen `--bg-1`/`--ink`/`--ink-dim`/`--line` (y en `.section-live` también el `background` del propio elemento) en el ancestro de la sección — no hace falta tocar cada componente porque todos ya leen color desde estas variables, y las custom properties de CSS se resuelven en cascada hasta el punto de uso (incluso dentro de otro `var()`, como `--grad-amber`).

### El momento en vivo (`.section-live`)

"Actividad en vivo" eleva el verde de estado (ya usado en el punto pulsante y en `aprobado/confirmado/cerrado`) a un **degradé de sección completo** — no es un hue nuevo, es la misma semántica de "activo/en vivo" llevada a escala hero, igual que el ámbar ya tiene su propio degradé para el hero. Reemplazó una versión anterior con fondo claro tipo papel que no funcionaba con la marca.

- `--grad-green: linear-gradient(135deg, var(--green-2), var(--green))` — `--green-2:#0F3D2B` (extremo oscuro), `--green:#3ECF7E` (extremo vivo).
- Las celdas/paneles (`grid-shared > *`, `.panel`) flotan como **vidrio esmerilado oscuro** encima del degradé (`--bg-1: rgba(6,20,14,.55)` + `backdrop-filter: blur(10px)`) — así el contenido interno (cifras en degradé ámbar, estados en verde/ámbar) sigue leyendo con los tokens normales sin perder contraste contra un fondo que cambia de tono en diagonal.
- El texto que queda directo sobre el degradé (kicker, h2, párrafo, badge) pasa a `--ink:#fff` / `--ink-dim: rgba(255,255,255,.72)` dentro del scope de `.section-live`.
- El punto pulsante verde se pierde sobre un fondo verde — por eso el badge "Live" de esta sección usa `.live-dot.on-gradient` (blanco, con su propio keyframe `livePulseWhite`) en vez del punto verde estándar.

**Regla**: nunca reordenar esta secuencia sin revisar la dirección de elevación (celda siempre un tono más clara/vidriosa que su sección, tanto en oscuro como en el momento verde) — invertirla hace que las tarjetas se vean "hundidas" en vez de elevadas. El momento en vivo es uno solo (Actividad en vivo): no repetirlo en otra sección, ni usarlo en el hero (necesita el negro para que el panel de conversación resalte).

## Elevación (sombra neutra, no glow)

```css
/* Reposo */
box-shadow: 0 1px 2px rgba(0,0,0,0.3);
/* Hero panel / segment card / price card: elevación real, elementos protagonistas */
box-shadow: 0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3);
```

## Escala tipográfica

| Rol | Tamaño (desktop) | Peso |
|---|---|---|
| H1 hero | `clamp(44px, 7vw, 88px)` | 800, mixta, sin uppercase |
| H2 sección | `clamp(30px, 4vw, 52px)` | 700–800, mixta |
| H3 / sub-bloque | `clamp(20px, 2.2vw, 26px)` | 600–700 |
| Cuerpo destacado (lede) | `17–19px` | 400, `line-height:1.6` |
| Cuerpo | `14–15px` | 400 |

El H1 del hero debe ser visiblemente el elemento tipográfico más grande de toda la página.

## Motion

- Pulso "en vivo": box-shadow expandiéndose/desvaneciendo cada 2s.
- Filas de timeline/auditoría: fade + translateY(6px→0), 0.5s máximo, reveladas en secuencia (una por una) para simular una traza de ejecución real, no todas a la vez.
- Botones primarios en hover: `translateY(-1px)` + glow ámbar sutil (`box-shadow: 0 4px 16px rgba(242,169,59,0.35)`).
- Flecha `→` de cierre de CTA: `<span>` separado que desliza `translateX(4px)` en hover del link/botón padre (`a:hover .btn-arrow`) — refuerza la dirección de la acción sin depender de color.
- Elementos catalogados (grid 01–05, integraciones, quote-cards, filas de auditoría): `translateY(-3px/-4px)` sutil en hover + realce de fondo/borde — invita a explorar sin necesitar leer instrucciones.
- Nav del header: subrayado ámbar que crece de 0 a 100% de ancho en hover (no color por defecto en inline style — la clase controla el color para que el hover funcione).
- Fila de logos: marquee horizontal continuo (`translateX` en loop, contenido duplicado 2x, `mask-image` en los bordes) en vez de fila estática — refuerza "en vivo" sin ser parallax ni scroll-jacking.
- CTA final: fondo `radial-gradient` ámbar muy tenue (`rgba(242,169,59,0.10)`) detrás del bloque de precio — vitrina/spotlight que dirige la mirada al último CTA sin usar glow sobre el texto o el botón.
- Siempre con `@media (prefers-reduced-motion: reduce)` — incluyendo el marquee de logos y el rebote del scroll-cue.

### Revelado por scroll (`useReveal`)

```ts
const { ref, inView } = useReveal<HTMLDivElement>()
// <div ref={ref} className={`reveal${inView ? ' in' : ''}`}>
```

```css
.reveal { opacity:0; transform:translateY(28px) scale(.98); transition:opacity .8s var(--ease-out-expo), transform .8s var(--ease-out-expo); }
.reveal.in { opacity:1; transform:translateY(0) scale(1); }
```

Para grids/listas, un solo `useReveal` por grupo + `transitionDelay` escalonado (~100–150ms) por índice.

### Cuentas ascendentes (`useCountUp`)

`src/hooks/useCountUp.ts` anima solo la parte numérica de un valor tipo `"147"`, `"89%"`. Se dispara con el mismo booleano `inView` de un `useReveal` del grupo contenedor. Solo para cifras reales (leads, retomas, pólizas, conversión).

### Timeline de tool-calls (elemento de firma)

El componente más distintivo de la marca: una traza de ejecución del agente, no una lista de features.

```
tasar_retoma          18ms   ✓
calcular_financiacion 12ms   ✓
cotizar_poliza         9ms   ✓
reservar_inventario    7ms   ✓
```

- Nombre de función en `IBM Plex Mono`, minúsculas con guion bajo (estilo identificador de código real).
- Tiempo de ejecución alineado a la derecha, también en mono.
- Se revela fila por fila (no todas a la vez) para leerse como una traza real, no una lista estática — reusar el mismo patrón de reveal que las filas de auditoría, con stagger más rápido (~120–150ms) porque simula ejecución, no lectura.

### Barrido del agente (radar sweep)

```css
.guard-sweep { position:relative; }
.guard-sweep::before {
  content:''; position:absolute; inset:-60%; z-index:-1; border-radius:50%;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(242,169,59,0.18) 18deg, transparent 50deg);
  animation: guardSweep 9s linear infinite;
}
@keyframes guardSweep { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .guard-sweep::before { animation:none; opacity:.5; } }
```

Detrás del badge "Agente activo · 24/7/365" — refuerza "siempre encendido", nunca más de 1–2 instancias por vista.
