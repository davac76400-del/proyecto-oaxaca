/* ============================================================================
   OaxIntegra IA — Noticias reales del campo (LADO SERVIDOR)
   ----------------------------------------------------------------------------
   Trae avisos y noticias agropecuarias recientes de México, ligadas al
   cultivo y al estado que la persona tiene elegidos, para que "Mi parcela"
   no solo diga clima: también diga qué se está hablando de su cultivo esta
   semana (precio, plagas, clima regional, apoyos).

   La fuente es el feed RSS público de Google Noticias (formato estándar,
   sin llave, pensado para consumirse por máquina) filtrado por búsqueda.
   Se parsea con cheerio, el equivalente en Node de BeautifulSoup.

   Igual que el clima: si la fuente falla o cambia de forma, esto nunca
   tira la app. Se cachea en memoria un rato para no golpear la fuente en
   cada clic, y si falla se devuelve lo último bueno que hubo (o vacío).
   ========================================================================= */

'use strict';

const cheerio = require('cheerio');

const TOPE_MS = 8000;
const CACHE_MS = 45 * 60 * 1000;   /* 45 minutos: esto no es tan urgente como el clima */
const TOPE_NOTICIAS = 5;

const cache = new Map();   /* clave "cultivo|region" → { hasta, noticias } */

function limpiar(v, tope) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, tope || 200);
}

async function pedirConLimite(url) {
  const ctrl = new AbortController();
  const corte = setTimeout(() => ctrl.abort(), TOPE_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        /* Sin esto, algunas fuentes RSS responden vacío o rechazan la petición
           por venir sin identificarse como navegador. */
        'User-Agent': 'Mozilla/5.0 (compatible; OaxIntegraIA/1.0; +https://proyecto-oaxaca-five.vercel.app)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });
    if (!r.ok) { throw new Error('HTTP ' + r.status); }
    return await r.text();
  } finally {
    clearTimeout(corte);
  }
}

/* Arma la búsqueda a partir de lo que la persona tiene elegido. Sin cultivo
   ni región, igual busca algo útil en vez de no traer nada. */
function armarConsulta(cultivo, region) {
  const piezas = [];
  if (cultivo) { piezas.push(cultivo); }
  piezas.push('precio', 'cosecha');
  if (region) { piezas.push(region); }
  piezas.push('México');
  return piezas.join(' ');
}

async function traerNoticiasCampo(cultivoBruto, regionBruto) {
  const cultivo = limpiar(cultivoBruto, 60);
  const region  = limpiar(regionBruto, 60);
  const clave   = cultivo + '|' + region;
  const ahora   = Date.now();

  const enCache = cache.get(clave);
  if (enCache && enCache.hasta > ahora) { return enCache.noticias; }

  try {
    const consulta = armarConsulta(cultivo, region);
    const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(consulta) +
                '&hl=es-419&gl=MX&ceid=MX:es-419';

    const xml = await pedirConLimite(url);

    /* xmlMode: es RSS/XML, no HTML — sin esto cheerio cierra mal las
       etiquetas y se pierde contenido. */
    const $ = cheerio.load(xml, { xmlMode: true });
    const noticias = [];

    $('item').each(function (i) {
      if (noticias.length >= TOPE_NOTICIAS) { return; }
      const titulo = limpiar($(this).find('title').first().text(), 160);
      const enlace = limpiar($(this).find('link').first().text(), 500);
      const fuente = limpiar($(this).find('source').first().text(), 80);
      const fecha  = limpiar($(this).find('pubDate').first().text(), 60);
      /* solo enlaces https reales: nada de javascript: ni basura del feed */
      if (titulo && /^https:\/\//.test(enlace)) {
        noticias.push({ titulo: titulo, enlace: enlace, fuente: fuente, fecha: fecha });
      }
    });

    cache.set(clave, { hasta: ahora + CACHE_MS, noticias: noticias });
    return noticias;
  } catch (e) {
    /* nunca truena: mejor lo último bueno (aunque esté vencido) que nada */
    return (enCache && enCache.noticias) || [];
  }
}

module.exports = { traerNoticiasCampo };
