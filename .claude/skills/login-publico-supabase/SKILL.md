---
name: login-publico-supabase
description: Diagnostica y arregla el login/registro con Supabase Auth cuando funciona para el desarrollador pero no para el público (otros correos, Safari, el link de producción). Cubre Redirect URLs, Site URL, proyecto pausado, proyecto equivocado en el build y caracteres invisibles en la llave.
---

# Login que funciona para todos, no solo para ti

Aprendido en OaxIntegra IA. Síntoma: "yo sí entro desde mi cuenta y mi Chrome, pero con otro correo o en Safari no deja".

## Causas reales, de la más común a la menos

### 1. El proyecto está pausado
Supabase Free pausa el proyecto tras ~1 semana sin actividad. Todo el auth muere.
- Dashboard → verás "Project is paused" → **Resume project**. Tarda 1-3 min.
- Prevenir: tráfico periódico (un cron que llame a la API) o plan Pro.

### 2. La URL pública no está en Redirect URLs
El enlace mágico / OTP manda a `redirectTo`. Si esa URL no está permitida, Supabase redirige al Site URL o rechaza.
- Ruta: `https://supabase.com/dashboard/project/<REF>/auth/url-configuration`
- **Site URL**: el link de producción (`https://tu-app.vercel.app`).
- **Redirect URLs**, agregar:
  - `https://tu-app.vercel.app/**`
  - `https://*.vercel.app/**` (previews)
  - `http://localhost:3000/**` (desarrollo)
- **Save**.

### 3. El build apunta a otro proyecto de Supabase
Si la URL/anon key vienen de variables de entorno de Vercel, pueden quedarse con un proyecto viejo sin tus tablas. El registro "falla" sin llegar al proyecto bueno.
- Fijar URL + anon key en un archivo del repo (ej. `frontend/acceso.json`) y que el build lo prefiera sobre el entorno.
- Validar en el build que el `ref` dentro del JWT de la anon key == subdominio de la URL.

### 4. Caracteres invisibles en la llave
Al pegar la anon key en Vercel se cuela un salto de línea o comilla tipográfica. El navegador tira el `fetch` con `String contains non ISO-8859-1 code point` y el login muere sin mensaje.
- Limpiar en el build: `v.replace(/[^\x20-\x7E]/g, '')`.

### 5. Correo que no llega
El SMTP por defecto de Supabase solo manda a miembros del equipo y ~2-4 correos/hora.
- Configurar SMTP propio (Resend, Gmail con contraseña de app) en Auth → SMTP Settings.
- Error `535` = credenciales SMTP malas.
- Ver skill `email-verification` para el flujo OTP completo.

### 6. Safari
- Bloquea storage de terceros y a veces `localStorage` en modo privado: envolver accesos en try/catch con respaldo en memoria.
- Si el enlace abre en otro navegador (el del cliente de correo), la sesión PKCE no está ahí → preferir **código OTP de 6-8 dígitos** que se escribe en la misma pestaña.

## Orden de diagnóstico

1. ¿Proyecto activo? (dashboard)
2. ¿Probaste en el link de **producción**, no en un preview?
3. Auth → Logs: ¿llegó el intento? Si no llegó → causa 3 o 4. Si llegó con error → leer mensaje.
4. Redirect URLs y Site URL.
5. Probar en ventana privada con un correo nuevo.

## Qué no puede hacer Claude desde remoto
El dashboard de Supabase (URL config, SMTP, resume) suele requerir al usuario. Dar la URL directa con el `<REF>` del proyecto y los valores exactos a pegar.
