---
name: correo-smtp-gratis
description: Hace que Supabase Auth mande correos (códigos OTP) a cualquier dirección sin pagar. Úsala cuando el correo no llega, sale "No se pudo enviar el correo", Resend dice "domain is not verified", o hay que configurar SMTP y plantillas de correo en Supabase. Incluye la opción gratis con Gmail y la plantilla HTML con el código grande.
---

# Correo gratis para Supabase Auth (sin comprar dominio)

## El error real que vivimos
La app decía «No se pudo enviar el correo. Inténtalo en unos minutos.» y NO era cuestión de tiempo.
Los logs de Supabase (`auth_logs`) mostraron la causa:

```
gomail: could not send email 1: 550 "The vozpropia.com domain is not verified.
Please, add and verify your domain on https://resend.com/domains"
```

Causa: el remitente (`noreply@vozpropia.com`) era un dominio inventado. **Resend solo envía desde un dominio verificado.**
Sin dominio propio, Resend solo permite `onboarding@resend.dev` y únicamente hacia el correo de TU cuenta de Resend.

## Primero: leer el error de verdad (no adivinar)
Con el MCP de Supabase (`query_logs`):
```sql
select timestamp, event_message from logs
where source = 'auth_logs' order by timestamp desc limit 15
```
Busca `error_code":"unexpected_failure"` y el texto `gomail: could not send email`. Ahí está el motivo exacto.
El mensaje que ve la persona debe decir la verdad (ver skill `email-verification`), nunca "inténtalo en unos minutos" si el fallo es de configuración.

## Opciones sin costo
| Opción | Sirve para cualquier correo | Necesita dominio | Límite aprox. |
|---|---|---|---|
| **Gmail SMTP + contraseña de aplicación** (la que usamos) | Sí | No | ~500 correos/día |
| Resend con dominio propio verificado | Sí | Sí (se compra) | 100/día gratis |
| Resend con `onboarding@resend.dev` | No, solo a tu correo | No | solo pruebas |

Verifica los límites vigentes de cada proveedor antes de prometerlos.

## Pasos con Gmail (los que funcionaron)
1. Cuenta de Google → **Seguridad** → activar **Verificación en 2 pasos**.
2. Abrir `myaccount.google.com/apppasswords` → nombre «Voz Propia» → copiar el código de 16 letras.
3. Supabase → **Authentication → Emails → SMTP Settings** → activar **Enable custom SMTP**:
   - Sender email: el mismo Gmail · Sender name: nombre de la app
   - Host `smtp.gmail.com` · Port `465` · Username: el Gmail · Password: el código de 16 letras
   - Minimum interval per user: 60 s (ya viene)
4. **Save** y probar con un correo distinto al tuyo.
5. La primera vez puede caer en spam: marcar «No es spam».

Nota observada en logs: al activar SMTP propio, Supabase subió el límite de correos de `2/1h` a `30` por hora.

## Plantillas (Authentication → Emails → Templates)
- Hay que cambiarlas **las dos**: **Confirm signup** (cuenta nueva) y **Magic link** (cuenta existente). Si solo cambias una, la otra sigue mandando el correo feo/en inglés.
- Cada una tiene **Subject** aparte (ej. `Tu código de Voz Propia`) y **Body** (pestañas Source / Preview).
- La variable del código es `{{ .Token }}`. Para enlace usarías `{{ .ConfirmationURL }}`.
- Se pega el HTML en Source: Ctrl+A, borrar, pegar, **Preview** para revisar, **Save changes**.
- HTML de correo = tablas + estilos en línea (Gmail ignora `<style>` y flex). Plantilla probada: tarjeta oscura `#0e1424`, código en monoespaciada 36px con `letter-spacing:8px` dentro de un recuadro con borde verde `#3df2a0`, texto «Vence en una hora y solo sirve una vez».

## Longitud del código
Supabase mandó códigos de **8 dígitos** (no 6). La app tenía 6 casillas y no dejaba escribirlo completo.
Dos soluciones: ajustar la app (`CODE_LENGTH = 8`) o cambiar en Supabase → Authentication → Providers → Email → **Email OTP Length**. Deben coincidir siempre.

## Seguridad de llaves (error cometido)
- Una API key de Resend se pegó en el chat → se tuvo que **revocar y crear otra**. Regla: nunca pegar llaves secretas ni contraseñas de aplicación en chats; si pasa, revocar al instante.
- La llave `sb_publishable_...` de Supabase sí puede ir en el código del navegador. La `sb_secret_...` y el `service_role` jamás.

## Alternativa avanzada
Send Email Hook de Supabase con una Edge Function (`supabase/functions/enviar-correo`) que manda por Resend con diseño propio. Sigue necesitando dominio verificado en Resend, por eso no la usamos.
