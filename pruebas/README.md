# Las pruebas

Comprueban que se puede entrar a la app, de punta a punta, en un navegador de
verdad. **Sin tocar tu Supabase**: `supabase-falso.js` levanta uno de mentiras
que responde a las mismas llamadas.

## Correrlas

```bash
# Playwright, solo la primera vez
npm install -D playwright && npx playwright install chromium
```

## C · Usuario y contraseña (la forma de entrar actual)

Desde el 11 de septiembre de 2026 se entra con **usuario + contraseña**, no
con el enlace o el código del correo (ese código ahora solo comprueba que el
correo es tuyo, al registrarte o al recuperar tu cuenta — el detalle completo
está en `docs/08-acceso-por-codigo.md`).

```bash
node pruebas/supabase-falso.js "una-llave-cualquiera"

SUPABASE_URL=http://localhost:54321 SUPABASE_ANON_KEY="una-llave-cualquiera" \
  python3 frontend/build.py
npm start                                                  # otra terminal

ANON_KEY="una-llave-cualquiera" node pruebas/usuario-contrasena.mjs
```

**Importante:** la misma llave en las tres líneas. Si no coinciden, el
navegador manda un `apikey` que el servidor de mentiras no reconoce y todo
falla con «No API key found in request» — así se me fue un buen rato la
primera vez que lo corrí.

Al terminar, **vuelve a construir sin esas variables** para que `dist/` no se
quede apuntando al servidor de mentiras:

```bash
python3 frontend/build.py
```

### Qué comprueba (29 cosas)

Registro completo (correo → código → elegir usuario y contraseña, con los
rechazos de formato inválido y contraseña débil en el camino, y la lista de
requisitos pintándose en vivo) → cerrar sesión y volver a entrar con usuario
+ contraseña (con una contraseña incorrecta primero, que debe dar el mismo
mensaje sin importar qué falló) → cambiar la contraseña desde «Mi cuenta»
(pidiendo la contraseña actual, y rechazando una actual equivocada) → volver
a entrar con la contraseña nueva → «Olvidé mi contraseña» (nuevo código →
pantalla para **crear** una contraseña nueva, nunca para «recordar» la vieja)
→ entrar con la contraseña puesta al recuperar la cuenta → **una cuenta con
usuario del formato de ANTES de la migración 007 (con punto, hasta 20
caracteres) sigue pudiendo entrar** → **el enlace del correo (la plantilla
de fábrica de Supabase, sin configurar nada) durante «Olvidé mi contraseña»
lleva a elegir una contraseña nueva, no entra directo con la que se está
intentando recuperar** → cero errores de JavaScript.

Las dos comprobaciones en negrita corrigen bugs reales que encontró una
revisión de código sobre la primera versión de este sistema (ver el commit
que las agregó): sin ellas, una cuenta vieja se quedaba sin poder entrar por
usuario, y recuperar la cuenta por el enlace del correo no servía de nada —
entraba derecho con la contraseña que justo se había olvidado.

## Los escenarios viejos (A y B), retirados

`acceso.mjs` y `sin-configurar.mjs` probaban la forma de entrar **anterior**
(un código que se fijaba como la contraseña, sin usuario ni contraseña
elegidos por la persona). Esa pantalla ya no existe — los `id` que usaban
esos archivos (`#reg-usuario`, `#vista-guardalo`, `#vista-crear-recuperacion`)
se quitaron del HTML, así que **ya no corren**. Se dejan en el repositorio
como referencia histórica; si alguna vez hace falta resucitarlos, hay que
reescribirlos contra las vistas nuevas descritas en `docs/08-acceso-por-codigo.md`.

Lo que sigue de aquí para abajo es esa documentación vieja, tal cual, por si
sirve de referencia mientras tanto.

### A · Supabase sin configurar (lo que le pasa a quien acaba de empezar)

```bash
node pruebas/supabase-falso.js "una-llave-cualquiera"     # sin variables: 6 dígitos, plantilla de enlace

SUPABASE_URL=http://localhost:54321 SUPABASE_ANON_KEY="una-llave-cualquiera" \
  python3 frontend/build.py
npm start                                                  # otra terminal

node pruebas/sin-configurar.mjs
```

Comprueba que la app funciona **aunque nunca se toque el panel de Supabase**:
el correo trae un enlace, la persona le da clic, y la app le inventa su código.

### B · Supabase ya configurado (8 dígitos y plantilla con el código)

```bash
LARGO_FALSO=8 PLANTILLA_FALSA=codigo node pruebas/supabase-falso.js "una-llave-cualquiera"

SUPABASE_URL=http://localhost:54321 SUPABASE_ANON_KEY="una-llave-cualquiera" \
  python3 frontend/build.py
npm start

ANON_KEY="una-llave-cualquiera" node pruebas/acceso.mjs
```

Al terminar, **vuelve a construir sin esas variables** para que `dist/` no se
quede apuntando al servidor de mentiras:

```bash
python3 frontend/build.py
```

## Qué comprueban (32 cosas)

| Paso | Qué mira |
|---|---|
| 1 | Que la portada tenga **un solo campo**, y que no queden restos del registro viejo |
| 2 | Que un correo mal escrito avise, y no avance |
| 3 | Que pedir el enlace lleve a «revisa tu correo» |
| 4 | Que el «demasiados envíos» se explique en español |
| 5 | Que al volver del enlace entre solo, y que **el token se borre de la barra** |
| 6 | Que el giro se pregunte **ya adentro**, y que se guarde |
| 7 | Que la sesión aguante una recarga |
| 8 | Que un token falso **no** deje entrar, y que limpie lo que había |
| 8b | Que el enlace sirva también con la app ya abierta (BUG-28) |
| 9 | Que se pueda cerrar sesión, también desde el celular (BUG-27) |
| 10 | Que no haya ningún error de JavaScript |

El paso 4 provoca un 429 y el 8 un 401 **a propósito**; por eso el paso 10 los
descarta. También descarta los fallos de `fonts.googleapis.com`, que en algunas
redes está bloqueado y no es cosa de la app.

## Si algo falla

La prueba dice en qué paso y qué esperaba. Casi siempre es una de dos:

- **El servidor de mentiras se quedó con datos de la corrida anterior.**
  No debería: la prueba llama a `/__reset` al empezar. Si sospechas, reinícialo.
- **Estás corriendo `dist/` construido sin las variables de Supabase.**
  Entonces la portada sale con el botón apagado y falla desde el paso 3.
