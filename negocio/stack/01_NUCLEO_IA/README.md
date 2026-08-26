# 01_NUCLEO_IA

El cerebro que se replica en todos los proyectos.

## La arquitectura corregida

```
Claude Code   →  motor único de desarrollo. Aquí vive el trabajo.
Gemini        →  segunda opinión y ventana larga. CONSULTOR, no intermediario.
OpenClaw      →  operador: vigila, dispara rutinas, avisa. NO traductor.
n8n           →  plomería del cliente, en producción, sin ti.
Hostinger     →  VPS con Coolify encima.
```

**Lo que se eliminó:** la cadena Gemini → dicta → OpenClaw → Claude. Es un
teléfono descompuesto: cada traspaso pierde contexto y ninguno agrega capacidad.
Ya te pasó en OaxIntegra IA cuando sacaste n8n del chat (`logs/pendientes.md`).
Mismo error, un nivel más arriba.

## Lo más rentable de esta carpeta

`claude/plantillas-CLAUDE-md/` — no se descarga, se escribe. Es lo que hace que el
cliente 8 te cueste la mitad de horas que el cliente 2. Sin esto no hay escala.
