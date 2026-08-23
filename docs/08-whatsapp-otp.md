# Verificar el teléfono por WhatsApp

Cuando alguien se registra y deja su número, la app le manda un código de
6 dígitos por WhatsApp y se lo pide para confirmar que ese número es suyo.

**Ya está todo programado y probado.** Lo único que falta es que le digas por
dónde mandar los mensajes.

---

## Lo primero: pruébalo sin contratar nada

Viene configurado en **modo de prueba**. No manda ningún WhatsApp: escribe el
código en la terminal del servidor, y así puedes ver el flujo completo
funcionando ahora mismo.

```bash
node backend/servidor.js
```

Te registras con un teléfono cualquiera y en la terminal ves esto:

```
  ┌──────────────────────────────────────────────┐
  │  CÓDIGO DE VERIFICACIÓN (modo de prueba)     │
  │  Teléfono: +5219511234567                    │
  │  Código:   472591                            │
  └──────────────────────────────────────────────┘
```

Escribes ese código en la página y listo. **Nunca lo dejes así en producción**:
el código sale en la terminal, no en el teléfono de la persona.

---

## Para mandarlos de verdad: elige un camino

### Camino A · WhatsApp Cloud API de Meta ⭐ el que te recomiendo

Es el oficial. Tiene mil conversaciones gratis al mes, que para empezar sobra.

**Qué tienes que hacer:**

1. Entra a **https://developers.facebook.com** y crea una app de tipo
   «Empresa».
2. Agrégale el producto **WhatsApp**.
3. En **API Setup** te dan dos cosas que necesito:
   - **Phone number ID** (un número largo)
   - **Token de acceso** (empieza con `EAA...`)
4. Ve a **Message Templates** y crea una plantilla:
   - Categoría: **Authentication**
   - Nombre: `codigo_acceso`
   - Idioma: **Español (México)**
   - Meta la aprueba sola en unos minutos porque es de autenticación.
5. En tu `.env`:

```bash
WHATSAPP_PROVEEDOR=meta
WHATSAPP_PHONE_ID=el_numero_largo_que_te_dieron
WHATSAPP_TOKEN=EAA...
WHATSAPP_PLANTILLA=codigo_acceso
WHATSAPP_IDIOMA=es_MX
```

**Ojo con el token:** el que te dan al principio dura 24 horas. Para que no
se caiga cada día, genera uno permanente en
**Business Settings → Usuarios del sistema**.

---

### Camino B · Twilio

Más rápido de arrancar, pero cobra por mensaje.

1. Crea una cuenta en **https://twilio.com**
2. Activa el **WhatsApp Sandbox** (para probar) o pide un número propio
3. En tu `.env`:

```bash
WHATSAPP_PROVEEDOR=twilio
TWILIO_SID=AC...
TWILIO_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

### Camino C · Tu propio flujo de n8n

Si prefieres armarlo tú, la app le manda los datos a tu webhook y tu flujo se
encarga de enviar el WhatsApp.

```bash
WHATSAPP_PROVEEDOR=n8n
N8N_WHATSAPP_URL=https://tu-cuenta.app.n8n.cloud/webhook/whatsapp
N8N_SECRETO=inventa-aqui-una-contrasena-larga
```

**Lo que va a recibir tu flujo** (un POST con este JSON):

```json
{
  "accion": "codigo_whatsapp",
  "telefono": "5219511234567",
  "codigo": "472591",
  "vigencia_minutos": 10
}
```

Y la cabecera `X-OaxIntegra-Secreto` con lo que hayas puesto en `N8N_SECRETO`.

**Tu flujo debe:**
1. Nodo **Webhook** (POST)
2. Un **IF** que compare la cabecera con tu secreto — si no coincide, corta.
   Sin esto, cualquiera que adivine tu dirección puede mandar WhatsApps a
   nombre tuyo.
3. Nodo de WhatsApp (el de Twilio, el de Meta o el que uses) con un texto tipo:
   > Tu código de OaxIntegra IA es **{{$json.codigo}}**. Vence en
   > {{$json.vigencia_minutos}} minutos. No se lo compartas a nadie.
4. Nodo **Respond to Webhook** devolviendo cualquier cosa con código 200.

---

## Cómo pongo esto en producción

```bash
# en tu computadora: en el archivo .env
# en Netlify: Site settings → Environment variables
# en Vercel:  Project Settings → Environment Variables
```

**Y una cosa más, importante:** inventa una contraseña larga y ponla en
`OTP_SECRETO`. Con ella se protegen los códigos guardados.

---

## ⚠️ Un límite que tienes que conocer

Los códigos se guardan **en la memoria del servidor**. Eso funciona perfecto
con `backend/servidor.js` corriendo en un hosting normal.

**Pero en Netlify y Vercel las funciones se apagan entre llamadas**, así que
la memoria se borra: se manda el código y al comprobarlo ya no existe.

Tienes dos salidas:

1. **Publicar `backend/servidor.js` en un hosting que lo mantenga encendido**
   (Railway, Render, Fly.io, un VPS). Es lo más simple y funciona tal cual.
2. **Guardar los códigos fuera de la memoria** (Upstash Redis tiene tarifa
   gratuita). Habría que cambiar los dos `Map` de `backend/otp-core.js` por
   llamadas a Redis. Son unas 20 líneas; dime y te lo hago.

---

## Lo que ya está protegido

No hace falta que hagas nada de esto, ya está hecho y probado:

| Protección | Cómo funciona |
|---|---|
| Códigos de verdad al azar | `crypto.randomInt`, no `Math.random` |
| No se guardan en claro | Se guarda su huella (HMAC-SHA256) |
| Vencen | A los 10 minutos |
| Un solo uso | Al acertar, el código se quema |
| Máximo de intentos | 5, y luego hay que pedir otro |
| Espera entre envíos | 60 segundos |
| Tope por hora | 5 códigos por número |
| Comparación segura | En tiempo constante, no revela dígitos |

---

## La regla que no se rompe

**La verificación nunca puede impedir que alguien se registre.**

Si el servidor no tiene WhatsApp configurado, o si falla, o si la persona
nunca recibe el mensaje, la app **sigue de largo** y guarda el número marcado
como no verificado. También hay un botón **«Seguir sin verificar»** a la vista.

Esto es a propósito: el **BUG-04** de este proyecto fue exactamente que el
teléfono bloqueaba el registro entero. No se repite.

En la cuenta queda el dato:

```json
{ "telefono": "+52 9511234567", "telefonoVerificado": true }
```
