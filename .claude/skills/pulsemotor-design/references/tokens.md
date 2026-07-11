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

```html

```

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
- Siempre con `@media (prefers-reduced-motion: reduce)`.
