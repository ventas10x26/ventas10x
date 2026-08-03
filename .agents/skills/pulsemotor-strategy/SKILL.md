---
name: pulsemotor-strategy
description: Marco estratégico de negocio y modelo de datos de Pulse Motor (pulsemotor.co) — "segundo nivel de evolución". Cubre el diferencial de producto (método de venta, no marca), la ética de datos/multi-tenant (el modelo de cómputo se replica entre concesionarios, los datos y la propiedad intelectual de cada marca NUNCA se cruzan), el embudo de ventas 360° (Oportunidades → Citas → Show Up → Cotizaciones → Pedidos → Matrículas), la integralidad ROE (matrículas, financiación, seguros todo riesgo, retomas, accesorios, monitoreo satelital/telemetría, wallbox y cargadores de emergencia para eléctricos), el ciclo de vida del cliente (venta → mantenimiento → renovación), el modelo de datos (entidades/atributos/relaciones/RLS, qué ya existe en Supabase — incluidas las 8 tablas de integralidad 360° migradas el 2026-07-18), los insumos de datos que alimentan el prototipo por DataBridge (las 10 bases de datos operativas de un concesionario: asesores por sede, CRM de oportunidades, pedidos/anticipos, crédito, facturación, matrículas/RUNT, accesorios, pólizas, retomas, preventas), la ruta de producto (prototipar → desplegar → iterar → predecir con IA/ML), la meta de productividad (% de conversión por asesor/modelo/versión/segmento — autos, SUV, híbridos, eléctricos) y la visión de dashboard dinámico de KPIs. Usar esta skill SIEMPRE que la tarea sea sobre: tablas/RLS/multi-tenancy de Supabase para Pulse Motor; DataBridge (qué fuentes de datos ingiere, cómo se mapean a las tablas `pulse_*`); features de dashboard/métricas/KPIs para concesionarios (incluyendo vistas agregadas por org/equipo de ventas); pronósticos o modelos predictivos de ventas; cualquier feature que combine datos de más de un vendedor o concesionario (benchmarking, comparativas, modelos de IA entrenados entre clientes); discusión de ROI/ROE, integralidad de la venta, o valor del cliente en el tiempo; roadmap o priorización de producto; confidencialidad, ética de datos o reconocimiento de marca/PI de fabricantes y concesionarios; o cualquier referencia a "el marco estratégico", "segunda evolución" o el panel piloto de Almotores (almotores.vercel.app). NO usar para trabajo puramente visual/de marca (landing, componentes UI, copy, paleta) — eso lo cubre la skill pulsemotor-design. Las dos son complementarias: esta skill decide QUÉ construir, con qué datos y con qué límites éticos; pulsemotor-design decide CÓMO se ve.
---

# Pulse Motor — Marco estratégico v2 (segundo nivel de evolución)

Documento vivo. Se creó a partir del marco estratégico que el usuario (desarrollador de Pulse Motor y de `almotores.vercel.app`, director de gestión comercial de Almotores KIA) definió explícitamente para pasar de "agente conversacional en WhatsApp" a "sistema de rendimiento de ventas 360° para concesionarios de vehículos nuevos, agnóstico de marca". El artefacto visual que lo acompaña vive en el historial de la conversación donde se creó (buscar "Marco Estratégico v2" en artifacts); este archivo es la versión de trabajo que debe guiar decisiones futuras de producto, datos y dashboard.

## 1. El diferencial: método, no marca

Pulse Motor no compite por marca de vehículo. El producto es agnóstico — el selector de marca en `/pulse/signup` ya lo refleja (KIA, Hyundai, Renault, Chevrolet, Toyota, Mazda, Nissan, Otro). El diferencial real es el **método de venta**: cómo se prospecta, cómo se hace seguimiento y cómo se cierra. Es el mismo problema en cualquier concesionario de cualquier marca líder: leads que se enfrían, cotizaciones que no se trazan, integralidad de la venta que se pierde en el camino.

**Regla dura reforzada explícitamente por el usuario (2026-07-18):** "no quiero casarme con ninguna marca de autos" — el 360° de integralidad es transversal a todo el sector y a las marcas líderes del mercado, no un producto para KIA. Esto aplica tanto a lógica de producto como a copy/UI: nunca hardcodear el nombre de una marca en texto de página, placeholders, guiones de ejemplo o nombres de sección — usar variables/config (`marca`, `SEG.marca`, etc.) o lenguaje agnóstico ("tu marca", "el catálogo de tu concesionario"), igual que ya hace el selector de `/pulse/signup`.

**Hallazgo y fix (2026-07-18 → resuelto):** el usuario confirmó "las 2 cosas" (mantener el piloto Almotores KIA funcionando Y generalizar) — así que la marca ahora se captura de verdad y fluye por toda la cadena en vez de estar hardcodeada:
- `/pulse/signup` ya capturaba `marca` en `user_metadata.pulse_marca`, pero **no llegaba a ningún lado** — `sincronizarPulseAgente` (en `src/app/api/pulse/agente/route.ts` y en `src/app/api/pulse/onboarding/configure-agent/route.ts`) grababa `marca: 'KIA'` a la fuerza en `pulse_agentes` para CUALQUIER asesor nuevo, sin importar qué marca eligió. Ya se corrigió: ambas funciones reciben la marca real (de auth o del formulario) y solo caen a un genérico ("tu marca") si de verdad no se conoce — nunca a "KIA".
- `PulseAgenteDTO`/`PulseAgentMetadata` (`src/lib/pulse-agent.ts`) ahora exponen `marca`; `DEFAULT_CONFIG` dejó de asumir KIA.
- Los prompts de sistema de Codex para generar la config del agente (`generarConIA` en `configure-agent/route.ts`, `regenerarConIA` en `agente/route.ts`) ya reciben la marca real en vez de decir literalmente "asesores KIA Colombia".
- `detectarEspecializacion`: la detección detallada de línea/modelo (Sportage/Picanto/K3/...) se mantiene **solo para KIA** (nomenclatura conocida del piloto) — cualquier otra marca recibe un portafolio genérico en vez de nombres de modelo inventados.
- `src/app/pulse/onboarding-demo/page.tsx` ahora captura `marca` (auth → URL `?marca=` → sessionStorage → selector manual, mismo listado que `/pulse/signup`) y todo el copy (badges, guiones, footer) la usa dinámicamente.
- `src/app/pulse/agente/page.tsx`, `playground/page.tsx` y `databridge/page.tsx` (este último con datos de ejemplo genéricos) también generalizados.
- **Sin verificar en runtime**: el entorno local no tiene `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`, así que no se pudo probar el flujo completo end-to-end contra la base de datos — solo typecheck limpio + revisión manual. Verificar en el entorno real (o agregando la key localmente) antes de asumir que quedó 100% funcional.

**Cómo aplicar:** al proponer features nuevas, evaluar si resuelven el método (prospección/seguimiento/cierre) de forma agnóstica a la marca — nunca acoplar lógica de producto a una marca específica (aunque el piloto actual sea KIA/Almotores).

## 1.5 Ética de datos y propiedad intelectual — regla dura: el modelo se replica, los datos NUNCA

Precisión explícita del usuario (2026-07-18) sobre el punto anterior: lo replicable de Pulse Motor entre marcas/concesionarios es el **modelo de cómputo** (el motor de lógica de negocio 360° — el embudo, las fórmulas de ROE, la arquitectura del modelo predictivo). Los **datos** de cada concesionario — leads, equipo de ventas, cifras de conversión, estrategia comercial, modelos y tecnologías propias — son confidenciales y son propiedad de esa marca/concesionario. La ética, confidencialidad y reconocimiento de propiedad intelectual de cada marca y equipo se debe respetar siempre.

- **Aislamiento por tenant, ya implementado en el schema:** cada tabla `pulse_*` (incluidas las 8 nuevas de integralidad 360°) tiene RLS con `vendedor_id = auth.uid()` — un vendedor nunca ve datos de otro vendedor ni de otro concesionario a través del cliente. Cualquier feature nueva (dashboard, benchmarking, IA/ML) debe respetar exactamente el mismo aislamiento — nunca relajar RLS para "facilitar" una vista agregada.
- **Vista agregada por concesionario (Enterprise) es un caso aparte:** hoy la RLS solo modela ownership individual (`vendedor_id = auth.uid()`), no hay tabla de membresía/roles por organización para Pulse Motor (a diferencia de Ventas10x, que sí tiene `org_members`/`getActiveOrg()`). Si un director de concesionario necesita ver el agregado de todo su equipo de asesores, **eso requiere una capa de autorización por org nueva** (verificar rol antes de consultar con service role) — no debe construirse relajando las policies RLS actuales fila por fila.
- **Reconocimiento de marca / PI:** Pulse Motor no se apropia ni exhibe públicamente marcas, logos o material de fabricantes/concesionarios sin autorización explícita — coherente con haber quitado el carrusel de logos ficticios de la landing en vez de inventar clientes que no existen (commit `fd29cbb`).
- **Benchmarking entre concesionarios** (si se construye a futuro): solo con datos agregados/anonimizados (percentiles, promedios de industria) — nunca exponiendo la cifra cruda o el nombre de un concesionario/marca a un cliente distinto.
- **Modelo predictivo (ML):** entrenado por concesionario, o federado/anonimizado — nunca un solo modelo global que mezcle datos crudos de clientes distintos sin su consentimiento explícito.

**Cómo aplicar:** antes de construir cualquier vista, reporte o modelo que combine datos de más de un `vendedor_id`/`org_id`, confirmar explícitamente con el usuario el mecanismo de autorización — no asumir que agregar es "solo una query distinta".

## 2. El embudo probado (piloto: Almotores KIA)

`almotores.vercel.app` ("Almotores KIA — Análisis 360") es el panel real en producción del concesionario piloto del usuario — no un mockup. Su embudo de ventas, con datos reales observados:

| Etapa | Conteo | Conversión mostrada |
|---|---|---|
| Oportunidades | 2.494 | base |
| Citas | 1.284 | 51% (de oportunidades) |
| Show Up | 900 | 70% (de citas agendadas) |
| Cotizaciones | 1.584 | 68% (métrica propia de efectividad) |
| Pedidos | 354 | 22% (de cotizaciones) |
| Matrículas | 139 | 39% (de pedidos) |

El panel también expone una dimensión de **sede/vitrina** (ej. "Cali Norte", "Av. 39", "Sur", cada una con sus propios leads y % de conversión) — confirma que multi-sede es una dimensión real del negocio, no hipotética.

**Cómo aplicar:** este embudo (6 etapas + dimensión de sede) es la referencia canónica para cualquier feature de embudo/pipeline en Pulse Motor. No inventar etapas nuevas sin necesidad — generalizar estas mismas para cualquier concesionario, no rehacerlas por marca.

## 3. Integralidad 360° — de dónde sale el ROE real

El ROE de una venta no vive solo en el margen del vehículo. Cinco variables, hoy evaluadas sueltas (o no evaluadas) en la mayoría de concesionarios, que Pulse Motor debe medir como una sola operación por cliente:

1. **Matrículas** — el cierre real del embudo: vehículo entregado y registrado, no solo pedido facturado.
2. **Financiación** — margen de intermediación con el aliado bancario; se pierde cuando no se cotiza en la misma conversación con el lead.
3. **Seguros todo riesgo** — comisión por póliza emitida junto a la venta, no como trámite aparte que el cliente resuelve por su cuenta.
4. **Retomas** — tasación consistente del vehículo usado; hoy depende del criterio de cada asesor, no de un histórico de mercado.
5. **Ticket de accesorios** — upsell contextual al modelo y perfil del comprador, cotizado en el mismo pedido.

Esta lista espeja (mismo hilo visual y de negocio) el grid "Ecosistema 360°" que ya existe en `pulsemotor-design`/`_shared/sections.tsx` (`ECOSISTEMA`: vehículos, financiación, accesorios, retomas, pólizas) — no son dos conceptos distintos, son la misma integralidad vista desde el ángulo de producto (landing) y desde el ángulo de negocio (ROE). Mantener consistencia de paleta de chips entre ambos (azul=matrículas/vehículos, violeta=financiación, índigo=pólizas, rosa=retomas, teal=accesorios).

**Ampliación explícita del usuario (2026-07-25) — dos líneas nuevas, todavía no modeladas:**

6. **Monitoreo satelital** — innovación de telemetría del vehículo enfocada en seguridad (no en optimización de flota ni ahorro de combustible — el ángulo de venta es protección/recuperación).
7. **Wallbox y cargadores de emergencia** — cargador wallbox para carga en casa (vehículos híbridos/eléctricos) y cargador de emergencia portátil, como parte del ticket de accesorios de un vehículo electrificado.

Ninguna de las dos tiene todavía tabla en Supabase (sección 5) ni chip en el grid "Ecosistema 360°" de la landing (`pulsemotor-design`) — son candidatas reales a incorporarse, no ideas descartadas. **Cómo aplicar:** al proponer schema o UI nueva para integralidad 360°, contemplar estas 7 líneas (no solo las 5 originales) pero no inventar columnas/chips para ellas sin confirmar alcance con el usuario primero — quedan en "Próximos pasos" hasta esa decisión.

## 4. Valor del cliente en el tiempo (lifetime value)

La venta no termina en la matrícula. El ciclo completo que Pulse Motor debe soportar:

```
Venta → Mantenimiento → Renovación → (vuelve a Venta, mismo cliente, misma marca, vehículo nuevo)
```

Cada una de las cinco variables de integralidad existe para maximizar la experiencia pre/post-venta — eso es lo que retiene al cliente hasta su próxima compra de la misma marca. Hoy no existe una entidad de "cliente" post-venta en el modelo de datos (ver sección 5) — es el vacío más importante a llenar para poder trabajar mantenimiento/renovación.

**Cómo aplicar:** cualquier feature de "fidelización" o "postventa" debe engancharse a esta entidad cliente, no tratarse como un módulo aparte sin relación con la venta original.

## 5. Modelo de datos: qué existe vs. qué falta

### Ya existe en Supabase (proyecto `zicdmwihdslyydjuuqgq`)

| Tabla | Rol en el embudo | Columnas clave |
|---|---|---|
| `pulse_leads` | Oportunidad | `vendedor_id`, `org_id`, `modelo`, `score`, `urgencia`, `canal`, `estado`, `capturado_at`, `contactado_at`, `cerrado_at` |
| `pulse_citas` | Cita | `lead_id`, `vendedor_id`, `fecha`, `hora`, `estado` |
| `pulse_eventos` | Log genérico | `lead_id`, `vendedor_id`, `tipo`, `payload` (jsonb) |
| `pulse_conversaciones` | Historial WhatsApp | `instance_name`, `remote_jid`, `historial` (jsonb) |
| `pulse_agentes` | Config del agente | `user_id`, `marca`, `followup_*`, `bot_activo` |
| `pulse_contactos` | Contactos genéricos | `nombre`, `email`, `telefono`, `fuente`, `estado` |

`pulse_eventos.payload` (jsonb) fue, hasta el 2026-07-18, el único lugar donde podían registrarse cotización/pedido/matrícula/etc. de forma ad-hoc — servía para prototipar rápido, pero no permitía agregación/KPI confiable a escala (sin columnas tipadas, sin FK reales). Ya no hace falta: ver tablas nuevas abajo.

### Integralidad 360° — ya migrado a Supabase (2026-07-18)

Migración `pulse_integralidad_360_tablas_nuevas` aplicada vía `apply_migration`. Las 8 tablas siguen el mismo patrón de seguridad que `pulse_leads`: `vendedor_id` denormalizado en cada una + RLS `vendedor_id = auth.uid()` (select/insert/update/delete), `updated_at` con el trigger genérico `public.update_updated_at()` ya existente. Verificado sin advisories de seguridad tras la migración.

Encadenadas en la "espina" del embudo:

```
Oportunidad (pulse_leads, existe)
  └─ Cita (pulse_citas, existe)
       └─ Cotización (pulse_cotizaciones)
            lead_id · vendedor_id · org_id · vehiculo_modelo · version · precio_lista · descuento · canal · vigencia_hasta · estado
            └─ Pedido (pulse_pedidos)
                 cotizacion_id · lead_id · vendedor_id · org_id · vin · fecha_pedido · fecha_entrega_estimada · estado
                 └─ Matrícula (pulse_matriculas)
                      pedido_id (único, 1:1) · vendedor_id · org_id · placa · fecha_matricula · ciudad · entidad_transito
                      └─ Cliente post-venta (pulse_clientes)
                           matricula_id (único, 1:1) · vendedor_id · org_id · doc_identidad · telefono · email · proximo_mantenimiento_fecha/km · fecha_renovacion_estimada
```

Colgando de `Pedido` (las 4 variables de integralidad que no son el vehículo en sí):

- **`pulse_financiaciones`** — `pedido_id`, `vendedor_id`, `entidad_financiera`, `monto`, `plazo_meses`, `tasa`, `cuota`, `estado_aprobacion`
- **`pulse_polizas`** — `pedido_id`, `vendedor_id`, `aseguradora`, `tipo` (default `todo_riesgo`), `prima_mensual`, `vigencia_inicio/fin`
- **`pulse_retomas`** — `lead_id`, `vendedor_id`, `vehiculo_marca`, `vehiculo_modelo`, `vehiculo_anio`, `kms`, `valor_tasado`, `valor_final`, `estado`
- **`pulse_accesorios_venta`** — `pedido_id`, `vendedor_id`, `accesorio`, `precio`, `cantidad`

**Relaciones clave:** Lead 1→N Citas · Lead 1→N Cotizaciones · Cotización 1→1 Pedido (al ganar, `on delete restrict`) · Pedido 1→1 Matrícula (`on delete cascade`) · Pedido 1→(0..1) Financiación · Pedido 1→(0..1) Póliza · Pedido 1→N Accesorios · Lead 1→(0..1) Retoma · Matrícula 1→1 Cliente (dispara el ciclo de vida post-venta).

**Cómo aplicar:** las tablas ya existen — no volver a proponerlas como "faltantes". Los route handlers de `/pulse` que las consuman deben usar `createAdmin`/service role (igual que `pulse_citas`/`pulse_contactos`, que tienen RLS habilitado sin acceso anónimo) o autenticación con `auth.uid()` del vendedor si se consultan client-side. Cualquier cambio de esquema adicional (nuevas columnas, relaciones) sigue yendo por `apply_migration`, nunca SQL manual fuera de control de versiones.

## 6. Ruta de producto: prototipar → desplegar → iterar → predecir

1. **Prototipar** — migrar el embudo de Almotores a las nuevas entidades (cotización → pedido → matrícula → cliente) sin romper lo que ya funciona en producción para ese concesionario piloto.
2. **Desplegar** — generalizar el mismo modelo de datos a cualquier marca (no acoplarse a KIA), listo para el resto del selector de `/pulse/signup`.
3. **Iterar** — el dashboard reordena qué indicador manda según qué etapa del embudo tiene la fuga más costosa esa semana (KPIs dinámicos, no fijos).
4. **Predecir** — modelos entrenados sobre el histórico real de cada concesionario (no supuestos genéricos de industria): probabilidad de cierre por lead, mejor momento de contacto, propensión a accesorios, propensión a renovación.

El usuario mencionó v0.com como referencia de "mostrar diferentes apps como soluciones inteligentes de negocio" — la lectura correcta no es imitar v0 técnicamente, sino la lógica de **prototipo rápido → producto usable → iteración visible**, aplicada a paneles de negocio en vez de a componentes de UI genéricos.

## 7. Dashboard dinámico de KPIs

El tablero debe priorizar solo, no ser armado manualmente por el usuario: el propio modelo decide qué KPI mostrar arriba según dónde está la fuga o la oportunidad más grande de la semana (ej.: si el show-up cae, ese KPI sube de prioridad visual aunque no sea el primero de la lista). Esto es una evolución directa del panel ya probado en `almotores.vercel.app` — no un dashboard nuevo sin relación.

**Cómo aplicar:** cualquier trabajo de `/pulse/dashboard` o `/pulse/metricas` (hoy con UI placeholder según bug conocido #7 de `AGENTS.md`) debe apuntar hacia esta visión de priorización dinámica, no hacia una grilla de métricas estáticas en orden fijo.

## 8. Los insumos de datos del prototipo — qué sube el concesionario a DataBridge

Explicación explícita del usuario (2026-07-25) de **de dónde nace el prototipo** de cada concesionario nuevo (paso 1 de la ruta de producto, sección 6): no arranca en cero, arranca de las bases de datos operativas que ya existen en cualquier concesionario — típicamente en CRM, ERP, Google Sheets, SharePoint o Excel locales de cada sede/punto de venta. **Esto es exactamente lo que construimos en `/pulse/databridge`** (subir CSV/Excel/JSON/Sheets, mapeo automático de esquema, detección de relaciones, panel desplegado real) — DataBridge no es una feature genérica de "importar datos", es la implementación literal del paso 1 de este marco.

Las 10 bases de datos que el usuario identificó como el insumo mínimo para que Pulse Motor "entienda" la operación diaria de un concesionario:

| # | Base de datos | Mapea a (sección 5) |
|---|---|---|
| 1 | Asesores por sede | **Sin tabla propia todavía** — hoy `vendedor_id` existe en todo el schema pero no hay entidad "asesor" con sede asociada |
| 2 | CRM: oportunidades + journey completo (cotización → seguimiento → citas/test drive → cierre/facturación o desistimiento) | `pulse_leads` + `pulse_citas` + `pulse_eventos` |
| 3 | Pedidos con anticipos y reservas | `pulse_pedidos` |
| 4 | Solicitudes de crédito y seguimiento | `pulse_financiaciones` |
| 5 | Facturación | `pulse_pedidos`/`pulse_matriculas` (no hay tabla de facturación dedicada — hoy implícita en el estado del pedido) |
| 6 | Matrículas y RUNT | `pulse_matriculas` |
| 7 | Venta de accesorios | `pulse_accesorios_venta` |
| 8 | Venta de pólizas de seguros | `pulse_polizas` |
| 9 | Retomas cotizadas y retomas efectivas/facturadas | `pulse_retomas` |
| 10 | Preventas | **Sin tabla propia todavía** — no hay concepto de "preventa" (reserva antes de tener inventario/pedido formal) en el schema actual |

8 de las 10 ya tienen tabla dedicada desde la migración `pulse_integralidad_360_tablas_nuevas` (sección 5). **Asesores por sede** y **Preventas** son los dos vacíos reales — quedan en "Próximos pasos".

**En `/pulse/concesionario` (2026-07-25):** esta lista ya tiene su propia sección en la landing (`InsumosSection`, `src/app/pulse/_shared/sections.tsx`) — agrupada en 3 momentos del journey (antes de vender / negociación / cierre e integralidad) en vez de como grid plano de 10 celdas, para que se lea rápido en vez de abrumar. Si esta tabla cambia (nueva fuente, nuevo mapeo), actualizar también `INSUMOS_GRUPOS` ahí.

**Cómo aplicar:** cuando se trabaje en DataBridge (mapeo de esquema, detección de relaciones, plantillas de importación, copy de la pantalla de subida), usar esta lista de 9 como la referencia canónica de qué tipos de fuente debe reconocer/sugerir — no inventar categorías de datos distintas. Si se agrega soporte de importación para "asesores por sede" o "preventas", eso implica primero decidir el schema nuevo (sección 5), no solo el parseo del archivo.

## 9. Del prototipo al modelo predictivo — la meta de productividad

Narrativa completa del usuario (2026-07-25) que conecta los insumos de la sección 8 con el paso 4 ("Predecir") de la ruta de producto (sección 6):

1. El concesionario sube cualquiera de las 10 bases de datos → Pulse Motor empieza a entender el desarrollo diario de la operación: desde creación del lead hasta agendamiento, show up, test drive, facturación, financiación y retomas.
2. Con eso, entrena **un modelo de datos único por concesionario** (no un modelo global entre clientes — coherente con la regla dura de la sección 1.5: el modelo de cómputo se replica, los datos nunca).
3. El modelo está diseñado para ser **predictivo con alto nivel de confianza**: pronóstico de ventas por sede, por asesor, por modelo y por versión del portafolio de la marca, y por segmento (autos, SUV, híbridos, eléctricos) — anticipándose a la demanda y preferencia del mercado.
4. **La meta de negocio detrás del pronóstico no es la cifra en sí, es la productividad**: subir el % de conversión de cada asesor, por modelo y versión — entendido como unidades facturadas y matriculadas por la fuerza de ventas, no solo leads atendidos.
5. Para lograrlo, el modelo analiza cada punto del viaje del cliente — prospección, seguimiento, venta consultiva, generación de tráfico real, prueba de manejo, negociación, facturación, forma de pago, matriculación — y **se anticipa a resultados con alta probabilidad antes de que cierre el ciclo o mes de venta**, no solo reporta después del hecho.

**Cómo aplicar:** cualquier feature de pronóstico/forecast/predicción debe modelarse por concesionario (nunca cruzando `vendedor_id`/`org_id` de clientes distintos sin el mecanismo de autorización de la sección 1.5) y debe reportarse desagregado por sede/asesor/modelo/versión/segmento — un número agregado único de "ventas esperadas" no cumple esta visión. Esto es la especificación funcional de la palabra "Predecir" en el paso 4 de la sección 6 y del dashboard dinámico de la sección 7 — no una feature nueva y separada.

## Próximos pasos pendientes de decisión con el usuario

- ~~Orden de prioridad real para migrar las tablas nuevas~~ — resuelto 2026-07-18: se migraron las 8 tablas completas de una vez (ver arriba).
- Falta construir los route handlers/UI que escriban en `pulse_cotizaciones` → `pulse_clientes` (hoy las tablas existen pero nada las alimenta todavía — no hay flujo real que las use aún).
- Si el dashboard dinámico se construye sobre `/pulse/dashboard`/`/pulse/metricas` existentes o como ruta nueva.
- Si el modelo predictivo (paso 4 de la ruta de producto) se aborda ahora o se pospone hasta tener volumen de datos suficiente en las tablas nuevas.
- Schema para **asesores por sede** (entidad "asesor" con sede asociada — hoy no existe, solo `vendedor_id` suelto) y para **preventas** (reserva antes de pedido formal) — los dos vacíos identificados en la sección 8.
- Decisión de alcance para **monitoreo satelital**, **wallbox** y **cargador de emergencia** (sección 3, líneas 6-7): si entran como tablas `pulse_*` nuevas, como columnas dentro de `pulse_accesorios_venta`, o se posponen — y si suman chip propio en el grid "Ecosistema 360°" de la landing.
- Si DataBridge (`/pulse/databridge`) debe evolucionar de "subir y mapear libremente" a ofrecer plantillas/reconocimiento guiado para las 9 fuentes específicas de la sección 8 (hoy el mapeo es genérico, no sabe que existe una lista canónica de 9 tipos de fuente).
