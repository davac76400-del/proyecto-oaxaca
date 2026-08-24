# Empieza aquí

Tus llaves de Supabase **ya están puestas** (proyecto `OaxIntegra-IA`). Lo que
falta son dos cosas que solo se pueden hacer desde tu panel de Supabase.

Para ver en qué vas, en cualquier momento:

```bash
node revisar.js
```

---

## ⚠️ 1 · Que el código sea de 8 números

**Authentication → Sign In / Providers → Email:**

| Ajuste | Ponlo en |
|---|---|
| **Email OTP Length** | **8** |
| **Email OTP Expiration** | **600** (10 minutos) |

Si esto queda en 6, llegarán 6 números y la pantalla pedirá 8.

---

## ⚠️ 2 · La plantilla del correo — SIN ESTO NO LLEGA NINGÚN CÓDIGO

**Authentication → Emails → Magic Link.** Ahí se cambian las dos cosas:

**Asunto:**

```
Tu código para entrar a OaxIntegra IA
```

**Cuerpo:**

```html
<p>Hola, somos de OaxIntegra IA y te enviamos tu código de acceso.</p>

<p style="font-size:15px">Escribe estos 8 números en la página:</p>

<p style="font-size:34px; font-weight:bold; letter-spacing:8px; margin:18px 0">{{ .Token }}</p>

<p style="font-size:14px"><b>Guarda este número.</b> Con tu correo y estos 8 números entras siempre.</p>

<p style="font-size:13px; color:#666">Si no pediste entrar, no hagas nada.</p>
```

`{{ .Token }}` son los números. **Es lo único imprescindible.**

> `{{ .Token }}` **no es un número fijo**: es un hueco que Supabase rellena con
> uno recién generado al azar para cada persona y cada petición.

---

## 3 · Las tablas de la base — ✅ YA ESTÁ HECHO

Las apliqué yo el 24 de agosto con el conector, y las comprobé una por una.
No tienes que hacer nada aquí.

Si algún día montas el proyecto desde cero, es pegar en el **SQL Editor**, en
orden, los seis archivos de `backend/migraciones/`.

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
