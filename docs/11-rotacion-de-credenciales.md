# Rotación de Credenciales (Seguridad)

**CRÍTICO**: Las credenciales fueron compartidas en chat el 2026-09-13. Hay que rotarlas YA, antes de abrir la app a usuarios.

---

## Lo que tienes que hacer

Son tres cosas, se hacen de una vez. Toma **5 minutos máximo**.

### 1 · Nueva API key de Resend

1. Ve a **[https://resend.com/api-keys](https://resend.com/api-keys)**
2. Dale a **Create API Key** con estos datos:
   - Name: `oaxintegra-2` (o cualquier nombre que te diga que es el nuevo)
   - Permission: **Sending access**
3. **Cópiala** (empieza con `re_`)
4. **Guárdala en un lugar seguro por ahora** — la vas a pegar en el siguiente paso
5. Vuelve a API Keys y **elimina la anterior** (la que empieza con `re_` y NO es la que acabas de crear)

### 2 · Nuevo secreto de webhook en Supabase

1. Ve a **[https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/auth/hooks](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/auth/hooks)**
2. En **Send Email hook**, dale a **Disable** (lo apaga temporalmente)
3. Dale a **Enable** de nuevo
4. Tipo: **HTTPS**
5. URL: (la misma de antes)
   ```
   https://pnexvkjnwbyaiwcwyrev.supabase.co/functions/v1/enviar-correo
   ```
6. Dale a **Generate secret**
7. **Cópialo** — será `v1,whsec_...`
8. **Guárdalo** — lo vas a usar en el siguiente paso
9. Dale a **Create**

Ahora tienes dos secretos nuevos:
- El de Resend (`re_...`)
- El del webhook (`v1,whsec_...`)

### 3 · Guardar los secretos en Edge Functions

1. Ve a **[https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/functions/secrets](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/functions/secrets)**
2. Busca `RESEND_API_KEY` y `SEND_EMAIL_HOOK_SECRET`
3. **Edita** `RESEND_API_KEY`: borra lo que hay y pega el nuevo de Resend (`re_...`)
4. **Edita** `SEND_EMAIL_HOOK_SECRET`: borra lo que hay y pega el nuevo del webhook (`v1,whsec_...`)
5. Listo.

---

## Verificar que funciona

Regístrate en la app con un correo de prueba y asegúrate de que el código llega.

---

## Qué cambió y por qué

| Qué | Dónde | Por qué |
|---|---|---|
| Resend API key | En Supabase → Edge Functions → Secrets | Si la vieja se usa mal, pueden mandar correos falsos de OaxIntegra |
| Secreto de webhook | En Supabase de dos lados | Si alguien tiene el viejo, puede simular que Supabase Auth manda códigos |

La app no se entera de los cambios — en cuanto guardes los secretos nuevos, empiezan a usarse automáticamente.

---

## Si algo falla

- Revisa **[logs de Edge Functions](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/functions/enviar-correo/logs)** y **[logs de Auth](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/logs/auth-logs)**
- Si dice `falta RESEND_API_KEY` o `falta SEND_EMAIL_HOOK_SECRET`, vuelve al paso 3
- Si dice `la firma no coincide`, el secreto del webhook está en un lado pero no en el otro — cópialo de nuevo en ambos

---

## Después: Verificar un dominio en Resend

Esto es para que la app pueda registrar a cualquiera, no solo al correo con el que abriste Resend:

1. Ve a **[https://resend.com/domains](https://resend.com/domains)** → **Add Domain**
2. Escribe tu dominio (ej: `oaxintegra.com`)
3. Copia los registros DNS que te da Resend
4. Pégalos donde tengas el dominio (GoDaddy, Namecheap, etc.)
5. Espera ~5 minutos a que verifique
6. Una vez verificado, en Supabase → Edge Functions → Secrets, añade o edita:
   ```
   CORREO_DESDE = OaxIntegra IA <hola@tudominio.com>
   ```

Hasta que hagas esto, solo se puede probar registrándose con el correo de tu cuenta de Resend.

---

## Checklist

- [ ] API key nueva de Resend creada
- [ ] API key vieja de Resend eliminada
- [ ] Secreto nuevo de webhook generado en Supabase
- [ ] `RESEND_API_KEY` actualizado en Edge Functions Secrets
- [ ] `SEND_EMAIL_HOOK_SECRET` actualizado en Edge Functions Secrets
- [ ] Probado: registro con correo de prueba y código recibido
- [ ] Dominio verificado en Resend (después)
