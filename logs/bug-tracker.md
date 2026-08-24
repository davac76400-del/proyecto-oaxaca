# Bitácora de errores — post-mortem completo

Todos los errores enfrentados en el desarrollo, con su causa real y la
solución exacta. **Leer esto evita repetir semanas de trabajo.**

---

## BUG-01 · El chapulín reemplazado por emoji ✅ RESUELTO

**Síntoma:** versiones alternas del archivo (hechas por otras IA) sustituían
el chapulín alebrije por un emoji 🦗 o un SVG genérico.

**Causa:** al reescribir el archivo desde cero, se perdía el activo incrustado.

**Solución:** el chapulín es **activo protegido**. Cualquier reescritura debe
conservar las 4 apariciones del marcador `__CHAPULIN__`. El build ahora falla
si el marcador no está presente.

**Lección:** el autor ha pedido esto en casi todas las iteraciones. Es el
requisito más repetido de todo el proyecto.

---

## BUG-02 · "Escribiendo…" infinito ✅ RESUELTO

**Síntoma:** si n8n no respondía, el indicador de escritura se quedaba girando
para siempre y el chat quedaba inutilizable.

**Causa:** el `fetch` no tenía timeout.

**Solución:** `AbortController` con límite (hoy 20 s) y motor local de respaldo.
```js
var ctrl = new AbortController();
var corte = setTimeout(function(){ ctrl.abort(); }, CONFIG.LIMITE_MS);
fetch(url, { signal: ctrl.signal, ... })
```

---

## BUG-03 · Login que aceptaba a cualquiera ✅ RESUELTO

**Síntoma:** una versión alterna dejaba entrar sin validar el código.

**Solución:** validación real contra `localStorage`:
```js
var cuenta = leerCuentas()[usuario.toLowerCase()];
if (!cuenta) return error('No encontré esa cuenta');
if (cuenta.codigo !== codigo) return error('Código incorrecto');
```

---

## BUG-04 · El registro no dejaba pasar de la primera ventana ✅ RESUELTO

**Síntoma:** llenabas los datos, tocabas "Continuar" y no pasaba nada.

**Causa:** el teléfono estaba marcado como obligatorio (`data-regla="telefono"`)
y además figuraba en `validarGrupo([usu, tel, neg])`, aunque la etiqueta decía
"(opcional)".

**Solución:**
```js
// antes: if (!validarGrupo([usu, tel, neg])) return;
if (!validarGrupo([usu, neg])) return;   // el teléfono sale del grupo
```
más la nueva regla `telefono-opcional`.

---

## BUG-05 · El botón "Continuar" se sentía congelado ✅ RESUELTO

**Causa:** un `setTimeout` decorativo de 450 ms antes de avanzar de paso.

**Solución:** eliminado. El paso es inmediato.

---

## BUG-06 · Teléfono válido marcado en rojo ✅ RESUELTO

**Síntoma:** escribir `55-1234 5678` (10 dígitos con formato) daba error.

**Causa:** la validación contaba los caracteres literales, incluyendo guiones
y espacios.

**Solución:** limpiar antes de contar, y aceptar vacío:
```js
'telefono-opcional': {
  probar: function(v){
    var d = v.replace(/\D/g,'');
    return d.length === 0 || d.length === 10;
  }
}
```

⚠️ **Queda un detalle:** España usa 9 dígitos, no 10. La regla exige 10 para
todos los países. Ver `pendientes.md`.

---

## BUG-07 · El código generado automáticamente ⚠️ REVERTIDO POR DECISIÓN

**Qué pasó:** en una iteración se implementó que el sistema generara el código
de 6 dígitos y lo mostrara para guardarlo.

**Por qué se revirtió:** el autor lo pidió así en un momento, pero luego aclaró
que quería lo contrario: **que el usuario escriba y elija su propio código**.

**Estado actual:** el usuario escribe su código en 6 casillas. Correcto.

**Lección para Claude Code:** el autor cambia de opinión entre iteraciones.
Seguir siempre la instrucción más reciente y confirmar si hay ambigüedad.

---

## BUG-08 · La barra lateral del chat se quedaba azul oscuro en modo día ✅ RESUELTO

**Síntoma:** al cambiar a tema claro, la barra lateral de conversaciones y la
barra del chat seguían oscuras, rompiendo el diseño.

**Causa (importante):** las utilidades de Tailwind **con opacidad** hornean el
color al compilar:
```css
/* lo que generaba Tailwind */
.bg-obsidiana\/50 { background-color: rgba(8,11,18,.5); }  /* hex FIJO */
```
Aunque cambiaras las variables del tema, esas clases mantenían el color viejo.

**Solución:** reemplazar esas utilidades por clases propias que usan variables:
```css
.lateral-chat     { background: color-mix(in srgb, rgb(var(--obsidiana)) 55%, transparent); }
.barra-chat       { background: color-mix(in srgb, rgb(var(--barroalto)) 65%, transparent); }
.panel-suave      { background: color-mix(in srgb, rgb(var(--barro)) 65%, transparent); }
.zona-chat-marco  { background: rgb(var(--barro)); }
.menu-movil       { background: color-mix(in srgb, rgb(var(--obsidiana)) 96%, transparent); }
```

**No revertir esto.** Si alguien vuelve a poner `bg-obsidiana/50`, el bug regresa.

---

## BUG-09 · Textos blancos sobre fondo claro ✅ RESUELTO (el más profundo)

**Síntoma:** el logo "OaxIntegra" y varios textos salían en blanco azulado
`rgb(233,238,244)` sobre el fondo café claro. Ilegibles.

**Causa raíz:** `tailwind.config.js` tenía **hexadecimales fijos del tema
oscuro**:
```js
colors: { texto:'#E9EEF4', tenue:'#8FA0B6', ... }   // ← el problema
```
Así, `text-texto` **siempre** pintaba blanco, sin importar el tema activo.

**Solución (cambio arquitectónico):**

1. Las variables CSS pasaron a **formato de canales RGB**:
```css
--texto: 36 28 19;      /* en vez de #241C13 */
```
2. El config de Tailwind pasó a usarlas con `<alpha-value>`:
```js
colors: {
  texto: 'rgb(var(--texto) / <alpha-value>)',
  tenue: 'rgb(var(--tenue) / <alpha-value>)',
  ...
}
```
3. Todos los usos directos en el `<style>` se envolvieron:
```css
color: rgb(var(--texto));
background: rgb(var(--obsidiana));
```

**Resultado:** todas las clases de Tailwind ahora siguen el tema activo.
Esto arregló de raíz varios problemas de tema a la vez.

**Herramienta de verificación** (útil para revisar de nuevo):
```js
// Pegar en la consola del navegador: lista textos demasiado claros
document.querySelectorAll('#portada *, header *').forEach(e => {
  if (!e.textContent.trim() || e.children.length) return;
  const m = getComputedStyle(e).color.match(/\d+/g); if (!m) return;
  const [r,g,b] = m.map(Number);
  const lum = 0.299*r + 0.587*g + 0.114*b;
  if (lum > 170) console.log(e.tagName, e.textContent.trim().slice(0,30), getComputedStyle(e).color);
});
```

---

## BUG-10 · Textos tenues lavados ✅ RESUELTO

**Síntoma:** textos de ayuda pequeños casi invisibles.

**Causa:** opacidades aplicadas al texto — `text-tenue/70`, `/80`, `/60`.
Sobre un café ya medio, la opacidad lo dejaba casi al nivel del fondo.

**Solución:** eliminadas todas las opacidades de texto y `--tenue` oscurecido
a `74 63 50` (#4A3F32).
```python
import re
s = re.sub(r'text-tenue/\d+', 'text-tenue', s)
s = re.sub(r'text-texto/\d+', 'text-texto', s)
```

**Regla permanente:** nunca aplicar opacidad a texto en el tema claro.

---

## BUG-11 · El recuadro negro del chapulín ✅ RESUELTO (tras 4 intentos)

**Síntoma:** el chapulín se veía como imagen pegada con un rectángulo oscuro.

**Intentos fallidos:**
1. Medallón oscuro con borde y greca → seguía siendo un recuadro visible
2. `mix-blend-mode: screen` sin fondo → sobre fondo claro el chapulín se
   **borraba**, quedaba fantasmal y lavado
3. Halo radial difuso detrás + screen → el halo **se veía como rectángulo
   borroso**; el "recuadro" que el autor seguía reportando ERA el halo
4. Ajustes de CSS varios → ninguno funcionó, porque el problema estaba en la
   imagen, no en el CSS

**Solución real:** recortar el fondo con Python/PIL (rampa por luminancia),
generando transparencia verdadera. Ver `frontend/procesar_chapulin.py`.
Con transparencia real se pudo eliminar el halo Y el blend mode.

**Detalle de peso:** el PNG transparente pesaba 518 KB → convertido a WebP
transparente: 137 KB. Importa porque se incrusta 4 veces en base64.

---

## BUG-12 · El fosforescente que no se iba ✅ RESUELTO

**Síntoma:** el autor pidió muchas veces quitar el fosforescente; se quitaban
los efectos del CSS y **seguía viéndose fosforescente**.

**Causa real (tardó en descubrirse):** los trazos cian neón están
**pintados dentro de la imagen**, no eran un efecto CSS. Ninguna edición de
CSS podía quitarlos.

**Solución:** detectar los píxeles neón por saturación + brillo y desaturarlos
con PIL. Ver `paso_3_suavizar()` en `procesar_chapulin.py`.

**Lección:** cuando un efecto visual "no se quita por más CSS que le pongas",
revisar si está horneado en el activo.

---

## BUG-13 · "Modo local" — la IA no responde ✅ RESUELTO (23 ago 2026)

**Síntoma:** al escribir en el chat, siempre responde el motor local con el
aviso "no logro conectar con tu servidor de inteligencia artificial".

**Lo que YA se descartó:**
- ✅ El código del `fetch` está correcto (POST, JSON, headers bien)
- ✅ El extractor de respuesta acepta 9 formatos distintos y es recursivo
- ✅ El timeout se subió de 8 s a 20 s por si la IA tardaba
- ✅ El payload incluye todos los campos esperados
- ✅ El endpoint apunta a la URL que el autor indicó (`gamon2...`)
- ✅ El autor reporta haber configurado CORS con `*`

**Causas posibles restantes, en orden:**

1. **El flujo de n8n no está en "Active".** El botón "Execute workflow" solo
   mantiene viva la URL unos segundos. Es la causa más común.

2. **Protocolo `file://`.** ⚠️ **Hipótesis fuerte y poco explorada:** si el
   autor abre el HTML con doble clic, el navegador reporta el origen como
   `null`. Muchos servidores rechazan `null` aunque tengan `Access-Control-Allow-Origin: *`.
   **Prueba decisiva:** subir el archivo a Netlify/Vercel/GitHub Pages y
   probarlo desde una URL `https://` real. Si ahí funciona, el problema nunca
   fue n8n.

3. **CORS aún incompleto:** falta permitir el método `OPTIONS` (preflight), o
   el header está en el nodo equivocado.

4. **El flujo responde vacío:** el último nodo no es "Respond to Webhook".

**Diagnóstico pendiente que solo el autor puede hacer:**
Abrir la app → F12 → pestaña Console → leer el error en rojo. Ese texto
identifica la causa exacta en un segundo.

**RECOMENDACIÓN:** dejar de pelear con n8n para el chat. Usar
`backend/ai_service_directo.js` (llamada directa) o desplegar
`backend/ai_service_directo.py` como pequeño backend. Elimina toda esta capa
de fallo. El autor además ya expresó querer cambiar de Gemini a otra IA, lo
cual es el momento ideal para hacer el cambio.

---

### Solución final (23 ago 2026) — se abandonó n8n para el chat

Se hizo lo que este mismo documento venía recomendando: **quitar n8n del chat
por completo** y llamar a la IA directo desde el navegador. Con eso desaparecen
de un golpe las cuatro causas posibles que quedaban (flujo inactivo, CORS,
preflight, respuesta vacía), porque ya no hay flujo de n8n de por medio.

**La cadena nueva:** Llama 3.2 (gratis, vía OpenRouter) → Gemini Flash (gratis)
→ motor local. El motor local **no se quitó**: sigue siendo el último recurso
para que el emprendedor nunca se quede sin respuesta.

Cambios concretos en `frontend/app.src.html`:

1. Se borró `CONFIG.WEBHOOK_ASISTENTE` y todo su camino (`enviarWebhook` para
   el chat, el diagnóstico de CORS, el extractor de n8n en la ruta del chat).
   `enviarWebhook` **se conservó** porque las altas de cuenta y el formulario
   de contacto sí lo siguen usando.
2. Nuevo bloque `CONFIG_IA` con los dos ayudantes. Las llaves las pone el
   autor una sola vez; **al usuario final nunca se le pide nada**.
3. `consultarIA` intenta Llama, y solo si falla intenta Gemini. La estructura
   de la respuesta (tarjeta, imagen, botones) la sigue armando el motor local
   y el texto de la IA se inserta dentro, como antes.
4. La insignia ahora dice "Asistente listo", "Asistente listo · respaldo",
   "Sin conexión · modo local" o "Modo local". Al tocarla hace una prueba real
   y explica cuál falló y por qué, en español normal.
5. **Memoria de la plática:** se mandan las últimas 6 vueltas. Sin esto, el
   consejo del propio tutorial ("dile: más corto") no funcionaba.

**Verificado con Playwright** (los 5 escenarios, sirviendo por `http://localhost`):
Llama responde → insignia verde; Llama con error 429 → entra Gemini e insignia
de respaldo; los dos caídos → motor local con nota amable y diagnóstico que
nombra los dos fallos; el historial llega bien formado a cada proveedor.

**Fallo encontrado y corregido durante la prueba:** la pregunta se enviaba dos
veces (`user`,`user`), porque `mensajeYo()` ya la había guardado en la plática
antes de que el armador la agregara aparte. Se corrigió quitando el último
turno propio en `historialReciente()`. También se descartan los saludos de
apertura del asistente al armar la petición de Gemini, que no acepta que la
conversación empiece hablando el modelo.

**Lo único que falta:** que el autor pegue sus dos llaves gratuitas y
reconstruya. Instrucciones paso a paso en `docs/06-ia-directa.md`.

---

## BUG-15 · Las llaves de la IA quedaban a la vista ✅ RESUELTO (23 ago 2026)

**Cómo se detectó:** revisión de seguridad del autor sobre la entrega anterior.

**El problema:** la primera versión de la IA directa ponía las llaves en
`CONFIG_IA`, dentro de `app.src.html`. Eso las hornea en el HTML que se publica,
así que **cualquiera que abriera la página y viera el código fuente podía
leerlas y gastarlas**. Se había documentado como "riesgo aceptable por ser
llaves gratuitas", pero es un patrón que no debe quedar en el proyecto.

**La solución — las llaves se van al servidor:**

```
navegador  ──POST /api/ia──►  backend (lee .env)  ──►  Llama 3.2 → Gemini Flash
(sin llaves)
```

1. Nace `backend/ia-core.js`: toda la lógica de la IA y **el único lugar que
   lee `process.env`**. Nunca llega al navegador.
2. Tres envoltorios comparten ese núcleo: `backend/servidor.js` (local),
   `netlify/functions/ia.js` y `api/ia.js`.
3. En el frontend, `CONFIG_IA` se queda con **un solo campo**: `ENDPOINT`.
   Cero llaves, cero nombres de proveedor.
4. `.env` (ignorado por git) + `.env.example` (plantilla, se sube vacía).

**Tres defensas para que no vuelva a pasar:**

- **Candado en `build.py`:** si aparece algo con forma de llave en
  `app.src.html`, la construcción se detiene con un mensaje explicando dónde
  va. Cubre OpenRouter, Gemini, OpenAI, Anthropic, Groq, GitHub y Slack.
  Verificado a propósito pegando una llave falsa: el build falla con código 1.
- **Tachado de errores:** los avisos de fallo viajan al navegador para poder
  explicarle al usuario qué pasó. Antes de salir pasan por `tacharSecretos()`.
  Probado con un proveedor falso que devolvía la llave dentro de su error:
  llega como «llave oculta».
- **`/api/estado`** informa si hay llaves, nunca cuáles.

**Nota sobre `backend/ai_service_directo.js`:** ese archivo enseñaba justo el
patrón inseguro. Se vació y quedó solo un aviso que apunta a `ia-core.js`, para
que nadie lo copie por error. El historial sigue en git.

**Verificado en el navegador:** con el servidor y proveedores simulados, el
HTML servido no contiene ninguna llave ni nombre de variable de entorno, y las
únicas peticiones que salen son a nuestro `/api/ia`.

---

## BUG-16 · No se podía probar sin publicar ✅ RESUELTO (23 ago 2026)

**Síntoma:** para probar cualquier cambio había que subir el archivo a Netlify.
Abrirlo con doble clic daba origen `null` y no había forma de llamar a un
backend.

**Solución:** `backend/servidor.js`, que sirve la app y el asistente **en la
misma dirección** (`http://localhost:3000`). Al venir todo del mismo origen,
desaparecen a la vez el problema de CORS y el de `file://`.

No necesita `npm install`: solo usa lo que trae Node (18+), incluido el lector
de `.env`, escrito a mano para no añadir dependencias.

**Detalle de seguridad:** el servidor no deja salir de `dist/`. Comprobado con
rutas crudas (`--path-as-is`) y codificadas (`%2e%2e%2f`): responde 404.

---

## BUG-14 · La barra de arriba se quedaba clara en modo noche ✅ RESUELTO (23 ago 2026)

**Síntoma:** al pasar a modo noche y bajar un poco la página, la barra
superior seguía viéndose clara, como con luz, encima del fondo oscuro.

**Causa:** el mismo patrón del BUG-08 — un color horneado:
```css
.encabezado[data-desplazado="si"]{ background-color:rgba(251,246,238,.9); }
```
Ese crema fijo no seguía el tema. Solo se notaba al desplazarse, porque sin
desplazar la barra es transparente; por eso había pasado desapercibido.

**Solución:** el fondo pasa a la variable de superficie elevada:
```css
background-color:color-mix(in srgb, rgb(var(--barroalto)) 92%, transparent);
```
Día `#F7F0E2` (casi idéntico al crema anterior, no cambia el diseño), noche
`#131D33`. Verificado midiendo el color calculado en ambos temas.

**Regla, otra vez:** ningún color de fondo se escribe fijo. Siempre
`rgb(var(--x))` o `color-mix` sobre una variable.

---

## BUG-17 · La hoja de impresión salía en blanco ✅ RESUELTO (23 ago 2026)

**Síntoma:** al pulsar «Descargar en PDF», la vista de impresión salía
completamente vacía.

**Causa:** el CSS marcaba la tarjeta con `position:absolute; left:0; top:0`
esperando mandarla al inicio de la hoja. Pero `absolute` posiciona respecto al
**ancestro posicionado más cercano**, no respecto a la página: la tarjeta del
chat vive dentro de varios contenedores ya posicionados, así que acababa fuera
de la primera página.

**Solución:** no imprimir la tarjeta en su sitio. Hay un `<div id="hoja-print">`
vacío colgando directo de `<body>`; al exportar se **copia** ahí la tarjeta
(copia, no se mueve, para no dejar la original sin botones), y el papel oculta
todo lo demás con `body > *{ display:none }`.

**Segundo problema encontrado en la misma prueba:** imprimir desde el modo
noche daba **texto blanco sobre papel blanco**. Se resolvió redefiniendo las
variables de color a la paleta clara dentro de `@media print #hoja-print{…}`,
en vez de forzar colores fijos.

**Lección:** para imprimir un elemento suelto, muévelo (o cópialo) a la raíz
del `<body>`. Posicionarlo donde está es pelearse con el árbol de contenedores.

---

## BUG-18 · Un bloque de CSS nuevo no se aplicaba ✅ RESUELTO (23 ago 2026)

**Síntoma:** el carrusel de la guía salía con las seis tarjetas apiladas una
debajo de otra, sin estilos, aunque el CSS estaba escrito.

**Causa:** el bloque se insertó con un `replace` que buscaba
`"  /*__TAILWIND__*/"` **con dos espacios de sangría**. En el archivo el
marcador está en su propia línea, sin sangría:
`<style>/*__TAILWIND__*/</style>`. El `replace` no encontró nada, devolvió el
texto igual y **el script imprimió "listo" de todos modos**.

**Solución:** insertar el CSS al final del bloque `<style>` propio (el que va
después de Tailwind, para que gane en especificidad).

**Lección para quien edite con scripts:** todo `replace` sobre este archivo
debe ir con `assert`. Un `replace` que no encuentra su objetivo **no falla**:
se queda callado y te deja creyendo que funcionó.

---

## BUG-19 · La cabecera se desbordaba ✅ RESUELTO (23 ago 2026)

**Síntoma:** al agregar el botón «Guía Interactiva», el contenido de la
cabecera medía 1445 px dentro de un contenedor de 1280 px. El chip con el
nombre de la cuenta y el botón de salir quedaban **fuera de la pantalla**.

**Solución, en tres partes:**
1. Se quitó del escritorio el botón largo «Contáctanos si hay un problema»:
   duplicaba el enlace «Contacto» que tenía justo al lado, y sigue estando en
   el menú del celular y en la sección de contacto.
2. El menú de escritorio ahora aparece a partir de **1024 px** (antes 768),
   que es donde de verdad cabe.
3. `white-space:nowrap` en los enlaces, para que no se partan en dos líneas.

**Efecto secundario que hubo que atender:** al subir el corte a 1024 px, entre
768 y 1023 se pasó a usar el menú desplegable, **que no tenía selector de
tema**. Se le agregó uno.

**Verificado** en 360, 390, 768, 900, 1100, 1280, 1440 y 1600 px: la cabecera
cabe en una línea y nada se sale.

---

## BUG-20 · La página tardaba 13 segundos en aparecer ✅ RESUELTO (23 ago 2026)

**Cómo se detectó:** midiendo con el navegador y la CPU frenada 6 veces, para
imitar un celular económico. La primera pintura ocurría a los **13 004 ms**.
Trece segundos de pantalla en blanco.

**Primera sospecha (parcialmente cierta):** el peso. El chapulín iba incrustado
en base64 **cuatro veces**: 714 KB de los 975 que pesaba el archivo.

Se corrigió incrustándolo **una sola vez** en una variable de CSS
(`--chapulin`) y usándolo como fondo en sus 4 lugares con `.chapulin-img`.
El archivo pasó de **975 KB a 440 KB**. El chapulín sigue en los 4 sitios: es
la identidad de la marca (BUG-01), y ahora el `build.py` **se detiene** si
alguien lo quita de alguno.

**Pero eso no arregló el tiempo:** seguía en 13 s. La causa real era otra.

**Causa real:** la hoja de tipografías de Google se cargaba de la forma normal,
y esa forma **detiene el pintado hasta que llega**. Con la red caída tardó
12 549 ms en fallar, y la página esperó todo ese rato en blanco. Para el
público de esta app —señal mala en muchos pueblos— eso es exactamente el
peor caso.

**Solución:**
```html
<link rel="stylesheet" media="print" onload="this.media='all';this.onload=null" href="…">
<noscript><link rel="stylesheet" href="…"></noscript>
```
Con `media="print"` el navegador la baja sin frenar nada y el `onload` la
activa al llegar. Mientras tanto se lee con las letras del propio teléfono.

**Resultado medido, misma CPU frenada 6x:**

| | Antes | Después |
|---|---|---|
| Primera pintura | 13 004 ms | **112 ms** |
| Primer texto a la vista | 13 004 ms | **536 ms** |
| Página utilizable | 13 130 ms | **672 ms** |
| Peso del archivo | 975 KB | **440 KB** |

**Lección:** el peso importaba, pero lo que tenía la página en blanco era un
recurso externo que bloquea el pintado. Antes de optimizar a ciegas, medir.

---

## BUG-21 · Copiar o guardar una respuesta normal reventaba ✅ RESUELTO (23 ago 2026)

**Síntoma:** al pulsar «Copiar el texto», «Descargar en PDF» o «Guardar como
imagen» en una respuesta que no fuera una tarjeta de publicación, no pasaba
nada y la consola tiraba `Cannot read properties of null (reading 'innerText')`.

**Causa:** `textoPlano()` daba por hecho que siempre venía una tarjeta de
publicación y hacía `$('.js-cuerpo', caja).innerText` sin comprobar. En una
guía de trámites o un consejo de precios ese elemento no existe.

**Solución:** `textoPlano()` ahora comprueba; si no hay tarjeta, toma el texto
de la respuesta quitando botones y la calculadora.

**De paso:** los tres botones estaban solo en las tarjetas de publicación.
Ahora salen en **todas** las respuestas: una guía de trámites también se
quiere llevar en papel.

---

## BUG-22 · La insignia "IA" era ilegible en modo noche ✅ RESUELTO (23 ago 2026)

**Síntoma:** el cuadrito "IA" junto al logo no se leía con el tema oscuro.

**Causa:** `.insignia-ia` tenía el color de texto horneado en crema
(`#FBF6EE`) sobre `rgb(var(--cian))`. En modo noche el cian es neón brillante
(`#22F5FF`), y crema sobre neón da **1.25:1** — muy por debajo del 4.5:1
que pide WCAG AA.

**Solución:** usar `var(--tinta-inversa)`, que ya cambia con el tema:
**14.92:1** en noche y 4.61:1 en día. El mismo arreglo se aplicó al girador
de carga, que giraba sobre un botón cian.

**Es el mismo patrón del BUG-08, BUG-09 y BUG-14:** un color escrito fijo que
no sigue el tema. Ya van cuatro.

---

## BUG-23 · Textos pequeños por debajo del contraste mínimo ✅ RESUELTO (23 ago 2026)

**Cómo se detectó:** midiendo el contraste real de cada texto con la fórmula
de WCAG, no a ojo.

| Color | Dónde | Antes | Ahora |
|---|---|---|---|
| `--verde` | texto de 18 px sobre el fondo | 4.21:1 🔴 | **4.90:1** ✅ |
| `--ambar` | etiquetas dentro de tarjetas | 4.13:1 🔴 | **4.93:1** ✅ |
| `--cian` | textos chicos en tarjetas | 4.38:1 🔴 | **5.22:1** ✅ |

Se oscurecieron los tres alrededor de un 10 %: siguen siendo el mismo color,
ahora se leen. AA pide 4.5:1 en texto normal y 3:1 en texto grande (24 px o
18.66 px en negrita).

**Aviso para quien audite después:** un detector que busca el fondo subiendo
por el DOM **se equivoca** cuando el fondo es un degradado, porque
`backgroundColor` sale transparente y sigue subiendo hasta la página. Varios
avisos de «contraste bajo» eran falsos: el texto estaba sobre una tarjeta
clara, no sobre el fondo. Conviene comprobar sobre qué superficie cae de
verdad antes de cambiar un color.

---

## BUG-24 · El teléfono exigía 10 dígitos a todo el mundo ✅ RESUELTO (23 ago 2026)

**Síntoma:** alguien de Bolivia (8 dígitos), Chile (9) o España (9) no podía
poner su teléfono: la app le decía que estaba mal.

**Causa:** la regla `telefono-opcional` comparaba contra 10 fijo. Ya estaba
anotado como pendiente desde el BUG-06.

**Solución:** tabla `PAISES` con `[lada, etiqueta, mínimo, máximo]` para los
22 países. La regla lee el país elegido, el campo dice cuántos dígitos lleva
(«8 dígitos», «10 a 11 dígitos») y el mensaje de error nombra el país.

**De paso:** México estaba **repetido dos veces** en la lista de ladas.

**Probado** con 12 casos en 6 países, incluido el vacío (sigue siendo opcional:
si esa regla se rompe, el registro se bloquea entero — BUG-04).

---

## BUG-25 · `var codigoWa = null` borraba la asignación ✅ RESUELTO (23 ago 2026)

**Síntoma:** el código de WhatsApp nunca se leía. Al escribir los 6 números
salía «Escribe los seis números que te llegaron», como si estuvieran vacíos.

**Causa:** clásico del hoisting de `var`. La asignación estaba arriba:

```js
codigoWa = conectarCasillas('#casillas-wa', …);   // línea 2503
…
var codigoWa = null, esperaWa = 0;                 // línea 2560 ← ¡lo borraba!
```

`var` sube la declaración al principio, pero **la asignación a `null` se
ejecuta donde está escrita**, o sea después. Resultado: `codigoWa` quedaba en
`null` justo antes de usarse.

**Solución:** declarar `var codigoWa = conectarCasillas(…)` en un solo lugar y
no volver a inicializarlo más abajo.

**Lección:** en este archivo todo vive en un IIFE gigante con `var`. Antes de
declarar una variable, buscar si ya existe más arriba.

---

## BUG-26 · El aviso del correo mal escrito nunca salía ✅ RESUELTO (24 ago 2026)

**Síntoma:** escribes cualquier cosa en el campo del correo, le das al botón y
no pasa nada. Ni entra, ni te dice qué está mal. Parece que la página se trabó.

**Causa:** `validarCampo()` busca la caja del error por convención de nombre:
`document.getElementById('error-' + campo.id)`. El campo se llama
`correo-acceso`, así que la caja tenía que llamarse `error-correo-acceso`. Yo la
llamé `error-acceso`. Como el `getElementById` devuelve `null` y el código
comprueba `if (caja)`, **no reventaba nada**: simplemente no se pintaba el
mensaje.

**Arreglo:** renombrada a `error-correo-acceso` en los 9 lugares donde aparecía.

**Lección:** este tipo de convención implícita —«el id de la caja se deriva del
id del campo»— es cómoda pero silenciosa cuando se rompe. Lo cazó la prueba de
Playwright, no la lectura del código.

---

## BUG-27 · En celular no había manera de cerrar sesión ✅ RESUELTO (24 ago 2026)

**Síntoma:** entras desde el teléfono y no hay botón de salir por ningún lado.

**Causa:** el chip de sesión con el botón «salir» vive dentro del `<nav>` de la
cabecera, que es `hidden lg:flex`. En pantallas menores a 1024 px simplemente no
existe. El menú móvil tenía «Mi perfil» y el cambio de tema, pero nunca se le
añadió la salida. Venía arrastrándose desde el BUG-19, cuando el punto de
quiebre de la navegación subió a `lg`.

**Por qué importa más ahora:** con enlaces mágicos la sesión se renueva sola y
dura indefinidamente. Antes al menos caducaba al borrar los datos del navegador.
Y el público de esta app entra casi todo desde el teléfono.

**Arreglo:** `#sesion-chip-movil` en el menú móvil, con el nombre y un botón
«Cerrar sesión». `pintarSesion()` pinta los dos, y los dos botones llaman a la
misma función `cerrarSesion()`.

---

## BUG-28 · El enlace del correo no hacía nada si la app ya estaba abierta ✅ RESUELTO (24 ago 2026)

**Síntoma:** con la app abierta en una pestaña, pegas ahí el enlace del correo y
no entra. En una pestaña nueva sí.

**Causa:** ir de `http://localhost:3000/` a `http://localhost:3000/#access_token=…`
es una navegación **dentro del mismo documento**. El navegador solo cambia el
fragmento: no recarga, no dispara `load`, y `arrancarAuth()` —que es quien lee
el token— nunca se vuelve a ejecutar.

**Arreglo:** un `hashchange` que vuelve a llamar a `arrancarAuth()` si aparece
un `access_token` y todavía no hay sesión.

**Cómo salió:** la prueba automática hacía `goto()` a la misma dirección con
distinto `#`, que resultó ser justo el caso raro. Iba a "arreglar la prueba"
hasta ver que el escenario es real: mucha gente pega el enlace en la pestaña
que ya tiene abierta.

---

## Resumen

| # | Problema | Estado |
|---|---|---|
| 01 | Chapulín reemplazado por emoji | ✅ |
| 02 | "Escribiendo…" infinito | ✅ |
| 03 | Login sin validar | ✅ |
| 04 | Registro bloqueado por teléfono | ✅ |
| 05 | Botón "Continuar" lento | ✅ |
| 06 | Teléfono válido en rojo | ✅ |
| 07 | Código autogenerado | ⚠️ revertido por decisión |
| 08 | Chat oscuro en modo día | ✅ |
| 09 | Textos blancos sobre claro | ✅ |
| 10 | Textos tenues lavados | ✅ |
| 11 | Recuadro negro del chapulín | ✅ |
| 12 | Fosforescente persistente | ✅ |
| 13 | Modo local / IA no responde | ✅ resuelto — n8n fuera del chat, IA directa |
| 14 | Barra superior clara en modo noche | ✅ |
| 15 | **Llaves de la IA visibles en el HTML** | ✅ resuelto — se movieron al backend |
| 16 | No se podía probar sin publicar | ✅ resuelto — servidor local |
| 17 | Hoja de impresión en blanco | ✅ |
| 18 | Bloque de CSS que no se aplicaba | ✅ |
| 19 | Cabecera desbordada | ✅ |
| 20 | **13 s de pantalla en blanco en celular lento** | ✅ resuelto — 112 ms |
| 21 | Copiar/guardar respuesta normal reventaba | ✅ |
| 22 | Insignia "IA" ilegible en modo noche | ✅ |
| 23 | Contraste bajo en verde, ámbar y cian | ✅ |
| 24 | Teléfono exigía 10 dígitos a todos los países | ✅ |
| 25 | `var` que borraba su propia asignación | ✅ |
| 26 | El aviso del correo mal escrito no salía | ✅ |
| 27 | En celular no se podía cerrar sesión | ✅ |
| 28 | El enlace no servía con la app ya abierta | ✅ |
