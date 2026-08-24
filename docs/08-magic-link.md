# Entrar con un enlace por correo

Se acabaron las contraseñas, los códigos de seis dígitos y el teléfono.
Ahora se escribe el correo, llega un enlace, se le da clic y ya está dentro.

Lo hace **Supabase**, que es quien manda el correo y quien lleva la cuenta de
quién es quién. La app no guarda ninguna contraseña porque no hay ninguna.

---

## Por qué así

La gente para la que está hecha esta app **pierde el código**. Pasó en el
proyecto: el paso 2 del registro decía «guarda tus seis dígitos» dentro de un
recuadro amarillo, y aun así el problema volvía.

Un enlace por correo quita el problema de raíz: no hay nada que recordar. Y de
paso, el correo se convierte en la forma de recuperar la cuenta, que antes era
justo para lo que servía el teléfono.

---

## Ponerlo a andar (una sola vez)

### 1 · Crear el proyecto en Supabase

Entra a [supabase.com](https://supabase.com), crea una cuenta y un proyecto
nuevo. Es gratis y no pide tarjeta.

### 2 · Copiar los dos datos

**Settings → API**. Copia estos dos:

| En el panel dice | Va en el `.env` como |
|---|---|
| **Project URL** — `https://abcdefghijk.supabase.co` | `SUPABASE_URL` |
| **anon public** — empieza con `eyJ` | `SUPABASE_ANON_KEY` |

```bash
cp .env.example .env
# y pega los dos ahí
```

> ⚠️ En esa misma pantalla hay una tercera llave, la **`service_role`**.
> **Esa no se toca.** Se salta todas las reglas de seguridad: quien la tenga
> puede leer y borrar tu base de datos entera. `build.py` se detiene solo si
> detecta que alguien la puso por error — abre el JWT y mira el rol de dentro,
> porque las dos llaves se parecen muchísimo.

### 3 · Decirle a Supabase a dónde regresar

**Authentication → URL Configuration**. En **Redirect URLs** agrega las
direcciones desde donde vas a abrir la app:

```
http://localhost:3000/**
https://tu-sitio.netlify.app/**
```

**Si te saltas este paso, el enlace del correo no lleva a ningún lado.** Es el
tropiezo más común: Supabase rechaza cualquier dirección que no esté en esa
lista, sin avisar en el correo.

### 4 · Construir y arrancar

```bash
cd frontend && python3 build.py
cd .. && npm start
```

Al construir te dice si quedó configurado:

```
Acceso por enlace: https://abcdefghijk.supabase.co
```

Si dice `SIN CONFIGURAR`, falta uno de los dos datos del `.env`.

---

## El texto del correo

**Authentication → Emails → Magic Link**. Cambia el asunto y el cuerpo por
esto:

**Asunto:**

```
Tu enlace para entrar a OaxIntegra IA
```

**Cuerpo:**

```html
<p>Hola, somos de Wax, integra IA y te enviamos este enlace de acceso para entrar a tu cuenta.</p>

<p><a href="{{ .ConfirmationURL }}">Entrar a mi cuenta</a></p>

<p>El enlace sirve una sola vez y vence en una hora.<br>
Si no pediste entrar, no hagas nada: sin darle clic no pasa nada.</p>
```

`{{ .ConfirmationURL }}` es lo único que no se puede cambiar: es donde
Supabase mete el enlace de verdad. Todo lo demás es tuyo.

> **Una cosa, y tú decides.** El texto quedó tal cual lo pediste. Pero
> «Wax, integra IA» se lee como el nombre dictado en voz alta —
> **OaxIntegra IA** partido en dos. Si era eso, la línea sería:
>
> *«Hola, somos de OaxIntegra IA y te enviamos este enlace de acceso para
> entrar a tu cuenta.»*
>
> Cámbialo en esa misma pantalla si quieres; no hace falta tocar código.

### Cuántos correos puedes mandar

Con el servidor que Supabase te presta: **3 por hora**, y eso alcanza para
probar, no para tener gente usándolo.

Cuando ya vaya en serio, conecta tu propio servidor de correo en
**Settings → Authentication → SMTP Settings**. Resend, Brevo o Mailgun tienen
plan gratis suficiente. De paso los correos dejan de caer en spam, que con el
servidor prestado pasa seguido.

---

## Cómo funciona por dentro

```
1. Escribe su correo
        │
        ▼
2. POST /auth/v1/otp?redirect_to=<esta página>
   { email, create_user: true }
        │
        ▼
3. Supabase manda el correo
        │
        ▼
4. Le da clic  →  vuelve a la app con los tokens en el
                  fragmento:  #access_token=…&refresh_token=…
        │
        ▼
5. La app lee el fragmento, LO BORRA de la barra de
   direcciones, y pregunta GET /auth/v1/user
        │
        ▼
6. Ya adentro. Se renueva solo un minuto antes de vencer.
```

**Todo con `fetch` normal, sin el SDK de Supabase.** Son cuatro llamadas
contadas y la app es un solo archivo HTML: meter una librería de 100 KB por
esto sería cambiar el peso de la página por nada. Ver `docs/05-arquitectura-tecnica.md`.

### Por qué los tokens vienen en el `#` y no en la dirección normal

El fragmento (lo que va después del `#`) **no viaja al servidor**. Nunca
aparece en los registros de nadie. Por eso Supabase lo usa para esto, y por eso
la app lo borra en cuanto lo lee: si se queda ahí, el token vive en el
historial del navegador.

```js
window.history.replaceState(null, '', window.location.pathname);
```

### Renovar la sesión

El `access_token` dura una hora. La app programa la renovación **un minuto
antes** de que venza, no cuando ya venció: así nadie ve un error a media
conversación.

Si el `refresh_token` ya no vale (pasaron semanas, o cerraste sesión en otro
lado), se borra todo y aparece la portada otra vez. Nunca se queda a medias.

---

## Lo que se guarda dónde

| Dato | Dónde vive |
|---|---|
| Correo, id de la cuenta | Supabase (`auth.users`) |
| Giro del negocio | Supabase (`user_metadata`) **y** copia local |
| Los tokens de la sesión | `localStorage` de ese navegador |
| Conversaciones y publicaciones | `localStorage` de ese navegador |

El giro se guarda en los dos lados a propósito: en Supabase para que te siga
cuando entres desde otro teléfono, y aquí para que la app no tenga que
esperar a la red para saber de qué es tu negocio.

**El giro ya no se pregunta al entrar.** Aparece adentro, como una tira arriba
del chat, con un botón de «Ahora no». El acceso son dos cosas: correo y clic.

---

## Si algo no funciona

| Lo que ves | Qué pasa |
|---|---|
| «El acceso todavía no está configurado» | Falta `SUPABASE_URL` o `SUPABASE_ANON_KEY` en el `.env`. Vuelve a construir después de ponerlos. |
| El correo no llega | Revisa spam. Si sigue sin llegar, ya gastaste los 3 por hora del servidor prestado: pon tu propio SMTP. |
| Le doy clic y no pasa nada | Falta tu dirección en **Redirect URLs** (paso 3). Es lo más común. |
| «Ese enlace ya venció» | Dura una hora y sirve una sola vez. Pide otro. |
| «Espera un minuto antes de pedir otro» | Supabase corta a 3 por hora por correo. |
| Entra y a los segundos se sale | El reloj de la computadora está mal. Los tokens se validan por hora. |

### Ver el estado sin enseñar nada

```bash
curl http://localhost:3000/api/estado
```

Dice qué está configurado y qué falta, sin revelar ninguna llave.

---

## Lo que probé y lo que no

**Probado aquí, funcionando:**

- La portada con un solo campo, en modo día y modo noche
- Que sin configurar, avisa en vez de romperse, y desactiva el botón
- El regreso desde el enlace, simulando el `#access_token` en la dirección
- Que el fragmento se borra de la barra al entrar
- Que un token inválido borra la sesión y regresa a la portada
- Que `build.py` bloquea una llave `service_role` de verdad y deja pasar
  una `anon` (probado con dos JWT armados a mano)

**No pude probar aquí:**

- **El correo de verdad.** Hace falta un proyecto de Supabase con sus llaves,
  y las tuyas todavía no existen. La máquina donde corro además tiene la
  salida a internet filtrada.
- **El texto del correo**, porque se configura en tu panel de Supabase, no en
  el código. Arriba está listo para copiar y pegar.
