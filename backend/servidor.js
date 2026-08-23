#!/usr/bin/env node
/* ============================================================================
   OaxIntegra IA — Servidor para trabajar en tu computadora
   ----------------------------------------------------------------------------
   Hace dos cosas a la vez, para que ya no tengas que subir nada a Netlify
   cada vez que quieras probar un cambio:

     1. Sirve la app en http://localhost:3000
        (así se acaba el problema del "file://" del doble clic)
     2. Responde en /api/ia con las llaves guardadas en tu archivo .env
        (el navegador nunca las ve)

   CÓMO USARLO:
       cp .env.example .env        ← y pega tus llaves adentro
       node backend/servidor.js
       # abre http://localhost:3000

   No necesita npm install: solo usa lo que ya trae Node (18 o más nuevo).
   ========================================================================= */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const RAIZ = path.dirname(__dirname);

/* --- lee el .env sin depender de ninguna librería ------------------------ */
function cargarEnv() {
  const ruta = path.join(RAIZ, '.env');
  if (!fs.existsSync(ruta)) { return false; }
  fs.readFileSync(ruta, 'utf8').split('\n').forEach(linea => {
    const l = linea.trim();
    if (!l || l.startsWith('#')) { return; }
    const i = l.indexOf('=');
    if (i < 1) { return; }
    const clave = l.slice(0, i).trim();
    let valor = l.slice(i + 1).trim();
    /* quita comillas si las puso */
    if ((valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }
    if (!process.env[clave]) { process.env[clave] = valor; }
  });
  return true;
}
const hayEnv = cargarEnv();

/* se carga DESPUÉS del .env, porque lee process.env al arrancar */
const ia = require('./ia-core.js');
const otp = require('./otp-core.js');

const PUERTO  = Number(process.env.PORT || 3000);
const CARPETA = path.join(RAIZ, 'dist');
const INDICE  = 'OaxIntegra-IA-app.html';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg':  'image/svg+xml', '.ico': 'image/x-icon'
};

function json(res, codigo, datos) {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
    /* En desarrollo se permite cualquier origen para que puedas abrir la app
       desde otro puerto si te hace falta. En producción esto lo maneja
       Netlify/Vercel, que sirven todo desde el mismo dominio. */
    'Access-Control-Allow-Origin': '*'
  });
  res.end(cuerpo);
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    /* 8 MB: una foto del celular ya reducida cabe de sobra. El navegador la
       achica antes de mandarla, y el núcleo rechaza cualquiera de más de 4 MB. */
    let datos = '', tope = 8 * 1024 * 1024;
    req.on('data', trozo => {
      datos += trozo;
      if (datos.length > tope) { req.destroy(); reject(new Error('cuerpo demasiado grande')); }
    });
    req.on('end', () => {
      try { resolve(datos ? JSON.parse(datos) : {}); }
      catch (e) { reject(new Error('el cuerpo no es JSON válido')); }
    });
    req.on('error', reject);
  });
}

function servirArchivo(res, rutaRel) {
  /* nunca dejar salir de dist/ */
  const limpio = path.normalize(rutaRel).replace(/^(\.\.[/\\])+/, '');
  const destino = path.join(CARPETA, limpio === '/' || limpio === '' ? INDICE : limpio);
  if (!destino.startsWith(CARPETA)) {
    res.writeHead(403).end('Prohibido');
    return;
  }
  fs.readFile(destino, (err, contenido) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('No encontré ese archivo.\n\n¿Ya construiste la app?\n  cd frontend && python3 build.py');
      return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(destino)] || 'application/octet-stream' });
    res.end(contenido);
  });
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  /* permiso previo del navegador */
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    });
    res.end();
    return;
  }

  /* ---- el asistente ---- */
  if (url.pathname === '/api/ia') {
    if (req.method !== 'POST') { return json(res, 405, { error: 'Usa POST' }); }
    try {
      const cuerpo = await leerCuerpo(req);
      const r = await ia.responder(cuerpo);
      console.log('  · /api/ia →', r.origen || 'sin respuesta',
                  Object.keys(r.fallos).length ? JSON.stringify(r.fallos) : '');
      return json(res, 200, r);
    } catch (e) {
      console.error('  · /api/ia ✗', e.message);
      return json(res, 400, { output: '', origen: '', fallos: { general: e.message } });
    }
  }

  /* ---- verificación del teléfono por WhatsApp ---- */
  if (url.pathname === '/api/otp/enviar') {
    if (req.method !== 'POST') { return json(res, 405, { ok: false, motivo: 'Usa POST' }); }
    try {
      const cuerpo = await leerCuerpo(req);
      const r = await otp.enviar(cuerpo);
      console.log('  · /api/otp/enviar →', r.ok ? 'mandado' : r.motivo);
      return json(res, 200, r);
    } catch (e) {
      return json(res, 400, { ok: false, motivo: 'No pude procesar la petición.' });
    }
  }
  if (url.pathname === '/api/otp/verificar') {
    if (req.method !== 'POST') { return json(res, 405, { ok: false, motivo: 'Usa POST' }); }
    try {
      const cuerpo = await leerCuerpo(req);
      const r = otp.verificar(cuerpo);
      console.log('  · /api/otp/verificar →', r.ok ? 'correcto' : r.motivo);
      return json(res, 200, r);
    } catch (e) {
      return json(res, 400, { ok: false, motivo: 'No pude procesar la petición.' });
    }
  }

  /* ---- estado, para saber si el servidor tiene llaves ---- */
  if (url.pathname === '/api/estado') {
    return json(res, 200, Object.assign({}, ia.estado(), { whatsapp: otp.estado() }));
  }

  /* ---- la app ---- */
  servirArchivo(res, url.pathname);
});

servidor.listen(PUERTO, () => {
  const e = ia.estado();
  console.log('');
  console.log('  OaxIntegra IA — servidor de desarrollo');
  console.log('  ─────────────────────────────────────');
  console.log('  App:        http://localhost:' + PUERTO + '/');
  console.log('  Asistente:  http://localhost:' + PUERTO + '/api/ia');
  console.log('');
  console.log('  Archivo .env:  ' + (hayEnv ? 'encontrado' : 'NO existe (copia .env.example)'));
  console.log('  Llama 3.2:     ' + (e.llama  ? 'llave lista'  : 'sin llave (OPENROUTER_API_KEY)'));
  console.log('  Gemini Flash:  ' + (e.gemini ? 'llave lista'  : 'sin llave (GEMINI_API_KEY)'));
  const w = otp.estado();
  console.log('  WhatsApp:      ' + (w.listo ? 'por ' + w.proveedor
    : 'modo prueba — el código sale aquí en la terminal'));
  if (!e.listo) {
    console.log('');
    console.log('  ⚠  Sin llaves, el chat responde con su motor local.');
    console.log('     Eso está bien para probar el diseño.');
  }
  console.log('');
  console.log('  Para detenerlo: Control + C');
  console.log('');
});
