# El correo del código: cómo se volvió de OaxIntegra

Antes, al registrarse llegaba esto:

> **Supabase Auth** · Confirm your email address
> Follow the link below to confirm this email address and finish signing up.
> [Confirm email address]

En inglés, con el nombre de Supabase, y con un enlace en vez del código. Ahora
llega un correo de **OaxIntegra IA**, en español, con el código grande a la
vista y el enlace de segundo, chiquito, por si alguien prefiere el clic.

---

## Por qué hubo que hacer una función y no bastó cambiar la plantilla

En el panel de Supabase hay un editor de plantillas de correo
(**Authentication → Emails**), y ahí se puede poner `{{ .Token }}` para que el
correo traiga los números. Ese era el plan, y **no se puede**: en el plan
gratis el botón **Source** está en gris con este aviso encima:

> Set up custom SMTP to edit templates.
> Emails will be sent using the default templates.

O sea: mientras el correo lo mande el servidor compartido de Supabase, las
plantillas son las suyas y no se tocan. Para tener un correo propio hay que
mandarlo uno mismo — y eso es justo lo que hace la función.

## Cómo funciona

Supabase tiene un enganche llamado **Send Email Hook**: cuando a Auth le toca
mandar un correo, en vez de mandarlo él avisa a una función nuestra y le pasa
los datos. La función es `supabase/functions/enviar-correo/index.ts`.

```
alguien se registra
      │
      ▼
Supabase Auth  ──genera el código──┐
      │                            │
      │  «mándalo tú»              │
      ▼                            ▼
enviar-correo ──────────────►  Resend ──────►  el correo, de OaxIntegra
(arma el HTML)                                        │
                                                      ▼
                                        la persona escribe el código
                                                      │
                                                      ▼
                                    /auth/v1/verify  ·  igual que siempre
```

Lo importante de este dibujo es lo que **no** cambia:

- **El código lo sigue inventando Supabase.** Son números nuevos y distintos
  para cada persona y cada intento — nunca el mismo para todos —, y es
  Supabase quien los caduca (una hora) y los invalida en cuanto se usan.
- **La app lo sigue comprobando igual**, con `/auth/v1/verify`. No se tocó ni
  una línea del registro: solo cambió *cómo se ve* el correo.

Por eso esto se puede apagar en cualquier momento sin romper nada: se vuelve
al correo de fábrica y nadie se queda fuera (ver el final de esta página).

---

## Lo que hay que hacer una vez, a mano

Son cuatro pegadas de texto. La función ya está desplegada.

### 1 · Una cuenta de Resend y su llave

Resend es quien entrega el correo. Gratis hasta 3 000 correos al mes, que es
mucho más de lo que hoy hace falta.

1. Entra a **[resend.com](https://resend.com)** y crea la cuenta (se puede con
   Google o GitHub).
2. Ve a **[API Keys](https://resend.com/api-keys)** → **Create API Key**.
   - Name: `oaxintegra`
   - Permission: **Sending access**
3. Cópiala. Empieza con `re_`. **Se enseña una sola vez**: si la pierdes, se
   borra esa y se crea otra.

### 2 · Crear el enganche en Supabase (y quedarte con su secreto)

Ve a **[Authentication → Hooks](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/auth/hooks)**.

1. En **Send Email hook**, dale a habilitarlo.
2. Tipo: **HTTPS**.
3. URL:
   ```
   https://pnexvkjnwbyaiwcwyrev.supabase.co/functions/v1/enviar-correo
   ```
4. Dale a **Generate secret** y **cópialo**. Es un texto que empieza con
   `v1,whsec_`.
5. **Create**.

Ese secreto es lo que hace que la función sepa que quien la llama es de
verdad Supabase Auth y no cualquiera que encontró la dirección. Sin él la
función contesta 401 y no manda nada.

### 3 · Guardar los dos secretos donde la función los lee

Ve a **[Edge Functions → Secrets](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/functions/secrets)**
y añade estos dos:

| Nombre | Valor |
|---|---|
| `RESEND_API_KEY` | la llave del paso 1 (empieza con `re_`) |
| `SEND_EMAIL_HOOK_SECRET` | el secreto del paso 2 (empieza con `v1,whsec_`) |

Pégalos completos y tal cual, sin comillas y sin espacios al final.

### 4 · Probar

Regístrate en la app con un correo. Tiene que llegar el correo de OaxIntegra
con el código, y el código tiene que servir al escribirlo.

Si no llega, no hay que adivinar: el motivo queda escrito en los
**[logs de la función](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/functions/enviar-correo/logs)**.
La tabla del final de esta página dice qué significa cada mensaje.

---

## Un límite que conviene saber antes de abrir la app a la gente

Mientras no verifiques un dominio propio, Resend manda desde
`onboarding@resend.dev`, y con ese remitente **solo deja mandarle correos a la
dirección con la que abriste la cuenta de Resend**. Cualquier otro destinatario
lo rechaza.

O sea:

- **Para probar tú**: funciona ya, tal cual, si te registras con el mismo
  correo de tu cuenta de Resend.
- **Para que se registre cualquiera**: hay que verificar un dominio en
  **[Domains](https://resend.com/domains)** (se añaden unos registros DNS
  donde tengas el dominio) y luego cambiar el remitente. Eso se hace sin
  tocar código, con un tercer secreto:

  | Nombre | Valor |
  |---|---|
  | `CORREO_DESDE` | `OaxIntegra IA <hola@tudominio.com>` |

  Si no pones ese secreto, la función usa `OaxIntegra IA <onboarding@resend.dev>`.

Esto no es un defecto de la función: es cómo Resend (y cualquier servicio de
correo serio) evita que alguien mande correo diciendo ser de un dominio que no
es suyo.

---

## Si algo sale mal: cómo apagarlo

Apagar el enganche devuelve el correo de fábrica al instante — feo y en
inglés, pero funcionando. **Nadie se queda sin poder registrarse.**

En **[Authentication → Hooks](https://supabase.com/dashboard/project/pnexvkjnwbyaiwcwyrev/auth/hooks)**,
desactiva el **Send Email hook**. Eso es todo. La app no se entera: sigue
pidiendo el código a `/auth/v1/otp` y comprobándolo con `/auth/v1/verify`
igual que siempre.

### Qué dice cada mensaje de los logs

| En los logs | Qué pasó | Qué hacer |
|---|---|---|
| `falta SEND_EMAIL_HOOK_SECRET` | el secreto del paso 3 no está guardado | guárdalo |
| `la firma no coincide` | el secreto guardado no es el que generó el enganche | vuelve a copiarlo del paso 2 |
| `el sello de tiempo está fuera de rango` | llegó un aviso muy viejo (o un reintento repetido) | normalmente se arregla solo |
| `falta RESEND_API_KEY` | la llave del paso 1 no está guardada | guárdala |
| `Resend no aceptó el envío: 403` | el remitente no está permitido | el límite del dominio, arriba |
| `Resend no aceptó el envío: 401` | la llave de Resend es mala o se borró | crea otra |
| `correo enviado` | salió bien | si no llegó, mira la carpeta de spam |

El código **nunca** aparece en los logs, y es a propósito: quien lo lee entra,
y los logs los ve cualquiera que entre al panel.

---

## Lo que quedó por escrito en el código

- `supabase/functions/enviar-correo/index.ts` — la función. Comprueba la firma
  del aviso a mano con WebCrypto (doce líneas) en vez de traer una librería,
  para que el correo de toda la app no dependa de que un paquete de terceros
  siga en pie.
- La firma se compara en **tiempo fijo**: con `===` normal, el tiempo que tarda
  en contestar delata cuánto acertó quien está probando.
- Se revisa el **sello de tiempo** del aviso (cinco minutos de margen): sin eso,
  quien grabara un aviso podría repetirlo después para volver a disparar correos.
- Un tipo de correo que Supabase invente mañana igual se manda, con el texto
  neutro de «tu código para entrar», en vez de quedarse callado.
