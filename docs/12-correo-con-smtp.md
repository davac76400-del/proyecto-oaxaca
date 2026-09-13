# El correo del código, con tu propio SMTP

Este es el camino que deja que **se registre cualquiera**, no solo tú. Son
tres pegadas de texto y un interruptor. Unos 10 minutos.

---

## Por qué hubo que cambiar

El correo lo mandaba Resend desde `onboarding@resend.dev`, su dominio
compartido de pruebas. Y ahí está el problema: **sin un dominio propio
verificado, ese remitente no entrega de forma fiable**. Quedó a la vista el
13 de septiembre de 2026:

- 07:44:35 · la función escribió `correo enviado` en sus logs — o sea, Resend
  contestó `200` y aceptó el envío.
- El correo **nunca llegó** al buzón. Ni a la bandeja, ni a spam.

El `200` de Resend solo quiere decir «lo encolé», no «lo entregué». Y para lo
que hace falta —que cualquiera se registre— el dominio compartido no sirve de
todos modos: **solo deja mandarle correo a la dirección con la que abriste la
cuenta de Resend**.

Había dos salidas: comprar un dominio y verificarlo en Resend, o mandar el
correo por un SMTP propio. Se eligió lo segundo: es gratis y funciona hoy.

Y trae un premio: **con SMTP propio, Supabase deja editar sus plantillas de
correo**. Ese era el muro del principio (`Set up custom SMTP to edit
templates`), el que obligó a escribir una función aparte. Al caer, el correo
bonito en español lo manda Supabase solo, y **la función deja de hacer
falta**.

```
ANTES                           AHORA
Auth → función → Resend         Auth → Gmail (SMTP)
      ↓                               ↓
  no entregaba                   entrega a cualquiera
```

---

> **Antes de empezar: hay dos proyectos en la cuenta de Supabase y se parecen.**
> El bueno es **`pnexvkjnwbyaiwcwyrev`**, el que se llama `agrointegra` — es el
> del `.env`, el de la función y el de los enganches. El otro,
> `uagsebllcngpkgmbhmin` («davac76400-del's Project»), está vacío. Todos los
> enlaces de esta página ya llevan el bueno; si navegas a mano por el panel,
> mira el nombre arriba a la izquierda antes de tocar nada. Configurar el SMTP
> en el proyecto equivocado se ve exactamente igual de bien y no cambia nada.

## 1 · La contraseña de aplicación de Google

Gmail no deja que otro programa entre con tu contraseña normal. Se le pide una
aparte, solo para esto, que se puede revocar sin tocar tu cuenta.

**Hace falta tener la verificación en 2 pasos encendida.** Si no la tienes:
[myaccount.google.com/signinoptions/two-step-verification](https://myaccount.google.com/signinoptions/two-step-verification)

1. Entra a **[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**
2. Donde dice el nombre de la app, escribe `OaxIntegra` y dale a **Crear**.
3. Sale una contraseña de **16 letras en cuatro bloques**, tipo
   `abcd efgh ijkl mnop`. **Cópiala.**
4. **Quítale los espacios** al pegarla: van las 16 letras seguidas
   (`abcdefghijklmnop`). Con espacios, Supabase da error de autenticación y no
   dice por qué.

Se enseña una sola vez. Si la pierdes, borras esa y creas otra.

## 2 · Encender el SMTP en Supabase

Ve a **[Authentication → Emails → SMTP Settings](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/auth/smtp)**
y enciende **Enable Custom SMTP**. Llénalo así:

| Campo | Qué va |
|---|---|
| **Sender email** | tu correo de Gmail, completo |
| **Sender name** | `OaxIntegra IA` |
| **Host** | `smtp.gmail.com` |
| **Port** | `587` |
| **Username** | tu correo de Gmail, completo (el mismo de arriba) |
| **Password** | la contraseña de aplicación del paso 1, **sin espacios** |

Dale a **Save**.

> **El puerto 587 y no el 465.** Los dos sirven en Gmail, pero el 465 espera
> que la conexión ya venga cifrada desde el saludo y el 587 la cifra a medio
> camino (STARTTLS), que es como la abre Supabase. Con el 465 el envío se
> queda colgado hasta que se le acaba el tiempo, y el error que sale habla de
> un plazo vencido, no del puerto.

## 3 · Subir el límite de correos por hora

De fábrica el proyecto manda **dos correos por hora**. Ese número es bajo
porque de fábrica los manda el servidor compartido de Supabase; con tu propio
SMTP ya no hace falta apretarlo tanto.

En **[Authentication → Rate Limits](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/auth/rate-limits)**,
sube **«Rate limit for sending emails»** a unos **30 por hora**.

## 4 · Pegar las plantillas (esto es lo que lo hace bonito)

Ahora sí se puede. Las plantillas están hechas y guardadas en el repositorio,
en **`supabase/plantillas/`** — son el mismo diseño que ya tenía el correo de
OaxIntegra: el código grande en su caja verde, en español, y el enlace de
segundo.

En **[Authentication → Emails](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/auth/templates)**
(en el menú de la izquierda es **Emails**, debajo de NOTIFICATIONS),
para cada pestaña: pega el asunto, dale a **Source**, borra lo que haya y pega
el HTML.

| Pestaña del panel | Archivo | Asunto |
|---|---|---|
| **Confirm signup** | `confirmar-registro.html` | Tu código para crear tu cuenta |
| **Magic Link** | `enlace-magico.html` | Tu código para entrar |
| Reset Password | `recuperar-contrasena.html` | Tu código para recuperar tu cuenta |
| Change Email Address | `cambiar-correo.html` | Tu código para cambiar tu correo |
| Invite user | `invitacion.html` | Te invitaron a OaxIntegra IA |
| Reauthentication | `reautenticacion.html` | Tu código de confirmación |

Los asuntos están también en los archivos `.asunto.txt` de al lado, para
copiarlos sin escribirlos.

> **Las dos que de verdad se usan hoy son «Confirm signup» y «Magic Link»**, y
> la segunda sorprende. El motivo está en la app: tanto para registrarse como
> para recuperar la cuenta, pide el código al mismo sitio —
> `POST /auth/v1/otp` (búscalo en `frontend/app.src.html`, van con
> `create_user: true` y `create_user: false`) —. Y ese endpoint elige la
> plantilla según a quién le escribe:
>
> - correo **nuevo** (`create_user: true`) → manda **Confirm signup**;
> - correo **que ya tiene cuenta** → manda **Magic Link**.
>
> O sea que **«Reset Password» no se usa nunca**, aunque el botón diga «olvidé
> mi contraseña»: eso también sale por Magic Link. Si solo pegas «Confirm
> signup», el registro sale bonito y recuperar la cuenta sigue llegando en
> inglés. Pega las seis y no hay que acordarse de cuál es cuál.
>
> (Por eso, además, el error de Supabase decía `Error sending magic link
> email` incluso al registrarse: es el texto de esa ruta, no el de la
> plantilla.)

> Si cambias el diseño del correo, no lo edites en el panel: se edita en
> `supabase/functions/enviar-correo/index.ts` (la función `armarHtml`) y se
> regeneran las seis con
> ```bash
> node supabase/plantillas/generar.mjs
> ```
> Así el correo está escrito en un solo lugar y las plantillas no se van
> quedando atrás.

## 5 · Apagar el enganche

Con las plantillas puestas, la función ya no pinta nada: si se queda
encendida, sigue mandando el correo por Resend —que es justo lo que no
entregaba—.

En **[Authentication → Hooks](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/auth/hooks)**,
**apaga el Send Email hook**.

## 6 · Que las direcciones del sitio sean las de verdad

El correo lleva, de segundo y chiquito, un enlace para entrar de un clic. Ese
enlace lo arma Supabase con las direcciones que tenga apuntadas, no con la de
donde esté la app: si no coinciden, el código sigue sirviendo pero el enlace
deja a la persona en otro sitio o no la deja pasar.

En **[Authentication → URL Configuration](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/auth/url-configuration)**:

| Campo | Qué va |
|---|---|
| **Site URL** | la dirección donde está la app publicada, hoy `https://proyecto-oaxaca-five.vercel.app` |
| **Redirect URLs** | esa misma con `/**` al final: `https://proyecto-oaxaca-five.vercel.app/**` |

Si quedó apuntando a una dirección vieja de Vercel, es aquí donde se cambia.

## 7 · Probar

Regístrate en la app con un correo **que no sea el tuyo** (ese es el punto de
todo esto: pídele a alguien que lo pruebe, o usa otro correo que tengas). Tiene
que llegar el correo de OaxIntegra con el código, y el código tiene que servir.

Si no llega, el motivo queda escrito en los
**[logs de Auth](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/logs/auth-logs)**:

| En los logs | Qué pasó | Qué hacer |
|---|---|---|
| `535 Username and Password not accepted` | Google rechazó el usuario o la contraseña | la sección de abajo: son cuatro causas y hay que descartarlas en orden |
| `timeout` o se queda colgado | casi siempre es el puerto 465 | ponlo en 587 |
| `534 Please log in with your web browser` | falta la verificación en 2 pasos en la cuenta de Google | enciéndela y crea la contraseña de aplicación otra vez |
| `429: email rate limit exceeded` | se gastaron los correos de la hora | paso 3, o espera |
| `Hook requires authorization token` | el enganche sigue encendido | paso 5 |

---

## El 535 de Google, en detalle

Es el error que más cuesta, porque **Google no dice cuál de las dos cosas está
mal** —el usuario o la contraseña—: contesta lo mismo en los dos casos. Pasó el
13 de septiembre de 2026 y se dio vueltas un día entero cambiando la contraseña,
que era solo una de cuatro causas posibles.

Así se vio en los logs de Auth, y conviene reconocer la forma:

```
09:19 · 09:22   mail_from: noreply@mail.app.supabase.io   →  200   (SMTP apagado: salía)
09:25 en adelante                        Gmail SMTP       →  500   535 BadCredentials
```

Que **empiece a fallar justo al encender el SMTP** y que antes saliera es la
prueba de que el problema es el SMTP y no la app, ni el proyecto, ni la red.

Las cuatro causas, en el orden en que conviene descartarlas:

1. **La contraseña lleva espacios.** Google la enseña en cuatro bloques
   (`abcd efgh ijkl mnop`) y hay que pegar las 16 letras seguidas.
2. **La contraseña fue revocada.** Si se rotan las credenciales de la cuenta de
   Google, la contraseña de aplicación que estaba puesta en Supabase deja de
   servir en ese momento, y nadie avisa. Hay que crear otra y volver a pegarla.
3. **El Username no es la cuenta donde se creó la contraseña.** Es la más fácil
   de pasar por alto cuando se manejan varias cuentas de Gmail: la contraseña
   de aplicación **solo sirve para la cuenta que la generó**. El campo
   **Username** tiene que ser esa misma dirección, completa y con `@gmail.com`.
4. **La cuenta no tiene verificación en 2 pasos.** Sin ella no existen las
   contraseñas de aplicación, y la contraseña normal de la cuenta da 535
   igualmente.

**Sender email** tiene que ser esa misma dirección también. Gmail no deja mandar
correo diciendo ser de otra cuenta.

### Mientras tanto, que nadie se quede fuera

Apagar **Enable Custom SMTP** devuelve el correo de fábrica al instante. Es feo y
va en inglés, pero **entrega** —quedó probado ese mismo día a las 09:19 y 09:22,
con registros que sí se completaron—. Es un interruptor, no un cambio: se vuelve
a encender cuando la contraseña ya esté bien, sin tocar nada más.

---

## Lo que hay que saber de este camino

- **500 correos al día.** Es el límite de Gmail. Para lo que hace la app hoy
  sobra; si algún día se acerca, el camino es un dominio propio (abajo).
- **El remitente es tu Gmail.** Sale «OaxIntegra IA» como nombre, pero quien
  mire el remitente de verdad ve tu dirección. Funciona, aunque se ve menos
  formal que `hola@oaxintegra.com`.
- **Los términos de Gmail** son para correo personal, no para envíos masivos
  de un servicio. Con el registro de una app en desarrollo no hay problema; a
  gran escala hay que mudarse.

### Cuando quieras un remitente propio

Comprar un dominio (unos $10–15 al año) y verificarlo en
**[Resend → Domains](https://resend.com/domains)** (se pegan unos registros
DNS). Con el dominio verificado hay dos opciones, y las dos ya están
preparadas:

1. **Seguir con SMTP**, cambiando los datos del paso 2 por los de Resend.
2. **Volver a encender la función**, que sigue en el repositorio y funcionando:
   se prende el enganche del paso 5 y se le añade el secreto `CORREO_DESDE`
   con `OaxIntegra IA <hola@tudominio.com>`. Lo de Resend está contado en
   `docs/10-correo-del-codigo.md`.

## Si algo sale mal: cómo volver atrás

Apagar **Enable Custom SMTP** devuelve el correo de fábrica de Supabase al
instante — feo y en inglés, con enlace en vez de código, pero entregando a
cualquiera. **Nadie se queda sin poder registrarse.** La app no se entera: el
código se sigue pidiendo a `/auth/v1/otp` y comprobando con `/auth/v1/verify`,
y quien reciba un enlace en vez de números le da clic y entra igual.
