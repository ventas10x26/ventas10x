---
name: pulsemotor-design
description: Sistema de diseño y lineamientos de marca de Pulse Motor (pulsemotor.co), un agente autónomo de IA que orquesta el contexto 360° de la venta automotriz (inventario, financiación, pólizas, retomas, accesorios) dentro de una sola conversación de WhatsApp, para concesionarios y asesores independientes en LatAm. Usar esta skill SIEMPRE que se construya, edite o revise cualquier UI, landing page, componente, email o pieza visual de Pulse Motor — incluso si el usuario no menciona "diseño" explícitamente, solo pide "una sección nueva", "un componente", "el hero", "la pricing page", etc. También usar si el usuario pregunta por la paleta, tipografía, tono de copy o el "arquetipo" de la marca. NO usar para Ventas10x.co ni para Almotores — es un sistema de marca distinto y específico de Pulse Motor.
---

# Pulse Motor — Sistema de diseño

## El arquetipo: el copiloto autónomo de venta 360°

Pulse Motor no es "un chatbot que responde WhatsApp". Es un **agente autónomo** que orquesta *todo* el contexto de una venta de auto — vehículo, versión, financiación, póliza, retoma, accesorios — dentro de una sola conversación, y que **muestra su trabajo**: cada cotización, cada tasación, cada póliza calculada es una acción trazable (un "tool call") con su propio tiempo de ejecución, no una respuesta de caja negra.

**Todo el lenguaje visual y de copy se ancla en la transparencia y amplitud de ese agente**, no en genérico "SaaS de IA":

- Agente autónomo, copiloto, orquesta, contexto 360°, ecosistema, timeline ejecutado, ruteo, auditable, conversión estimada
- NUNCA: "asistente virtual" genérico, partículas flotantes, cubos 3D decorativos, mockup de celular como protagonista, iconografía de robot/chip/cerebro

Antes de diseñar cualquier pieza nueva, preguntate: *¿esto muestra al agente haciendo un trabajo real y verificable, o es una promesa vaga de "IA"?* Si es lo segundo, hay que rehacerlo.

**`src/app/pulse/page.tsx` ya implementa este arquetipo** — tratalo como la implementación canónica, junto con `assets/reference-page.html` como catálogo de patrones aislado.

## Los dos segmentos (ambos con el mismo agente)

- **Concesionario (Enterprise)**: fuerza de ventas, inventario multi-punto, integra DMS (Siigo/SAP), atribución por asesor, compliance/auditoría.
- **Vendedor individual (Pro)**: copiloto personal en su propio WhatsApp Business, cotiza y cierra sin depender de un área de crédito, precio de entrada bajo (self-serve).

Nunca tratar esto como una sola persona genérica "el asesor" — el copy y las secciones deben distinguir explícitamente estos dos públicos (ver sección "Diseñado para cómo realmente se vende" en `page.tsx`).

## Reglas duras (no negociables)

1. **Numeración catalogada permitida** (`01`–`05`) para listar capacidades/ecosistema — a diferencia de un onboarding, acá no describe una secuencia temporal sino un catálogo de puntos de fricción cubiertos, y por eso los números leen como índice, no como decoración vacía. Para procesos que sí son secuenciales en el tiempo, usar sellos (`✓ Paso 1`) en vez de números crudos.
2. **Nunca partículas, cubos 3D decorativos, ni mockup de teléfono como elemento hero principal.** El WhatsApp es la prueba (una conversación real, recortada), no el protagonista visual — el protagonista es el **timeline de tool-calls** que se ve al lado. Sombras neutras grandes y suaves (elevación física) están permitidas y son deseables en paneles clave (hero panel, price card, segment cards en hover) — la línea sigue siendo *halo de color sangrando* (glow, prohibido) vs. *sombra neutra que sugiere objeto físicamente elevado* (permitido).
3. **El movimiento es funcional**, no decorativo: el timeline de tool-calls se revela como una traza real de ejecución (uno por uno, con su tiempo), un pulso de "en vivo", timing real de conversación. Revelado por scroll con el hook compartido `useReveal` (`src/hooks/useReveal.ts`) en cada sección — no inventar mecanismos nuevos. Cifras reales cuentan hacia arriba con `useCountUp` (`src/hooks/useCountUp.ts`) al revelarse — solo para cifras reales (leads, retomas, pólizas, conversión), nunca como efecto de texto genérico.
4. **Ámbar como familia de acento** (`--amber → --amber-2`, degradé tonal permitido para cifras clave y la palabra de énfasis del hero) — no mezclar otros hues como acento de marca. Verde exclusivo para estados on/off/en vivo/aprobado — **con dos excepciones explícitas**:
   - La sección "Actividad en vivo" (`.section-live`, ver "Ritmo de fondo entre secciones" en `tokens.md`) eleva ese mismo verde a un degradé de fondo a escala hero (`--grad-green`), espejando lo que el ámbar ya hace en el hero. Es la misma semántica de "en vivo", no un segundo hue de marca.
   - **Chips de categoría** (a pedido explícito del usuario, inspirados en el grid multicolor de Platzi): los íconos de grids catalogados (Ecosistema 360°, Cumplimiento y seguridad) pueden llevar un chip de color decorativo distinto por ítem (azul, violeta, teal, rosa, índigo) — ver "Chips de categoría" en `tokens.md`. Alcance estrictamente limitado al fondo/borde del ícono; texto, CTAs, links, fondo de sección y estados siguen siendo ámbar/verde/neutro. No extender esto a botones, titulares, ni badges de estado.
5. **No repetir la misma anatomía de sección en cadena.** Alternar: grid catalogado, split de 2 cards de segmento, stats+tabla de auditoría, grid de integraciones, testimonios por segmento. La variedad de composición es parte del sistema.
6. **Jerarquía tipográfica con confianza**: el H1 del hero es el elemento más grande de la página (`clamp(44px, 7vw, 88px)`); cada H2 de sección escala a partir de ahí, nunca al mismo tamaño para todo.
7. **Titulares en minúscula/mixta con énfasis en negrita**, NO en mayúscula sostenida (`text-transform:none`, no uppercase) — a diferencia de una iteración anterior de esta skill que usaba Oswald todo en mayúsculas. Los titulares se leen como una frase con una palabra o cláusula resaltada en degradé ámbar, no como un cartel de guardia.
8. Respetar `prefers-reduced-motion` en todo componente animado.

## Tokens de diseño

Ver `references/tokens.md` para la tabla completa. Resumen rápido:

- **Color:** negro cálido `#0B0D0C` / `#14120F` / `#1B1815` de base, ámbar de señal `#F2A93B` (degradé tonal `#F2A93B → #C9770B` permitido) como único acento, verde `#3ECF7E` solo para "activo/en vivo/aprobado".
- **Tipografía:** Inter (700–800) para titulares en minúscula/mixta con énfasis en degradé ámbar · IBM Plex Mono para timestamps, nombres de función del timeline (`tasar_retoma`, `calcular_financiacion`) y cualquier dato · Inter (400–600) para cuerpo. Cargadas con `next/font/google` en `src/app/pulse/layout.tsx` (autohospedadas en build time) — nunca un `<link>` a Google Fonts en runtime ni `@import` en un `<style>`.
- **Bordes/radios:** rectos y contenidos, radio 3–8px máximo.
- **Grids de contenido:** bordes de 1px compartidos entre celdas (`gap:1px` con `background:var(--line)`) en vez de cards flotantes, salvo los segment cards y el hero panel, que sí llevan sombra de elevación real por ser los elementos protagonistas de su sección.

## Elementos de firma (signature elements)

- **Badge de agente activo**: punto verde con pulso + "Agente activo · 24/7/365". Puede llevar detrás el "barrido" cónico ámbar tenue (rotación lenta) como refuerzo visual de "siempre encendido" — nunca compite con el texto.
- **Panel hero: conversación + timeline de tool-calls**: un mensaje real de lead, la respuesta del agente, y debajo una traza de 4 tool-calls (`nombre_funcion · Nms`) que se revelan una por una — es el elemento más distintivo de la marca, mostrando literalmente lo que el agente ejecutó, no una promesa. Debajo del timeline, un auto (🚗) recorre una pista punteada al ritmo de los tool-calls ejecutados — el trámite avanzando en tiempo real, nunca un auto decorativo suelto (a pedido explícito del usuario, que pidió "autos animados" — el skill solo permite motivo automotriz si está atado a progreso/datos reales, nunca como decoración vacía). Cierra con una cifra de conversión estimada.
- **Grid catalogado 01–05**: la cobertura del "ecosistema 360°" (vehículos, financiación, accesorios, retomas, pólizas) en un grid de borde compartido con números de índice.
- **Segment cards**: dos tarjetas con sombra real (Concesionario/Enterprise vs. Vendedor individual/Pro), cada una con tag, título, subtítulo, 4 bullets de valor y su propio CTA — nunca fusionar ambos públicos en una sola tarjeta genérica. La card de Concesionario suma un preview real del diagrama de tablas de `/pulse/databridge` (mini-esquema de nodos conectados: leads, clientes, inventario, financiación, pólizas) — prueba visual de que "subís tu DMS/Excel y la IA arma el mapa" tan literal como el timeline de tool-calls del hero, no un mockup genérico. Asimetría entre las dos cards (Concesionario más alta por el diagrama) es intencional, no un error de layout.
- **Precios con toggle de segmento**: sección `#precios` con un switch (Vendedor individual / Concesionario) que cambia los 2 planes mostrados — nunca los 4 planes juntos en una sola grilla. El plan de mayor compromiso de cada segmento lleva badge "Recomendado" y CTA sólido (`pm-btn`); el otro va con botón outline (`pm-btn-outline`) — la jerarquía se marca por peso visual dentro de la familia ámbar, nunca con un hue nuevo.
- **Banner de confianza**: stat de adopción (`+N concesionarios`) + CTA de demo, debajo de la fila de logos — refuerza el trust signal con una acción concreta, no solo el logo wall.
- **Cobertura 24/7 (panel "por qué")**: reusa el patrón de fila de timeline/auditoría (`log-row`) pero aplicado a 4 franjas horarias con un evento real cada una y `✓ Cubierto` en verde — nunca un mockup de celular ni una captura genérica de la app para ilustrar "siempre activo".
- **Cumplimiento y seguridad**: grid catalogado (mismo patrón `grid-shared`/`integ-item` que integraciones) con reclamos concretos de seguridad/datos (cifrado, alojamiento, Habeas Data, auditoría, control de acceso) — nunca certificaciones específicas que el producto no tiene realmente.
- **Actividad en vivo**: fila de 4 stats con delta (`+12%`, `+5pt`) + tabla auditable (timestamp / evento / canal / estado) de eventos reales del ecosistema (retomas, pólizas, financiación, citas, cross-sell) — no solo mensajes de WhatsApp.
- **Integraciones nativas**: grid de badges de stack real (WhatsApp Business, DMS, aseguradoras, HubSpot/Salesforce) — comunica que el agente vive dentro del stack del concesionario, no como capa aparte.
- **Revelado progresivo por scroll**: cada sección se descubre al bajar vía `useReveal`; cifras reales cuentan hacia arriba con `useCountUp`. No reemplazar por scroll-jacking, parallax, ni librerías nuevas (no hay `framer-motion` en el proyecto).

## Copy y tono

- Español neutro-LatAm, directo, en segunda persona cuando se habla al vendedor individual; en tercera/impersonal cuando se habla del concesionario como organización.
- Vocabulario del negocio real: retoma, póliza, financiación, DMS, ruteo de leads, cross-sell — nunca jerga de sistema genérica ("dashboard", "insights").
- Nunca adjetivos vacíos ("revolucionario", "next-gen"). Específico y verificable: "tasé su 2021 en $42.500.000", no "tasación instantánea con IA".

## Cómo trabajar con esta skill

1. Leé `references/tokens.md` para valores exactos antes de construir cualquier pieza.
2. Mirá `assets/reference-page.html` como catálogo estático de patrones (segment cards, timeline de tool-calls, grid 01–05), y `src/app/pulse/page.tsx` como la implementación real con estado/hooks — para revelado por scroll y cuentas ascendentes, reusá `useReveal`/`useCountUp`.
3. Si el pedido choca con una regla dura (ej. "ponele un mockup de celular gigante" o "fusioná los dos segmentos en una card"), decilo explícitamente y proponé la alternativa en vez de aplicarlo en silencio.
