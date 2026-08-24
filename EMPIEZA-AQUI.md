# Empieza aquí

## ✅ No tienes que configurar nada

Las llaves están puestas, las tablas aplicadas, y la app **funciona con
Supabase tal como viene de fábrica**. Solo:

```bash
cd frontend && python3 build.py && cd ..
npm start
```

Abre `http://localhost:3000`, regístrate con **tu propio correo**, y listo.

### Qué va a pasar

De fábrica, Supabase manda un correo con un **enlace**, no con números. No
importa: le das clic, entras, y **la app te inventa tu código de 8 números y
te lo enseña en pantalla**. Con ese código entras siempre después.

Probado: `node pruebas/sin-configurar.mjs` → 16 de 16.

Para ver el estado de tus llaves en cualquier momento: `node revisar.js`

---

## Lo opcional · que el correo traiga los números

Si prefieres que el correo llegue con el código escrito en vez de un enlace,
son dos cambios en tu panel de Supabase. **La app funciona igual sin esto.**

### 1 · Que el código sea de 8 números

**Authentication → Sign In / Providers → Email:**

| Ajuste | Ponlo en |
|---|---|
| **Email OTP Length** | **8** |
| **Email OTP Expiration** | **600** (10 minutos) |

La app acepta 6 u 8, así que esto es solo para que sea más difícil de adivinar.

### 2 · La plantilla del correo

**Authentication → Emails → Magic Link:**

**Asunto:**

```
Tu código para entrar a OaxIntegra IA
```

**Cuerpo:**

```html
<p>Hola, somos de OaxIntegra IA y te enviamos tu código de acceso.</p>

<p style="font-size:15px">Escribe estos números en la página:</p>

<p style="font-size:34px; font-weight:bold; letter-spacing:8px; margin:18px 0">{{ .Token }}</p>

<p style="font-size:14px"><b>Guarda este número.</b> Con tu correo y estos números entras siempre.</p>

<p style="font-size:13px; color:#666">Si no pediste entrar, no hagas nada.</p>
```

`{{ .Token }}` **no es un número fijo**: es un hueco que Supabase rellena con
uno recién generado al azar para cada persona.

---

## 4 · Probarlo

```bash
cd frontend && python3 build.py && cd ..
npm start
```

Abre `http://localhost:3000`, pon **tu propio correo**, y revisa que te llegue
el número. Con eso sabes que todo funciona.

---

## Lo opcional: la IA de verdad

Sin esto la app corre igual, pero el chat responde con su motor local en vez
de con la IA. Dos llaves gratis más:

| Llave | Dónde | Empieza con |
|---|---|---|
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) | `sk-or-v1-` |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | `AIza` |

---

## Cómo distinguir un dato real de un hueco

El error más común, y no es tuyo: los dos archivos se ven idénticos.

```bash
SUPABASE_ANON_KEY=tu_clave_anon_de_supabase   ← EL HUECO. No sirve.
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...  ← EL DATO.
```

**Si lo puedes leer y entender, no es la clave.**

`node revisar.js`, `python3 build.py` y `npm start` detectan esto solos y se
detienen antes de dejarte seguir con un dato falso.

---

## Lo que YA NO se usa

Si ves un `.env` con esto, es de una versión vieja del proyecto:

```
WHATSAPP_TOKEN   WHATSAPP_PHONE_ID   WHATSAPP_APP_SECRET
WEBHOOK_VERIFY_TOKEN   NGROK_AUTHTOKEN   URL_PUBLICA   N8N_WHATSAPP_URL
```

Todo lo de WhatsApp y Meta se quitó el 24 de agosto de 2026. `node revisar.js`
te avisa si siguen ahí.
