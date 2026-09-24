---
name: noticias-rss-cheerio
description: Trae noticias reales y recientes sobre un tema (cultivo, giro, ciudad) parseando RSS de Google News y Bing News con cheerio (el BeautifulSoup de Node), en una función serverless de Vercel con caché y respaldo. Úsala para agregar una sección de "noticias" o "lo que se está hablando" a una app.
---

# Noticias reales con cheerio + RSS

Implementado en OaxIntegra IA (`backend/noticias-campo.js` + `api/noticias.js`): tarjeta "Se está hablando de esto" en Mi parcela, filtrada por cultivo y estado.

## Por qué RSS y no scrapear páginas
- RSS es público, sin llave y hecho para máquinas: no se rompe cuando cambian el diseño.
- Scrapear HTML de periódicos viola términos, cambia seguido y bloquean IPs de servidores.

## Fuentes

```
https://news.google.com/rss/search?q=<consulta>&hl=es-419&gl=MX&ceid=MX:es-419
https://www.bing.com/news/search?q=<consulta>&format=rss&setlang=es&cc=MX
```

Consulta útil: `"<cultivo> <estado> when:14d"` (Google acepta `when:`). Agregar palabras de contexto (`agricultura`, `cosecha`, `precio`) si salen notas irrelevantes.

## Instalación

```bash
npm i cheerio
```

## Núcleo

```js
const cheerio = require('cheerio');

function leerItems(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $('item').map((_, el) => {
    const it = $(el);
    const enlace = it.find('link').first().text().trim();
    return {
      titulo: limpiar(it.find('title').first().text(), 180),
      enlace,
      fuente: limpiar(it.find('source').first().text(), 60) || dominio(enlace),
      fecha: it.find('pubDate').first().text().trim() || null,
    };
  }).get().filter(n => n.titulo && /^https?:\/\//.test(n.enlace));
}

const limpiar = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const dominio = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
```

Google pone " - Nombre del medio" al final del título: quitarlo si ya se muestra la fuente aparte.

## Reglas
- Header `User-Agent` propio e identificable.
- Timeout 4.5 s por fuente, Google → Bing → caché vencida → `[]` (ver skill `respaldo-en-cadena`).
- Caché 45 min por clave `cultivo|region` (las noticias no cambian cada minuto; cuida cuota y velocidad).
- Máximo 5 notas. Quitar duplicados por título normalizado.
- Ordenar por fecha, descartar notas de más de 30 días.

## Función serverless (`api/noticias.js`)

```js
const { traerNoticias } = require('../backend/noticias.js');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ noticias: [] });
  const { cultivo = '', region = '' } = req.query || {};
  const noticias = await traerNoticias(String(cultivo).slice(0, 60), String(region).slice(0, 60));
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  return res.status(200).json({ noticias });
};
```

Para desarrollo local, registrar la misma ruta en el servidor Node propio.

## En el frontend (seguridad)
- Construir con `document.createElement` + `textContent`. **Nunca** `innerHTML` con el título (XSS desde un feed).
- Enlaces con `target="_blank" rel="noopener noreferrer nofollow"`.
- Si llega `[]`, esconder la tarjeta; no mostrar "error".
- Fecha con `toLocaleDateString('es-MX', { day:'numeric', month:'short' })`.
