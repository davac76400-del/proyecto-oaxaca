#!/usr/bin/env node
/* ============================================================================
   OaxIntegra IA — Webhook de WhatsApp Cloud API
   ----------------------------------------------------------------------------
   Recibe lo que la gente le escribe al WhatsApp del negocio: textos y fotos.
   Las fotos las baja de verdad y las guarda en media/.

   CÓMO SE USA:
       cp .env.example .env      ← y pon tus datos
       npm install               ← solo la primera vez
       npm start                 ← servidor en el puerto 8080
       npm run tunel             ← además levanta ngrok y te da la URL pública

   RUTAS:
       GET  /webhook   → la comprobación que hace Meta al conectar
       POST /webhook   → los mensajes que llegan
       GET  /salud     → para ver si está vivo
       GET  /media/... → las fotos que se han bajado
   ========================================================================= */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const fs = require('fs');
const crypto = require('crypto');
const express = require('express');

const wa = require('./lib/whatsapp.js');
const huipiles = require('./lib/huipiles.js');

const PUERTO = Number(process.env.PORT || 8080);
const TOKEN_VERIFICACION = process.env.WEBHOOK_VERIFY_TOKEN || '';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';
const CON_TUNEL = process.argv.includes('--tunel') || process.env.USAR_NGROK === 'si';

const app = express();

/* Guardamos el cuerpo tal cual llegó: la firma de Meta se calcula sobre los
   bytes exactos, así que si se reserializa el JSON ya no coincide. */
app.use(express.json({
  limit: '2mb',
  verify: (req, _res, buf) => { req.crudo = buf; }
}));

/* las fotos bajadas quedan servidas, para poder verlas desde el navegador */
app.use('/media', express.static(wa.CARPETA_MEDIA, { maxAge: '1h' }));
app.use('/huipiles', express.static(huipiles.CARPETA, { maxAge: '1h' }));


/* ---------------------------------------------------------------------------
   ¿DE VERDAD LO MANDÓ META?
   Meta firma cada aviso con tu App Secret. Sin comprobarlo, cualquiera que
   sepa tu dirección puede inventarse mensajes.
   Si no pusiste el App Secret, se deja pasar pero se avisa fuerte.
   ------------------------------------------------------------------------ */
function firmaValida(req) {
  if (!APP_SECRET) { return true; }
  const firma = req.get('x-hub-signature-256') || '';
  if (!firma.startsWith('sha256=')) { return false; }

  const mia = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(req.crudo || Buffer.alloc(0))
    .digest('hex');

  const a = Buffer.from(firma);
  const b = Buffer.from(mia);
  if (a.length !== b.length) { return false; }
  return crypto.timingSafeEqual(a, b);
}


/* ===========================================================================
   1 · GET /webhook — la comprobación de Meta
   Meta llama una vez con hub.verify_token. Si coincide con el tuyo, hay que
   devolverle hub.challenge TAL CUAL, en texto plano y con código 200.
   ======================================================================== */
app.get('/webhook', (req, res) => {
  const modo = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const reto = req.query['hub.challenge'];

  console.log('');
  console.log('  → Meta está comprobando el webhook…');

  if (modo === 'subscribe' && token === TOKEN_VERIFICACION && TOKEN_VERIFICACION) {
    console.log('  ✓ El token coincide. Webhook verificado.');
    return res.status(200).type('text/plain').send(String(reto));
  }

  console.log('  ✗ El token NO coincide.');
  console.log('    Meta mandó: ' + JSON.stringify(token));
  console.log('    El tuyo es: ' + JSON.stringify(TOKEN_VERIFICACION));
  console.log('    Tienen que ser idénticos, letra por letra.');
  return res.sendStatus(403);
});


/* ===========================================================================
   2 · POST /webhook — los mensajes que llegan
   REGLA DE ORO: contestarle a Meta con 200 DE INMEDIATO. Si tardas más de
   unos segundos, Meta reintenta y te llega el mismo mensaje una y otra vez.
   El trabajo pesado se hace después de haber respondido.
   ======================================================================== */
app.post('/webhook', (req, res) => {
  if (!firmaValida(req)) {
    console.log('  ✗ Llegó algo con firma inválida. Lo ignoro.');
    return res.sendStatus(403);
  }

  res.sendStatus(200);          /* ← primero contestar, luego trabajar */
  procesarAviso(req.body).catch(e => {
    console.error('  ✗ Error procesando el mensaje: ' + wa.explicarError(e));
  });
});


/* --- ya con Meta contestado, atendemos con calma ------------------------- */
const yaVistos = new Map();     /* para no atender dos veces el mismo mensaje */

function repetido(id) {
  const ahora = Date.now();
  for (const [k, t] of yaVistos) { if (ahora - t > 600000) { yaVistos.delete(k); } }
  if (yaVistos.has(id)) { return true; }
  yaVistos.set(id, ahora);
  return false;
}

async function procesarAviso(cuerpo) {
  if (!cuerpo || cuerpo.object !== 'whatsapp_business_account') { return; }

  for (const entrada of (cuerpo.entry || [])) {
    for (const cambio of (entrada.changes || [])) {
      const valor = cambio.value || {};

      /* avisos de entrega/lectura: se anotan y ya */
      for (const est of (valor.statuses || [])) {
        console.log('  · mensaje ' + est.id + ' → ' + est.status);
      }

      for (const msg of (valor.messages || [])) {
        if (repetido(msg.id)) {
          console.log('  · repetido, lo salto: ' + msg.id);
          continue;
        }
        const contacto = (valor.contacts || [])[0] || {};
        const quien = (contacto.profile || {}).name || msg.from;
        await atender(msg, quien);
      }
    }
  }
}

async function atender(msg, quien) {
  const de = msg.from;
  console.log('');
  console.log('  ┌─ mensaje de ' + quien + ' (+' + de + ')');
  console.log('  │  tipo: ' + msg.type);

  try { await wa.marcarLeido(msg.id); } catch (e) { /* da igual */ }

  /* ---------- TEXTO ---------- */
  if (msg.type === 'text') {
    const texto = ((msg.text || {}).body || '').trim();
    console.log('  │  dice: ' + texto.slice(0, 120));
    console.log('  └─');

    /* palabra clave para pedir huipiles */
    if (/huipil|huipiles|textil/i.test(texto)) {
      return await responderHuipiles(de);
    }

    return await contestar(de,
      '¡Hola ' + quien + '! Soy el asistente de OaxIntegra IA.\n\n' +
      'Mándame una *foto* de lo que vendes y te digo cómo aprovecharla, ' +
      'o escribe *huipiles* para ver textiles oaxaqueños.');
  }

  /* ---------- IMAGEN ---------- */
  if (msg.type === 'image') {
    const img = msg.image || {};
    console.log('  │  foto id: ' + img.id);
    if (img.caption) { console.log('  │  con pie: ' + img.caption); }

    try {
      const bajada = await wa.descargarMedia(img.id);
      console.log('  │  ✓ bajada: ' + bajada.nombre +
                  ' (' + Math.round(bajada.bytes / 1024) + ' KB, ' + bajada.mime + ')');
      console.log('  └─  guardada en media/' + bajada.nombre);

      return await contestar(de,
        'Ya recibí tu foto ✅\n\n' +
        'Pesa ' + Math.round(bajada.bytes / 1024) + ' KB y quedó guardada.\n' +
        'Cuéntame qué quieres hacer con ella: ¿un anuncio para vender? ' +
        '¿ponerle precio? ¿una descripción para tu catálogo?');
    } catch (e) {
      console.log('  └─  ✗ no pude bajarla: ' + wa.explicarError(e));
      return await contestar(de,
        'Recibí tu foto pero no la pude descargar. ¿Me la mandas otra vez?');
    }
  }

  /* ---------- lo demás ---------- */
  console.log('  └─');
  return await contestar(de,
    'Por ahora entiendo textos y fotos. Mándame una foto de lo que vendes ' +
    'y te ayudo con ella.');
}

async function contestar(de, texto) {
  try {
    await wa.mandarTexto(de, texto);
    console.log('  · respuesta enviada');
  } catch (e) {
    console.log('  ✗ no pude responder: ' + wa.explicarError(e));
  }
}

/* manda hasta 3 huipiles verificados, con su crédito en el pie */
async function responderHuipiles(de) {
  let fotos = huipiles.huipilesGuardados();

  if (!fotos.length) {
    await contestar(de, 'Déjame buscar unos huipiles oaxaqueños… tardo un momento.');
    try {
      const r = await huipiles.buscarHuipiles({ cuantas: 3, silencio: false });
      fotos = r.aceptadas.map(a => ({ archivo: a.archivo, ruta: a.ruta, credito: a }));
    } catch (e) {
      console.log('  ✗ búsqueda fallida: ' + e.message);
    }
  }

  if (!fotos.length) {
    return await contestar(de,
      'No pude traer fotos verificadas ahorita. Prefiero no mandarte una que ' +
      'no esté confirmada como oaxaqueña.');
  }

  for (const f of fotos.slice(0, 3)) {
    try {
      await wa.mandarImagen(de, {
        ruta: f.ruta, mime: 'image/webp',
        pie: 'Huipil oaxaqueño verificado · OaxIntegra IA'
      });
      console.log('  · enviada ' + f.archivo);
    } catch (e) {
      console.log('  ✗ no pude mandar ' + f.archivo + ': ' + wa.explicarError(e));
    }
  }
}


/* ===========================================================================
   3 · Rutas de servicio
   ======================================================================== */
app.get('/salud', (_req, res) => {
  res.json({
    ok: true,
    servicio: 'OaxIntegra IA · webhook de WhatsApp',
    token_verificacion: TOKEN_VERIFICACION ? 'configurado' : 'FALTA',
    whatsapp_token: (process.env.WHATSAPP_TOKEN &&
                     process.env.WHATSAPP_TOKEN !== 'tu_token_aqui') ? 'configurado' : 'FALTA',
    phone_id: (process.env.WHATSAPP_PHONE_ID &&
               process.env.WHATSAPP_PHONE_ID !== 'tu_phone_id_aqui') ? 'configurado' : 'FALTA',
    firma_verificada: APP_SECRET ? 'sí' : 'NO (falta WHATSAPP_APP_SECRET)',
    fotos_recibidas: (() => { try { return fs.readdirSync(wa.CARPETA_MEDIA).length; } catch (e) { return 0; } })(),
    huipiles_listos: huipiles.huipilesGuardados().length
  });
});

/* para buscar huipiles a mano desde el navegador */
app.get('/huipiles/buscar', async (_req, res) => {
  try {
    const r = await huipiles.buscarHuipiles({ cuantas: 3 });
    res.json({ ok: true, aceptadas: r.aceptadas.length, rechazadas: r.rechazadas });
  } catch (e) {
    res.status(500).json({ ok: false, motivo: e.message });
  }
});


/* ===========================================================================
   4 · ARRANQUE
   ======================================================================== */
function recuadro(lineas) {
  const ancho = Math.max(...lineas.map(l => l.replace(/\x1b\[[0-9;]*m/g, '').length)) + 2;
  const raya = '─'.repeat(ancho);
  console.log('  ┌' + raya + '┐');
  lineas.forEach(l => {
    const visible = l.replace(/\x1b\[[0-9;]*m/g, '').length;
    console.log('  │ ' + l + ' '.repeat(ancho - visible - 1) + '│');
  });
  console.log('  └' + raya + '┘');
}

const VERDE = '\x1b[32m', AMARILLO = '\x1b[33m', ROJO = '\x1b[31m';
const NEGRITA = '\x1b[1m', FIN = '\x1b[0m';

async function arrancar() {
  const servidor = app.listen(PUERTO, async () => {
    console.log('');
    console.log('  OaxIntegra IA · Webhook de WhatsApp');
    console.log('  ═══════════════════════════════════');
    console.log('  Servidor local:  http://localhost:' + PUERTO);
    console.log('');

    /* avisos de lo que falte */
    const faltantes = [];
    if (!TOKEN_VERIFICACION) { faltantes.push('WEBHOOK_VERIFY_TOKEN'); }
    if (!process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN === 'tu_token_aqui') {
      faltantes.push('WHATSAPP_TOKEN');
    }
    if (!process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_ID === 'tu_phone_id_aqui') {
      faltantes.push('WHATSAPP_PHONE_ID');
    }
    if (faltantes.length) {
      console.log('  ' + AMARILLO + '⚠ Faltan datos en el .env: ' + faltantes.join(', ') + FIN);
      console.log('    La verificación de Meta funciona igual, pero no podrás');
      console.log('    bajar fotos ni responder hasta que los pongas.');
      console.log('');
    }
    if (!APP_SECRET) {
      console.log('  ' + AMARILLO + '⚠ Sin WHATSAPP_APP_SECRET no se comprueba la firma de Meta.' + FIN);
      console.log('    Cualquiera que sepa tu dirección podría inventarse mensajes.');
      console.log('    Ponlo antes de dejar esto publicado.');
      console.log('');
    }

    /* Si ya tienes una dirección pública por tu cuenta (cloudflared, Railway,
       Render, un ngrok aparte…), ponla en URL_PUBLICA y el recuadro de abajo
       te la imprime lista para pegar, sin tener que armarla a mano. */
    let publica = (process.env.URL_PUBLICA || '').trim().replace(/\/+$/, '') ||
                  'http://localhost:' + PUERTO;
    const fijadaAMano = publica.indexOf('localhost') === -1;

    if (fijadaAMano) {
      console.log('  ' + VERDE + '✓ Usando la URL_PUBLICA de tu .env' + FIN);
      console.log('');
    }

    if (CON_TUNEL && !fijadaAMano) {
      try {
        const ngrok = require('@ngrok/ngrok');
        const authtoken = process.env.NGROK_AUTHTOKEN;
        if (!authtoken) {
          throw new Error('falta NGROK_AUTHTOKEN — sácalo gratis en ' +
                          'https://dashboard.ngrok.com/get-started/your-authtoken');
        }
        console.log('  Levantando el túnel de ngrok…');
        const escucha = await ngrok.forward({ addr: PUERTO, authtoken: authtoken });
        publica = escucha.url();
        console.log('  ' + VERDE + '✓ Túnel arriba' + FIN);
      } catch (e) {
        console.log('  ' + ROJO + '✗ No pude levantar ngrok: ' + e.message + FIN);
        console.log('');
        /* El error de ngrok no dice cuál de los dos problemas es, y son muy
           distintos: uno se arregla cambiando el token y el otro no. */
        if (/handshake|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(e.message)) {
          console.log('  ' + AMARILLO + 'Esto NO es culpa de tu token.' + FIN);
          console.log('  Es la red: algo (un proxy, un firewall, el wifi de una');
          console.log('  oficina o escuela) está bloqueando la salida a ngrok.');
          console.log('  Pruébalo desde otra red, o usa una de las alternativas.');
          console.log('');
        }
        console.log('  Alternativas, cualquiera sirve igual:');
        console.log('    ngrok http ' + PUERTO + '                (si lo tienes instalado aparte)');
        console.log('    cloudflared tunnel --url http://localhost:' + PUERTO);
        console.log('    Publica esto en Railway, Render o Fly.io y usa su dominio');
        console.log('');
      }
    } else {
      console.log('  (Para exponerlo a internet:  npm run tunel)');
      console.log('');
    }

    /* ---- LO QUE HAY QUE PEGAR EN META ---- */
    console.log('');
    recuadro([
      NEGRITA + 'PEGA ESTO EN META' + FIN,
      '',
      'developers.facebook.com → tu app → WhatsApp →',
      'Configuration → Webhook → Edit',
      '',
      NEGRITA + 'Callback URL:' + FIN,
      VERDE + publica + '/webhook' + FIN,
      '',
      NEGRITA + 'Verify token:' + FIN,
      VERDE + (TOKEN_VERIFICACION || '(FALTA: ponlo en el .env)') + FIN,
      '',
      'Luego pulsa «Verify and save» y suscríbete al',
      'campo ' + NEGRITA + 'messages' + FIN + '.'
    ]);
    console.log('');
    if (publica.indexOf('https://') !== 0) {
      console.log('  ' + AMARILLO + '⚠ Meta EXIGE una dirección https:// pública.' + FIN);
      console.log('    Con http://localhost no va a poder verificar.');
      console.log('    Si ya tienes una, ponla en el .env como  URL_PUBLICA=https://…');
      console.log('');
    }
    console.log('  Para detenerlo: Control + C');
    console.log('');
  });

  servidor.on('error', explicarFalloAlArrancar);
}

/* Si el puerto está ocupado, se explica en cristiano en vez de soltar el
   error crudo de Node, que asusta y no dice qué hacer. */
function explicarFalloAlArrancar(e) {
  console.log('');
  if (e.code === 'EADDRINUSE') {
    console.log('  ' + ROJO + '✗ El puerto ' + PUERTO + ' ya está ocupado.' + FIN);
    console.log('');
    console.log('  Seguramente dejaste otro servidor corriendo. Puedes:');
    console.log('    · Cerrarlo con Control + C en su terminal');
    console.log('    · O usar otro puerto:   PORT=8090 npm start');
    console.log('    · Para ver quién lo tiene:   lsof -i :' + PUERTO);
  } else if (e.code === 'EACCES') {
    console.log('  ' + ROJO + '✗ No tengo permiso para usar el puerto ' + PUERTO + '.' + FIN);
    console.log('    Los puertos por debajo de 1024 piden permisos de administrador.');
    console.log('    Prueba con uno más alto:   PORT=8080 npm start');
  } else {
    console.log('  ' + ROJO + '✗ No pude arrancar: ' + e.message + FIN);
  }
  console.log('');
  process.exit(1);
}

if (require.main === module) { arrancar(); }

module.exports = { app };
