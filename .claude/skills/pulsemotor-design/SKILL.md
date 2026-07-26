---
name: pulsemotor-design
description: Sistema de diseño y lineamientos de marca de Pulse Motor (pulsemotor.co), un agente autónomo de IA que orquesta el contexto 360° de la venta automotriz (inventario, financiación, pólizas, retomas, accesorios) dentro de una sola conversación de WhatsApp, para concesionarios y asesores independientes en LatAm. Usar esta skill SIEMPRE que se construya, edite o revise cualquier UI, landing page, componente, email o pieza visual de Pulse Motor — incluso si el usuario no menciona "diseño" explícitamente, solo pide "una sección nueva", "un componente", "el hero", "la pricing page", etc. También usar si el usuario pregunta por la paleta, tipografía, tono de copy o el "arquetipo" de la marca. NO usar para Ventas10x.co ni para Almotores — es un sistema de marca distinto y específico de Pulse Motor.
---

# Pulse Motor — Sistema de diseño

## Pivote de marca (2026-07-25): de ámbar/negro a azul/negro

El sistema vivió su primera etapa en una paleta ámbar de señal sobre negro cálido. El usuario pidió un pivote completo de marca a partir de un mockup de referencia (generado en Stitch): **azul como único acento**, header siempre oscuro sólido (no vidrio esmerilado), y un nuevo elemento de firma — un **log vertical de pasos del agente** — que reemplaza el timeline horizontal de tool-calls como pieza central del hero. Es un reemplazo real, no una variante A/B: todo lo de abajo describe el sistema vigente. Si en el código o en capturas viejas aparece `--amber`/`.grad-amber`/timeline horizontal, es remanente de la iteración anterior — migrar al tocarlo, no reproducirlo en piezas nuevas.

## El arquetipo: el copiloto autónomo de venta 360°

Pulse Motor no es "un chatbot que responde WhatsApp". Es un **agente autónomo** que orquesta *todo* el contexto de una venta de auto — vehículo, versión, financiación, póliza, retoma, accesorios — dentro de una sola conversación, y que **muestra su trabajo**: cada cotización, cada tasación, cada póliza calculada es una acción trazable con su propio timestamp/estado, no una respuesta de caja negra. El nuevo panel de firma (ver Elementos de firma) lo expresa como un **log de sistema** — `pulse_agent_v4.2.log` — en vez de una traza de tool-calls con nombres de función: mismo principio (mostrar el trabajo real), superficie visual distinta (pasos de negocio legibles por un director comercial, no nombres de función de código).

**Todo el lenguaje visual y de copy se ancla en la transparencia y amplitud de ese agente**, no en genérico "SaaS de IA":

- Agente autónomo, copiloto, orquesta, contexto 360°, ecosistema, sistema en línea, log de actividad, ruteo, auditable, precisión, conversión estimada
- NUNCA: "asistente virtual" genérico, partículas flotantes, cubos 3D decorativos, mockup de celular como protagonista, iconografía de robot/chip/cerebro

Antes de diseñar cualquier pieza nueva, preguntate: *¿esto muestra al agente haciendo un trabajo real y verificable, o es una promesa vaga de "IA"?* Si es lo segundo, hay que rehacerlo.

**`src/app/pulse/page.tsx` ya implementa este arquetipo** — tratalo como la implementación canónica, junto con `assets/reference-page.html` como catálogo de patrones aislado.

## Los dos segmentos (ambos con el mismo agente)

- **Concesionario (Enterprise)**: fuerza de ventas, inventario multi-punto, integra DMS (Siigo/SAP), atribución por asesor, compliance/auditoría.
- **Vendedor individual (Pro)**: copiloto personal en su propio WhatsApp Business, cotiza y cierra sin depender de un área de crédito, precio de entrada bajo (self-serve).

Nunca tratar esto como una sola persona genérica "el asesor" — el copy y las secciones deben distinguir explícitamente estos dos públicos (ver sección "Diseñado para cómo realmente se vende" en `page.tsx`).

## Reglas duras (no negociables)

1. **Numeración catalogada permitida** (`01`–`05`) para listar capacidades/ecosistema — a diferencia de un onboarding, acá no describe una secuencia temporal sino un catálogo de puntos de fricción cubiertos, y por eso los números leen como índice, no como decoración vacía. Para procesos que sí son secuenciales en el tiempo, usar sellos (`✓ Paso 1`) en vez de números crudos.
2. **Nunca partículas, cubos 3D decorativos, ni mockup de teléfono como elemento hero principal.** El WhatsApp es la prueba (una conversación real, recortada), no el protagonista visual — el protagonista es el **log vertical de pasos del agente** que se ve al lado (ver Elementos de firma). Sombras neutras grandes y suaves (elevación física) están permitidas y son deseables en paneles clave (hero panel, price card, segment cards en hover) — la línea sigue siendo *halo de color sangrando* (glow, prohibido) vs. *sombra neutra que sugiere objeto físicamente elevado* (permitido).
3. **El movimiento es funcional**, no decorativo: el log del hero se revela paso por paso (uno por uno, con su icono y su estado), simulando ejecución real, no una lista estática. Revelado por scroll con el hook compartido `useReveal` (`src/hooks/useReveal.ts`) en cada sección — no inventar mecanismos nuevos. Cifras reales cuentan hacia arriba con `useCountUp` (`src/hooks/useCountUp.ts`) al revelarse — solo para cifras reales (leads, retomas, pólizas, conversión, precisión), nunca como efecto de texto genérico.
4. **Azul como único acento de marca** (`--blue → --blue-2`, degradé tonal permitido para cifras clave y la palabra de énfasis del hero) — no mezclar otros hues como acento de marca, botón primario, link o badge de estado. El sistema es intencionalmente monocromático (azul + negro + blancos/grises), a diferencia de la iteración anterior que reservaba un verde aparte para "en vivo/aprobado": ahora esos mismos estados también van en azul (ver el indicador "SISTEMA EN LÍNEA" del panel de firma) — **no reintroducir verde como color de estado**. Única excepción, acotada:
   - **Chips de categoría** (a pedido explícito del usuario, inspirados en el grid multicolor de Platzi): los íconos de grids catalogados (Ecosistema 360°, Cumplimiento y seguridad) pueden llevar un chip de color decorativo distinto por ítem (violeta, teal, rosa, índigo, **ámbar** — el acento saliente, reincorporado como uno más de los cinco ahora que dejó de ser el color de marca) — ver "Chips de categoría" en `tokens.md`. Alcance estrictamente limitado al fondo/borde del ícono; texto, CTAs, links, fondo de sección y estados siguen siendo azul/neutro. No extender esto a botones, titulares, ni badges de estado. `--red` se mantiene aparte, exclusivo para errores/costos negativos — no es un acento de marca ni un chip decorativo.
5. **No repetir la misma anatomía de sección en cadena.** Alternar: grid catalogado, split de 2 cards de segmento, stats+tabla de auditoría, grid de integraciones, testimonios por segmento. La variedad de composición es parte del sistema.
6. **Jerarquía tipográfica con confianza**: el H1 del hero es el elemento más grande de la página (`clamp(44px, 7vw, 88px)`); cada H2 de sección escala a partir de ahí, nunca al mismo tamaño para todo.
7. **Titulares en minúscula/mixta con énfasis en negrita**, NO en mayúscula sostenida (`text-transform:none`, no uppercase). Los titulares se leen como una frase con una palabra o cláusula resaltada en azul, no como un cartel de guardia.
8. Respetar `prefers-reduced-motion` en todo componente animado.
9. **Header siempre oscuro sólido, sin importar el tema de la página.** A diferencia de la iteración ámbar (header de vidrio esmerilado que cambiaba con soft/dark), el header ahora es una franja fija oscura (`--header-bg`, ya no varía por tema) — mismo criterio que los paneles "pantalla de producto" (`.panel`/`--panel-*`): es una pieza de producto, no parte del lienzo de la página. El toggle de tema (`ThemeToggle`) sigue cambiando el resto de la página (fondo/texto de las secciones) pero el header no reacciona a él. Cualquier pieza nueva fuera del header/`.panel` sigue leyendo color de `var(--bg-*)`/`var(--ink*)`/`var(--line)` (que sí cambian con el tema) en vez de hardcodear un hex — ver "Tema: soft (claro, default) / dark" en `tokens.md`.

## Tokens de diseño

Ver `references/tokens.md` para la tabla completa. Resumen rápido:

- **Color:** azul de señal `#2563EB` (degradé tonal `#2563EB → #1D4ED8` permitido) como único acento — no cambia entre temas. El fondo/texto sí cambia: negro cálido `#0B0D0C`/`#14120F`/`#1B1815` en dark, blanco cálido `#FDFBF7`/`#FFFFFF`/`#F5F1E9` en soft (default). El header es siempre oscuro sólido (`#0B0D12`), en los dos temas.
- **Tipografía:** Inter (700–800) para titulares en minúscula/mixta con énfasis en azul · IBM Plex Mono para el nombre del log (`pulse_agent_v4.2.log`), el indicador de estado y cualquier dato/timestamp · Inter (400–600) para cuerpo. Cargadas con `next/font/google` en `src/app/pulse/layout.tsx` (autohospedadas en build time) — nunca un `<link>` a Google Fonts en runtime ni `@import` en un `<style>`.
- **Bordes/radios:** rectos y contenidos, radio 3–8px máximo.
- **Grids de contenido:** bordes de 1px compartidos entre celdas (`gap:1px` con `background:var(--line)`) en vez de cards flotantes, salvo los segment cards y el hero panel, que sí llevan sombra de elevación real por ser los elementos protagonistas de su sección.
- **Botones:** primario sólido azul (`.pm-btn`); secundario sólido negro (`.pm-btn-dark`, texto blanco) — a diferencia de la iteración anterior, el secundario ya no es un outline/ghost transparente, es un segundo color sólido de igual peso visual que el primario. Reservar `.pm-btn-outline`/`.pm-btn-ghost` (borde sin relleno) para acciones terciarias de bajo compromiso dentro de una sección, no como el botón secundario por defecto del hero.

## Elementos de firma (signature elements)

- **Badge de agente activo**: cuadrado azul (no punto verde) + "Agente activo · 24/7/365" o el stat de adopción correspondiente (`+180 concesionarios activos`) — mismo indicador cuadrado que usa el panel de log para "sistema en línea". Puede llevar detrás el "barrido" cónico azul tenue (rotación lenta) como refuerzo visual de "siempre encendido" — nunca compite con el texto.
- **Panel hero: log vertical de pasos del agente** (`PulseAgentLog`, reemplaza el timeline horizontal de tool-calls) — es el elemento más distintivo de la marca. Estructura:
  - Barra de título tipo ventana de sistema: ícono de documento + nombre de archivo en mono (`pulse_agent_v4.2.log`) + 3 puntos decorativos a la derecha (nunca funcionales, es un guiño a "consola/terminal", no una ventana real).
  - 3–4 pasos verticales conectados por una línea vertical continua (no punteada): cada paso es un ícono en caja azul-tenue + título + subtítulo con el dato real resuelto (`Detectado: WhatsApp Business`, `Calificación: Alta intención (Financiación)`, `Asignado a: Asesor Senior (Grupo A)`) — el paso "activo" (normalmente el del medio, el que más muestra el trabajo del agente) lleva un fondo ligeramente resaltado (`--panel-bg-2`) para leerse como "esto es lo que está pasando ahora".
  - Barra de estado inferior, banda oscura de ancho completo: indicador cuadrado azul + "SISTEMA EN LÍNEA" en mono, y a la derecha una cifra real en azul (`99.8%`) + su etiqueta (`PRECISIÓN`) — mismo lugar semántico que antes ocupaba la cifra de conversión estimada al pie del timeline.
  - Se revela paso por paso (stagger), igual que el timeline anterior — no todo el panel a la vez.
- **Grid catalogado 01–05**: la cobertura del "ecosistema 360°" (vehículos, financiación, accesorios, retomas, pólizas) en un grid de borde compartido con números de índice.
- **Segment cards**: dos tarjetas con sombra real (Concesionario/Enterprise vs. Vendedor individual/Pro), cada una con tag, título, subtítulo, 4 bullets de valor y su propio CTA — nunca fusionar ambos públicos en una sola tarjeta genérica. La card de Concesionario suma un preview real del diagrama de tablas de `/pulse/databridge` (mini-esquema de nodos conectados: leads, clientes, inventario, financiación, pólizas) — prueba visual de que "subís tu DMS/Excel y la IA arma el mapa" tan literal como el log del hero, no un mockup genérico. Asimetría entre las dos cards (Concesionario más alta por el diagrama) es intencional, no un error de layout.
- **Precios con toggle de segmento**: sección `#precios` con un switch (Vendedor individual / Concesionario) que cambia los 2 planes mostrados — nunca los 4 planes juntos en una sola grilla. El plan de mayor compromiso de cada segmento lleva badge "Recomendado" y CTA sólido azul (`pm-btn`); el otro va con `pm-btn-dark` (sólido negro) — la jerarquía se marca por orden/tamaño, no por quitarle relleno al secundario.
- **Banner de confianza**: stat de adopción (`+N concesionarios`) + CTA de demo, debajo de la fila de logos — refuerza el trust signal con una acción concreta, no solo el logo wall.
- **Cobertura 24/7 (panel "por qué")**: reusa el patrón de fila de log (`log-row`) pero aplicado a 4 franjas horarias con un evento real cada una y `✓ Cubierto` en azul — nunca un mockup de celular ni una captura genérica de la app para ilustrar "siempre activo".
- **Cumplimiento y seguridad**: grid catalogado (mismo patrón `grid-shared`/`integ-item` que integraciones) con reclamos concretos de seguridad/datos (cifrado, alojamiento, Habeas Data, auditoría, control de acceso) — nunca certificaciones específicas que el producto no tiene realmente.
- **Actividad en vivo**: fila de 4 stats con delta (`+12%`, `+5pt`) + tabla auditable (timestamp / evento / canal / estado) de eventos reales del ecosistema (retomas, pólizas, financiación, citas, cross-sell) — no solo mensajes de WhatsApp. El "momento no-negro" de esta sección ahora usa un degradé azul (`--grad-blue-deep`) en vez del verde que usaba antes.
- **Integraciones nativas**: grid de badges de stack real (WhatsApp Business, DMS, aseguradoras, HubSpot/Salesforce) — comunica que el agente vive dentro del stack del concesionario, no como capa aparte.
- **Revelado progresivo por scroll**: cada sección se descubre al bajar vía `useReveal`; cifras reales cuentan hacia arriba con `useCountUp`. No reemplazar por scroll-jacking, parallax, ni librerías nuevas (no hay `framer-motion` en el proyecto).
- **Toggle de tema (soft/dark)**: botón circular con ícono de luna (en soft, invita a pasar a oscuro) o sol (en dark, invita a volver a soft) en el header, junto a Login/Ser agente — el propio header no cambia de color con este toggle (regla dura 9), solo el resto de la página. Soft es el tema por default; ver "Tema: soft (claro, default) / dark" en `tokens.md` para la arquitectura completa de tokens.

## Copy y tono

- Español neutro-LatAm, directo, en segunda persona cuando se habla al vendedor individual; en tercera/impersonal cuando se habla del concesionario como organización.
- Vocabulario del negocio real: retoma, póliza, financiación, DMS, ruteo de leads, cross-sell — nunca jerga de sistema genérica ("dashboard", "insights").
- Nunca adjetivos vacíos ("revolucionario", "next-gen"). Específico y verificable: "tasé su 2021 en $42.500.000", no "tasación instantánea con IA".

## Más allá del home: el dashboard interno (/pulse/dashboard, /agente, /pipeline, /metricas, /perfil, /databridge, etc.)

Esta skill no es solo para la landing pública — aplica a **todo** `/pulse/**`, incluido el producto autenticado. El pivote de marca del 2026-07-25 (azul en vez de ámbar) también aplica ahí — no es exclusivo de las 3 landings.

- Los tokens de color viven en `src/app/pulse/layout.tsx` (bloque `<style>` scoped a `.pulse-root`) — cualquier página o componente bajo `/pulse` puede usarlos vía `var(--bg-0)`, `var(--blue)`, etc. sin redefinirlos.
- `PulseAppShell.tsx` (`src/components/pulse/`) es el shell compartido (sidebar + header + pill de créditos + paywall) usado por dashboard/agente/pipeline/métricas/perfil/databridge — ya migrado al sistema azul/negro. Es el punto de mayor apalancamiento: cualquier cambio ahí se propaga a las 6 páginas que lo usan.
- La pill de créditos: azul = saldo saludable, gris/blanco = alerta temprana, rojo = crítico — ya no usa verde/ámbar como en la iteración anterior (ver regla dura 4, sistema monocromático + rojo exclusivo para error).
- `globals.css` (compartido con Ventas10x.co) define `h1, h2, h3 { font-family: 'Syne' }` a nivel global — **nunca editar esa regla directamente** (afectaría también a Ventas10x.co). En su lugar, `layout.tsx` la sobreescribe con `.pulse-root h1, .pulse-root h2, .pulse-root h3 { font-family: var(--font-inter) }` (mayor especificidad, scoped), así que todo título real (`<h1>`/`<h2>`/`<h3>`) bajo `/pulse` ya usa Inter aunque la página en sí no esté migrada.
- El resto de las páginas del dashboard (login, onboarding, pricing, pago-exitoso, playground, onboarding-demo) y los componentes de `src/components/pulse/` (PulseFollowUpPanel, PulsePipelineKanban, PulseAudioLogs, PulseVozRecorder, PulseWhatsappConnect, CreditosBanner, etc.) — si todavía tienen colores navy/naranja sueltos de una iteración previa a ámbar, migrar directamente al azul nuevo (no pasar por ámbar como paso intermedio). Migrar de a una página/componente por vez, verificando con capturas antes de dar por hecho el cambio.

## Cómo trabajar con esta skill

1. Leé `references/tokens.md` para valores exactos antes de construir cualquier pieza.
2. Mirá `assets/reference-page.html` como catálogo estático de patrones (segment cards, log de pasos del agente, grid 01–05), y `src/app/pulse/page.tsx` como la implementación real con estado/hooks — para revelado por scroll y cuentas ascendentes, reusá `useReveal`/`useCountUp`.
3. Para el dashboard interno, `PulseAppShell.tsx` es la referencia canónica del shell ya migrado — replicá sus mismos tokens/patrones en vez de inventar variantes nuevas por página.
4. Si el pedido choca con una regla dura (ej. "ponele un mockup de celular gigante", "fusioná los dos segmentos en una card", un ícono de robot/chip/cerebro, o "agregá verde para el estado activo"), decilo explícitamente y proponé la alternativa en vez de aplicarlo en silencio.
