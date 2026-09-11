# Cómo se entra a la app

> **Esto cambió de nuevo el 11 de septiembre de 2026.** Antes (desde el 24 de
> agosto) se entraba con correo + un código de 8 números que se quedaba fijo
> como la contraseña. **Eso se quitó.**
>
> Ahora: **usuario y contraseña**, elegidos por cada quien. El correo y un
> código siguen existiendo, pero solo para comprobar que un correo es tuyo —
> al registrarte, o si olvidas tu contraseña.
> El paso a paso está en `docs/08-acceso-por-codigo.md`.

---

## Cómo es ahora

Dos botones. Registrarte pide pasar por el correo una vez; entrar, no.

```
[ Iniciar sesión ]   →   usuario + contraseña          →   dentro
[ Registrarme    ]   →   tu correo → código → eliges tu usuario
                          y tu contraseña                →   dentro
```

El código que llega al registrarte (o al recuperar tu cuenta) **ya no se
guarda como nada**: solo prueba que ese correo es tuyo. Con eso comprobado,
tú eliges tu usuario (fijo desde entonces) y tu contraseña (la puedes cambiar
cuando quieras).

Si se te olvida la contraseña, «Olvidé mi contraseña» manda un código nuevo
al correo con el que te registraste, y ahí **creas una contraseña nueva** —
no te la recuerda, porque ni la propia app puede leerla (va cifrada con
bcrypt). El detalle de por qué, en `docs/08-acceso-por-codigo.md`.

Todo el detalle en `docs/08-acceso-por-codigo.md`.

## Por qué se cambió (otra vez)

La versión de agosto (correo + código fijo) resolvía el problema de una
contraseña que se te olvida —no hay nada que olvidar si el código *es* la
contraseña— pero cambiaba ese problema por otro: nada de eso es memorable ni
se parece a una contraseña normal, y quien perdía el correo con el código
perdía la cuenta sin más remedio que el código de recuperación (otro número
más que recordar o anotar).

Usuario y contraseña es lo que casi todo el mundo ya sabe usar, y permite lo
que un código fijo no: **cambiarla** sin tener que perder acceso a la cuenta
mientras tanto, y tener una de verdad distinta a lo que llega por correo.

**Lo que se mantiene igual que en agosto:** sigue haciendo falta un correo
para registrarte (ahí llega el código que comprueba que es tuyo). Quien no
tenga correo activo se queda fuera, igual que antes.

---

## Qué se sabe de cada persona

| Dato | De dónde sale |
|---|---|
| Correo | Lo escribió al registrarse (Supabase lo confirmó con un código) |
| Usuario / nombre que se muestra | Lo eligió al registrarse (`perfiles.usuario`) |
| Giro del negocio | Se le pregunta **ya adentro**, y puede decir «Ahora no» |

El giro es lo único que se pregunta además del correo, y **no bloquea nada**:
aparece como una tira arriba del chat, con botón para cerrarla. Sirve para que
el asistente responda con ejemplos del oficio de cada quien.

---

## Qué se quitó exactamente

| Se fue | Dónde estaba |
|---|---|
| Usuario + código de 6 dígitos | `#casillas`, `#casillas-entrar` |
| Pestañas Regístrate / Iniciar sesión | `#tab-registro`, `#tab-entrar` |
| Teléfono y selector de país | `#reg-telefono`, `#reg-lada`, tabla `PAISES` |
| Verificación por WhatsApp | `#paso-whatsapp`, `#casillas-wa`, `backend/otp-core.js` |
| Cuentas en `localStorage` | `leerCuentas()`, `guardarCuenta()` |
| Aviso de alta por webhook de n8n | `CONFIG.WEBHOOK_REGISTRO` |

---

## Lo que sí se conservó

- El chat **sigue abierto para todos**. Entrar no es requisito para probarlo;
  solo sirve para que te reconozca y guarde tus conversaciones.
- La portada sigue apareciendo primero, con el chapulín y la marca.
- El modo día / noche, las medallas, las publicaciones guardadas: intactos.

---

## Detalles que importan

**La sesión se confirma contra Supabase, no contra `localStorage`.** Lo
guardado en el navegador solo sirve para pintar la pantalla sin parpadeo
mientras se confirma. Si Supabase dice que no, se borra y aparece la portada.
Cualquiera puede escribir en el `localStorage` de su propio navegador; creerle
sería dejar la puerta abierta.

**El token se borra de la barra de direcciones** en cuanto se lee. Si no,
queda en el historial del navegador.

**Se puede cerrar sesión desde el celular.** El chip de la barra de arriba solo
existe en pantalla grande; en el menú móvil hay ahora su propio botón. Antes no
lo había — ver BUG-27.

Todo el detalle técnico, en `docs/08-acceso-por-codigo.md`.
