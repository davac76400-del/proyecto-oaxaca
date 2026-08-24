# Cómo se entra a OaxIntegra IA

**Una sola forma de entrar:** tu correo y un código de 8 números.

```
        ┌──────────────────────────────┐
        │  [ Iniciar sesión ]          │
        │  [ Registrarme    ]          │
        └──────────────────────────────┘
              │                    │
    ┌─────────┘                    └──────────┐
    ▼                                         ▼
REGISTRARSE                            INICIAR SESIÓN
 1. usuario + correo                    correo + 8 números  →  dentro
 2. te llegan 8 números al correo             │
 3. los escribes                              └─ «Olvidé mi código»
 4. ⚠️ GUÁRDALOS: son tu código
 5. (opcional) código de recuperación
```

---

## El código de entrada

Llega por correo **al registrarte**, y **ese mismo número se queda como tu
contraseña**. No cambia. Con tu correo y esos 8 números entras siempre, sin
volver a esperar ningún correo.

### Por qué hay que fijarlo, y no basta con el que manda Supabase

Los códigos que manda Supabase son **de un solo uso y vencen**. Si la app no
hiciera nada más, el número dejaría de servir al día siguiente y la persona se
quedaría fuera.

Lo que hace la app: en cuanto el código se comprueba, lo **fija como la
contraseña** de esa cuenta (`PUT /auth/v1/user`). Supabase la cifra con bcrypt
y no la devuelve nunca. Así el número que llegó al correo es el mismo con el
que se entra siempre.

**Comprobado en la prueba:** después del registro se mira que la contraseña
guardada en el servidor sea exactamente el código que llegó, y que **no quede
en el navegador**.

### Cada quien recibe el suyo

`{{ .Token }}` no es un número: es un hueco que Supabase rellena, al mandar
cada correo, con uno recién generado al azar. Seis peticiones dan seis códigos
distintos — está en la prueba.

---

## Si se te olvida: «Olvidé mi código»

```
correo + código de recuperación  →  ✓  →  te llega un código NUEVO al correo
                                          →  lo escribes  →  dentro
```

El **código de recuperación** son 8 números que la persona elige dentro de la
app, en **Mi cuenta** (tocando su nombre en la barra de arriba). Se ofrece
también justo después de registrarse.

No es una segunda forma de entrar: **solo sirve para pedir un código de entrada
nuevo**. Con él, el viejo deja de valer al instante.

### Dónde se guarda cada cosa

| | Dónde | Cómo |
|---|---|---|
| Código de **entrada** | `auth.users` de Supabase | bcrypt, no se puede leer |
| Código de **recuperación** | `perfiles.recuperacion_hash` | bcrypt de Postgres (pgcrypto) |
| En el navegador | **nada de esto** | comprobado en la prueba |

En Supabase cada cuenta tiene **una sola** contraseña, y esa la ocupa el código
de entrada. Por eso el de recuperación se guarda aparte, cifrado, y se
comprueba dentro de una función que nadie puede leer por fuera
(`usar_recuperacion`, en `003_recuperacion.sql`).

### Contra quien pruebe códigos a lo tonto

- **5 intentos** y luego **15 minutos** de espera
- Un correo que no existe contesta **lo mismo** que un código equivocado, y
  tarda parecido: así esto no sirve para averiguar quién tiene cuenta
- Se rechazan `11111111`, `12345678` y `12121212`

---

## ⚠️ Lo que hay que configurar en Supabase

### 1 · Que el correo lleve el código, y de 8 números

**Authentication → Sign In / Providers → Email:**

| Ajuste | Ponlo en |
|---|---|
| **Email OTP Length** | **8** |
| **Email OTP Expiration** | **600** (10 minutos) |

Los 8 tienen que coincidir con `LARGO_CODIGO` en la app. Si algún día lo
cambias, avísame para cambiar las casillas de la pantalla.

### 2 · La plantilla del correo

**Authentication → Emails → Magic Link:**

**Asunto:**

```
Tu código para entrar a OaxIntegra IA
```

**Cuerpo:**

```html
<p>Hola, somos de OaxIntegra IA y te enviamos tu código de acceso.</p>

<p style="font-size:15px">Escribe estos 8 números en la página:</p>

<p style="font-size:34px; font-weight:bold; letter-spacing:8px; margin:18px 0">{{ .Token }}</p>

<p style="font-size:14px"><b>Guarda este número.</b> Con tu correo y estos 8 números entras siempre.</p>

<p style="font-size:13px; color:#666">Si no pediste entrar, no hagas nada.</p>
```

`{{ .Token }}` son los números. **Sin eso no llega ningún código.**

### 3 · Las tablas

En el **SQL Editor**, en este orden:

1. `backend/migraciones/001_perfiles.sql`
2. `backend/migraciones/002_codigo_seguridad.sql`
3. `backend/migraciones/003_recuperacion.sql`

El 003 depende del 002, y el 002 del 001.

---

## Si algo no funciona

| Lo que ves | Qué pasa |
|---|---|
| Llega un correo **sin números** | Falta `{{ .Token }}` en la plantilla |
| Llegan 6 números y la pantalla pide 8 | Falta poner **Email OTP Length = 8** |
| «Ese correo y ese código no coinciden» | Se escribió mal, o es de otra cuenta |
| «Demasiados intentos, espera 15 minutos» | Cinco fallos seguidos en la recuperación |
| Se queda en «Comprobando si está libre…» | Falta aplicar `001_perfiles.sql` |
| «No se pudo guardar» al poner la recuperación | Falta aplicar `003_recuperacion.sql` |

---

## Lo que probé y lo que no

**Probado aquí: 51 comprobaciones en un navegador de verdad**, en pantalla de
celular (`pruebas/acceso.mjs`, contra un Supabase de mentiras):

- La portada con dos botones, sin dos formas de entrar
- Registro completo, con el usuario comprobado **sin sesión**
- Que el código que llega **quede fijado** como contraseña
- Entrar después solo con correo + código, sin ningún correo de por medio
- Código equivocado, y recuperación equivocada, con los intentos que quedan
- La recuperación buena → llega un código nuevo → el viejo deja de valer
- Que ni el código de entrada ni el de recuperación queden en el navegador
- Cerrar sesión, y que vuelva a los dos botones del principio

**No pude probar aquí:**

- **Que el correo salga de verdad.** Esta máquina tiene bloqueada la salida a
  `supabase.com`. Eso lo tienes que ver tú: `npm start`, tu propio correo, y
  comprobar que llega el número.
