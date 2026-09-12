/* ============================================================================
   OaxIntegra IA — Función para Vercel: /api/estado
   ----------------------------------------------------------------------------
   Le dice al navegador si el servidor tiene las llaves de la IA listas,
   para que la insignia del chat no mienta ("IA real" vs "motor local").
   No revela las llaves, solo si existen.
   ========================================================================= */

'use strict';

const ia = require('../backend/ia-core.js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') { return res.status(204).end(); }

  return res.status(200).json(ia.estado());
};
