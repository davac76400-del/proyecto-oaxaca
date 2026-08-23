# La inteligencia artificial del asistente (conexión directa)

**Desde el 23 de agosto de 2026 el chat ya no pasa por n8n.**
El navegador le habla directo a la IA. Sin conectores, sin MCP, sin
intermediarios. Esto cierra el BUG-13, que llevaba abierto todo el proyecto.

---

## Los dos ayudantes, en orden

| # | Quién | Para qué | Cuesta |
|---|---|---|---|
| 1 | **Llama 3.2** (vía OpenRouter) | Contesta casi siempre | Gratis |
| 2 | **Gemini Flash** (Google) | Entra solo si Llama no pudo | Gratis |
| 3 | **Motor local** (dentro del archivo) | Si no hay internet o fallan los dos | Gratis |

El paso 3 ya existía y **no se quitó**: garantiza que el emprendedor nunca se
quede sin respuesta, aunque se caiga todo.

---

## Cómo encenderla (una sola vez, lo haces tú)

Al usuario final **nunca** se le pide una llave. Las pones tú aquí y ya
funciona para toda la gente que entre a la página.

### 1 · Saca las dos llaves (gratis, 2 minutos)

- **Llama 3.2** → https://openrouter.ai/keys
  Te da una llave que empieza con `sk-or-v1-...`
- **Gemini Flash** → https://aistudio.google.com/apikey
  Te da una llave que empieza con `AIza...`

### 2 · Pégalas en el archivo fuente

Abre `frontend/app.src.html`, busca `CONFIG_IA` (está cerca del inicio del
`<script>`) y llena las dos líneas que dicen `CLAVE`:

```js
var CONFIG_IA = {
  LLAMA: {
    CLAVE:  'sk-or-v1-loquetehayandado',
    URL:    'https://openrouter.ai/api/v1/chat/completions',
    MODELO: 'meta-llama/llama-3.2-3b-instruct:free'
  },
  GEMINI: {
    CLAVE:  'AIzaloquetehayandado',
    MODELO: 'gemini-2.0-flash'
  },
  PROXY: ''
};
```

### 3 · Reconstruye la app

```bash
cd frontend && python3 build.py
```

Eso regenera `dist/OaxIntegra-IA-app.html`. **Nunca edites `dist/` a mano.**

### 4 · Súbela a un hospedaje real

Netlify Drop, Vercel o GitHub Pages. **No la pruebes con doble clic:** abrir el
archivo así hace que algunos servicios rechacen la respuesta (fue una de las
causas sospechadas del BUG-13). Para probar en tu compu:

```bash
cd dist && python3 -m http.server 3000
# y entras a http://localhost:3000/OaxIntegra-IA-app.html
```

---

## ⚠️ Lo que tienes que saber de las llaves

Cuando pegas una llave en el archivo, **queda escrita dentro del HTML**.
Cualquiera que abra tu página y mire el código fuente puede verla.

Como las dos son gratuitas, el riesgo **no es que te cobren**: es que alguien
te consuma el límite gratuito del día. Para un proyecto como este es un
intercambio aceptable, y es la única forma de que funcione sin pedirle nada al
emprendedor.

**Si algún día quieres esconderlas de verdad,** monta el proxy que está al
final de `backend/ai_service_directo.js` (es una función de Netlify, se
despliega en minutos) y pon su dirección en `CONFIG_IA.PROXY`. Cuando `PROXY`
tiene algo escrito, se usa eso y se ignoran las llaves de arriba.

---

## Cómo saber si está funcionando

Arriba a la derecha del chat hay una insignia:

| Dice | Significa |
|---|---|
| **Asistente listo** | Contestó Llama 3.2, todo normal |
| **Asistente listo · respaldo** | Llama no pudo, contestó Gemini |
| **Sin conexión · modo local** | Ninguno contestó; responde el motor de adentro |
| **Modo local** | Todavía no has puesto ninguna llave |

**Tócala** y hace una prueba real: te dice cuál de los dos falló y por qué, en
español normal.

---

## Si algún día deja de funcionar

El nombre del modelo puede cambiar si el proveedor lo retira. Si la insignia
dice que Llama falla con un aviso tipo "modelo no encontrado", entra a
https://openrouter.ai/models?q=llama+3.2 y copia el nombre exacto de un modelo
que termine en `:free`, y pégalo en `CONFIG_IA.LLAMA.MODELO`.

Mientras eso pasa, **Gemini sigue contestando** y la página no se rompe: para
eso está la cadena.

---

## Detalles técnicos

- **Memoria de la plática:** se mandan las últimas 6 vueltas de la
  conversación, para que el usuario pueda decir "más corto" o "cámbiale el
  final" sin repetir todo (el tutorial de la app le pide justo eso).
- **Tiempo de espera:** 20 segundos por ayudante (`CONFIG.LIMITE_MS`), con
  `AbortController`. Si se pasa, se intenta el siguiente.
- **La personalidad** vive en `promptMaestroChat()`: español mexicano cálido,
  cero tecnicismos, material listo para usar, respeto al oficio artesanal.
- **La estructura de la respuesta** (tarjeta de publicación, imagen, botones)
  la sigue armando el motor local; el texto de la IA se mete *dentro*. Así la
  redacción es de la IA real pero no se pierde el formato.
- **n8n sigue usándose para las altas de cuenta** (`WEBHOOK_REGISTRO`) y para
  el formulario de contacto. Eso es aparte del chat y no se tocó.
