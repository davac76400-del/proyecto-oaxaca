---
name: respaldo-en-cadena
description: Patrón para consumir APIs externas (IA, clima, noticias, datos) sin que la app truene cuando una fuente falla. Fuente principal → reintento → proveedor distinto → caché vieja → vacío elegante. Úsala siempre que la app dependa de un servicio de terceros.
---

# Respaldo en cadena: ninguna fuente es de fiar sola

Aplicado 3 veces en OaxIntegra IA:

| Función | Cadena |
|---|---|
| IA del chat | OpenRouter (Llama) → Gemini Flash → mensaje honesto con el motivo de cada fallo |
| Clima | Open-Meteo → Open-Meteo otra vez (1.5 s después) → wttr.in → último dato guardado |
| Noticias | Google News RSS → Bing News RSS → caché vencida → `[]` (la tarjeta se esconde) |

## Reglas

1. **Tiempo límite en cada intento** con `AbortController`. Corto (4-5 s) si corre en serverless; la suma de intentos debe caber en el límite de la función (10 s en Vercel Hobby).
2. **El respaldo es otro proveedor**, no el mismo con otra URL. Si Google bloquea tu IP, otra ruta de Google también falla.
3. **Un reintento solo** para el principal, con pausa. Cubre el "tropezón de un segundo".
4. **Caché con dos edades**: fresca (se usa sin preguntar) y vencida (solo si todo falló). Mejor dato viejo que ninguno.
5. **Nunca lanzar error a la UI.** La función regresa un valor vacío válido y la UI se adapta (esconde la tarjeta, muestra aviso).
6. **Decir la verdad**: devolver `origen` (quién contestó) y `fallos` (por qué falló cada uno) para mostrar "contestó el respaldo".
7. **Tachar secretos** de los mensajes de error antes de mandarlos al navegador (las llaves van en URLs y headers).
8. **Validar la forma** de la respuesta: HTTP 200 con cuerpo vacío también es fallo.

## Plantilla (Node, servidor)

```js
const TOPE_MS = 4500;
const CACHE_MS = 45 * 60 * 1000;
const cache = new Map();

async function conLimite(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TOPE_MS);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r;
  } finally { clearTimeout(t); }
}

async function traer(clave, fuentes) {
  const c = cache.get(clave);
  if (c && c.hasta > Date.now()) return { datos: c.datos, origen: 'cache' };

  const fallos = {};
  for (const [nombre, fn] of fuentes) {
    try {
      const datos = await fn();
      if (datos && (!Array.isArray(datos) || datos.length)) {
        cache.set(clave, { hasta: Date.now() + CACHE_MS, datos });
        return { datos, origen: nombre, fallos };
      }
      fallos[nombre] = 'vacío';
    } catch (e) {
      fallos[nombre] = e.name === 'AbortError' ? 'tardó demasiado' : tacharSecretos(e.message);
    }
  }
  if (c) return { datos: c.datos, origen: 'cache-vencida', fallos };
  return { datos: [], origen: '', fallos };
}

function tacharSecretos(txt) {
  return String(txt)
    .replace(/\b(sk-or-v1-|sk-ant-|sk-|gsk_|AIza)[A-Za-z0-9_\-]{8,}/g, '«llave oculta»')
    .replace(/([?&]key=)[^&\s"']+/gi, '$1«llave oculta»')
    .slice(0, 300);
}
```

## En el navegador

- Caché en `localStorage` envuelto en try/catch (Safari privado lo bloquea) con respaldo en memoria.
- Bandera `pidiendo` para no disparar la misma petición dos veces.
- Timeout propio en el `fetch` del cliente (10 s) aunque el servidor ya tenga los suyos.

## Checklist

- [ ] Cada llamada externa tiene timeout
- [ ] Hay al menos un proveedor distinto de respaldo
- [ ] Caché vencida como último recurso
- [ ] La UI nunca muestra un error técnico crudo
- [ ] Los errores no filtran llaves
