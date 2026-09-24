---
name: build-html-seguro
description: Script de build en Node que arma una app de un solo HTML (Tailwind compilado, imágenes incrustadas, config inyectada) y se niega a publicar si detecta llaves secretas, service_role de Supabase, valores de plantilla o HTML/JS roto. Úsala para apps estáticas desplegadas en Vercel/Netlify o para revisar que no se filtren secretos al navegador.
---

# Build de un solo HTML que no deja salir secretos

Basado en `build.js` de OaxIntegra IA. Entrada `frontend/app.src.html` → salida `dist/index.html`.

## Pasos del build

1. **Compilar Tailwind** con `npx tailwindcss -c tailwind.config.js -i entrada.css -o salida.css --minify`.
2. **Leer piezas** y verificar que cada marcador aparece las veces esperadas (`/*__TAILWIND__*/` 1 vez, `__IMAGEN__` 1 vez). Si no, abortar: alguien borró o duplicó un marcador.
3. **Imagen pesada una sola vez**: incrustarla en una variable CSS (`--logo:url(data:...)`) y reusar con `background-image`. En OaxIntegra bajó el archivo de 975 KB a ~300 KB.
4. **Inyectar config pública** (URL de Supabase, anon key) desde un archivo del repo, con el entorno solo como respaldo.
5. **Revisar seguridad** (abajo). Si algo falla: `process.exit(1)`.
6. **Validar**: etiquetas balanceadas y sintaxis JS de cada `<script>` con `new Function(código)` o `node --check`.
7. Escribir `dist/index.html` e imprimir tamaño.

## Revisión de secretos

```js
const PROHIBIDAS = [
  [/sk-or-v1-[A-Za-z0-9_-]{12,}/, 'OpenRouter'],
  [/sk-ant-[A-Za-z0-9_-]{12,}/, 'Anthropic'],
  [/sk-[A-Za-z0-9]{32,}/, 'OpenAI'],
  [/AIza[A-Za-z0-9_-]{30,}/, 'Google/Gemini'],
  [/gsk_[A-Za-z0-9]{20,}/, 'Groq'],
  [/ghp_[A-Za-z0-9]{30,}/, 'GitHub'],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, 'Slack'],
];
```

**service_role de Supabase**: es un JWT. Decodificar la parte del medio y buscar `"role":"service_role"`. Esa llave se salta todo RLS; en el navegador solo va la **anon**.

```js
function payload(jwt) {
  let b = jwt.split('.')[1]; b += '='.repeat((4 - b.length % 4) % 4);
  return JSON.parse(Buffer.from(b.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString());
}
```

**Coherencia**: `payload(anon).ref` debe ser igual al subdominio de `SUPABASE_URL`. Si no, se mezclaron proyectos.

**Valores de plantilla**: rechazar `tu-proyecto`, `your_`, `pega_aqui`, `xxx`, `<...>`, `placeholder`. Si llegan al navegador, la app "funciona" pero habla con nada.

**Caracteres invisibles**: `valor.replace(/[^\x20-\x7E]/g, '')` antes de usarlo en headers HTTP; avisar si se limpió algo.

## Reglas
- Las llaves privadas viven en variables de entorno del servidor y se usan solo desde `/api/*`.
- `.env` en `.gitignore`; `.env.example` con nombres y valores falsos.
- El build falla ruidoso. Un deploy que no sale es mejor que una llave publicada.
- Si se filtró una llave: **rotarla** en el proveedor (no basta con borrarla del repo; queda en el historial de git).
