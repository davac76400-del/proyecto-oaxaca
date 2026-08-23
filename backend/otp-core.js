/* ============================================================================
   OaxIntegra IA — Verificación del teléfono por WhatsApp
   ----------------------------------------------------------------------------
   Manda un código de 6 dígitos al WhatsApp de la persona y luego lo comprueba.

   Igual que con la IA: las credenciales viven en variables de entorno, nunca
   en el navegador. Este archivo no llega jamás al cliente.

   POR DÓNDE SE MANDA (variable WHATSAPP_PROVEEDOR):
     'meta'    → WhatsApp Cloud API, la oficial de Meta. Es la recomendada.
     'twilio'  → Twilio
     'n8n'     → tu propio flujo de n8n, si prefieres armarlo tú
     'consola' → NO manda nada: escribe el código en la terminal.
                 Es el modo por defecto, para que puedas probar sin contratar
                 nada. Nunca lo dejes así en producción.

   Ver docs/08-whatsapp-otp.md para el paso a paso de cada uno.
   ========================================================================= */

'use strict';

const crypto = require('crypto');

const CONFIG = {
  PROVEEDOR:     (process.env.WHATSAPP_PROVEEDOR || 'consola').toLowerCase(),
  VIGENCIA_MS:   Number(process.env.OTP_VIGENCIA_MIN || 10) * 60 * 1000,
  MAX_INTENTOS:  Number(process.env.OTP_MAX_INTENTOS || 5),
  ESPERA_MS:     Number(process.env.OTP_ESPERA_SEG || 60) * 1000,   /* entre envíos */
  MAX_POR_HORA:  Number(process.env.OTP_MAX_POR_HORA || 5),
  LIMITE_MS:     15000
};

/* ---------------------------------------------------------------------------
   DÓNDE SE GUARDAN LOS CÓDIGOS
   En memoria, a propósito: así funciona sin base de datos y los códigos
   desaparecen solos al reiniciar. Sirve perfecto para un solo servidor.
   ⚠️ Si algún día pones varios servidores o usas funciones de Netlify/Vercel
   (que se apagan entre llamadas), esto NO sirve: hace falta Redis o una tabla
   en la base de datos. Está explicado en docs/08-whatsapp-otp.md.
   ------------------------------------------------------------------------ */
const pendientes = new Map();   /* telefono → { hash, expira, intentos, enviado } */
const historial  = new Map();   /* telefono → [tiempos de envío] */

/* limpieza periódica, para que la memoria no crezca sin fin */
setInterval(() => {
  const ahora = Date.now();
  for (const [tel, d] of pendientes) { if (d.expira < ahora) { pendientes.delete(tel); } }
  for (const [tel, t] of historial) {
    const vivos = t.filter(x => ahora - x < 3600000);
    if (vivos.length) { historial.set(tel, vivos); } else { historial.delete(tel); }
  }
}, 5 * 60 * 1000).unref();


/* --- utilidades ---------------------------------------------------------- */

/* Deja el teléfono en formato internacional solo con dígitos: 5219511234567 */
function normalizar(bruto) {
  if (typeof bruto !== 'string') { return ''; }
  const d = bruto.replace(/\D/g, '');
  return (d.length >= 8 && d.length <= 15) ? d : '';
}

/* El código no se guarda tal cual: se guarda su huella. Si alguien llegara a
   ver la memoria del servidor, no puede leer los códigos de nadie. */
function huella(telefono, codigo) {
  const sal = process.env.OTP_SECRETO || 'oaxintegra-sal-por-defecto';
  return crypto.createHmac('sha256', sal).update(telefono + ':' + codigo).digest('hex');
}

/* Comparación en tiempo constante: no revela cuántos dígitos acertó. */
function igual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) { return false; }
  return crypto.timingSafeEqual(ba, bb);
}

function nuevoCodigo() {
  /* aleatorio de verdad, no Math.random */
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

const hayProveedor = () => CONFIG.PROVEEDOR !== 'consola';


/* --- los mensajeros ------------------------------------------------------ */

async function pedirConLimite(url, opciones) {
  const ctrl = new AbortController();
  const corte = setTimeout(() => ctrl.abort(), CONFIG.LIMITE_MS);
  try {
    const r = await fetch(url, Object.assign({}, opciones, { signal: ctrl.signal }));
    const txt = await r.text().catch(() => '');
    if (!r.ok) { throw new Error('HTTP ' + r.status + (txt ? ' · ' + txt.slice(0, 160) : '')); }
    return txt;
  } finally { clearTimeout(corte); }
}

/* 1 · WhatsApp Cloud API (Meta) — la oficial */
async function porMeta(telefono, codigo) {
  const id = process.env.WHATSAPP_PHONE_ID;
  const tok = process.env.WHATSAPP_TOKEN;
  const plantilla = process.env.WHATSAPP_PLANTILLA || 'codigo_acceso';
  const idioma = process.env.WHATSAPP_IDIOMA || 'es_MX';
  if (!id || !tok) { throw new Error('faltan WHATSAPP_PHONE_ID o WHATSAPP_TOKEN'); }

  /* Meta exige una plantilla aprobada para escribirle primero a alguien.
     La de tipo "authentication" recibe el código como parámetro. */
  await pedirConLimite('https://graph.facebook.com/v21.0/' + id + '/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telefono,
      type: 'template',
      template: {
        name: plantilla,
        language: { code: idioma },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: codigo }] },
          { type: 'button', sub_type: 'url', index: '0',
            parameters: [{ type: 'text', text: codigo }] }
        ]
      }
    })
  });
}

/* 2 · Twilio */
async function porTwilio(telefono, codigo) {
  const sid = process.env.TWILIO_SID;
  const tok = process.env.TWILIO_TOKEN;
  const de  = process.env.TWILIO_WHATSAPP_FROM;   /* ej: whatsapp:+14155238886 */
  if (!sid || !tok || !de) { throw new Error('faltan TWILIO_SID, TWILIO_TOKEN o TWILIO_WHATSAPP_FROM'); }

  const cuerpo = new URLSearchParams({
    From: de,
    To: 'whatsapp:+' + telefono,
    Body: 'Tu código de OaxIntegra IA es ' + codigo + '. Vence en ' +
          Math.round(CONFIG.VIGENCIA_MS / 60000) + ' minutos. No se lo compartas a nadie.'
  });

  await pedirConLimite('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(sid + ':' + tok).toString('base64')
    },
    body: cuerpo.toString()
  });
}

/* 3 · Tu propio flujo de n8n */
async function porN8n(telefono, codigo) {
  const url = process.env.N8N_WHATSAPP_URL;
  if (!url) { throw new Error('falta N8N_WHATSAPP_URL'); }
  const cabeceras = { 'Content-Type': 'application/json' };
  /* si pusiste un secreto compartido, viaja como cabecera para que tu flujo
     pueda comprobar que la petición sale de aquí y no de un desconocido */
  if (process.env.N8N_SECRETO) { cabeceras['X-OaxIntegra-Secreto'] = process.env.N8N_SECRETO; }

  await pedirConLimite(url, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify({
      accion: 'codigo_whatsapp',
      telefono: telefono,
      codigo: codigo,
      vigencia_minutos: Math.round(CONFIG.VIGENCIA_MS / 60000)
    })
  });
}

/* 4 · Consola — para probar sin contratar nada */
async function porConsola(telefono, codigo) {
  console.log('');
  console.log('  ┌──────────────────────────────────────────────┐');
  console.log('  │  CÓDIGO DE VERIFICACIÓN (modo de prueba)     │');
  console.log('  │  Teléfono: +' + telefono.padEnd(32) + '│');
  console.log('  │  Código:   ' + codigo.padEnd(34) + '│');
  console.log('  └──────────────────────────────────────────────┘');
  console.log('  No se mandó ningún WhatsApp: WHATSAPP_PROVEEDOR está en "consola".');
  console.log('');
}

const MENSAJEROS = { meta: porMeta, twilio: porTwilio, n8n: porN8n, consola: porConsola };


/* ---------------------------------------------------------------------------
   ENVIAR
   ------------------------------------------------------------------------ */
async function enviar(peticion) {
  const telefono = normalizar(peticion && peticion.telefono);
  if (!telefono) {
    return { ok: false, motivo: 'Ese número no se ve completo. Revísalo y vuelve a intentar.' };
  }

  const ahora = Date.now();

  /* ¿pidió otro código demasiado pronto? */
  const previo = pendientes.get(telefono);
  if (previo && ahora - previo.enviado < CONFIG.ESPERA_MS) {
    const faltan = Math.ceil((CONFIG.ESPERA_MS - (ahora - previo.enviado)) / 1000);
    return { ok: false, esperar: faltan,
             motivo: 'Espera ' + faltan + ' segundos antes de pedir otro código.' };
  }

  /* ¿demasiados en la última hora? */
  const envios = (historial.get(telefono) || []).filter(t => ahora - t < 3600000);
  if (envios.length >= CONFIG.MAX_POR_HORA) {
    return { ok: false,
             motivo: 'Ya se mandaron varios códigos a ese número. Intenta de nuevo en una hora.' };
  }

  const codigo = nuevoCodigo();
  const mensajero = MENSAJEROS[CONFIG.PROVEEDOR] || porConsola;

  try {
    await mensajero(telefono, codigo);
  } catch (e) {
    console.error('  · WhatsApp ✗', e.message);
    return { ok: false, motivo: 'No pude mandar el mensaje ahorita. Inténtalo en un momento.' };
  }

  pendientes.set(telefono, {
    hash: huella(telefono, codigo),
    expira: ahora + CONFIG.VIGENCIA_MS,
    intentos: 0,
    enviado: ahora
  });
  envios.push(ahora);
  historial.set(telefono, envios);

  return {
    ok: true,
    vigencia_minutos: Math.round(CONFIG.VIGENCIA_MS / 60000),
    esperar: Math.round(CONFIG.ESPERA_MS / 1000),
    /* en modo consola se avisa, para que quien prueba sepa dónde mirar */
    modo_prueba: CONFIG.PROVEEDOR === 'consola'
  };
}


/* ---------------------------------------------------------------------------
   COMPROBAR
   ------------------------------------------------------------------------ */
function verificar(peticion) {
  const telefono = normalizar(peticion && peticion.telefono);
  const codigo = String((peticion && peticion.codigo) || '').replace(/\D/g, '');

  if (!telefono || codigo.length !== 6) {
    return { ok: false, motivo: 'Escribe los 6 números que te llegaron.' };
  }

  const d = pendientes.get(telefono);
  if (!d) {
    return { ok: false, motivo: 'Ese código ya venció. Pide uno nuevo.' };
  }
  if (d.expira < Date.now()) {
    pendientes.delete(telefono);
    return { ok: false, motivo: 'Ese código ya venció. Pide uno nuevo.' };
  }

  d.intentos++;
  if (d.intentos > CONFIG.MAX_INTENTOS) {
    pendientes.delete(telefono);
    return { ok: false, motivo: 'Van muchos intentos fallidos. Pide un código nuevo.' };
  }

  if (!igual(d.hash, huella(telefono, codigo))) {
    const quedan = CONFIG.MAX_INTENTOS - d.intentos + 1;
    if (quedan <= 0) { return { ok: false, motivo: 'Ese código no es. Pide uno nuevo.' }; }
    return { ok: false,
             motivo: 'Ese código no es. Te queda' + (quedan === 1 ? ' 1 intento.' : 'n ' + quedan + ' intentos.') };
  }

  /* acertó: el código se quema, no se puede reusar */
  pendientes.delete(telefono);
  return { ok: true };
}


/* Estado, sin revelar nada sensible. */
function estado() {
  return {
    activo: true,
    proveedor: CONFIG.PROVEEDOR,
    modo_prueba: CONFIG.PROVEEDOR === 'consola',
    listo: hayProveedor(),
    vigencia_minutos: Math.round(CONFIG.VIGENCIA_MS / 60000)
  };
}

module.exports = { enviar, verificar, estado, normalizar };
