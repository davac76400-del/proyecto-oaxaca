#!/usr/bin/env node
/* ============================================================================
   PROBAR IA  ·  node probar-ia.mjs
   ----------------------------------------------------------------------------
   Prueba automática de OpenRouter/Gemini de punta a punta:
     1. Prende el servidor
     2. Abre un navegador (Chromium) invisible
     3. Entra al chat con una sesión de prueba
     4. Manda una pregunta
     5. Dice quién contestó (openrouter, gemini o motor local) y muestra el texto
     6. Apaga el servidor y guarda una captura de pantalla

   No necesitas tocar nada del navegador a mano.
   ============================================================================ */

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = process.env.PORT || 3000;
const URL_APP = `http://localhost:${PUERTO}/`;
const PREGUNTA = '¿Cuánto cuesta el maíz ahora en Oaxaca?';
const CAPTURA = path.join(AQUI, 'captura-prueba-ia.png');

const VERDE = '\x1b[32m', ROJO = '\x1b[31m', AMARILLO = '\x1b[33m', GRIS = '\x1b[90m', FIN = '\x1b[0m';

const SESION = {
  id: '00000000-0000-4000-8000-000000000001',
  correo: 'juan@prueba.local',
  usuario: 'Juan',
  nombre: 'Juan',
  giro: 'campo',
  giroTexto: 'Campo, milpa y ganado',
  tieneRecuperacion: false,
  alta: '2026-01-01T00:00:00.000Z'
};

function esperar(ms) { return new Promise(r => setTimeout(r, ms)); }

async function esperarServidor(intentos = 30) {
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(URL_APP);
      if (r.ok || r.status < 500) return true;
    } catch { /* aún no está listo */ }
    await esperar(1000);
  }
  return false;
}

async function main() {
  console.log('');
  console.log('  Prueba de la IA (OpenRouter / Gemini)');
  console.log('  ' + '─'.repeat(44));
  console.log('');

  console.log('  1 · Prendiendo el servidor…');
  const servidor = spawn('node', ['backend/servidor.js'], {
    cwd: AQUI,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  let logServidor = '';
  servidor.stdout.on('data', d => { logServidor += d.toString(); });
  servidor.stderr.on('data', d => { logServidor += d.toString(); });

  const listo = await esperarServidor();
  if (!listo) {
    console.log('  ' + ROJO + '✗ El servidor no arrancó a tiempo.' + FIN);
    console.log(GRIS + logServidor.slice(-800) + FIN);
    servidor.kill();
    process.exit(1);
  }
  console.log('  ' + VERDE + '✓ Servidor arriba en ' + URL_APP + FIN);

  console.log('  2 · Abriendo el navegador…');
  const nav = await chromium.launch();
  const pag = await nav.newPage({ viewport: { width: 1280, height: 900 } });

  const erroresJS = [];
  pag.on('pageerror', e => erroresJS.push(e.message));
  pag.on('console', m => { if (m.type() === 'error') erroresJS.push(m.text()); });

  await pag.addInitScript(s => {
    window.localStorage.setItem('oaxintegra.sesion', JSON.stringify(s));
  }, SESION);

  let respIA = null;
  pag.on('response', async r => {
    if (r.url().includes('/api/ia') && !r.url().includes('/estado')) {
      try { respIA = await r.json(); } catch { /* ignorar */ }
    }
  });

  await pag.goto(URL_APP);
  await pag.waitForTimeout(2000);

  console.log('  3 · Escribiendo la pregunta: "' + PREGUNTA + '"');
  const caja = await pag.$('textarea, input[type="text"]:not([id*="usuario"]):not([id*="clave"])');
  if (!caja) {
    console.log('  ' + ROJO + '✗ No encontré la caja de escribir del chat.' + FIN);
    await pag.screenshot({ path: CAPTURA });
    await nav.close();
    servidor.kill();
    process.exit(1);
  }
  await caja.fill(PREGUNTA);
  await pag.keyboard.press('Enter');

  console.log('  4 · Esperando la respuesta (hasta 60 s)…');
  for (let i = 0; i < 60 && !respIA; i++) { await pag.waitForTimeout(1000); }
  await pag.waitForTimeout(1000);

  console.log('');
  console.log('  ' + '─'.repeat(44));
  console.log('  RESULTADO');
  console.log('  ' + '─'.repeat(44));

  if (!respIA) {
    console.log('  ' + ROJO + '✗ El navegador nunca recibió respuesta de /api/ia' + FIN);
  } else {
    const origen = respIA.origen || '(vacío → motor local, ninguna IA contestó)';
    const color = respIA.origen === 'openrouter' ? VERDE
                : respIA.origen === 'gemini' ? AMARILLO
                : ROJO;
    console.log('  Quién contestó : ' + color + origen + FIN);
    if (respIA.fallos && Object.keys(respIA.fallos).length) {
      console.log('  Fallos         : ' + JSON.stringify(respIA.fallos));
    }
    const texto = (respIA.output || '').trim();
    console.log('  Largo texto    : ' + texto.length + ' caracteres');
    console.log('');
    console.log('  Respuesta:');
    console.log('  ' + GRIS + texto.slice(0, 500) + (texto.length > 500 ? '…' : '') + FIN);
  }

  console.log('');
  const reales = erroresJS.filter(e => !/fonts\.googleapis|net::ERR_|favicon|autofill|accounts\.google/i.test(e));
  if (reales.length) {
    console.log('  ' + ROJO + '✗ Errores de JavaScript en la página:' + FIN);
    reales.slice(0, 5).forEach(e => console.log('    · ' + e));
  } else {
    console.log('  ' + VERDE + '✓ Sin errores de JavaScript' + FIN);
  }

  await pag.screenshot({ path: CAPTURA, fullPage: false });
  console.log('');
  console.log('  Captura guardada en: ' + CAPTURA);

  await nav.close();
  servidor.kill();
  console.log('');
  console.log('  Servidor apagado. Listo.');
  console.log('');
}

main().catch(e => {
  console.error('Error inesperado:', e);
  process.exit(1);
});
