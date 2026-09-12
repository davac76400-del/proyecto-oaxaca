# Cómo se entra a OaxIntegra IA

**Desde el 11 de septiembre de 2026: usuario y contraseña**, elegidos por
cada quien. El correo y un código siguen ahí, pero ya no son la forma de
entrar — solo sirven para comprobar que un correo es tuyo, al registrarte o
si se te olvida la contraseña.

> Esto reemplaza al sistema anterior (código de 8 números que se quedaba
> fijo como la contraseña). Ese cambio, y por qué se hizo, está en
> `docs/04-auth-flow.md`. La migración que lo puso en la base es
> `backend/migraciones/007_usuario_contrasena.sql` — **hay que aplicarla**
> para que esto funcione (ver más abajo).

```
        ┌──────────────────────────────┐
        │  [ Iniciar sesión ]          │
        │  [ Registrarme    ]          │
        └──────────────────────────────┘
              │                    │
    ┌─────────┘                    └──────────┐
    ▼                                         ▼
REGISTRARSE                            INICIAR SESIÓN
 1. tu correo                           usuario + contraseña  →  dentro
 2. te llega un código, lo escribes           │
    (solo comprueba que el correo es tuyo)    └─ «Olvidé mi contraseña»
 3. eliges tu USUARIO y tu CONTRASEÑA               │
 4. dentro, con eso ya entras siempre          código nuevo al correo
                                                     │
                                              eliges una contraseña NUEVA
                                              (no te «recuerda» la vieja)
```

---

## Los requisitos, tal cual los pide la pantalla

| | Regla | Dónde se revisa |
|---|---|---|
| **Usuario** | 5 a 20 caracteres. Letras, números, `_`, `-` y `.`. Sin espacios. Único (no se puede repetir). | En el navegador (`REGLAS.usuario`) y otra vez en la base (`usuario_formato`, `usuario_libre`) |
| **Contraseña** | Al menos 5 caracteres. Al menos una MAYÚSCULA y una minúscula. Solo letras, números y estos signos: `_` `-` `.` | Solo en el navegador (`evaluarClave`, con la lista que se pinta en verde mientras escribes) |
| **Correo** | Tiene que ser de un dominio real conocido (gmail.com, hotmail.com, outlook.com, yahoo.com, etc.) | Solo en el navegador (`REGLAS.correo`, lista `DOMINIOS_CORREO_VALIDOS`) |

El usuario se elige **una sola vez**, justo después de comprobar el correo al
registrarte. De ahí en adelante es fijo — no cambia con cada correo, como sí
pasaba antes.

> **Límite conocido:** la contraseña la guarda Supabase Auth directamente
> (`PUT /auth/v1/user`), y de fábrica Supabase solo exige un largo mínimo —
> no sabe nada de mayúsculas, minúsculas o el resto de la lista de aquí. Nada
> en este repositorio, ni la migración `007` ni ninguna otra, hace cumplir
> esa lista del lado del servidor: alguien que hable directo con la API de
> Supabase (sin pasar por esta pantalla) podría poner una contraseña que no
> cumpla las mayúsculas o los números. La única forma real de exigirlo
> también del lado del servidor es un *Password Verification Hook* de
> Supabase (una Edge Function que Supabase consulta antes de aceptar cada
> contraseña) — no se armó en esta sesión porque es una pieza de
> infraestructura aparte (hay que escribirla, desplegarla y activarla en el
> panel), no un cambio de código. Si te importa cerrar esto del todo, es lo
> que faltaría agregar.

La contraseña se puede cambiar cuando quieras, desde dentro de la cuenta (más
abajo) o si la olvidas.

---

## 1 · Registrarte

```
tu correo  →  código de comprobación  →  eliges usuario y contraseña  →  dentro
```

El código que llega por correo (`/auth/v1/otp` + `/auth/v1/verify`, de
Supabase) **ya no se fija como nada**. Solo abre una sesión de verificación:
con ella se elige el usuario (`fijar_usuario`, en la base) y se manda la
contraseña a Supabase (`PUT /auth/v1/user`), que la cifra con bcrypt como
siempre. El código en sí no vuelve a servir — Supabase lo invalida en cuanto
se comprueba, igual que antes.

El usuario se comprueba **en vivo** mientras escribes (`usuario_libre`, sin
sesión, porque en ese momento todavía no hay una): dice si ya lo tiene
alguien antes de que intentes enviarlo.

## 2 · Entrar

La pantalla de «Iniciar sesión» pide **usuario y contraseña** — no correo.

Por dentro, Supabase Auth solo sabe entrar con correo, así que la app hace
un paso extra antes: le pregunta a la base «¿cuál es el correo de este
usuario?» (`correo_por_usuario`, sin sesión — se usa justo para poder
conseguirla) y con ese correo intenta el login de siempre
(`/auth/v1/token?grant_type=password`).

Esa pregunta se hace **mientras la persona escribe su usuario**, no solo al
darle a Entrar: si la cuenta no existe, el campo lo dice ahí mismo («No hay
ninguna cuenta con ese usuario») y no se queda marcado como válido. Antes se
pintaba de válido con solo tener letras, y la persona se enteraba de que su
usuario estaba mal escrito hasta después de teclear la contraseña — con un
error que parecía ser de la contraseña.

Los tres fallos se dicen por separado, a propósito:

| Qué pasó | Qué dice la pantalla |
|---|---|
| No existe ninguna cuenta con ese usuario | «No hay ninguna cuenta con ese usuario. Revisa que esté bien escrito, o créala desde *Registrarme*.» |
| La cuenta existe, la contraseña no coincide (400 de Supabase) | «Tu contraseña no es correcta.» |
| No se pudo ni preguntar: le falta una función a la base (404), un permiso mal puesto (401/403), o no hay señal | «El acceso no está terminado de instalar en el servidor…», nombrando la migración `009` |

Ese tercer caso es el que más tiempo costó en la práctica: antes se confundía
con «ese usuario no existe», así que la persona revisaba cómo había escrito su
usuario mientras el problema estaba en el servidor. Lo mismo con el 429 de
Supabase por intentar muchas veces, que se contaba como «contraseña
incorrecta» y dejaba a la gente cambiando una contraseña que estaba bien.

Distinguir el primer caso es decisión explícita del proyecto: se prefiere un
mensaje útil sobre esconder si un usuario existe (ver el aparte de abajo).

### Sobre `correo_por_usuario`: sí, revela que un usuario existe

Por diseño, esta función le dice a quien pregunte «sí, este usuario existe, y
su correo es éste» — es la única forma de que entrar con usuario funcione.
Es el mismo trato que cualquier sitio con «entra con tu usuario»: Twitter,
GitHub, el banco. Lo que sí se cuidó, igual que en la recuperación de la
migración 003:

- Usuario que no existe, o con formato inválido, tarda **parecido** a uno
  que sí existe (`pg_sleep`), para que la demora no sirva de reloj.
- Nunca se listan usuarios ni cuántos hay parecidos.
- El freno real contra probar contraseñas a lo tonto lo pone Supabase Auth
  por su cuenta en `/auth/v1/token` — eso no cambió.

## 3 · «Olvidé mi contraseña»

```
tu correo  →  código nuevo  →  lo escribes  →  eliges una contraseña NUEVA  →  dentro
```

**Importante — esto no «recuerda» tu contraseña vieja, crea una nueva.** La
pantalla lo dice así, sin rodeos: *«No te va a llegar tu contraseña de
vuelta: por seguridad, ni nosotros podemos leerla. Lo que sí puedes hacer
aquí es crear una nueva.»*

No es un descuido ni una limitación de esta versión: **es imposible hacerlo
de otra forma sin debilitar la seguridad de todos.** Supabase guarda la
contraseña cifrada con bcrypt — un cifrado de un solo sentido, hecho a
propósito para que ni la propia base de datos pueda volver a sacar el texto
original. «Recordarte» la contraseña necesitaría guardarla de una forma que
sí se pudiera leer, y eso es justo lo que un cifrado de contraseñas nunca
debe hacer (si alguien alguna vez entrara a la base sin permiso, se
llevaría contraseñas legibles en vez de un cifrado inútil para él). Ningún
sitio serio — ni tu correo, ni el banco, ni Twitter — te «recuerda» tu
contraseña por esto mismo; todos ofrecen crear una nueva.

Igual que en el registro, el código solo comprueba que el correo es tuyo.
No hace falta ya saber un código de recuperación aparte, ni haberlo puesto
antes: basta con demostrar que ese correo es tuyo, ahora mismo, para elegir
una contraseña nueva. Tu usuario **no cambia** — se te muestra en la pantalla
para confirmarlo.

## 4 · Cambiar tu contraseña (sin haberla olvidado)

Desde dentro de la cuenta: tocas tu nombre en la barra de arriba → «Cambiar
mi contraseña». Pide:

- **Tu contraseña actual** — se vuelve a comprobar contra Supabase en ese
  momento (`/auth/v1/token?grant_type=password`), no basta con que el
  teléfono ya tenga la sesión abierta. Así, si el celular es prestado o la
  sesión es vieja, no cualquiera puede cambiarla sin saber la de antes.
- **Tu contraseña nueva**, dos veces, con la misma lista de requisitos
  pintándose en verde.

Si la actual no coincide, lo dice («Esa no es tu contraseña actual.») y no
cambia nada.

---

## Las cuentas de antes de este cambio

Nadie se queda fuera. Una cuenta creada con el sistema viejo (usuario con
formato distinto — con punto, por ejemplo — y contraseña igual al código
numérico de aquel entonces) **sigue entrando exactamente igual que
siempre**: usuario y esa misma contraseña. El formulario de login no le
exige el formato nuevo a nadie (`usuario-login` y `clave-login`, en
`REGLAS`, solo piden que no vengan vacíos).

Lo que sí exige el formato nuevo — 5 a 20 caracteres, con punto permitido — es
**crear** un usuario (`usuario_formato`, `usuario_libre`, `fijar_usuario`) y
**poner** una contraseña nueva (al registrarse, al cambiarla, o al
recuperarla). Una cuenta vieja se pasa al formato nuevo sola, la primera vez
que use «Cambiar mi contraseña» o «Olvidé mi contraseña».

---

## Dónde se guarda cada cosa

| | Dónde | Cómo |
|---|---|---|
| Usuario | `perfiles.usuario` | texto, con el formato revisado por un `CHECK` |
| Contraseña | `auth.users`, de Supabase | bcrypt, no se puede leer ni por la propia base |
| Código de comprobación (registro y recuperación) | vive un momento en Supabase Auth | de un solo uso, vence, y no vuelve a servir tras comprobarlo |
| En el navegador | nada de esto — solo el token de sesión, mientras dura | comprobado en la prueba |

### Lo que NO se tocó

El **código de recuperación** de la migración 003 (los 8 números que algunas
cuentas viejas tienen guardados, cifrados en `perfiles.recuperacion_hash`)
sigue en la base tal cual — la columna, la función `usar_recuperacion`, todo.
**El sitio ya no lo usa**: ahora «olvidé mi contraseña» solo pide el correo,
como se explicó arriba. Se decidió no tocarlo a propósito: borrarlo sería
tirar datos de cuentas reales por una característica que ya nadie llama. Si
algún día estorba, se retira en una migración aparte, adrede.

---

## Configurar Supabase: nada es obligatorio

**La app funciona con Supabase tal como viene de fábrica.** Lo de abajo son
mejoras, no requisitos — el código de comprobación funciona igual mande
Supabase un enlace o números.

### Mejora 1 · que el correo traiga los números

**Authentication → Emails → Magic Link**, cuerpo:

```html
<p>Hola, somos de OaxIntegra IA y te enviamos tu código.</p>

<p style="font-size:15px">Escribe estos números en la página:</p>

<p style="font-size:34px; font-weight:bold; letter-spacing:8px; margin:18px 0">{{ .Token }}</p>

<p style="font-size:14px">Este código solo comprueba que este correo es tuyo. Tu usuario y tu contraseña son aparte, y los elegiste tú.</p>

<p style="font-size:13px; color:#666">Si no pediste esto, no hagas nada.</p>
```

Sin esto, quien no le dé clic al enlace del correo puede escribir el código
que la propia app le inventa y le enseña en pantalla al darle clic — sigue
funcionando, solo que con un paso más.

### Mejora 2 · códigos de 8 en vez de 6

**Authentication → Sign In / Providers → Email:**

| Ajuste | De fábrica | Recomendado |
|---|---|---|
| **Email OTP Length** | 6 | **8** |
| **Email OTP Expiration** | 3600 | **600** |

La app **acepta 6 u 8** (`MIN_CODIGO_CORREO` / `LARGO_CODIGO`), así que esto
solo sube de un millón de combinaciones a cien millones.

### 3 · Las tablas

Los archivos de `backend/migraciones/`, en orden, del `001` al `009`.
El `007_usuario_contrasena.sql` es el que trae todo lo de este documento
(usuario+contraseña); sin aplicarlo, la app sigue mostrando las pantallas
nuevas pero la base las rechaza.

**Si solo vas a correr una, corre la `009_acceso_completo.sql`.** Existe justo
porque aplicar migraciones a mano, una por una en el panel, no deja forma de
saber después cuáles llegaron de verdad. La `009` deja el acceso completo sin
importar qué se aplicó antes: rehace `usuario_libre`, `fijar_usuario` y
`correo_por_usuario`, y —esto es lo que ninguna anterior podía garantizar—
fija sus permisos de forma **explícita**, con `GRANT` y `REVOKE`. Se puede
correr las veces que se quiera.

El hueco que tapa era serio y callado: `correo_por_usuario` **solo** se crea
en la `007`, y la app la llama en cada inicio de sesión (Supabase entra con
correo, no con usuario). Si la `007` no llegó, esa función no existe,
PostgREST contesta 404, y la pantalla decía «ese usuario no existe» aunque la
cuenta estuviera ahí — con el usuario buscando el error en su propio nombre y
el administrador buscándolo en el lado equivocado.

La `009` termina imprimiendo una tabla de comprobación. Lo que tiene que
salir:

```
correo_por_usuario  | anon puede: true  | authenticated puede: true
fijar_usuario       | anon puede: false | authenticated puede: true
usuario_libre       | anon puede: true  | authenticated puede: true
```

Si una línea no aparece, esa función no se creó y hay que mirar el error de
más arriba en el panel.

> **Estado en el proyecto `agrointegra`** (`pnexvkjnwbyaiwcwyrev`):
> la `001` a la `007` se aplicaron el 12 de septiembre de 2026, y la `008`
> ese mismo día. Comprobado entonces: la tabla `perfiles` con sus doce
> columnas y RLS encendido; las tres políticas solo para `authenticated` y
> ninguna de DELETE; `anon` puede llamar `usuario_libre`,
> `correo_por_usuario` y `usar_recuperacion`, y **no** puede llamar
> `fijar_usuario`, `fijar_giro`, `fijar_recuperacion` ni `crear_perfil`.
>
> La **`009` queda pendiente de aplicar**. No se pudo hacer desde aquí: el
> entorno donde corre este agente no alcanza `pnexvkjnwbyaiwcwyrev`
> (el proxy de red contesta 403 a ese dominio) y el MCP de Supabase de esta
> sesión solo ve un proyecto viejo e inactivo, no este. Hay que pegarla en el
> editor SQL del panel, como las demás.
>
> El `dist/` y el `publicar/` de este repositorio ya se construyeron con la
> URL y la llave anon de ese proyecto, así que el botón de registrarse ya no
> sale apagado.

### Los avisos que quedan, y por qué se quedan

El revisor de seguridad de Supabase marca varios avisos del tipo «esta
función `SECURITY DEFINER` se puede llamar desde la API». **Son esperados:
es el diseño.** La tabla está cerrada con RLS y estas funciones son las
puertas controladas. Revisadas una por una:

| Función | Quién puede | Por qué es seguro |
|---|---|---|
| `usuario_libre` | sin sesión | Solo sí/no. Nunca dice de quién es ni cuántos hay. |
| `correo_por_usuario` | sin sesión | Se usa justo para poder entrar. Igual de lenta con usuario real o inventado; nunca lista usuarios. |
| `fijar_usuario` | con sesión | Solo toca la fila de quien llama (`auth.uid()`) |
| `fijar_giro` | con sesión | Igual |
| `usar_recuperacion` | sin sesión | Ya no la usa el sitio (ver arriba); se queda por las cuentas viejas que aún tienen el dato. Freno de 5 intentos y 15 min. |

Lo importante: **ningún aviso sobre RLS ni sobre tablas expuestas.**

---

## Si algo no funciona

| Lo que ves | Qué pasa |
|---|---|
| Llega un correo **sin números** | Falta `{{ .Token }}` en la plantilla (ver Mejora 1) — no es obligatorio, la app igual funciona con el enlace |
| «Ese usuario ya lo tiene alguien» al crear la cuenta | Alguien más ya lo eligió; hay que probar otro |
| «Tu usuario o tu contraseña no coinciden» | El mensaje es a propósito el mismo para los dos casos — revisa ambos |
| Se queda en «Comprobando si está libre…» | Falta aplicar `001_perfiles.sql` (o `007`, si es la comprobación de usuario nueva) |
| «Esa no es tu contraseña actual» al cambiarla | Se escribió mal la de ahora — no es la nueva, es la de antes de este cambio |
| Una cuenta vieja no puede crear un usuario con punto | A propósito: el formato nuevo (`5-15`, sin punto) solo aplica a usuarios que se crean o cambian de aquí en adelante |

---

## Lo que probé y lo que no

**Probado: 29 comprobaciones en un navegador de verdad**
(`pruebas/usuario-contrasena.mjs`, contra un Supabase de mentiras y el
servidor real de `backend/servidor.js`):

- Registro completo: correo → código → usuario y contraseña, con los
  rechazos de formato inválido y contraseña débil en el camino, y la lista
  de requisitos pintándose en verde conforme se cumple cada uno
- Que el código **no** se fije como contraseña (a diferencia del sistema
  viejo)
- Cerrar sesión y volver a entrar con usuario + contraseña
- Contraseña incorrecta → el mismo mensaje genérico, sin decir qué falló
- Cambiar la contraseña desde dentro, con la contraseña actual mal (se
  rechaza) y luego bien (se guarda)
- Entrar con la contraseña recién cambiada
- «Olvidé mi contraseña»: pide el correo (no un código de recuperación
  previo), llega un código nuevo, y **crea** una contraseña — nunca
  «recuerda» la vieja
- Que muestre el usuario existente durante la recuperación, sin cambiarlo
- Entrar con la contraseña puesta al recuperar la cuenta
- **Una cuenta con usuario del formato de antes de esta migración** (con
  punto, hasta 20 caracteres) **sigue pudiendo entrar** — esto se rompió en
  una primera versión de `007` y lo agarró una revisión de código antes de
  llegar a este documento; el porqué está en el comentario del `CHECK` de
  `usuario_formato`, en la propia migración
- **El enlace del correo (la plantilla de fábrica de Supabase) durante
  «Olvidé mi contraseña» lleva a elegir una contraseña nueva**, no entra
  derecho con la que se está intentando recuperar — mismo caso: se rompía en
  la primera versión, lo agarró la revisión, se corrigió y quedó con su
  propia prueba para que no se repita
- Cero errores de JavaScript en toda la corrida

**No pude probar aquí:**

- **Que el correo salga de verdad.** Esta máquina tiene bloqueada la salida
  a `supabase.com`. Eso lo tienes que ver tú: `npm start`, tu propio correo,
  y comprobar que llega el código.
- **Que alguien se registre de verdad, de punta a punta.** Las siete
  migraciones ya están aplicadas en `agrointegra` y se comprobaron ahí los
  permisos, las políticas y los dos formatos de usuario (ver arriba). Lo que
  no se pudo hacer desde esta máquina es la vuelta completa —correo → código
  → usuario y contraseña— porque la salida a `supabase.co` está bloqueada
  aquí. Eso es de un minuto para ti: `npm start`, tu propio correo, y a ver
  si llega.
