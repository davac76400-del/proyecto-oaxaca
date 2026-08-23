# Arquitectura técnica

## Decisión fundamental: un solo archivo HTML

La app entera —HTML, CSS, JavaScript e imágenes— vive en **un único archivo
autocontenido** (`dist/OaxIntegra-IA-app.html`, ~900 KB).

**Por qué:**
- El autor lo sube a distintos hospedajes sin configurar nada
- Funciona con doble clic, sin servidor
- Sin dependencias externas, sin CDN, sin romperse si un servicio cae
- Sin build en el servidor

**Consecuencia:** no hay `index.html` / `login.html` / `dashboard.html` por
separado. Es una SPA con secciones que se muestran y ocultan. Si Claude Code
va a modularizar, debe saber que **el requisito de "un solo archivo" fue
deliberado** — confirmar con el autor antes de dividirlo.

---

## Pipeline de construcción

```
frontend/app.src.html          (FUENTE MAESTRO — aquí se edita)
   │  contiene 2 marcadores:
   │    /*__TAILWIND__*/   ← 1 vez, dentro de <style>
   │    __CHAPULIN__       ← 4 veces, en los src de <img>
   │
   ├─ npx tailwindcss -c tailwind.config.js -i entrada.css -o salida.css --minify
   │     └─ genera el CSS de las utilidades usadas
   │
   ├─ base64(assets/chapulin_04_suave_ACTUAL.webp)
   │
   └─ build.py sustituye ambos marcadores
          ↓
   dist/OaxIntegra-IA-app.html   (ENTREGABLE — nunca editar a mano)
```

Ejecutar: `cd frontend && python3 build.py`

---

## Stack

| Capa | Tecnología | Nota |
|---|---|---|
| Markup | HTML5 semántico | una sola página |
| Estilos | Tailwind CSS **compilado localmente** + CSS propio | sin CDN |
| Lógica | JavaScript vanilla ES5 | sin frameworks, sin build de JS |
| Tipografías | Playfair Display + Plus Jakarta Sans | via Google Fonts |
| Persistencia | localStorage | sin backend |
| IA | fetch a webhook n8n | **con problemas — ver bug-tracker** |
| Imágenes | WebP en base64 | incrustadas |

**Por qué ES5 y no ES6+:** compatibilidad con navegadores viejos, que el
público objetivo puede tener. Usa `var`, `function`, sin arrow functions en el
código principal.

---

## Estructura interna de `app.src.html`

```
<head>
  <style>
    :root { --greca-mask, --greca-fondo, --greca-banda }   ← máscaras SVG
    :root, [data-tema="dia"]   { …variables de color… }
    [data-tema="noche"]        { …variables de color… }
    …clases propias (.btn-neon, .casilla, .tarjeta-marca, .chapulin…)
    /*__TAILWIND__*/                                        ← marcador
  </style>
</head>
<body>
  <header>            ← logo, menú, toggle día/noche, botón perfil/salir
  <section #inicio>   ← hero con el chapulín
  <section #proposito>
  <section #herramientas>  ← las 4 tarjetas de solución
  <section #demo>     ← EL CHAT (lateral de conversaciones + hilo + entrada)
  <section #ley>      ← iniciativa de ley
  <section #contacto>
  <footer>
  <div #portada>      ← OVERLAY DE ACCESO (bloquea todo)
  <div .modal>×N      ← tutorial, ley, guardadas, éxito, privacidad, términos
  <script>            ← toda la lógica, en un IIFE
</body>
```

## Secciones del JavaScript (en orden dentro del IIFE)

1. **CONFIG** — webhooks, timeout
2. **Utilidades** — `$`, `$$`, `almacen` (wrapper de localStorage), `copiar`, `avisar`
3. **Tema día/noche** — `aplicarTema`, persistencia
4. **Modales** — `abrirModal`, `cerrarModal`, `mostrarPortada`, `ocultarPortada`
5. **Validación** — objeto `REGLAS`, `validarCampo`, `validarGrupo`
6. **Casillas de código** — `conectarCasillas` (avance, borrado, pegado)
7. **Cuentas** — `leerCuentas`, `guardarCuenta`, `crearCuenta`, `iniciarSesion`, `cerrarSesion`
8. **Conversaciones** — `cargarConvs`, `nuevaConv`, `borrarConv`, `pintarListaConvs`
9. **Chat** — `preguntar`, `mensajeIA`, `mensajeUsuario`, `extraerTexto`
10. **Red** — `enviarWebhook`, `diagnosticarConexion`, `marcarOrigen`
11. **Motor local de respaldo** — `motorLocal`, `respaldo`
12. **ARRANQUE** — aplica tema, pinta sesión, muestra/oculta portada

---

## Contrato con la IA

**Petición** (POST a `CONFIG.WEBHOOK_ASISTENTE`):
```json
{
  "message": "Escríbeme una publicación para vender mis rebozos",
  "username": "MariaTelar23",
  "code": "473921",
  "businessType": "Textil y telar de pedal",
  "phone": "+52 5512345678",
  "origen": "oaxintegra-landing"
}
```

**Respuesta esperada:** cualquier JSON con el texto en alguna de estas llaves
(el extractor las busca en orden, y es recursivo):
```js
['output', 'respuesta', 'reply', 'text', 'message', 'answer', 'content', 'result', 'data']
```
También acepta texto plano y arreglos (`[{output:"..."}]` funciona).

**Timeout:** 20 segundos (`CONFIG.LIMITE_MS`), con `AbortController`.
Si expira o falla → **motor local de respaldo** genera una respuesta y muestra
el aviso de "modo local". La app nunca se queda colgada.

---

## Motor local de respaldo

Cuando n8n no responde, `motorLocal` arma una respuesta estructurada usando el
giro del negocio del usuario. Siempre construye la **tarjeta de publicación**
(con imagen y botones); si la IA real responde, su texto se inserta **dentro**
de esa tarjeta para conservar el formato.

Esto es intencional: garantiza que el usuario siempre reciba algo útil.
