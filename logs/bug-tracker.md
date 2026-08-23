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
