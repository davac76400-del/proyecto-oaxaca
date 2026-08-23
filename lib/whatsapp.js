/* ============================================================================
   OaxIntegra IA — Trato con la API de WhatsApp (Meta Graph)
   ----------------------------------------------------------------------------
   Tres cosas:
     1. Bajar las fotos que la gente manda por WhatsApp
     2. Mandar mensajes de texto de vuelta
     3. Mandar imágenes de vuelta

   Bajar una foto de WhatsApp son DOS pasos, no uno. Meta no te da la foto
   directa: primero te da una dirección temporal, y esa dirección solo abre si
   mandas el token. Es un tropiezo clásico: si intentas abrirla en el navegador
   te sale un error y parece que todo está roto.
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const VERSION = process.env.GRAPH_VERSION || 'v21.0';
const GRAFO = 'https://graph.facebook.com/' + VERSION;

/* La carpeta se crea sola la primera vez. */
const CARPETA_MEDIA = path.join(__dirname, '..', 'media');
fs.mkdirSync(CARPETA_MEDIA, { recursive: true });

const TOPE_BYTES = 25 * 1024 * 1024;   /* WhatsApp no manda más de esto */

const EXTENSIONES = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
  'audio/ogg': '.ogg', 'audio/mpeg': '.mp3', 'video/mp4': '.mp4',
  'application/pdf': '.pdf'
};

function token() {
  const t = process.env.WHATSAPP_TOKEN;
  if (!t || t === 'tu_token_aqui') {
    throw new Error('Falta WHATSAPP_TOKEN en el archivo .env');
  }
  return t;
}

function idTelefono() {
  const id = process.env.WHATSAPP_PHONE_ID;
  if (!id || id === 'tu_phone_id_aqui') {
    throw new Error('Falta WHATSAPP_PHONE_ID en el archivo .env');
  }
  return id;
}


/* ---------------------------------------------------------------------------
   PASO 1 · Preguntarle a Meta dónde está la foto
   Devuelve { url, mime_type, sha256, file_size }
   ------------------------------------------------------------------------ */
async function datosDeMedia(idMedia) {
  const r = await axios.get(GRAFO + '/' + idMedia, {
    headers: { Authorization: 'Bearer ' + token() },
    timeout: 20000
  });
  return r.data;
}


/* ---------------------------------------------------------------------------
   PASO 2 · Bajarla de verdad
   Esa dirección temporal EXIGE el token. Sin él responde 401.
   ------------------------------------------------------------------------ */
async function descargarMedia(idMedia) {
  const datos = await datosDeMedia(idMedia);

  if (!datos || !datos.url) {
    throw new Error('Meta no devolvió la dirección de la foto');
  }
  if (datos.file_size && Number(datos.file_size) > TOPE_BYTES) {
    throw new Error('El archivo pesa demasiado (' +
      Math.round(datos.file_size / 1024 / 1024) + ' MB)');
  }

  const r = await axios.get(datos.url, {
    headers: { Authorization: 'Bearer ' + token() },
    responseType: 'arraybuffer',
    timeout: 60000,
    maxContentLength: TOPE_BYTES,
    maxBodyLength: TOPE_BYTES
  });

  const mime = datos.mime_type || r.headers['content-type'] || 'application/octet-stream';
  const limpio = String(mime).split(';')[0].trim();
  const ext = EXTENSIONES[limpio] || '.bin';

  /* El nombre se arma con el id de Meta, que ya es único. Se limpia por si
     acaso: nunca se deja que un dato de fuera decida una ruta del disco. */
  const seguro = String(idMedia).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) || 'media';
  const nombre = Date.now() + '_' + seguro + ext;
  const destino = path.join(CARPETA_MEDIA, nombre);

  fs.writeFileSync(destino, Buffer.from(r.data));

  return {
    ruta: destino,
    nombre: nombre,
    mime: limpio,
    bytes: r.data.byteLength,
    sha256: datos.sha256 || null
  };
}


/* ---------------------------------------------------------------------------
   Mandar un texto de vuelta
   ------------------------------------------------------------------------ */
async function mandarTexto(para, texto) {
  const r = await axios.post(GRAFO + '/' + idTelefono() + '/messages', {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: para,
    type: 'text',
    text: { preview_url: false, body: String(texto).slice(0, 4000) }
  }, {
    headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
    timeout: 20000
  });
  return r.data;
}


/* ---------------------------------------------------------------------------
   Mandar una imagen de vuelta
   Si le pasas una ruta de disco, primero la sube a Meta y luego la manda.
   Si le pasas una dirección de internet, la manda directo.
   ------------------------------------------------------------------------ */
async function subirImagen(rutaArchivo, mime) {
  const FormData = require('form-data');
  const forma = new FormData();
  forma.append('messaging_product', 'whatsapp');
  forma.append('type', mime || 'image/jpeg');
  forma.append('file', fs.createReadStream(rutaArchivo), {
    filename: path.basename(rutaArchivo),
    contentType: mime || 'image/jpeg'
  });

  const r = await axios.post(GRAFO + '/' + idTelefono() + '/media', forma, {
    headers: Object.assign({ Authorization: 'Bearer ' + token() }, forma.getHeaders()),
    timeout: 60000,
    maxBodyLength: Infinity
  });
  return r.data.id;
}

async function mandarImagen(para, opciones) {
  const cuerpo = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: para,
    type: 'image',
    image: {}
  };

  if (opciones.ruta) {
    cuerpo.image.id = await subirImagen(opciones.ruta, opciones.mime);
  } else if (opciones.url) {
    cuerpo.image.link = opciones.url;
  } else {
    throw new Error('Dime la ruta del archivo o su dirección de internet');
  }
  if (opciones.pie) { cuerpo.image.caption = String(opciones.pie).slice(0, 1024); }

  const r = await axios.post(GRAFO + '/' + idTelefono() + '/messages', cuerpo, {
    headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
    timeout: 60000
  });
  return r.data;
}


/* Marcar el mensaje como leído: las dos palomitas azules. */
async function marcarLeido(idMensaje) {
  try {
    await axios.post(GRAFO + '/' + idTelefono() + '/messages', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: idMensaje
    }, {
      headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
      timeout: 10000
    });
  } catch (e) {
    /* que falle esto no debe romper nada */
    console.log('   (no pude marcar como leído: ' + e.message + ')');
  }
}


/* Los errores de Meta traen el detalle útil metido muy adentro del JSON.
   Esto lo saca para que en la terminal se lea algo comprensible. */
function explicarError(e) {
  const d = e && e.response && e.response.data;
  if (d && d.error) {
    return '[' + (d.error.code || '?') + '] ' + (d.error.message || '') +
           (d.error.error_data && d.error.error_data.details
             ? ' — ' + d.error.error_data.details : '');
  }
  return (e && e.message) || 'error desconocido';
}


module.exports = {
  descargarMedia, datosDeMedia,
  mandarTexto, mandarImagen, subirImagen,
  marcarLeido, explicarError,
  CARPETA_MEDIA
};
