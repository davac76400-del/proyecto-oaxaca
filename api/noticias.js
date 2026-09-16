/* ============================================================================
   OaxIntegra IA — Función para Vercel: /api/noticias
   ----------------------------------------------------------------------------
   Envoltorio delgado: toda la lógica (el scraping con cheerio y el caché)
   vive en backend/noticias-campo.js. Este archivo solo lee los parámetros
   de la URL y contesta en JSON, igual que api/ia.js y api/estado.js.
   ========================================================================= */

'use strict';

const { traerNoticiasCampo } = require('../backend/noticias-campo.js');

/* Vercel ya entrega req.query parseado; en el servidor de desarrollo local
   (backend/servidor.js, que usa http nativo) no existe, así que se arma a
   mano a partir de la URL cruda. */
function leerQuery(req) {
  if (req.query) { return req.query; }
  try { return Object.fromEntries(new URL(req.url, 'http://localhost').searchParams); }
  catch (e) { return {}; }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') { return res.status(204).end(); }
  if (req.method !== 'GET')     { return res.status(405).json({ noticias: [] }); }

  const q = leerQuery(req);
  try {
    const noticias = await traerNoticiasCampo(q.cultivo, q.region);
    return res.status(200).json({ noticias: noticias });
  } catch (e) {
    /* traerNoticiasCampo ya no tira, pero por si acaso: nunca romper el chat */
    return res.status(200).json({ noticias: [] });
  }
};
