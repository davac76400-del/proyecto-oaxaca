# Rotación de credenciales

El 13 de septiembre de 2026 se pegaron por chat la llave de Resend y el
secreto del enganche de correo. **Todo lo que pasa por un chat hay que darlo
por quemado**, así que las dos hay que retirarlas.

Buena noticia: como el correo ahora sale por SMTP propio
(`docs/12-correo-con-smtp.md`), ninguna de las dos se usa ya. No hay que
reemplazarlas por otras — hay que **borrarlas**, que es más sencillo y más
seguro.

---

## 1 · Borrar la llave de Resend

Mientras esa llave exista, quien la tenga puede mandar correo desde tu cuenta
de Resend, y esos correos irían firmados como si fueran tuyos.

1. Entra a **[resend.com/api-keys](https://resend.com/api-keys)**
2. Busca la que se llama `oaxintegra` (empieza con `re_`)
3. **Bórrala.**

No hace falta crear otra: el correo ya no pasa por Resend.

## 2 · Apagar el enganche y quitar sus secretos

El secreto del enganche solo sirve para que la función sepa que quien la llama
es Supabase Auth de verdad. Con el enganche apagado, no hay nada que firmar.

1. En **[Authentication → Hooks](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/auth/hooks)**,
   apaga el **Send Email hook** (esto ya va en el paso 5 de
   `docs/12-correo-con-smtp.md`).
2. En **[Edge Functions → Secrets](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/functions/secrets)**,
   borra `RESEND_API_KEY` y `SEND_EMAIL_HOOK_SECRET`.

---

## Si algún día se retoma Resend

Cuando haya un dominio propio verificado y se quiera volver a la función
(`docs/10-correo-del-codigo.md`), se empieza de cero con credenciales nuevas:

1. Llave nueva en **[resend.com/api-keys](https://resend.com/api-keys)**
   (Permission: **Sending access**).
2. Secreto nuevo al encender el enganche (botón **Generate secret**).
3. Los dos, en **Edge Functions → Secrets**. El secreto del enganche va en
   **dos lados** —en Auth firma, en la función comprueba— y es el error más
   fácil de cometer; está explicado en `docs/10-correo-del-codigo.md`.

Lo que **nunca** hay que hacer con ninguna de las dos: pegarlas en un chat, en
un `commit`, o en un archivo del repositorio. Para eso están los secretos de
Edge Functions, que no se pueden volver a leer desde el panel.

> GitHub bloquea el `push` si detecta una llave de Resend en el código, y ya lo
> hizo una vez en este repositorio (un ejemplo de documentación que traía la
> llave de verdad). Vale la pena saberlo: ese bloqueo es la última red, no la
> primera.

---

## Qué queda pendiente

- [ ] Llave de Resend borrada
- [ ] Send Email hook apagado
- [ ] `RESEND_API_KEY` y `SEND_EMAIL_HOOK_SECRET` borrados de Edge Functions
- [ ] SMTP propio andando y probado con un correo que no sea el tuyo
      (`docs/12-correo-con-smtp.md`)
