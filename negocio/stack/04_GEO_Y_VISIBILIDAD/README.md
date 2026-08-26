# 04_GEO_Y_VISIBILIDAD

Que la IA recomiende a tus clientes cuando un turista pregunta
"¿mejor hotel boutique en el centro de Oaxaca?".

## Corrección importante

**Cloudflare no es una herramienta de GEO.** Es CDN, borde y control de
rastreadores — y su función más publicitada es justo la contraria: *bloquear*
rastreadores de IA.

Para GEO necesitas lo opuesto: **permitir deliberadamente** a `GPTBot`,
`ClaudeBot`, `PerplexityBot`, `Google-Extended` y `CCBot`, y darles contenido
estructurado que puedan citar.

Si activas el bloqueo de IA "porque suena a seguridad", vuelves invisible al
cliente en el canal que le estás cobrando por conquistar.

**El GEO son los datos estructurados y el contenido. Cloudflare es el vehículo.**

## El entregable que justifica la mensualidad

`medicion-de-citas/` — el script que cada mes le pregunta a ChatGPT, Gemini, Claude
y Perplexity por el giro del cliente y registra si aparece. Sin ese reporte, la
mensualidad de C1 no se sostiene en la segunda renovación.
