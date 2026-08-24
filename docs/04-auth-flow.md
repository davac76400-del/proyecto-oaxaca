# Cómo se entra a la app

> **Esto cambió por completo el 24 de agosto de 2026.** Antes se entraba con
> usuario + un código de 6 números que la persona elegía, y opcionalmente un
> teléfono verificado por WhatsApp. **Todo eso se quitó.**
>
> Ahora: **el correo y ya**. Lo lleva Supabase.
> El paso a paso para configurarlo está en `docs/08-acceso-por-codigo.md`.

---

## Cómo es ahora

Dos botones y **una sola forma de entrar**: correo + un código de 8 números.

```
[ Iniciar sesión ]   →   correo + 8 números   →   dentro
[ Registrarme    ]   →   usuario + correo → te llegan 8 números
                          → los escribes → ⚠️ GUÁRDALOS → dentro
```

El código llega por correo al registrarse y **se queda fijado**: no cambia, no
vence, y con él se entra siempre sin esperar más correos.

Si se pierde, «Olvidé mi código» pide el **código de recuperación** (8 números
que la persona eligió dentro de la app) y manda uno de entrada nuevo.

Todo el detalle en `docs/08-acceso-por-codigo.md`.

## Por qué se cambió

La versión anterior tenía una razón de fondo buena: el público de esta app
puede no tener correo activo ni recordar contraseñas largas, pero sí recuerda
seis números.

En la práctica **no funcionó**. Los seis números se perdían. Tanto, que la
pantalla acabó con un recuadro amarillo que decía «⚠️ Recuerda guardar tu
usuario y tu código», y aun así el problema seguía. El teléfono se metió justo
para poder recuperar la cuenta cuando eso pasara, y eso trajo su propia cola:
validación por país, verificación por WhatsApp, un servicio que mantener.

El enlace por correo quita las dos cosas de un golpe: no hay nada que
recordar, y recuperar la cuenta es pedir otro enlace.

**Lo que sí se perdió:** quien no tenga correo se queda fuera. Es un costo
real y hay que tenerlo presente. La apuesta es que hoy casi cualquier teléfono
Android llega con una cuenta de Google configurada.

---

## Qué se sabe de cada persona

| Dato | De dónde sale |
|---|---|
| Correo | Lo escribió al entrar |
| Nombre que se muestra | Lo de antes del `@` de su correo |
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
