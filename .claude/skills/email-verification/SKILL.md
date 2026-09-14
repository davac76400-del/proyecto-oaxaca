---
name: email-verification
description: Procedimiento completo para implementar verificación de email con OTP en Supabase + Resend
---

# Email de Verificación con OTP · Procedimiento Completo

## 📋 Resumen Ejecutivo

Implementar verificación de email con código OTP usando:
- **Supabase Auth** (gestiona usuarios y tokens)
- **Resend API** (envía emails)
- **Edge Function** (backend sin servidor, firma JWT, genera HTML)
- **Frontend** (interfaz de ingreso de código)

**Tiempo estimado:** 2-3 horas
**Costo:** Resend (gratis los primeros 100 emails/día)

---

## 🚨 Errores Que Cometimos (EVITAR)

### 1. verify_jwt activado en la función (¡ERROR CRÍTICO!)
**Problema:** Supabase requería autenticación, pero el email viene del propio Supabase Auth sin JWT válido.
```typescript
// ❌ MALO - Causa 401
export const config = { jwt: { verify: true } };
```
**Solución:**
```typescript
// ✅ BIEN - Sin verificación (confiamos en la firma)
export const config = { jwt: { verify: false } };
```

### 2. Modelo Gemini retirado (gemini-2.0-flash no existe)
**Problema:** Intentamos usar modelo que Google discontinuó.
```javascript
// ❌ MALO
GEMINI_MODELO: 'gemini-2.0-flash',
```
**Solución:**
```javascript
// ✅ BIEN - Usar gemini-3.6-flash (el más nuevo disponible gratis)
GEMINI_MODELO: 'gemini-3.6-flash',
```

### 3. No validar respuesta de API en frontend
**Problema:** Si la API devuelve null/undefined, se renderizan elementos vacíos sin error.
```javascript
// ❌ MALO
function nodoIA(res) {
  var p = document.createElement('p');
  p.innerHTML = res.texto; // ¿Qué si res es null?
}
```
**Solución:**
```javascript
// ✅ BIEN - Validar primero
function nodoIA(res) {
  if (!res || typeof res !== 'object') { return document.createElement('div'); }
  var p = document.createElement('p');
  p.innerHTML = res.texto;
}
```

### 4. Concatenar URLs en atributo HTML (XSS)
**Problema:** Si la URL contiene caracteres especiales, rompe el HTML.
```javascript
// ❌ MALO - XSS
dentro += '<img src="' + foto + '" alt="Foto">';
```
**Solución:**
```javascript
// ✅ BIEN - DOM seguro
var img = document.createElement('img');
img.src = foto;
img.alt = 'Foto que mandaste';
elemento.appendChild(img);
```

### 5. localStorage compartida entre usuarios
**Problema:** Usuario A cierra sesión, Usuario B logea en la misma máquina y ve historial de A.
```javascript
// ❌ MALO - No limpia
sesion = null;
almacen.borrar(CLAVE_SESION);
```
**Solución:**
```javascript
// ✅ BIEN - Limpiar todo primero
almacen.borrar(claveConvs()); // Conversaciones del usuario anterior
sesion = null;
almacen.borrar(CLAVE_SESION);
```

---

## 🔧 Configuración Step by Step

### Paso 1: Variables de Entorno (.env)

```bash
# Resend API
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXX

# Supabase (ya debes tener)
SUPABASE_URL=https://pnexvkjnwbyaiwcwyrev.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# URL pública de tu app (para enlaces en el email)
PUBLIC_URL=http://localhost:3000

# Email desde el cual se envía
RESEND_FROM_EMAIL=noreply@oaxintegra.local
```

**Dónde obtener:**
- **RESEND_API_KEY:** https://resend.com/api-keys
- **SUPABASE_URL/KEY:** Supabase dashboard → Settings → API

---

### Paso 2: Edge Function en Supabase

**Ubicación:** `supabase/functions/enviar-correo/index.ts`

**Características:**
- ✅ Firma JWT para seguridad
- ✅ Genera código OTP de 6 dígitos
- ✅ Envía HTML bonito con tu branding
- ✅ Maneja errores sin exponer llaves
- ✅ No loguea datos sensibles

**Estructura de la función:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// 1. Leer llaves desde Variables de Entorno
const CLAVE_RESEND = Deno.env.get("RESEND_API_KEY");
const CLAVE_JWT = Deno.env.get("SUPABASE_JWT_SECRET");
const URL_SUPABASE = Deno.env.get("SUPABASE_URL");
const CORREO_DESDE = Deno.env.get("RESEND_FROM_EMAIL");

// 2. Validar firma JWT (tarea de Supabase)
function verificarFirma(datos) {
  // Supabase ya validó la firma del webhook
  // Nosotros confía y procesa
}

// 3. Generar textos según tipo de email
function textosSegun(tipo) {
  const textos = {
    signup: { asunto: "Verifica tu cuenta", titulo: "¡Bienvenido!" },
    recovery: { asunto: "Recupera tu cuenta", titulo: "Recuperación" }
  };
  return textos[tipo] || textos.signup;
}

// 4. Armar HTML del email
function armarHtml(codigo, enlace, textos) {
  return `
    <h1>${textos.titulo}</h1>
    <p>Tu código de verificación:</p>
    <h2 style="font-size: 2em; font-weight: bold;">${codigo}</h2>
    <p>O haz clic en este enlace:</p>
    <a href="${enlace}">Verificar cuenta</a>
  `;
}

// 5. Enviar con Resend
async function enviarEmail(para, codigo, enlace, textos) {
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CLAVE_RESEND}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: CORREO_DESDE,
      to: [para],
      subject: textos.asunto,
      html: armarHtml(codigo, enlace, textos)
    })
  });
  
  if (!respuesta.ok) {
    console.error("Resend error:", respuesta.status);
    throw new Error("No se pudo enviar el email");
  }
  
  return respuesta.json();
}

// 6. Handler principal
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Método no permitido", { status: 405 });
  }

  const datos = await req.json();
  const para = datos.user?.email;
  const codigo = datos.email_data?.token ?? "";
  
  if (!para || !codigo) {
    return new Response("Datos incompletos", { status: 400 });
  }

  try {
    await enviarEmail(para, codigo, "...", textosSegun(datos.email_data?.email_action_type));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error("Error al enviar email");
    return new Response("Error interno", { status: 500 });
  }
});
```

**Configuración en Supabase:**

```bash
# En supabase/functions/enviar-correo/index.ts
# ¡IMPORTANTE! Desactivar verify_jwt

export const config = { 
  jwt: { verify: false }  // ← CRÍTICO: Sin esto no funciona
};
```

---

### Paso 3: Desplegar la Edge Function

```bash
# Login a Supabase
supabase link --project-ref pnexvkjnwbyaiwcwyrev

# Desplegar
supabase functions deploy enviar-correo \
  --env RESEND_API_KEY=$RESEND_API_KEY \
  --env SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET \
  --env RESEND_FROM_EMAIL=noreply@oaxintegra.local
```

---

### Paso 4: Configurar Webhook en Supabase

**En Supabase Dashboard:**

1. Ve a **Authentication → Emails**
2. En "Email Templates", cada una tiene un webhook
3. En el webhook, apunta a tu Edge Function:
   ```
   https://<project-ref>.supabase.co/functions/v1/enviar-correo
   ```

---

### Paso 5: Frontend - Capturar el Código

```html
<!-- 6 inputs de 1 dígito cada uno -->
<input type="text" maxlength="1" inputmode="numeric" id="cod-0">
<input type="text" maxlength="1" inputmode="numeric" id="cod-1">
<input type="text" maxlength="1" inputmode="numeric" id="cod-2">
<input type="text" maxlength="1" inputmode="numeric" id="cod-3">
<input type="text" maxlength="1" inputmode="numeric" id="cod-4">
<input type="text" maxlength="1" inputmode="numeric" id="cod-5">
```

```javascript
// Juntar los 6 dígitos
function obtenerCodigo() {
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += document.getElementById('cod-' + i).value || '0';
  }
  return codigo;
}

// Validar con Supabase
async function verificarCodigo(codigo) {
  const res = await supabase.auth.verifyOtp({
    email: email,
    token: codigo,
    type: 'email'
  });
  if (res.error) {
    console.error('Código inválido');
    return false;
  }
  return true;
}
```

---

## ✅ Testing Checklist

- [ ] Edge Function desplegada y sin errores
- [ ] Email llega en menos de 2 segundos
- [ ] Código es alfanumérico de 6 caracteres
- [ ] Email tiene botón de enlace + código numérico
- [ ] Código valida correctamente en Supabase Auth
- [ ] Al verificar, el usuario recibe JWT válido
- [ ] Token guarda en localStorage y refresca automáticamente
- [ ] Al logout, se limpian tokens y localStorage

---

## 🐛 Debug

### Email no llega
1. ¿RESEND_API_KEY está en Supabase? → Supabase Console → Settings → Environment
2. ¿Dominio verificado en Resend? → https://resend.com/domains
3. ¿Edge Function en logs tiene error? → Supabase Console → Functions

### Código no valida
1. ¿El código tiene exactamente 6 caracteres?
2. ¿Se envió correctamente al endpoint `/auth/verify_otp`?
3. ¿El tipo es `'email'` (no `'signup'` o `'recovery'`)?

### Webhook no dispara
1. En Supabase Dashboard, ve a **Functions** → **enviar-correo**
2. Revisa los logs (últimas 100 invocaciones)
3. Busca errores `401`, `403`, `500`

---

## 📦 Lo Que Usamos

| Herramienta | Razón | Costo |
|---|---|---|
| Supabase Auth | Gestión de usuarios nativa | Gratis |
| Resend API | Envío de emails | Gratis (100/día) |
| Edge Function | Backend sin servidor | $2 por millón de invocaciones |
| Deno | Runtime de la función | Incluido en Supabase |

**Total: Gratis para 100 usuarios/día. Luego $0.02 por 1000 verificaciones.**

---

## 🎯 Próximos Pasos Opcionales

1. **Cambiar templata HTML** → Personalizar con tu branding
2. **Rate limiting** → Máximo 3 intentos por correo
3. **Expiración** → El código válido solo 10 minutos
4. **WhatsApp** → Resend también soporta SMS con Twilio
5. **Multi-idioma** → Enviar email en el idioma del usuario

