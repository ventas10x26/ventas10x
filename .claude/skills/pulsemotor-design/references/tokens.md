# Tokens de diseño — Pulse Motor

## Tema: soft (claro, default) / dark

Las 3 páginas públicas de Pulse Motor (`/pulse`, `/pulse/concesionario`, `/pulse/asesor`) tienen un **botón de tema** en el header (`ThemeToggle`, ícono de luna/sol) que alterna entre dos temas completos. **El tema por default es `soft`** (claro) — `dark` es una variante que el usuario elige explícitamente, persistida en `localStorage` (`pulse-theme`) y compartida entre las 3 páginas (si el usuario elige oscuro en el home y navega a `/pulse/concesionario`, esa página también carga en oscuro).

Implementación (`src/app/pulse/_shared/sections.tsx`):
- `usePulseTheme()` — hook que inicializa `theme:'soft'` (coincide con el render de servidor, evita mismatch de hidratación) y lo actualiza desde `localStorage` recién en un `useEffect`.
- Cada página envuelve todo su contenido en `<div className="pulse-theme-root" data-theme={theme}>`. El CSS define los valores soft en `.pulse-theme-root` (sin condición) y los reescribe en `.pulse-theme-root[data-theme='dark']`.
- **Importante**: los valores soft se declaran en `:root` Y en `.pulse-theme-root` a la vez (`:root, .pulse-theme-root { --bg-0:... }`), no solo en `:root`. `layout.tsx` envuelve estas mismas páginas en su propio `.pulse-root` con tokens oscuros fijos para el dashboard autenticado (ver más abajo) — al ser un ancestro más cercano que `:root`, si `.pulse-theme-root` no redeclara los valores soft directamente sobre sí mismo, los heredaría oscuros de ese ancestro en vez de caer en el fallback de `:root`. Cualquier variable de tema nueva debe seguir este mismo patrón (declararse en ambos selectores, o al menos en `.pulse-theme-root` directamente) para no repetir este bug.
- **El header NO usa estos tokens de tema** (ver regla dura 9 en `SKILL.md`) — es una franja fija oscura vía `--header-bg`, que ya no cambia entre soft/dark. Solo el resto de la página (secciones, texto, bordes) reacciona al toggle.

## Color

| Token | Soft (default) | Dark | Uso |
|---|---|---|---|
| `--bg-0` | `#FDFBF7` | `#0B0D0C` | Fondo base de página |
| `--bg-1` | `#FFFFFF` | `#14120F` | Paneles, cards, log |
| `--bg-2` | `#F5F1E9` | `#1B1815` | Elevación secundaria / hover |
| `--bg-3` | `#F7F3EC` | `#241F1A` | Ritmo de sección (`.section-dim`) |
| `--bg-4` | `#F1EAE0` | `#2D2721` | Ritmo de sección (`.section-dim-2`) |
| `--line` | `#E7E0D2` | `#2A2620` | Bordes, divisores, grids compartidos |
| `--ink` | `#1A1712` | `#F3EFE7` | Texto principal |
| `--ink-dim` | `#726B5E` | `#9B958A` | Texto secundario, labels |
| `--blue` | `#2563EB` | `#2563EB` | Acento único de marca — **no cambia con el tema**, lee bien sobre blanco y sobre negro |
| `--blue-2` | `#1D4ED8` | `#1D4ED8` | Extremo oscuro del degradé tonal azul (nunca solo) |
| `--blue-dim` | `#3D5A99` | `#3D5A99` | Variante apagada del acento (bordes/texto secundario con toque de marca) |
| `--red` | `#E5484D` | `#E5484D` | Errores, costos negativos — exclusivo, no es acento de marca ni chip decorativo |

**Retirado en el pivote 2026-07-25**: `--amber`/`--amber-2`/`--amber-dim`/`--grad-amber`/`.grad-amber` (acento anterior) y `--green`/`--green-2`/`--grad-green` (verde exclusivo de estados "en vivo/aprobado"). El sistema es ahora monocromático azul + neutros + rojo de error — no reintroducir un segundo hue de estado.

### Tokens de tema derivados (no solo color base)

Cambiar de tema no es solo recolorear `--bg-*`/`--ink-*` — varios efectos necesitan su propia intensidad por tema, así que viven en variables propias en vez de valores crudos en cada regla:

| Token | Soft | Dark | Uso |
|---|---|---|---|
| `--header-bg` | `#0B0D12` | `#0B0D12` | Fondo del header — fijo, oscuro sólido, **no varía por tema** (ver regla dura 9) |
| `--shadow-lg` | `0 20px 40px rgba(30,24,15,.10), 0 6px 14px rgba(30,24,15,.06)` | `0 24px 48px rgba(0,0,0,.45), 0 8px 16px rgba(0,0,0,.3)` | Elevación hover de seg-card/quote-card/price-card |
| `--shadow-sm` | `0 1px 2px rgba(30,24,15,.05)` | `0 1px 2px rgba(0,0,0,.3)` | Elevación de reposo de grids compartidos |
| `--seg-wash-blue` | wash tenue (alpha .05–.16) | wash saturado (alpha .32–.8) | Degradé de esquina de los segment cards — el mismo wash saturado que se ve intenso en dark quedaría como un bloque de color sólido en soft, por eso la intensidad es un token de tema, no un valor fijo |
| `--seg-badge-border` / `--seg-badge-ink` | `var(--line)` / `var(--ink-dim)` | `rgba(255,255,255,.35)` / `#fff` | Badge de prueba social dentro del seg-card — en dark el wash de fondo es saturado y necesita texto blanco; en soft el wash es casi blanco y el mismo texto blanco sería invisible |
| `--seg-badge-dot` / `--seg-badge-dot-shadow` | `var(--blue)` | `#fff` | Punto pulsante de ese mismo badge (clase `.live-dot.on-tint`) |
| `--seg-hover-ink` | `var(--ink)` | `#fff` | Color del título/subtítulo del seg-card en hover |
| `--hero-mesh` | un `radial-gradient` azul muy tenue, anclado cerca del hero | `none` | Mesh decorativo de fondo, solo en soft (ver abajo) |

### Paneles "pantalla de producto" (`--panel-*`, fijos, nunca cambian con el tema)

El log del hero, el preview de esquema de DataBridge, el preview de WhatsApp, el panel de Cobertura 24/7 y la tabla de auditoría de "Actividad en vivo" — todo lo que lleva la clase `.panel` — son **capturas del producto real**, no parte del lienzo de la página. Por eso usan un set de variables aparte que **siempre** son oscuras, sin importar si la página está en soft o en dark. El header (ver arriba) sigue el mismo criterio con su propio token (`--header-bg`), aunque no está dentro de `.panel`:

```css
--panel-bg:#14120F; --panel-bg-2:#1B1815; --panel-line:#2A2620; --panel-ink:#F3EFE7; --panel-ink-dim:#9B958A;
```

**Regla**: cualquier elemento dentro de un `.panel` (o el propio `.panel`) usa `--panel-*`, nunca `--bg-*`/`--ink-*`/`--line` a secas — si un componente nuevo necesita vivir dentro de un panel, sigue este mismo patrón en vez de heredar los tokens de tema de la página.

### Mesh decorativo (solo soft)

En el tema soft, una mancha radial muy tenue azul aparece detrás del hero de las 3 páginas, vía `background-image:var(--hero-mesh)` en `.pulse-theme-root`. En dark, `--hero-mesh` es `none` (el hero necesita el negro parejo para que el panel de log resalte). No agregar blobs nuevos vía JSX/DOM — es puramente CSS, cambia solo el valor del token.

Degradé de énfasis (cifras clave, palabra de énfasis en titulares, CTA primario):
```css
--grad-blue: linear-gradient(135deg, var(--blue), var(--blue-2));
```

Degradé de "momento en vivo" (fondo de sección "Actividad en vivo", ver "Ritmo de fondo entre secciones" más abajo — nunca para texto ni como acento suelto):
```css
--grad-blue-deep: linear-gradient(135deg, #0B1E4D, var(--blue));
```

### Chips de categoría (excepción acotada, a pedido explícito del usuario)

Inspirados en el grid multicolor de categorías de Platzi. Un color decorativo distinto por ítem, **solo** en el fondo/borde del ícono de grids catalogados (Ecosistema 360°, Cumplimiento y seguridad, Integraciones nativas) — nunca en texto, CTAs, badges de estado ni fondo de sección, que siguen siendo azul/neutro.

El ámbar de la iteración anterior (`#F2A93B`) se reincorpora acá como uno de los cinco chips decorativos, ahora que dejó de ser el acento de marca — evita que la paleta decorativa colisione con el nuevo azul de marca al reusar el mismo hue en dos roles distintos.

| Uso | Hex |
|---|---|
| Vehículos nuevos / Cifrado | `#F2A93B` (ámbar) |
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
| Log del hero: nombre de archivo, timestamps, datos | IBM Plex Mono | 400–500 | según corresponda |
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
| **Actividad en vivo** | `--grad-blue-deep` (degradé `#0B1E4D → #2563EB`, único momento no-negro) | vidrio esmerilado `rgba(10,20,40,.55)` |
| Integraciones nativas | `--bg-2` `#1B1815` | `--bg-3` `#241F1A` |
| Testimonios | `--bg-3` `#241F1A` | `--bg-4` `#2D2721` |
| Precios | `--bg-0` `#0B0D0C` + spotlight azul | `--bg-1` (price-cards) |

Se implementa con clases de scope (`.section-dim`, `.section-dim-2`, `.section-live`) que redefinen `--bg-1`/`--ink`/`--ink-dim`/`--line` (y en `.section-live` también el `background` del propio elemento) en el ancestro de la sección — no hace falta tocar cada componente porque todos ya leen color desde estas variables, y las custom properties de CSS se resuelven en cascada hasta el punto de uso (incluso dentro de otro `var()`, como `--grad-blue`).

### El momento en vivo (`.section-live`)

"Actividad en vivo" eleva el azul de marca a un **degradé de sección completo** — no es un hue nuevo, es la misma marca llevada a escala hero, igual que el propio azul ya tiene su degradé tonal para cifras y énfasis. Reemplazó al degradé verde de la iteración anterior (retirado junto con el resto del verde de estado, ver regla dura 4).

- `--grad-blue-deep: linear-gradient(135deg, #0B1E4D, var(--blue))` — extremo oscuro casi negro-azulado, extremo vivo el propio `--blue`.
- Las celdas/paneles (`grid-shared > *`, `.panel`) flotan como **vidrio esmerilado oscuro** encima del degradé (`--bg-1: rgba(10,20,40,.55)` + `backdrop-filter: blur(10px)`) — así el contenido interno (cifras en degradé azul, estados en azul) sigue leyendo con los tokens normales sin perder contraste contra un fondo que cambia de tono en diagonal.
- El texto que queda directo sobre el degradé (kicker, h2, párrafo, badge) pasa a `--ink:#fff` / `--ink-dim: rgba(255,255,255,.72)` dentro del scope de `.section-live`.
- El punto/cuadrado pulsante de "en vivo" se pierde sobre un fondo azul similar — por eso el badge "Live" de esta sección usa `.live-dot.on-gradient` (blanco fijo, con su propio keyframe `livePulseWhite`, **sin importar el tema** — este fondo siempre es el degradé azul) en vez del indicador azul estándar. No confundir con `.live-dot.on-tint` (usado en el badge de prueba social del seg-card): ese SÍ sigue el tema vía `--seg-badge-dot`, porque el wash de fondo del seg-card cambia de saturado (dark) a tenue (soft) y el punto necesita adaptarse en cada caso.

**Regla**: nunca reordenar esta secuencia sin revisar la dirección de elevación (celda siempre un tono más clara/vidriosa que su sección, tanto en oscuro como en el momento azul) — invertirla hace que las tarjetas se vean "hundidas" en vez de elevadas. El momento en vivo es uno solo (Actividad en vivo): no repetirlo en otra sección, ni usarlo en el hero (necesita el negro para que el panel de log resalte).

## Elevación (sombra neutra, no glow)

```css
/* Reposo */
box-shadow: var(--shadow-sm);
/* Hero panel / segment card / price card: elevación real, elementos protagonistas */
box-shadow: var(--shadow-lg);
```

Usar siempre `var(--shadow-sm)`/`var(--shadow-lg)`, nunca los valores `rgba(0,0,0,...)` crudos — esos tokens ya tienen una intensidad tuneada por tema (más sutil en soft, donde una sombra negra al 45% se ve como un halo oscuro en vez de elevación física; sin cambios en dark, que es donde se afinó originalmente). La única excepción son los paneles "pantalla de producto" (`.panel`, ver arriba) y el header — su sombra/fondo quedan fijos en el valor oscuro original porque no cambian de color entre temas.

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
- Filas de log/auditoría: fade + translateY(6px→0), 0.5s máximo, reveladas en secuencia (una por una) para simular una traza real, no todas a la vez.
- Botones primarios en hover: `translateY(-1px)` + glow azul sutil (`box-shadow: 0 4px 16px rgba(37,99,235,0.35)`).
- Flecha `→` de cierre de CTA: `<span>` separado que desliza `translateX(4px)` en hover del link/botón padre (`a:hover .btn-arrow`) — refuerza la dirección de la acción sin depender de color.
- Elementos catalogados (grid 01–05, integraciones, quote-cards, filas de auditoría): `translateY(-3px/-4px)` sutil en hover + realce de fondo/borde — invita a explorar sin necesitar leer instrucciones.
- Nav del header: subrayado azul que crece de 0 a 100% de ancho en hover (no color por defecto en inline style — la clase controla el color para que el hover funcione). El header en sí es siempre oscuro (ver regla dura 9), así que el texto de nav es blanco/gris claro en reposo, azul en hover/activo.
- Fila de logos: marquee horizontal continuo (`translateX` en loop, contenido duplicado 2x, `mask-image` en los bordes) en vez de fila estática — refuerza "en vivo" sin ser parallax ni scroll-jacking.
- CTA final: fondo `radial-gradient` azul muy tenue (`rgba(37,99,235,0.10)`) detrás del bloque de precio — vitrina/spotlight que dirige la mirada al último CTA sin usar glow sobre el texto o el botón.
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

`src/hooks/useCountUp.ts` anima solo la parte numérica de un valor tipo `"147"`, `"99.8%"`. Se dispara con el mismo booleano `inView` de un `useReveal` del grupo contenedor. Solo para cifras reales (leads, retomas, pólizas, conversión, precisión).

### Log vertical de pasos del agente (elemento de firma, `PulseAgentLog`)

El componente más distintivo de la marca: una traza legible de lo que el agente resolvió en un caso real, no una lista de features ni nombres de función de código.

```
📧 pulse_agent_v4.2.log                                    ···

  👤  Entrada de Lead
      Detectado: WhatsApp Business
   │
  🤖  Análisis de Perfil IA                    ← paso activo, fondo resaltado
      Calificación: Alta intención (Financiación)
   │
  ➤   Distribución Inteligente
      Asignado a: Asesor Senior (Grupo A)

  ■ SISTEMA EN LÍNEA                              99.8%  PRECISIÓN
```

- Barra de título: ícono + nombre de archivo en `IBM Plex Mono`, 3 puntos decorativos a la derecha (no funcionales).
- Cada paso: ícono en caja azul-tenue (`background:${blue}1a; border:1px solid ${blue}40`), título en Inter semibold, subtítulo en Inter regular color `--panel-ink-dim` con el dato real resuelto.
- Línea vertical continua (`border-left:2px solid var(--panel-line)`) conectando los íconos — no punteada (la línea punteada queda para la "pista" del auto en el hero de home, ver abajo, si se mantiene).
- El paso activo/central lleva `background:var(--panel-bg-2)` y un borde levemente más marcado para leerse como "esto es lo que está pasando ahora", el resto en `var(--panel-bg)`.
- Barra de estado inferior: banda `var(--panel-bg-2)` o más oscura, ancho completo, indicador cuadrado azul + "SISTEMA EN LÍNEA" en mono a la izquierda, cifra real en azul + etiqueta en mono a la derecha.
- Se revela paso por paso (stagger ~150–200ms), reusando el mismo patrón de reveal que el resto del sistema.

### Barrido del agente (radar sweep)

```css
.guard-sweep { position:relative; }
.guard-sweep::before {
  content:''; position:absolute; inset:-60%; z-index:-1; border-radius:50%;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(37,99,235,0.18) 18deg, transparent 50deg);
  animation: guardSweep 9s linear infinite;
}
@keyframes guardSweep { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .guard-sweep::before { animation:none; opacity:.5; } }
```

Detrás del badge "Agente activo · 24/7/365", refuerza "siempre encendido", nunca más de 1–2 instancias por vista.
