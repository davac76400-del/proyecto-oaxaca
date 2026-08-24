# La inteligencia artificial del asistente

**Actualizado el 23 de agosto de 2026 — las llaves ya no viven en el HTML.**

El chat no pasa por n8n, ni por conectores, ni por MCP. Pero tampoco llama a la
IA desde el navegador: **las llaves viven en el servidor**, porque cualquiera
puede leer el código de una página web.

---

## Cómo funciona ahora

```
  navegador  ──POST──►  /api/ia  ──►  Llama 3.2   (gratis, el principal)
  (sin llaves)          (backend)      └─ si falla ─►  Gemini Flash (gratis)
                                                        └─ si falla ─►  motor local
```

- El **navegador** no conoce ninguna llave. Solo sabe pedirle a `/api/ia`.
- El **backend** guarda las llaves en variables de entorno y hace la cadena.
- El **motor local** (dentro del HTML) sigue ahí como último recurso: si no hay
  internet o el servidor no contesta, el emprendedor igual recibe algo útil.

| Archivo | Para qué |
|---|---|
| `backend/ia-core.js` | Toda la lógica y el único lugar que lee las llaves |
| `backend/servidor.js` | Servidor para tu computadora (app + `/api/ia`) |
| `netlify/functions/ia.js` | Envoltorio si publicas en Netlify |
| `api/ia.js` | Envoltorio si publicas en Vercel |
| `.env` | Tus llaves. **Nunca se sube a GitHub.** |
| `.env.example` | La plantilla, sin llaves, que sí se sube |

---

## 1 · Trabajar en tu computadora

Ya no hace falta subir nada a Netlify para probar un cambio.

```bash
# una sola vez: crea tu archivo de llaves
cp .env.example .env
# abre .env y pega tus dos llaves

# construye la app
cd frontend && python3 build.py && cd ..

# arranca todo
node backend/servidor.js
```

Y abres **http://localhost:3000**

Eso levanta la app y el asistente juntos, en la misma dirección. Como todo sale
del mismo sitio, **no hay problemas de CORS** y **no existe el problema del
`file://`** del doble clic.

No necesitas `npm install`: el servidor solo usa lo que ya trae Node (versión 18
o más nueva).

Para detenerlo: `Control + C`.

### Las dos llaves (gratis, 2 minutos)

- **Llama 3.2** → https://openrouter.ai/keys — empieza con `sk-or-v1-`
- **Gemini Flash** → https://aistudio.google.com/apikey — empieza con `AIza`

Van en tu `.env` así:

```bash
OPENROUTER_API_KEY=sk-or-v1-loquetehayandado
GEMINI_API_KEY=AIzaloquetehayandado
```

Puedes poner solo una si quieres; funciona igual, nada más sin respaldo.

---

## 2 · Publicar

### En Netlify

1. Sube el proyecto (el `netlify.toml` ya está configurado).
2. **Site settings → Environment variables**, y agregas:
   - `OPENROUTER_API_KEY`
   - `GEMINI_API_KEY`
3. Listo. El `netlify.toml` ya manda `/api/ia` hacia la función.

### En Vercel

1. Sube el proyecto.
2. **Project Settings → Environment Variables**, las mismas dos.
3. `api/ia.js` queda publicado solo en `/api/ia`.

En los dos casos **las llaves se escriben en el panel del servicio, nunca en el
código**. Si cambias una llave, no hace falta reconstruir la app.

---

## 3 · El candado del build

`frontend/build.py` ahora **se niega a construir** si encuentra algo con forma
de llave dentro de `app.src.html`:

```
✗ ALTO. Encontré 1 posible(s) llave(s) en app.src.html:
    · una llave de OpenRouter  (sk-or-v1-abc…)

  Las llaves NUNCA van en el HTML: cualquiera que abra la página
  puede leerlas. Quítala del código y ponla en el archivo .env
```

Detecta llaves de OpenRouter, Gemini/Google, OpenAI, Anthropic, Groq, GitHub y
Slack. Está ahí para que ni un despiste ni otra IA que edite el archivo puedan
volver a hornear una llave en el entregable.

### Si tu backend está en otro dominio

Por defecto la app llama a `/api/ia`, una dirección relativa que funciona igual
en tu computadora, en Netlify y en Vercel. Si algún día pones el backend
aparte, se lo dices al construir, sin editar el código:

```bash
OAXINTEGRA_API_URL=https://mi-api.com/api/ia python3 build.py
```

---

## 4 · Cómo saber si está funcionando

Arriba a la derecha del chat hay una insignia:

| Dice | Significa |
|---|---|
| **Asistente listo** | Contestó Llama 3.2, todo normal |
| **Asistente listo · respaldo** | Llama no pudo, contestó Gemini |
| **Sin conexión · modo local** | No hubo respuesta; contesta el motor de adentro |
| **Modo local** | El servidor no tiene llaves puestas |

**Tócala** y hace una prueba real contra el servidor: te dice cuál de los dos
falló y por qué, en español normal. Los avisos de error pasan por un filtro que
**tacha cualquier llave** antes de mostrarlos, por si el proveedor la repitiera
dentro de su mensaje.

---

## 5 · Si algún día deja de funcionar

El nombre del modelo puede cambiar si el proveedor lo retira. **No hace falta
tocar el código:** se cambia en el `.env` (o en el panel de Netlify/Vercel).

```bash
# busca uno que termine en :free en https://openrouter.ai/models?q=llama
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
GEMINI_MODEL=gemini-2.0-flash
```

Mientras eso pasa, **Gemini sigue contestando** y la página no se rompe: para
eso está la cadena.

---

## 6 · Detalles técnicos

- **Contrato de `/api/ia`** — recibe:
  ```json
  { "message": "…", "username": "…", "businessType": "…",
    "historial": [ { "rol": "user", "texto": "…" } ] }
  ```
  y devuelve:
  ```json
  { "output": "…", "origen": "llama" | "gemini" | "", "fallos": { } }
  ```
  Si `output` viene vacío, el navegador usa su motor local.

- **`/api/estado`** — dice si el servidor tiene llaves (`true`/`false`),
  **nunca las llaves**. Sirve para que la insignia no mienta al cargar.

- **No se confía en lo que manda el navegador:** el mensaje se recorta a 4000
  caracteres, el historial a 6 turnos, y se descarta cualquier rol inventado.
  El cuerpo de la petición está topado a 256 KB.

- **Memoria de la plática:** se mandan las últimas 6 vueltas, para que el
  usuario pueda decir "más corto" sin repetir todo (el tutorial de la app le
  pide justo eso).

- **Tiempo de espera:** 20 segundos por ayudante (`IA_TIMEOUT_MS`).

- **La personalidad** vive en `promptMaestro()` dentro de `ia-core.js`: español
  mexicano cálido, cero tecnicismos, material listo para usar, respeto al
  oficio artesanal.

- **La estructura de la respuesta** (tarjeta de publicación, imagen, botones)
  la sigue armando el motor local; el texto de la IA se mete *dentro*. Así la
  redacción es de la IA real pero no se pierde el formato.

- **Ya no queda n8n en ninguna parte** (24 ago 2026). Las altas de cuenta las
  lleva Supabase con el enlace por correo (`docs/08-magic-link.md`), y el
  formulario de contacto abre el correo o el WhatsApp del negocio con el
  mensaje ya escrito, sin webhook de por medio.

- **Si abres el HTML con doble clic** (sin servidor), no hay `/api/ia` que
  responda y el chat usa el motor local. Es lo esperado: para la IA real,
  usa `node backend/servidor.js`.
