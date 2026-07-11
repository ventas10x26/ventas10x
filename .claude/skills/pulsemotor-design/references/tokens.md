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
| `--amber-dim` | `#8A6423` | Variante apagada del acento |
| `--green` | `#3ECF7E` | EXCLUSIVO para activo/en vivo/ok |

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
