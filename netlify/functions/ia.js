/* ============================================================================
   OaxIntegra IA — Función para Netlify
   ----------------------------------------------------------------------------
   Es solo el envoltorio: toda la lógica está en backend/ia-core.js.

   Las llaves se ponen en Netlify (no en el código):
     Site settings → Environment variables →
       OPENROUTER_API_KEY = sk-or-v1-...
       GEMINI_API_KEY     = AIza...

   El archivo netlify.toml de la raíz ya manda /api/ia hacia acá.
   ========================================================================= */

'use strict';

const ia = require('../../backend/ia-core.js');

const CABECERAS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CABECERAS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CABECERAS, body: JSON.stringify({ error: 'Usa POST' }) };
  }

  try {
    const cuerpo = JSON.parse(event.body || '{}');
    const r = await ia.responder(cuerpo);
    return { statusCode: 200, headers: CABECERAS, body: JSON.stringify(r) };
  } catch (e) {
    return {
      statusCode: 400,
      headers: CABECERAS,
      body: JSON.stringify({ output: '', origen: '', fallos: { general: 'no pude procesar la petición' } })
    };
  }
};
