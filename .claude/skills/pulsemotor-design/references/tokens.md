# Tokens de diseño — Pulse Motor

## Color

| Token | Hex | Uso |
|---|---|---|
| `--bg-0` | `#0B0D0C` | Fondo base de página |
| `--bg-1` | `#14120F` | Paneles, cards, bitácora |
| `--bg-2` | `#1B1815` | Elevación secundaria |
| `--line` | `#2A2620` | Bordes, divisores, grids compartidos |
| `--ink` | `#F3EFE7` | Texto principal (blanco cálido) |
| `--ink-dim` | `#9B958A` | Texto secundario, labels |
| `--amber` | `#F2A93B` | Acento único de marca |
| `--amber-2` | `#C9770B` | Extremo oscuro del degradé tonal ámbar (nunca solo — siempre junto a `--amber`) |
| `--amber-dim` | `#8A6423` | Variante apagada del acento |
| `--green` | `#3ECF7E` | EXCLUSIVO para activo/en vivo/ok |

Degradé de énfasis (cifras clave, palabra de énfasis en titulares, CTA primario):
```css
--grad-amber: linear-gradient(135deg, var(--amber), var(--amber-2));
```

## Tipografía

| Rol | Familia | Peso |
|---|---|---|
| Display / H1 / H2 | Oswald | 500–700, uppercase |
| Datos / timestamps / tags | IBM Plex Mono | 400–500 |
| Cuerpo / UI | Inter | 400–600 |

Cargadas con `next/font/google` en `src/app/pulse/layout.tsx` (autohospedadas, no runtime):

```tsx
import { Oswald, IBM_Plex_Mono, Inter } from 'next/font/google'
const oswald = Oswald({ subsets:['latin'], weight:['500','600','700'], variable:'--font-oswald', display:'swap' })
const ibmPlexMono = IBM_Plex_Mono({ subsets:['latin'], weight:['400','500'], variable:'--font-mono', display:'swap' })
const inter = Inter({ subsets:['latin'], weight:['400','500','600'], variable:'--font-inter', display:'swap' })
// className={`pulse-root ${oswald.variable} ${ibmPlexMono.variable} ${inter.variable}`} en el wrapper del layout
```

Consumidas en componentes como `fontFamily: "var(--font-oswald), sans-serif"` (nunca el string literal `'Oswald'` — eso es lo que causó que la fuente no cargara en producción una vez).

## Espaciado y forma

- Radio: 3px (tags) → 6px (paneles) → 8px (bloques grandes). Nunca más de 8px.
- Secciones: `padding: 120px 6vw` desktop, ~64px mobile.
- Grids comparten borde 1px entre celdas:

```css
.grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border:1px solid var(--line); }
.grid > *{ background:var(--bg-1); }
```

- **No repetir la misma composición en secciones consecutivas** (ver regla dura 5): alternar grid uniforme, split asimétrico (lista + panel fijo), y "un elemento protagonista + acompañantes menores".

## Elevación (sombra neutra, no glow)

Sombra neutra grande y suave para que un panel se sienta físicamente elevado — distinto del glow ámbar (que solo va en hover de CTA primario):

```css
/* Reposo: casi nada, el panel vive "en la superficie" */
box-shadow: 0 1px 2px rgba(0,0,0,0.3);
/* Hover / elemento protagonista (ej. price card): elevación real */
box-shadow: 0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3);
```

## Escala tipográfica

| Rol | Tamaño (desktop) | Peso/tracking |
|---|---|---|
| H1 hero | `clamp(48px, 7vw, 92px)` | 700, tracking negativo leve pese a ser uppercase condensada |
| H2 sección | `clamp(32px, 4.5vw, 56px)` | 700 |
| H3 / sub-bloque | `clamp(20px, 2.2vw, 26px)` | 600 |
| Cuerpo destacado (lede) | `18–20px` | 400, `line-height:1.6` |
| Cuerpo | `15–16px` | 400 |

El H1 del hero debe ser visiblemente el elemento tipográfico más grande de toda la página — si un H2 de sección se acerca a su tamaño, subir el H1.

## Motion

- Pulso "en vivo": box-shadow expandiéndose/desvaneciendo cada 2s.
- Filas de bitácora: fade + translateY(6px→0), 0.5s máximo.
- Botones primarios (`.pm-btn`) en hover: `translateY(-1px)` + glow ámbar sutil (`box-shadow: 0 4px 16px rgba(242,169,59,0.35)`).
- Siempre con `@media (prefers-reduced-motion: reduce)`.

### Revelado por scroll (`useReveal`)

Un solo hook (`src/hooks/useReveal.ts`), reusado en toda la home en vez de una animación distinta por sección:

```ts
const { ref, inView } = useReveal<HTMLDivElement>()
// <div ref={ref} className={`reveal${inView ? ' in' : ''}`}>
```

```css
.reveal { opacity:0; transform:translateY(16px); transition:opacity .6s ease, transform .6s ease; }
.reveal.in { opacity:1; transform:translateY(0); }
```

Para grids/listas, un solo `useReveal` por grupo (no uno por celda) + `transitionDelay` escalonado (~100–150ms) por índice al aplicar la clase a cada celda hija. Filas de bitácora reusan el mismo patrón con offset más chico (6px, 0.5s) por tratarse de una lista densa, no de un bloque de sección.

### Cuentas ascendentes (`useCountUp`)

`src/hooks/useCountUp.ts` anima solo la parte numérica de un valor tipo `"47"`, `"89%"` (parsea el string, anima el número, conserva el sufijo). Se dispara con el mismo booleano `inView` de un `useReveal` del grupo contenedor — nunca standalone ni en un timer propio. Solo para cifras reales (leads, tasa de respuesta, citas); no es un efecto de texto genérico.

### Barrido de guardia (radar sweep)

```css
.guard-sweep { position:relative; }
.guard-sweep::before {
  content:''; position:absolute; inset:-40%; z-index:-1; border-radius:50%;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(242,169,59,0.16) 15deg, transparent 45deg);
  animation: guardSweep 10s linear infinite;
}
@keyframes guardSweep { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .guard-sweep::before { animation:none; opacity:.4; } }
```

Usar detrás del badge "turno activo" (`position:relative` en el badge, el `::before` queda detrás por `z-index:-1`) y, con moderación, en algún otro punto de "vigilancia" — nunca más de 1–2 instancias por vista para que siga leyéndose como un detalle de marca, no como fondo genérico animado.
