/* OaxIntegra IA — /api/otp/enviar para Vercel. Ver backend/otp-core.js.
   ⚠️ Las funciones de Vercel también se apagan entre llamadas: los códigos
   en memoria se pierden. Ver docs/08-whatsapp-otp.md. */
'use strict';
const otp = require('../../backend/otp-core.js');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { return res.status(204).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ ok: false, motivo: 'Usa POST' }); }
  try {
    const cuerpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    return res.status(200).json(await otp.enviar(cuerpo));
  } catch (e) {
    return res.status(400).json({ ok: false, motivo: 'No pude procesar la petición.' });
  }
};
