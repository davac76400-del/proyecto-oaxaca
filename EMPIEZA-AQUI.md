# Empieza aquí

Necesito **dos datos tuyos** para que la app funcione. Nada más dos.
Son gratis y se sacan en unos minutos.

Si en algún momento te pierdes, corre esto y te dice exactamente en qué vas:

```bash
node revisar.js
```

---

## ⚠️ Lo primero: cómo distinguir el dato real del hueco

Este es **el error más común**, y no es tuyo: es que los dos archivos se ven
idénticos.

Cuando una IA te da un `.env`, muchas veces te da el **formulario en blanco**:

```bash
# ESTO ES EL HUECO — no sirve
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
```

Fíjate: dice **«tu-proyecto»** y **«tu_clave»**. Eso es la instrucción de dónde
va el dato, no el dato.

El de verdad se ve así:

```bash
# ESTO SÍ SIRVE
SUPABASE_URL=https://xkqpwmnvbdlqrtyu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZ...
```

Letras y números que no significan nada. **Si lo puedes leer y entender, no es
la clave.**

`node revisar.js` detecta esto solo y te lo dice. También lo detectan
`python3 build.py` y el servidor al arrancar: los tres se detienen antes de
dejarte seguir con un dato falso.

---

## Dato 1 y 2 · Supabase (para que la gente pueda entrar)

### Paso 1 — Crear la cuenta

Ve a **[supabase.com](https://supabase.com)** → *Start your project*.
Entra con tu Google (`davrore2011@gmail.com`). Es gratis, no pide tarjeta.

### Paso 2 — Crear el proyecto

Botón verde **New project**.

| Campo | Qué poner |
|---|---|
| Name | `oaxintegra` |
| Database Password | Invéntala y guárdala. **No es ninguno de los dos datos que necesito**, pero la vas a querer después. |
| Region | `East US (North Virginia)` — el más cercano de los gratis |

Tarda unos 2 minutos en estar listo.

### Paso 3 — Copiar los dos datos

Menú de la izquierda → **Settings** (el engrane) → **API**.

Ahí vas a ver tres cosas. **Copia las dos primeras:**

```
Project URL          https://xkqpwmnvbdlqrtyu.supabase.co      ← DATO 1
                     
Project API keys
  anon    public     eyJhbGciOiJIUzI1NiIsInR5cCI6...           ← DATO 2
  service_role       eyJhbGciOiJIUzI1NiIsInR5cCI6...           ← ⛔ ESTA NO
```

> **La tercera no la toques.** `service_role` se salta todas las reglas de
> seguridad: quien la tenga puede borrar tu base de datos completa. Se parecen
> muchísimo, las dos empiezan con `eyJ`.
>
> Si te equivocas, no pasa nada: `revisar.js` abre la llave, ve por dentro que
> dice `service_role`, y se detiene antes de que llegue a ningún lado. Ya lo
> probé.

### Paso 4 — Pegarlos

```bash
cp .env.example .env
```

Abre el `.env` con el Bloc de notas y pega tus dos datos:

```bash
SUPABASE_URL=https://xkqpwmnvbdlqrtyu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Comprueba que quedaron bien:

```bash
node revisar.js
```

### Paso 5 — Decirle a Supabase a dónde regresar

**Este paso se lo salta casi todo el mundo**, y si falta, el enlace del correo
no lleva a ningún lado.

En Supabase: **Authentication** → **URL Configuration** → **Redirect URLs** →
*Add URL*, y agrega estas dos:

```
http://localhost:3000/**
https://tu-sitio-real.com/**
```

(La segunda, cuando ya lo tengas publicado.)

### Paso 6 — Arrancar

```bash
cd frontend && python3 build.py && cd ..
npm start
```

Abre `http://localhost:3000` y pruébalo con tu propio correo.

---

## Y el texto del correo

En Supabase: **Authentication** → **Emails** → **Magic Link**.

Pega esto en el cuerpo:

```html
<p>Hola, somos de Wax, integra IA y te enviamos este enlace de acceso para entrar a tu cuenta.</p>

<p><a href="{{ .ConfirmationURL }}">Entrar a mi cuenta</a></p>

<p>El enlace sirve una sola vez y vence en una hora.<br>
Si no pediste entrar, no hagas nada.</p>
```

`{{ .ConfirmationURL }}` es lo único que no se puede cambiar.

> **Nota:** el texto quedó tal cual lo pediste. Pero «Wax, integra IA» se lee
> como tu marca dictada en voz alta — **OaxIntegra IA** partido en dos. Si era
> eso, cámbialo ahí mismo; no hace falta tocar código.

---

## Lo opcional: la IA de verdad

Sin esto la app funciona igual, pero el chat responde con su motor local en
vez de con la IA. Son dos llaves más, también gratis:

| Llave | Dónde | Empieza con |
|---|---|---|
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) | `sk-or-v1-` |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | `AIza` |

Detalle completo en `docs/06-ia-directa.md`.

---

## Lo que YA NO se usa

Si tienes un `.env` viejo con esto, **bórralo**: son de una versión anterior del
proyecto y ya no hacen nada.

```bash
WHATSAPP_TOKEN          WHATSAPP_PHONE_ID       WHATSAPP_APP_SECRET
WEBHOOK_VERIFY_TOKEN    NGROK_AUTHTOKEN         URL_PUBLICA
N8N_WHATSAPP_URL        OTP_SECRETO             WHATSAPP_PROVEEDOR
```

El webhook de WhatsApp y todo lo de Meta se quitaron el 24 de agosto de 2026,
cuando el acceso pasó a ser por correo. `node revisar.js` te avisa si siguen
ahí.

**Si una IA te da un `.env` con estas variables, esa IA está trabajando con una
versión vieja del proyecto.** No es que esté mal: es que no vio los cambios.
