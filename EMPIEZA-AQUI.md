# Empieza aquí

Tus llaves de Supabase **ya están puestas** (proyecto `OaxIntegra-IA`). Lo que
falta son dos cosas que solo se pueden hacer desde tu panel de Supabase.

Para ver en qué vas, en cualquier momento:

```bash
node revisar.js
```

---

## ⚠️ 1 · La plantilla del correo — SIN ESTO NO LLEGA NINGÚN CÓDIGO

Supabase manda un **enlace**, no un código, hasta que le digas lo contrario.

**Authentication → Emails → Magic Link**. Ahí se cambian las dos cosas:

**Asunto:**

```
Tu código para entrar a OaxIntegra IA
```

**Cuerpo:**

```html
<p>Hola, somos de OaxIntegra IA y te enviamos este enlace de acceso para entrar a tu cuenta.</p>

<p style="font-size:15px">Escribe estos 6 números en la página:</p>

<p style="font-size:34px; font-weight:bold; letter-spacing:8px; margin:18px 0">{{ .Token }}</p>

<p style="font-size:14px">O si prefieres, <a href="{{ .ConfirmationURL }}">entra directo con este enlace</a>.</p>

<p style="font-size:13px; color:#666">
El código sirve una sola vez y vence en una hora.<br>
Si no pediste entrar, no hagas nada.
</p>
```

`{{ .Token }}` son los 6 números. **Es lo único imprescindible.**

> **Ojo, que es importante:** `{{ .Token }}` **no es un número fijo.** Es un
> hueco que Supabase rellena, al mandar cada correo, con un número recién
> generado al azar para esa persona. María recibe uno, Pedro otro, y si María
> pide otro el suyo anterior deja de servir en ese instante.
>
> Está comprobado en `pruebas/acceso.mjs`: seis peticiones dan seis códigos
> distintos, y el viejo devuelve 403 en cuanto se pide uno nuevo.
>
> Y aunque alguien adivinara un código, no le serviría: **el número va al
> correo de esa persona**, no al de quien lo pide. Aquí no hay «correos
> secundarios» — la cuenta *es* el correo.

> El nombre va tal cual: **OaxIntegra IA**. (Confirmado el 24 de agosto: lo
> de «Wax, integra IA» era la marca dictada en voz alta y partida en dos.)

---

## 2 · A dónde puede regresar el enlace

**Authentication → URL Configuration → Redirect URLs**, agrega:

```
http://localhost:3000/**
```

Y cuando lo publiques, también la dirección real de tu sitio.

---

## 3 · Las tablas de la base

Si no las apliqué yo con el conector, pega el contenido de
`backend/migraciones/001_perfiles.sql` en el **SQL Editor** de Supabase y dale
a *Run*. Es copiar y pegar, no hay que entenderlo.

Para comprobar que quedó: **Table Editor** debe mostrar una tabla `perfiles`.

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
