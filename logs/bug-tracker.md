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

## BUG-13 · "Modo local" — la IA no responde 🟡 MITIGADO (23 ago 2026)

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

### Lo que se hizo (23 ago 2026)

No se puede "resolver" del todo desde el código: las causas 1, 3 y 4 dependen
de la configuración de n8n del autor (algo que solo él puede arreglar dentro
de su cuenta), y la causa 2 (`file://`) depende de cómo abra el archivo. Lo
que sí se hizo fue quitar la dependencia total de n8n y dar un camino de
respaldo real, siguiendo la recomendación de este mismo documento:

1. **Se integró la IA directa dentro de `app.src.html`** (la lógica de
   `backend/ai_service_directo.js`, adaptada a ES5 y al IIFE existente):
   nuevo bloque `CONFIG_IA` junto a `CONFIG`, con `PROVEEDOR` / `CLAVES` /
   `PROXY`. Viene **apagada por defecto** (todas las claves vacías), así que
   el comportamiento no cambia para quien no la configure.
2. **Nueva cadena de intentos en `consultarIA`:** n8n (si `WEBHOOK_ASISTENTE`
   tiene URL) → IA directa (si `CONFIG_IA` está configurada) → motor local.
   Antes solo existía n8n → motor local.
3. **La insignia del chat** ahora distingue tres estados: "Conectado a n8n",
   "Conectado a tu IA" (cuando responde la IA directa) y "Sin conexión ·
   modo local". Antes solo distinguía n8n / modo local.
4. **Diagnóstico de `file://`:** si el autor abre el archivo con doble clic,
   el botón de diagnóstico (la insignia) ahora se lo dice explícitamente
   antes de correr la prueba de red, en vez de solo reportar el error técnico.
5. **No se tocó nada del flujo de n8n existente** ni se quitó el webhook: se
   agregó una capa de respaldo, no un reemplazo. Nada de lo existente se
   eliminó (regla de oro del proyecto).

**Para activarla de verdad:** el autor debe rellenar `CONFIG_IA.PROVEEDOR` +
la clave correspondiente en `CONFIG_IA.CLAVES` (rápido, pero expone la clave
en el HTML — aceptable solo para pruebas), o mejor, apuntar `CONFIG_IA.PROXY`
a un pequeño backend/función serverless propia (ver el proxy de ejemplo al
final de `backend/ai_service_directo.js`) para que la clave nunca viaje al
navegador. Ninguna clave real se incluyó en el código.

**Por qué queda "mitigado" y no "resuelto":** sin credenciales reales del
autor no se puede comprobar una respuesta real de la IA en este entorno; lo
que se verificó (con Playwright, sirviendo el archivo por `http://localhost`)
es que la cadena de respaldo se activa correctamente y la app nunca se rompe:
intenta n8n, falla en la red (esperado en este entorno sin acceso a
`gamon2.app.n8n.cloud`), cae a motor local, y la insignia queda en "Sin
conexión · modo local" — igual que antes, pero ahora con un peldaño más
(la IA directa) listo para cuando se le dé una clave o un proxy.

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
| 13 | Modo local / IA no responde | 🟡 mitigado — respaldo de IA directa agregado |
