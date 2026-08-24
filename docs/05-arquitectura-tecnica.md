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
| IA | backend propio: Llama 3.2 → Gemini Flash | llaves en `.env` · ver `06-ia-directa.md` |
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

1. **CONFIG / CONFIG_IA / CONFIG_AUTH** — el WhatsApp del negocio, el
   endpoint del asistente, y la dirección + anon key de Supabase
2. **Utilidades** — `$`, `$$`, `almacen` (wrapper de localStorage), `copiar`, `avisar`
3. **Tema día/noche** — `aplicarTema`, persistencia
4. **Modales** — `abrirModal`, `cerrarModal`, `mostrarPortada`, `ocultarPortada`
5. **Validación** — objeto `REGLAS`, `validarCampo`, `validarGrupo`
6. **Acceso por enlace** — `enviarEnlace`, `leerRegreso`, `refrescarSesion`,
   `arrancarAuth` (ver `docs/08-acceso-por-codigo.md`)
7. **Cuentas** — `leerCuentas`, `guardarCuenta`, `crearCuenta`, `iniciarSesion`, `cerrarSesion`
8. **Conversaciones** — `cargarConvs`, `nuevaConv`, `borrarConv`, `pintarListaConvs`
9. **Chat** — `preguntar`, `mensajeIA`, `mensajeUsuario`, `extraerTexto`
10. **Red** — `enviarWebhook`, `diagnosticarConexion`, `marcarOrigen`
11. **Motor local de respaldo** — `motorLocal`, `respaldo`
12. **ARRANQUE** — aplica tema, pinta sesión, muestra/oculta portada

---

## Contrato con la IA (desde el 23 ago 2026)

**Ya no hay webhook de n8n en el chat, y el navegador tampoco llama a los
proveedores.** Las llaves estarían a la vista de cualquiera en un HTML, así que
viven en un backend.

```
navegador ──POST /api/ia──► backend ──► Llama 3.2 ──(si falla)──► Gemini Flash
(sin llaves)                (lee .env)                                  │
                                                          (si falla) ──► motor local
```

**El navegador envía:**
```json
{
  "message": "Escríbeme una publicación para vender mis rebozos",
  "username": "MariaTelar23",
  "businessType": "Textil y telar de pedal",
  "historial": [ { "rol": "user", "texto": "…" } ]
}
```

**El backend responde:**
```json
{ "output": "…texto de la IA…", "origen": "llama", "fallos": {} }
```
`origen` es `"llama"`, `"gemini"` o `""`. Si `output` viene vacío, el navegador
usa su motor local.

**También hay `GET /api/estado`**, que dice si el servidor tiene llaves
(`{ listo: true }`) sin revelarlas nunca. La insignia lo usa al cargar.

**Dónde vive cada pieza:**

| Archivo | Papel |
|---|---|
| `backend/ia-core.js` | La cadena completa. El único que lee las llaves. |
| `backend/servidor.js` | Desarrollo local: sirve `dist/` y `/api/ia` en el puerto 3000 |
| `netlify/functions/ia.js` | Envoltorio para Netlify |
| `api/ia.js` | Envoltorio para Vercel |

**Timeout:** 20 s por ayudante (`IA_TIMEOUT_MS`), con `AbortController`.

**Defensas del backend:** mensaje topado a 4000 caracteres, historial a 6
turnos con roles validados, cuerpo de la petición a 256 KB, y un filtro que
tacha cualquier llave antes de devolver un mensaje de error.

**Candado del build:** `build.py` se detiene si encuentra algo con forma de
llave en `app.src.html`, para que no se pueda volver a hornear un secreto en el
entregable.

**Ya no queda ningún n8n en el proyecto.** Las altas las lleva Supabase, y el
formulario de contacto abre el correo o el WhatsApp del negocio con el mensaje
ya escrito, sin servidor de por medio.

**La anon key de Supabase sí va en el HTML**, y no contradice lo de arriba: es
pública por diseño y lo que protege los datos son las políticas de Row Level
Security. `build.py` además abre el JWT y se detiene si alguien pega por error
la `service_role`, que es la que sí sería un desastre.

## Motor local de respaldo

Cuando ningún ayudante de IA responde, `motorLocal` arma una respuesta estructurada usando el
giro del negocio del usuario. Siempre construye la **tarjeta de publicación**
(con imagen y botones); si la IA real responde, su texto se inserta **dentro**
de esa tarjeta para conservar el formato.

Esto es intencional: garantiza que el usuario siempre reciba algo útil.
