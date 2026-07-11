---
name: pulsemotor-design
description: Sistema de diseño y lineamientos de marca de Pulse Motor (pulsemotor.co), un agente de IA por WhatsApp para asesores de venta de carros en LatAm. Usar esta skill SIEMPRE que se construya, edite o revise cualquier UI, landing page, componente, email o pieza visual de Pulse Motor — incluso si el usuario no menciona "diseño" explícitamente, solo pide "una sección nueva", "un componente", "el hero", "la pricing page", etc. También usar si el usuario pregunta por la paleta, tipografía, tono de copy o el "arquetipo" de la marca. NO usar para Ventas10x.co ni para Almotores — es un sistema de marca distinto y específico de Pulse Motor.
---

# Pulse Motor — Sistema de diseño

## El arquetipo: el turno / la guardia

Pulse Motor no es "un chatbot de IA" genérico. Es un agente que cubre el turno de un asesor de ventas de carros cuando el asesor no puede estar — de noche, en fin de semana, mientras atiende a otro cliente en el concesionario.

**Todo el lenguaje visual y de copy se ancla en el mundo del turno/guardia/despacho**, no en el mundo genérico de "SaaS de IA":

- Bitácora, relevo, guardia, turno activo, cierre de turno, reporte, sello/stamp, cobertura
- NUNCA: "dashboard", "asistente virtual", partículas flotantes, glow ambiental, mockups de celular como protagonista, iconografía de robot/chip/cerebro, cubos 3D decorativos

Antes de diseñar cualquier pieza nueva, preguntate: *¿esto se siente como un tablero de control de guardia que nunca duerme, o se siente como cualquier landing de IA?* Si es lo segundo, hay que rehacerlo.

**`src/app/pulse/page.tsx` ya implementa este arquetipo** (junto con `SegmentSelector.tsx` y `PulseContactModal.tsx`) — tratalo como la implementación canónica real, junto con `assets/reference-page.html` como catálogo de patrones aislado. Si en algún momento ves ahí fondo con gradiente, cubo 3D o mockup de celular como protagonista, es una regresión al diseño anterior, no el estado correcto — hay que revertirlo, no tomarlo como referencia.

## Reglas duras (no negociables)

1. **Nunca usar numeración decorativa (01/02/03)** salvo que el contenido sea un proceso secuencial real. Preferir sellos de check (`✓ PASO 1`), timestamps, o etiquetas de estado.
2. **Nunca** glow ambiental gratuito, partículas, cubos 3D decorativos, ni mockup de teléfono como elemento hero principal. El WhatsApp es la prueba, no el protagonista.
3. **El movimiento es funcional**, no decorativo: una bitácora que se actualiza como log real, un pulso de "en vivo", timing real de conversación. Una sola secuencia orquestada por sección, no efectos dispersos. En la home, cada sección (encabezado + su grid/lista) se revela al entrar en el viewport usando el hook compartido `useReveal` (`src/hooks/useReveal.ts`, IntersectionObserver + fade/translateY) — no inventar un mecanismo de scroll-reveal nuevo por sección. Las métricas reales (leads, tasa de respuesta, citas) cuentan hacia arriba al revelarse con `useCountUp` (`src/hooks/useCountUp.ts`) — es refuerzo del dato, no un efecto decorativo, así que no se agrega a texto que no sea una cifra real.
4. **Un solo acento de color** (ámbar de señal). El verde es exclusivamente para estados on/off — nunca como acento decorativo. Nada de gradientes como acento de marca.
5. Respetar `prefers-reduced-motion` en todo componente animado.

## Tokens de diseño

Ver `references/tokens.md` para la tabla completa. Resumen rápido:

- **Color:** negro cálido `#0B0D0C` / `#14120F` / `#1B1815` de base, ámbar de señal `#F2A93B` como único acento, verde `#3ECF7E` solo para "activo/en vivo".
- **Tipografía:** Oswald (condensada, uppercase) para titulares y headers de sección · IBM Plex Mono para timestamps, tags y cualquier dato · Inter para cuerpo de texto. Se cargan con `next/font/google` en `src/app/pulse/layout.tsx` (autohospedadas en build time), expuestas como `--font-oswald` / `--font-mono` / `--font-inter`. **No** uses un `<link>` a Google Fonts en runtime ni `@import` en un `<style>` — es frágil y en producción puede no cargar la fuente (ya pasó una vez).
- **Bordes/radios:** rectos y contenidos, radio 3–8px máximo.
- **Grids de contenido:** bordes de 1px compartidos entre celdas (`gap:1px` con `background:var(--line)`) en vez de cards flotantes con sombra.

## Elementos de firma (signature elements)

- **Badge de turno activo**: punto verde con pulso + "TURNO ACTIVO" + reloj en vivo + ubicación.
- **Bitácora en vivo**: panel de eventos con timestamp, quién, qué pasó, y tag de estado — reemplaza cualquier "feed de actividad" o mockup de chat genérico.
- **Reportes de cierre de turno**: testimonios en formato de reporte con hora + sede + estado "cerrado".
- **Relevo de turno**: pasos de onboarding enmarcados como protocolo de entrega de guardia.
- **Revelado progresivo por scroll**: cada sección se descubre al bajar (encabezado primero, luego su grid/lista con stagger de ~100–150ms entre celdas) vía `useReveal`. Las cifras reales cuentan hacia arriba con `useCountUp` al revelarse. Es el mecanismo que hace sentir la home como "un sistema que vas descubriendo", no una landing estática — no reemplazar por scroll-jacking, parallax, ni librerías de animación nuevas (no hay `framer-motion` ni similar en el proyecto; si hiciera falta algo más avanzado, decilo antes de agregar una dependencia).

## Copy y tono

- Verbos activos, en segunda persona ("vos"), directo.
- Vocabulario que el asesor reconoce de su propio trabajo (turno, guardia, relevo, cierre), nunca jerga de sistema.
- Nunca adjetivos vacíos ("revolucionario", "next-gen"). Específico: "responde en 30 segundos", no "respuestas instantáneas con IA de última generación".

## Cómo trabajar con esta skill

1. Leé `references/tokens.md` para valores exactos antes de construir cualquier pieza.
2. Mirá `assets/reference-page.html` como catálogo estático de patrones de CSS (grids con `gap:1px`, la bitácora, los sellos), y `src/app/pulse/page.tsx` como la implementación real con estado/hooks — para revelado por scroll y cuentas ascendentes, reusá `useReveal`/`useCountUp` en vez de reinventarlos.
3. Si el pedido choca con una regla dura (ej. "agregale un glow" o "ponele partículas"), decilo explícitamente y proponé la alternativa funcional en vez de aplicarlo en silencio.
