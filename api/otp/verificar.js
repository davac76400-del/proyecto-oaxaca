/* OaxIntegra IA — /api/otp/verificar para Vercel. Ver backend/otp-core.js. */
'use strict';
const otp = require('../../backend/otp-core.js');
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { return res.status(204).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ ok: false, motivo: 'Usa POST' }); }
  try {
    const cuerpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    return res.status(200).json(otp.verificar(cuerpo));
  } catch (e) {
    return res.status(400).json({ ok: false, motivo: 'No pude procesar la petición.' });
  }
};
