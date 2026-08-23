/* ============================================================================
   OaxIntegra IA — Verificación por WhatsApp, para Netlify
   ----------------------------------------------------------------------------
   Envoltorio: la lógica está en backend/otp-core.js.
   El netlify.toml manda /api/otp/enviar y /api/otp/verificar hacia acá.

   ⚠️ IMPORTANTE: las funciones de Netlify se apagan entre llamadas, así que
   los códigos guardados en memoria SE PIERDEN. Para que esto funcione de
   verdad en producción hace falta guardarlos fuera (Redis, Upstash o una
   tabla). Está explicado en docs/08-whatsapp-otp.md.
   Mientras tanto, lo que sí funciona sin cambios es el servidor propio
   (backend/servidor.js) en un hosting que lo mantenga encendido.
   ========================================================================= */

'use strict';

const otp = require('../../backend/otp-core.js');

const CABECERAS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') { return { statusCode: 204, headers: CABECERAS, body: '' }; }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CABECERAS, body: JSON.stringify({ ok: false, motivo: 'Usa POST' }) };
  }
  try {
    const cuerpo = JSON.parse(event.body || '{}');
    const ruta = (event.path || '').indexOf('verificar') >= 0 ? 'verificar' : 'enviar';
    const r = ruta === 'verificar' ? otp.verificar(cuerpo) : await otp.enviar(cuerpo);
    return { statusCode: 200, headers: CABECERAS, body: JSON.stringify(r) };
  } catch (e) {
    return { statusCode: 400, headers: CABECERAS,
             body: JSON.stringify({ ok: false, motivo: 'No pude procesar la petición.' }) };
  }
};
