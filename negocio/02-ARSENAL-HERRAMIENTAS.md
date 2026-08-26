# Arsenal — qué descargar y en qué carpeta va cada cosa

Todo está mapeado a `negocio/stack/`. La columna **Carpeta destino** es literal:
ahí lo clonas.

---

## ⚠️ Antes de descargar nada: la regla de seguridad

Un "skill", un "plugin" y un servidor MCP **ejecutan código en tu máquina con tus
permisos**. Vas a instalar decenas de repos de gente que no conoces, en la misma
computadora donde van a vivir las credenciales de producción de tus clientes: el
WhatsApp del hotel, su base de datos, sus cobros.

Reglas que no rompes, ni con prisa:

1. **Lee el código de cualquier skill/plugin antes de activarlo.** Si es demasiado
   largo para leerlo, es demasiado riesgoso para correrlo sin revisar. Pídeselo a
   Claude Code: "revisa este repo y dime qué hace con la red y con mis archivos".
2. **Ningún repo con menos de ~200 estrellas o sin commits en 6 meses** entra a tu
   entorno de producción. Al laboratorio (`08_APRENDIZAJE/laboratorio`) sí.
3. **Las credenciales de clientes nunca viven en un repo**, ni siquiera privado.
   Van en el gestor de secretos del VPS o en un gestor de contraseñas.
4. **Prueba en el VPS de laboratorio, no en el de clientes.** Ten dos.
5. Prefiere lo oficial (Anthropic, n8n, Cloudflare, Supabase, Meta) sobre lo
   comunitario cuando exista ambas.

Esto no es paranoia: el día que un cliente te pregunte cómo proteges sus datos,
esta lista es tu respuesta, y es parte de lo que estás vendiendo.

---

## 01_NUCLEO_IA — el cerebro

### `01_NUCLEO_IA/claude/plugins/` y `/skills/`

| Qué | Fuente | Para qué te sirve |
|---|---|---|
| Marketplace oficial de plugins | `/plugin marketplace add anthropics/claude-code` dentro de Claude Code | Punto de partida. Explóralo antes de bajar nada comunitario. |
| Skills oficiales de Anthropic | `github.com/anthropics/skills` | docx, pdf, xlsx, pptx. **Esenciales para ti**: vas a generar propuestas, contratos y reportes mensuales para clientes. |
| Tus propios skills | los escribes tú | Ver abajo, "Los skills que TÚ tienes que escribir". |

Dentro de Claude Code, `/skill-creator` te ayuda a escribir skills nuevos y
`/plugin` administra los instalados. Úsalos antes de buscar soluciones comunitarias.

### `01_NUCLEO_IA/claude/mcp-servers/`

Los servidores MCP son lo que le da manos a Claude fuera del repo. Estos son los
que de verdad vas a usar:

| Servidor | Fuente | Para qué |
|---|---|---|
| Servidores de referencia MCP | `github.com/modelcontextprotocol/servers` | filesystem, fetch, git, memory, sequential-thinking. La base. |
| Playwright MCP | `github.com/microsoft/playwright-mcp` | Que Claude abra un navegador de verdad. **Clave para tu servicio de scraping de tarifas (A4) y para probar las webs de clientes.** |
| Context7 | `github.com/upstash/context7` | Documentación actualizada de librerías dentro del contexto. Evita que el modelo te dé APIs viejas. |
| n8n-MCP | `github.com/czlonkowski/n8n-mcp` | **El más valioso de esta lista para tu negocio.** Le da a Claude conocimiento de los nodos de n8n, para que te arme workflows correctos en vez de inventados. |
| Cloudflare MCP | `github.com/cloudflare/mcp-server-cloudflare` | Administrar DNS, Workers y reglas desde Claude. Directo a tu servicio C1 (GEO). |
| Supabase MCP | `github.com/supabase-community/supabase-mcp` | Ya usas Supabase en OaxIntegra IA. |
| GitHub MCP | `github.com/github/github-mcp-server` | Issues, PRs, repos. |

### `01_NUCLEO_IA/claude/plantillas-CLAUDE-md/`

Aquí NO va nada descargado. Aquí escribes tú, y es de lo más rentable que vas a
hacer este mes.

Un `CLAUDE.md` es el archivo que Claude Code lee automáticamente al abrir un
proyecto. Escribe una plantilla por tipo de cliente (hotel, restaurante, cívico)
con: convenciones tuyas, stack, cómo se despliega, qué nunca se toca, tono de los
textos de cara al cliente. Cada cliente nuevo arranca copiando la plantilla.

**Esto es lo que hace que el cliente 8 te cueste la mitad de horas que el cliente 2.**
Sin esto no hay escala, y sin escala te saturas a los 12 clientes (ver
`01-CATALOGO` Parte 5).

### `01_NUCLEO_IA/openclaw/`

Sobre OpenClaw: **verifica en su repositorio oficial la forma actual de instalar
skills e integraciones antes de planear alrededor de una versión.** Este tipo de
proyecto se mueve rápido y no quiero que copies una instrucción que ya cambió.

Lo que sí puedo decirte con seguridad es **para qué debe servirte**, porque eso no
depende de la versión: es tu **operador**, no tu traductor (ver
`00-EVALUACION-CRITICA.md` § 3, Error 4). Tareas que le tocan:

- Vigilar el buzón de WhatsApp de tus clientes y avisarte de lo que se atoró.
- Disparar rutinas recurrentes: reporte de lunes, respaldo de viernes.
- Avisarte cuando el monitoreo detecte un bot caído.
- Preparar el resumen diario de qué pasó en cada cliente.

Lo que **no** le toca: recibir instrucciones de Gemini para pasárselas a Claude.

### `01_NUCLEO_IA/modelos-locales/`

Para cuando llegue la Mac. Una Apple Silicon de gama alta corre modelos locales
decentes, y eso es **costo marginal cero** en las tareas repetitivas.

| Qué | Fuente | Nota |
|---|---|---|
| Ollama | `github.com/ollama/ollama` | La forma más simple de correr modelos locales. |
| MLX / mlx-lm | `github.com/ml-explore/mlx` | De Apple, nativo para Apple Silicon. Más rápido que las alternativas en esa máquina. |
| Open WebUI | `github.com/open-webui/open-webui` | Interfaz de chat sobre modelos locales. |

Uso realista: clasificar mensajes, extraer datos de textos, generar borradores
masivos. **Para el bot que habla con el huésped, usa modelo de API**: la calidad
importa más que el ahorro cuando hay una reserva de por medio.

### `01_NUCLEO_IA/costos-y-limites/`

Una hoja de cálculo tuya, actualizada, con: precio por millón de tokens de cada
modelo que uses, precio por mensaje de WhatsApp por categoría en México, y límites
de los planes gratuitos que estés estirando.

**Sin esto no puedes cotizar.** Es la variable (A) de tu fórmula de precios y es lo
primero que te van a preguntar cuando quieras subir un precio.

---

## 02_CHATBOTS_Y_AUTOMATIZACION — donde vive el dinero

### `02_.../whatsapp/cloud-api-oficial/` ⭐ EMPIEZA AQUÍ, HOY

Guarda aquí la documentación de **WhatsApp Cloud API de Meta**, tus notas del
proceso de verificación, y las plantillas de mensaje que vayas mandando a aprobar.

**Esto es lo que arrancas esta semana**, antes que cualquier código, porque el
reloj de Meta no lo controlas tú (`00-EVALUACION-CRITICA.md` § 3, Error 1). Vas a
necesitar del hotel: acta constitutiva o alta en SAT, comprobante de domicilio y un
número que no esté ya registrado en WhatsApp normal.

### `02_.../whatsapp/no-oficial-RIESGO/`

La carpeta se llama así **a propósito**, para que cada vez que la abras te acuerdes.

| Qué | Fuente | La verdad sobre esto |
|---|---|---|
| Evolution API | `github.com/EvolutionAPI/evolution-api` | Multi-instancia, muy popular en LATAM. |
| WAHA | `github.com/devlikeapro/waha` | WhatsApp como API HTTP. |
| Baileys | `github.com/WhiskeySockets/Baileys` | La librería sobre la que corren casi todas. |
| whatsapp-web.js | `github.com/pedroslopez/whatsapp-web.js` | Automatiza WhatsApp Web. |

**Todas violan los términos de servicio de WhatsApp y el número se puede banear
sin aviso ni apelación.**

Piensa qué significa eso en tu caso concreto: el número baneado sería **el número
principal del hotel de tu tía**, el que está impreso en sus tarjetas, en Google, en
Booking y en el letrero de la entrada. No pierdes un bot: le desapareces el canal
de contacto del negocio, en plena temporada alta, y no hay a quién llamar.

Úsalas **solo** para: prototipos, tus propias pruebas, automatizaciones internas
con un número desechable. **Nunca** en el número principal de un cliente que te
está pagando. Este es de los pocos consejos de este documento que, si lo ignoras,
te cuesta la relación con tu primer cliente y con el gremio completo.

### `02_.../n8n/`

| Subcarpeta | Qué guardas | Fuente |
|---|---|---|
| `docker/` | n8n auto-hospedado | `github.com/n8n-io/n8n` |
| `docker/` | Kit de arranque IA oficial | `github.com/n8n-io/self-hosted-ai-starter-kit` — n8n + Ollama + Qdrant + Postgres armado. **Empieza por aquí.** |
| `workflows-plantilla/` | Tus flujos exportados en JSON | Los exportas tú. Uno por servicio del catálogo. |
| `nodos-comunidad/` | `n8n-nodes-evolution-api`, `n8n-nodes-mcp`, `n8n-nodes-chatwoot` | vía npm dentro de n8n |
| — | Biblioteca de plantillas oficial | `n8n.io/workflows` — miles de flujos listos. Búscalos por "hotel", "whatsapp", "booking". |

**`workflows-plantilla/` es tu activo real de esta carpeta.** El primer chatbot de
hotel te va a tomar 3 semanas. El quinto te tiene que tomar 2 días, y eso solo pasa
si exportas y parametrizas cada flujo en vez de rehacerlo.

### `02_.../motores-de-chat/`

| Qué | Fuente | Para qué |
|---|---|---|
| **Chatwoot** | `github.com/chatwoot/chatwoot` | Bandeja omnicanal con **traspaso a humano**. Casi obligatorio: ningún hotel acepta un bot sin que la recepcionista pueda tomar la conversación. |
| Typebot | `github.com/baptisteArno/typebot.io` | Flujos conversacionales visuales. Bueno para formularios y reservas guiadas. |
| Flowise | `github.com/FlowiseAI/Flowise` | Constructor visual de agentes con LLM. |
| Dify | `github.com/langgenius/dify` | Plataforma completa de apps con LLM. Más pesada, más completa. |

**Recomendación:** Chatwoot + n8n cubre el 90% de lo que vas a vender. No instales
las cuatro "por si acaso" — cada una es un servicio más que mantener y actualizar.

### `02_.../rag-y-conocimiento/`

Para que el bot sepa del hotel: manual, políticas, tarifas, FAQ.

| Qué | Fuente |
|---|---|
| Qdrant | `github.com/qdrant/qdrant` |
| pgvector | `github.com/pgvector/pgvector` — si ya usas Postgres/Supabase, **empieza aquí y no instales otra base** |
| Firecrawl | `github.com/mendableai/firecrawl` — convierte sitios web en texto limpio para ingestar |

### `02_.../plantillas-industria/`

Aquí no descargas nada. Aquí vive **tu producto empaquetado**: por cada giro, el
flujo n8n, los textos del bot, la base de conocimiento base y la lista de datos que
le tienes que pedir al cliente.

Cada carpeta llena es un producto que puedes vender otra vez sin volver a
construirlo.

---

## 03_WEBS_Y_RESERVAS

| Subcarpeta | Qué | Fuente |
|---|---|---|
| `stacks/` | **Astro** | `github.com/withastro/astro` — **tu opción por defecto**. Sitios estáticos rapidísimos, perfectos para hotel y restaurante, y el rendimiento ayuda al GEO. |
| `stacks/` | Next.js | `github.com/vercel/next.js` — solo cuando necesites app con sesión, no para un sitio informativo. |
| `stacks/` | Directus / Payload | `github.com/directus/directus`, `github.com/payloadcms/payload` — CMS para cuando el cliente quiera editar sin ti. |
| `componentes-ui/` | Tailwind + shadcn/ui | `github.com/tailwindlabs/tailwindcss`, `github.com/shadcn-ui/ui` |
| `motores-de-reserva/` | Cal.com | `github.com/calcom/cal.com` — auto-hospedable. Sirve para tours, mesas y citas. |
| `pagos-mexico/` | Stripe, Mercado Pago, Conekta, Clip | Sus SDKs oficiales. **Investiga comisiones reales de cada uno antes de recomendar**: es un número que el cliente te va a preguntar y que afecta su decisión. |
| `plantillas/` | Tus plantillas | Una por giro. Mismo principio que los workflows: la segunda web tiene que costarte 20% de la primera. |

---

## 04_GEO_Y_VISIBILIDAD

| Subcarpeta | Qué guardas |
|---|---|
| `datos-estructurados/` | Plantillas JSON-LD de schema.org para `Hotel`, `Restaurant`, `LocalBusiness`, `TouristAttraction`, `Event`. **Escríbelas una vez, revéndelas siempre.** |
| `llms-txt/` | La especificación de `llms.txt` (llmstxt.org) y tus plantillas por giro. |
| `cloudflare/` | Reglas, Workers, configuración de caché, y **tu nota sobre control de rastreadores de IA** |
| `perfiles-locales/` | Guías y listas de verificación: Google Business Profile, TripAdvisor, Google Maps. Consistencia de nombre, dirección y teléfono en todos lados. |
| `medicion-de-citas/` | Tu script para preguntarle mensualmente a ChatGPT, Gemini, Claude y Perplexity por el giro del cliente y registrar si aparece. **Este es el entregable que justifica la mensualidad de C1.** |

> **Repito la corrección porque es la que más caro sale:** Cloudflare no es GEO.
> Para GEO tienes que **permitir** deliberadamente a `GPTBot`, `ClaudeBot`,
> `PerplexityBot`, `Google-Extended` y `CCBot`. Si activas el bloqueo de IA de
> Cloudflare "porque suena a seguridad", vuelves invisible al cliente en el canal
> que le estás cobrando por conquistar.

Herramientas de medición: `github.com/GoogleChrome/lighthouse` y
`github.com/harlan-zw/unlighthouse` (audita el sitio completo, no una página).

---

## 05_DATOS_E_INTELIGENCIA

| Subcarpeta | Qué | Fuente |
|---|---|---|
| `scraping-tarifas/` | Playwright | `github.com/microsoft/playwright` |
| `scraping-tarifas/` | Crawlee | `github.com/apify/crawlee` — reintentos, colas, rotación. Robusto. |
| `calendario-oaxaca/` | **Lo construyes tú** | Ver abajo. |
| `dashboards/` | Metabase | `github.com/metabase/metabase` — tableros para clientes sin programar |
| `dashboards/` | Grafana | `github.com/grafana/grafana` — mejor para métricas técnicas |
| `observatorio/` | DuckDB | `github.com/duckdb/duckdb` — análisis local, rapidísimo, sin servidor |

### `calendario-oaxaca/` merece su propio párrafo

Un archivo con las fechas que mueven la ocupación en Oaxaca: Guelaguetza, Día de
Muertos, Noche de Rábanos, Semana Santa, puentes, festivales, congresos, ferias, y
el calendario escolar.

Es aburrido de construir y **es tu foso**. Ninguna herramienta internacional sabe
que la Noche de Rábanos llena el centro histórico. Es lo que hace que el servicio
A4 (Vigía de Tarifas) sea tuyo y no de cualquiera con una suscripción a una
herramienta gringa.

Dedícale una tarde este mes. Se paga solo con el primer cliente.

---

## 06_INFRAESTRUCTURA — lo que te deja dormir

| Subcarpeta | Qué | Fuente |
|---|---|---|
| `hostinger-vps/` | **Coolify** | `github.com/coollabsio/coolify` — ⭐ **la mejor recomendación de todo este documento.** PaaS auto-hospedado: instalas n8n, Chatwoot, Typebot y las webs de tus clientes desde una pantalla, con SSL automático. Te ahorra semanas. |
| `hostinger-vps/` | Dokploy | `github.com/Dokploy/dokploy` — alternativa si Coolify no te acomoda |
| `docker-compose/` | Tus stacks | Un `docker-compose.yml` por tipo de cliente, versionado |
| `monitoreo/` | **Uptime Kuma** | `github.com/louislam/uptime-kuma` — ⭐ **no vendas "24/7" sin esto instalado.** Te avisa por WhatsApp o Telegram antes de que el cliente se dé cuenta. |
| `monitoreo/` | Beszel o Netdata | `github.com/henrygd/beszel`, `github.com/netdata/netdata` — métricas del servidor |
| `seguridad-y-respaldos/` | restic | `github.com/restic/restic` — respaldos cifrados y automáticos |
| `seguridad-y-respaldos/` | Notas propias | Endurecimiento de SSH, UFW, fail2ban, rotación de llaves |
| `runbooks/` | **Lo escribes tú** | Uno por servicio: qué hacer cuando se cae. Ver abajo. |

### Los runbooks: escríbelos ahora, no cuando se caiga

Uno por servicio, una cuartilla, en formato "si pasa X, haz Y". Cuando se cae un
bot un sábado a las 11 de la noche y el hotel te está marcando, no vas a estar en
condiciones de improvisar.

Mínimos indispensables:
- El bot no responde
- Se acabó el saldo de WhatsApp / Meta rechazó una plantilla
- El VPS está lleno de disco
- Restaurar un cliente desde respaldo
- Se cayó el proveedor del modelo (¿cuál es el respaldo? — en OaxIntegra IA ya
  hiciste esto bien con la cadena Llama → Gemini → local. Repite ese patrón.)

**El orden importa:** la diferencia entre un freelance y un proveedor serio no es
el código, es tener respuesta a las 11 de la noche del sábado. Eso es literalmente
lo que justifica el componente (B) de tu fórmula de precios.

---

## 00_COMANDO — la parte que no es técnica y que decide si cobras

Casi nadie hace esta carpeta y es donde se muere la mayoría de los que sí saben
programar.

| Subcarpeta | Qué tiene que haber, este mes |
|---|---|
| `legal/` | Contrato de servicios, contrato de mensualidad con cláusula de 6 meses, convenio de confidencialidad, **aviso de privacidad**, cláusula de datos agregados y anonimizados (ver D1), acuerdo de nivel de servicio |
| `finanzas/` | Calculadora de precios (ya está: `calculadora-precios.js`), costos reales actualizados, control de ingresos, alta en SAT, cuenta bancaria del negocio |
| `ventas/` | Presentación de 10 diapositivas, plantilla de propuesta, casos de éxito con números, guion de la servilleta |
| `estrategia/` | Estos documentos. Reléelos cada mes. |
| `bitacora/` | Qué hiciste cada día. En 6 meses vas a querer saber por qué decidiste algo. |

Herramientas útiles aquí:
- **Documenso** — `github.com/documenso/documenso`, firma electrónica auto-hospedada
- **Facturación CFDI** — investiga Facturapi, Facturama y SW Sapien; los tres tienen
  API. Lo necesitas para ti **y** es la base de tu servicio C2.
- **Twenty** — `github.com/twentyhq/twenty`, CRM abierto, para cuando pases de 10
  prospectos. Antes de eso, una hoja de cálculo sirve mejor.

> **Prioridad honesta:** si este mes solo alcanzas a hacer una carpeta bien, que sea
> `legal/`. Un contrato de una cuartilla y bien redactado te protege más que
> cualquier repo de esta lista. Sin contrato, "cambios chiquitos" infinitos y
> mensualidades que nadie paga son cuestión de tiempo.

---

## Los skills que TÚ tienes que escribir

Descargar es lo fácil. Lo que te va a diferenciar son skills propios de tu
operación, que nadie más puede tener porque encapsulan tu forma de trabajar.
Escribe estos cinco este mes con `/skill-creator`, y guárdalos en
`01_NUCLEO_IA/claude/skills/`:

1. **`cotizador-oaxaca`** — recibe el giro y tamaño del negocio, aplica la fórmula
   de precios, y escupe la propuesta con la servilleta ya calculada con los números
   de ese cliente.
2. **`alta-cliente`** — crea la carpeta desde `_PLANTILLA_CLIENTE`, genera el
   `CLAUDE.md`, prepara el contrato y la lista de datos a pedir.
3. **`bot-hotel`** — genera el flujo de n8n y la base de conocimiento a partir de la
   información del hotel. **Este es el que convierte 3 semanas de trabajo en 2 días.**
4. **`auditoria-geo`** — audita un sitio (schema, llms.txt, velocidad, perfiles) y
   entrega el informe listo para presentar al cliente.
5. **`reporte-mensual`** — junta métricas de todos los clientes y genera el reporte
   de cada uno. **Este es el que evita que te cancelen**: el cliente que ve un
   reporte cada mes no se pregunta qué está pagando.

El #1 y el #5 son los que más dinero te van a hacer, y ninguno de los dos es
técnicamente difícil. Empieza por ahí.
