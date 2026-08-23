/* ============================================================================
   OaxIntegra IA — Función para Vercel
   ----------------------------------------------------------------------------
   Es solo el envoltorio: toda la lógica está en backend/ia-core.js.
   En Vercel, este archivo queda publicado automáticamente en /api/ia.

   Las llaves se ponen en Vercel (no en el código):
     Project Settings → Environment Variables →
       OPENROUTER_API_KEY = sk-or-v1-...
       GEMINI_API_KEY     = AIza...
   ========================================================================= */

'use strict';

const ia = require('../backend/ia-core.js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') { return res.status(204).end(); }
  if (req.method !== 'POST')    { return res.status(405).json({ error: 'Usa POST' }); }

  try {
    /* Vercel ya entrega el JSON procesado, pero por si acaso llega en texto. */
    const cuerpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const r = await ia.responder(cuerpo);
    return res.status(200).json(r);
  } catch (e) {
    return res.status(400).json({ output: '', origen: '', fallos: { general: 'no pude procesar la petición' } });
  }
};
