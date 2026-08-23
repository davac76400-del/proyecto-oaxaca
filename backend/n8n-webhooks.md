# n8n — webhooks, historial y por qué falla

## URLs REALES en uso

| Uso | URL | Estado |
|---|---|---|
| **Chat / IA** | `https://gamon2.app.n8n.cloud/webhook/chat` | ⚠️ cae en modo local |
| **Registro** | `https://davidrr7630.app.n8n.cloud/webhook/3ffe0c04-73c3-42a7-973d-2b5f8ec4d37d` | funciona (no bloquea) |

### URLs históricas (ya no en uso)
- `https://davidrr7630.app.n8n.cloud/webhook/chat` — instancia anterior del chat
- `https://davidrr7630.app.n8n.cloud/webhook/student-intent` — del proyecto hermano HoStudyQuestor

**Cuenta n8n:** el autor tiene al menos dos instancias en n8n Cloud:
`davidrr7630.app.n8n.cloud` y `gamon2.app.n8n.cloud`.

**IA conectada actualmente:** Google Gemini (el autor mencionó querer cambiarla).

---

## Configuración exigida en n8n

### Nodo 1 — Webhook (entrada)
```
HTTP Method:     POST
Path:            chat
Respond:         Using 'Respond to Webhook' node    ← CRÍTICO
Options:
  └─ Allowed Origins (CORS):  *                     ← CRÍTICO
```

### Nodo 2 — La IA
Gemini / OpenAI / Claude / el que sea. Recibe `{{ $json.body.message }}`.

**Prompt de sistema sugerido para el contexto oaxaqueño:**
```
Eres el asistente de OaxIntegra IA, hecho para emprendedores oaxaqueños
tradicionales (artesanos, mezcaleros, cocineros, comerciantes).

Reglas:
- Habla en español mexicano cálido y sencillo. Nada de tecnicismos.
- Nunca digas "prompt", "token", "endpoint", "IA generativa".
- El usuario vende: {{ $json.body.businessType }}
- Entrega SIEMPRE material listo para usar (una publicación, un precio, una
  descripción), no consejos vagos.
- Respeta y valora el trabajo artesanal. La IA acompaña, no reemplaza.
- Máximo 200 palabras salvo que pidan más.
```

### Nodo 3 — Respond to Webhook (salida)
```
Respond With:  JSON
Body:          { "output": "{{ $json.text }}" }
Response Headers:
  Access-Control-Allow-Origin:   *
  Access-Control-Allow-Methods:  POST, OPTIONS
  Access-Control-Allow-Headers:  Content-Type
```

### Y lo más olvidado
El interruptor **"Active"** (arriba a la derecha) debe estar ENCENDIDO.
El botón "Execute workflow" **solo sirve para pruebas** y se apaga en segundos.

---

## POR QUÉ FALLA — las 3 causas, en orden de probabilidad

### Causa 1 — El flujo no está activo (la más común)
Síntoma: el navegador reporta que no llegó nada, error de red.
Con "Execute workflow" la URL vive unos segundos y muere.
**Arreglo:** encender "Active".

### Causa 2 — Falta CORS
Síntoma en consola (F12):
```
Access to fetch at 'https://…/webhook/chat' from origin 'null' has been
blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```
El servidor SÍ responde, pero el navegador descarta la respuesta por seguridad.
**Arreglo:** poner `*` en Allowed Origins del nodo Webhook, y el header en el
nodo Respond.

⚠️ **Nota importante:** si abres el HTML con doble clic, el origen es `null`
(protocolo `file://`). Algunos servidores rechazan `null` aunque tengan `*`.
**Prueba a subir el archivo a un hospedaje real** (Netlify, Vercel, GitHub
Pages) antes de concluir que n8n está mal. Esto puede ser la causa real
del problema que el autor no ha logrado resolver.

### Causa 3 — El flujo no devuelve texto
Síntoma: respuesta vacía, 200 OK pero sin contenido.
**Arreglo:** el último nodo debe ser "Respond to Webhook" devolviendo el texto.

---

## Cómo diagnosticar (procedimiento para el autor)

1. Abrir la app, mandar un mensaje en el chat
2. Presionar **F12** → pestaña **Console**
3. Leer el texto en rojo:
   - dice "CORS" → Causa 2
   - dice "Failed to fetch" / "ERR_" sin CORS → Causa 1
   - no hay error pero llega vacío → Causa 3
4. También sirve el **botón de diagnóstico** integrado: la insignia
   "modo local" en el chat es clicable y corre la prueba en pantalla.

---

## RECOMENDACIÓN FUERTE: abandonar n8n para el chat

n8n añade una capa intermedia que ha costado semanas de depuración sin
resolverse. Para este caso de uso —una llamada simple a un modelo de IA— **es
más simple, rápido y barato llamar a la IA directamente**.

Ver `ai_service_directo.js` (para el navegador) y `ai_service_directo.py`
(si se monta un pequeño backend).

**Ventajas:** sin CORS intermedio, sin flujos que se apagan, menos latencia,
menos piezas que fallen.

**Advertencia de seguridad:** llamar a la IA desde el navegador expone la
clave de API. Para producción, la clave debe vivir en un backend mínimo
(una función serverless de Netlify/Vercel basta, ~20 líneas).

---

## Alternativas de IA sugeridas (el autor pidió cambiar Gemini)

| Proveedor | Ventaja | Nota |
|---|---|---|
| **OpenAI** (GPT-4o mini) | Nodo dedicado en n8n, muy fácil, barato | la opción más simple |
| **Anthropic Claude** (Haiku/Sonnet) | Excelente español y redacción — ideal para esta app | recomendada por calidad de texto |
| **DeepSeek** | Muy económica | buena relación costo/calidad |
| **Groq** (Llama) | Extremadamente rápida | gratis con límites |

Cambiar de IA **no requiere tocar el código de la página**: solo se cambia el
nodo dentro del flujo de n8n, o el endpoint en `ai_service_directo.js`.
