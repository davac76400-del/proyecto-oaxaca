# Entrar con un código al correo

Tres pasos: **correo → código de 6 números → elegir usuario**. Lo lleva
Supabase, que es quien manda el correo y quien recuerda quién es quién.

```
┌───────────────────────────┐
│ Paso 1 · tu correo        │
│ [ tucorreo@ejemplo.com ]  │
│ [ Mándame mi código     ] │
└───────────────────────────┘
             │
             ▼
┌───────────────────────────┐
│ Paso 2 · el código        │
│  ▢ ▢ ▢ ▢ ▢ ▢              │
│ [ Entrar ]                │
└───────────────────────────┘
             │
             ▼
┌───────────────────────────┐
│ Paso 3 · tu usuario       │   ← solo la primera vez, y es OBLIGATORIO
│ ⚠️ RECUERDA TU USUARIO     │
│ [ MariaTelar23 ]          │
└───────────────────────────┘
```

---

## ⚠️ EL PASO QUE HAY QUE HACER SÍ O SÍ

**Supabase manda un enlace, no un código, hasta que cambies la plantilla del
correo.** Si te saltas esto, la gente recibe un correo sin ningún número y la
pantalla del código se queda esperando algo que nunca llegó.

**Authentication → Emails → Magic Link**. Ahí se cambian las dos cosas:

**Asunto:**

```
Tu código para entrar a OaxIntegra IA
```

**Cuerpo:**

```html
<p>Hola, somos de OaxIntegra IA y te enviamos este enlace de acceso para entrar a tu cuenta.</p>

<p style="font-size:15px">Escribe estos 6 números en la página:</p>

<p style="font-size:34px; font-weight:bold; letter-spacing:8px; margin:18px 0">{{ .Token }}</p>

<p style="font-size:14px">O si prefieres, <a href="{{ .ConfirmationURL }}">entra directo con este enlace</a>.</p>

<p style="font-size:13px; color:#666">
El código sirve una sola vez y vence en una hora.<br>
Si no pediste entrar, no hagas nada.
</p>
```

Las dos etiquetas entre llaves son lo único que no se puede cambiar:

| Etiqueta | Qué es |
|---|---|
| `{{ .Token }}` | **Los 6 números.** Sin esto no hay código. |
| `{{ .ConfirmationURL }}` | El enlace, para quien prefiera darle clic |

Los dos caminos funcionan y llevan al mismo lugar. La app está hecha para el
código, pero si alguien le da clic al enlace, entra igual.

> **Sobre el nombre:** va **OaxIntegra IA**, con espacio y las dos letras de
> «IA» en mayúscula, igual que en toda la app. Confirmado el 24 de agosto de
> 2026: lo que se había puesto antes («Wax, integra IA») era el nombre dictado
> en voz alta y partido en dos.

---

## El otro paso que se salta todo el mundo

**Authentication → URL Configuration → Redirect URLs**, agrega:

```
http://localhost:3000/**
https://tu-sitio-real.com/**
```

Solo hace falta para quien entre por el enlace. Con el código funciona sin
esto, pero mejor déjalo puesto.

---

## El código NO es una contraseña fija

Esto importa entenderlo:

| | |
|---|---|
| **Cada vez que entras** | Se manda un código **nuevo** |
| **Sirve** | Una sola vez |
| **Vence** | En una hora |

Un código de 6 números que nunca cambiara y viajara por correo sin cifrar se
adivina en un rato: son un millón de combinaciones, nada para una computadora.
Así, aunque alguien vea el correo viejo, ese número ya no abre nada.

**Para quien lo usa se siente igual:** escribe el número que le llegó y entra.

---

## El usuario

Se elige **la primera vez y es obligatorio**. Reglas, las mismas de siempre en
este proyecto: de 4 a 20 caracteres, sin espacios, y al menos una MAYÚSCULA.

Mientras escribe se le va diciendo si está libre — sin poder leer la tabla,
porque las políticas de seguridad no lo permiten. Lo resuelve la función
`usuario_libre()`, que mira por dentro y solo contesta sí o no: nunca dice de
quién es ni cuántos hay.

### Si se le olvida el usuario, no pierde nada

Porque **el usuario no es la llave: la llave es el correo**. Entra con su
correo como siempre, y ahí mismo lo vuelve a ver.

Hay dos maneras:

1. **«Olvidé mi usuario»** en la portada. Entra normal y, al pasar, le sale su
   usuario en grande.
2. **Tocando su nombre** en la barra de arriba (o en el menú, si es celular).
   Sale una ventana con su usuario y su correo.

Esa es toda la recuperación de cuenta, y no hace falta más: no hay contraseña
que perder.

---

## La base de datos

Todo está en `backend/migraciones/001_perfiles.sql`. Se aplica pegándolo en el
**SQL Editor** de Supabase, o con el conector.

| Qué | Para qué |
|---|---|
| Tabla `perfiles` | El usuario y el giro. Ligada a `auth.users` por el id. |
| Índice único | Dos personas no pueden tener el mismo usuario, ni cambiando mayúsculas |
| **RLS** | Cada quien ve y toca **solo lo suyo** |
| `usuario_libre()` | Decir si un usuario está libre sin enseñar la tabla |
| `fijar_usuario()` | Guardarlo comprobando que siga libre, todo de una vez |
| `fijar_giro()` | Guardar el giro del negocio |

### Por qué las funciones y no tocar la tabla directo

Entre que compruebas que un usuario está libre y lo guardas, otro podría
tomarlo. `fijar_usuario()` hace las dos cosas de un solo golpe, y el índice
único tiene la última palabra: si hay choque, devuelve `ocupado` en vez de
reventar.

### Sobre la llave que va en el navegador

La **anon key** sí va en el HTML: es pública por diseño, es el identificador
del proyecto. **Lo que protege los datos son las políticas RLS de arriba**, no
esconderla.

La **service_role** nunca puede salir del servidor: se salta todas las reglas.
`build.py` y `revisar.js` abren el JWT, miran el rol de dentro, y se detienen
si aparece. Las dos empiezan con `eyJ` y se parecen muchísimo.

---

## Cuántos correos puedes mandar

Con el servidor que Supabase presta: **3 por hora**. Alcanza para probar, no
para tener gente usándolo.

Para uso real, conecta tu propio correo en **Settings → Authentication → SMTP**.
Resend, Brevo o Mailgun tienen plan gratis de sobra. De paso dejan de caer en
spam, que con el prestado pasa seguido.

---

## Si algo no funciona

| Lo que ves | Qué pasa |
|---|---|
| Llega un correo **sin ningún número** | Falta `{{ .Token }}` en la plantilla. Es lo primero de este documento. |
| «El acceso todavía no está configurado» | Falta `SUPABASE_URL` o `SUPABASE_ANON_KEY`. Corre `node revisar.js`. |
| El correo no llega | Mira en spam. Si sigue sin llegar, ya gastaste los 3 por hora. |
| «Ese código no coincide» | Se escribió mal, o ya se usó, o venció. Pide otro. |
| «Espera un minuto» | Supabase corta a 3 por hora por correo. |
| Se queda en «Comprobando si está libre…» | Falta aplicar `001_perfiles.sql`. |
| Entra y a los segundos se sale | El reloj de la computadora está mal: los tokens se validan por hora. |

---

## Lo que probé y lo que no

**Probado aquí, 42 comprobaciones en un navegador de verdad** (`pruebas/acceso.mjs`,
contra un Supabase de mentiras):

- La portada de tres pasos, en celular
- Correo mal escrito → avisa y no avanza
- Código equivocado → lo explica en español y no deja pasar
- Código correcto → pide el usuario, y **no deja entrar sin él**
- Usuario que no cumple las reglas → rechazado
- Usuario ya tomado → avisa **mientras escribe** y también al guardar
- Usuario bueno → entra y lo saluda por su nombre
- El giro se guarda y sobrevive a recargar
- Token inválido → no deja entrar y limpia lo que había
- El enlace del correo también sirve, y el token se borra de la barra
- Tocar el nombre enseña el usuario otra vez
- Cerrar sesión, también desde el celular
- Cero errores de JavaScript

**No pude probar aquí:**

- **Que el correo salga de verdad.** La máquina donde corro tiene la salida a
  internet filtrada: `supabase.com` no responde. El conector de Supabase sí
  llega, pero es para la base de datos, no para mandar correos de prueba.
  **Eso lo tienes que ver tú:** entra a `http://localhost:3000`, pon tu correo,
  y mira si llega el número.
- **La plantilla del correo**, porque se configura en tu panel, no en el código.
