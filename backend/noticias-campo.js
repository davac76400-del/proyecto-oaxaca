/* ============================================================================
   OaxIntegra IA — Noticias reales del campo (LADO SERVIDOR)
   ----------------------------------------------------------------------------
   Trae avisos y noticias agropecuarias recientes de México, ligadas al
   cultivo y al estado que la persona tiene elegidos, para que "Mi parcela"
   no solo diga clima: también diga qué se está hablando de su cultivo esta
   semana (precio, plagas, clima regional, apoyos).

   Se parsea con cheerio — el equivalente en Node de BeautifulSoup — sobre
   dos fuentes RSS públicas, sin llave, pensadas para consumirse por
   máquina. Misma filosofía que el clima de la parcela: RESPALDO EN
   CADENA, ninguna fuente es de fiar sola.

     1. Google Noticias, búsqueda con cultivo + estado
     2. Si falla o no trae nada: Bing Noticias, la misma búsqueda
        (proveedor distinto a propósito — si Google está caído o
        bloqueado para el servidor, esto no depende de lo mismo)
     3. Si ambas fallan: lo último bueno que se guardó en memoria,
        aunque ya esté vencido — mejor noticia vieja que ninguna
     4. Si tampoco hay eso: lista vacía. La tarjeta se esconde sola,
        nunca truena la página.

   Los tiempos de espera se cuidan cortos porque esto corre dentro de una
   función serverless de Vercel, que tiene su propio límite de segundos:
   mejor fallar rápido y pasar a la siguiente fuente que agotar el tiempo
   completo en una sola que no contesta.
   ========================================================================= */

'use strict';

const cheerio = require('cheerio');

const TOPE_MS = 4500;              /* por intento — hay dos intentos en cadena */
const CACHE_MS = 45 * 60 * 1000;   /* 45 minutos: esto no es tan urgente como el clima */
const TOPE_NOTICIAS = 5;

const cache = new Map();   /* clave "cultivo|region" → { hasta, noticias } */

const AGENTE = 'Mozilla/5.0 (compatible; OaxIntegraIA/1.0; +https://proyecto-oaxaca-five.vercel.app)';

function limpiar(v, tope) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, tope || 200);
}

/* El nombre de la fuente a veces no viene en la etiqueta <source>: de ahí
   se saca del dominio del enlace, para no dejar la tarjeta sin decir de
   dónde salió la nota. */
function fuenteDeEnlace(enlace) {
  try { return new URL(enlace).hostname.replace(/^www\./, ''); }
  catch (e) { return ''; }
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
        'User-Agent': AGENTE,
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

/* Ambas fuentes hablan RSS 2.0 estándar (<item><title><link><pubDate>), así
   que un solo lector de <item> les sirve a las dos — solo cambia la URL de
   búsqueda de cada quien. */
function leerItems(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const noticias = [];

  $('item').each(function () {
    if (noticias.length >= TOPE_NOTICIAS) { return; }
    const titulo = limpiar($(this).find('title').first().text(), 160);
    const enlace = limpiar($(this).find('link').first().text(), 500);
    const fecha  = limpiar($(this).find('pubDate').first().text(), 60);
    let fuente   = limpiar($(this).find('source').first().text(), 80);
    if (!fuente) { fuente = fuenteDeEnlace(enlace); }
    /* solo enlaces https reales: nada de javascript: ni basura del feed */
    if (titulo && /^https:\/\//.test(enlace)) {
      noticias.push({ titulo: titulo, enlace: enlace, fuente: fuente, fecha: fecha });
    }
  });

  return noticias;
}

async function deGoogleNoticias(consulta) {
  const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(consulta) +
              '&hl=es-419&gl=MX&ceid=MX:es-419';
  return leerItems(await pedirConLimite(url));
}

async function deBingNoticias(consulta) {
  const url = 'https://www.bing.com/news/search?q=' + encodeURIComponent(consulta) +
              '&format=RSS&setlang=es-MX&cc=MX';
  return leerItems(await pedirConLimite(url));
}

async function traerNoticiasCampo(cultivoBruto, regionBruto) {
  const cultivo = limpiar(cultivoBruto, 60);
  const region  = limpiar(regionBruto, 60);
  const clave   = cultivo + '|' + region;
  const ahora   = Date.now();

  const enCache = cache.get(clave);
  if (enCache && enCache.hasta > ahora) { return enCache.noticias; }

  const consulta = armarConsulta(cultivo, region);
  const fuentes = [deGoogleNoticias, deBingNoticias];

  for (const traerDe of fuentes) {
    try {
      const noticias = await traerDe(consulta);
      if (noticias.length) {
        cache.set(clave, { hasta: ahora + CACHE_MS, noticias: noticias });
        return noticias;
      }
    } catch (e) {
      /* esta fuente falló: se prueba la siguiente sin avisar nada al
         navegador — el aviso de verdad es simplemente no tener noticias */
    }
  }

  /* las dos fuentes fallaron o no trajeron nada: mejor lo último bueno
     que hubo (aunque esté vencido) que dejar la tarjeta sin nada */
  return (enCache && enCache.noticias) || [];
}

module.exports = { traerNoticiasCampo };
