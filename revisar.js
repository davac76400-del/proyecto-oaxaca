#!/usr/bin/env node
/* ============================================================================
   REVISAR  ·  node revisar.js   (o:  npm run revisar)
   ----------------------------------------------------------------------------
   Te dice, en español y sin rodeos, qué le falta a tu .env para que la app
   funcione — y sobre todo distingue estas dos cosas, que se parecen mucho:

       vacío        →  todavía no lo pegaste
       de plantilla →  pegaste el texto de ejemplo creyendo que era el dato

   Lo segundo es lo que pasa cuando una IA te da el formulario en blanco y se
   ve idéntico al lleno. Aquí se detecta y se dice con todas sus letras.

   Nunca imprime una llave completa: solo los primeros caracteres.
   ============================================================================ */

const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const ROJO = '\x1b[31m', VERDE = '\x1b[32m', AMARILLO = '\x1b[33m';
const GRIS = '\x1b[90m', NEGRITA = '\x1b[1m', FIN = '\x1b[0m';

/* --------------------------------------------------------------------------
   Cómo se ve un valor de plantilla. Si algo de esto aparece, no es un dato
   real: es el hueco donde va el dato.
   -------------------------------------------------------------------------- */
const SEÑAS_DE_PLANTILLA = [
  /^tu[_-]/i,               // tu_clave_anon_de_supabase, tu-proyecto
  /\btu[_-](proyecto|clave|token|id|dominio|correo|llave)/i,
  /^your[_-]/i,
  /^pega/i,                 // pega_aqui_tu_llave
  /aqui$/i,                 // tu_token_aqui
  /^<.*>$/,                 // <TU_LLAVE>
  /^(xxx+|placeholder|cambiar|reemplazar|ejemplo|example|todo)$/i,
  /^\.{3,}$/,
  /^sk-or-v1-\.{3}/,
];

/* Además, algunos valores concretos que salen en las plantillas de por ahí. */
const VALORES_DE_PLANTILLA = new Set([
  'https://tu-proyecto.supabase.co',
  'https://tudominio.supabase.co',
  'https://tu-dominio-ngrok.ngrok-free.app',
  'https://abcdefghijk.supabase.co',
]);

function esDePlantilla(v) {
  if (!v) return false;
  if (VALORES_DE_PLANTILLA.has(v)) return true;
  return SEÑAS_DE_PLANTILLA.some(r => r.test(v));
}

/* --------------------------------------------------------------------------
   Leer el .env sin librerías
   -------------------------------------------------------------------------- */
function leerEnv() {
  const ruta = path.join(RAIZ, '.env');
  if (!fs.existsSync(ruta)) return null;
  const datos = {};
  for (const linea of fs.readFileSync(ruta, 'utf8').split('\n')) {
    const t = linea.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    datos[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return datos;
}

/* Enseña lo justo para reconocerlo, nunca la llave entera. */
function asomar(v) {
  if (!v) return '';
  return v.length <= 14 ? v : v.slice(0, 12) + '…' + GRIS + '(' + v.length + ' caracteres)' + FIN;
}

/* --------------------------------------------------------------------------
   Cada cosa que se revisa
   -------------------------------------------------------------------------- */
const REVISIONES = [
  {
    nombre: 'SUPABASE_URL',
    para: 'Entrar con el correo',
    imprescindible: true,
    donde: 'supabase.com → tu proyecto → Settings → API → Project URL',
    comprobar(v) {
      if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(v)) {
        return 'No tiene la forma correcta. Debe verse así: https://abcdefghijk.supabase.co';
      }
      return null;
    }
  },
  {
    nombre: 'SUPABASE_ANON_KEY',
    para: 'Entrar con el correo',
    imprescindible: true,
    donde: 'supabase.com → tu proyecto → Settings → API → anon public',
    comprobar(v) {
      if (!v.startsWith('eyJ')) {
        return 'Las llaves de Supabase empiezan con "eyJ". Esta no.';
      }
      const trozos = v.split('.');
      if (trozos.length !== 3) return 'No parece una llave completa (le faltan partes).';
      try {
        let c = trozos[1].replace(/-/g, '+').replace(/_/g, '/');
        c += '='.repeat((4 - c.length % 4) % 4);
        const carga = Buffer.from(c, 'base64').toString('utf8');
        if (carga.includes('service_role')) {
          return 'PELIGRO: esta es la llave "service_role", no la "anon". ' +
                 'La service_role se salta TODAS las reglas de seguridad y no puede ' +
                 'ir en el navegador. Copia la que dice "anon public".';
        }
        if (!carga.includes('anon')) {
          return 'Esta llave no dice "anon" por dentro. Revisa que sea la correcta.';
        }
      } catch (e) {
        return 'No pude leer el contenido de la llave. ¿Se copió completa?';
      }
      return null;
    }
  },
  {
    nombre: 'OPENROUTER_API_KEY',
    para: 'La IA (ayudante principal, Llama 3.2)',
    imprescindible: false,
    donde: 'https://openrouter.ai/keys',
    siFalta: 'El chat responde con su motor local. Se ve bien, pero no es la IA de verdad.',
    comprobar: v => v.startsWith('sk-or-v1-') ? null : 'Las de OpenRouter empiezan con "sk-or-v1-".'
  },
  {
    nombre: 'GEMINI_API_KEY',
    para: 'La IA (respaldo, Gemini Flash)',
    imprescindible: false,
    donde: 'https://aistudio.google.com/apikey',
    siFalta: 'Sin respaldo: si Llama falla, se va directo al motor local.',
    comprobar: v => v.startsWith('AIza') ? null : 'Las de Google empiezan con "AIza".'
  },
];

/* Variables que ya no se usan y conviene avisar si siguen ahí. */
const YA_NO_SE_USAN = {
  WHATSAPP_TOKEN:       'el webhook de WhatsApp se quitó el 24 de agosto',
  WHATSAPP_PHONE_ID:    'el webhook de WhatsApp se quitó el 24 de agosto',
  WHATSAPP_APP_SECRET:  'el webhook de WhatsApp se quitó el 24 de agosto',
  WEBHOOK_VERIFY_TOKEN: 'el webhook de WhatsApp se quitó el 24 de agosto',
  WHATSAPP_PROVEEDOR:   'la verificación por WhatsApp se quitó el 24 de agosto',
  NGROK_AUTHTOKEN:      'ngrok era para el webhook; la app no lo necesita',
  URL_PUBLICA:          'era para el webhook; la app no lo necesita',
  N8N_WHATSAPP_URL:     'n8n se quitó del proyecto',
  OTP_SECRETO:          'los códigos por WhatsApp se quitaron',
};

/* -------------------------------------------------------------------------- */
function main() {
  console.log('');
  console.log('  ' + NEGRITA + 'OaxIntegra IA · revisión del .env' + FIN);
  console.log('  ' + '─'.repeat(44));
  console.log('');

  const env = leerEnv();

  if (env === null) {
    console.log('  ' + ROJO + '✗ No existe el archivo .env' + FIN);
    console.log('');
    console.log('    Créalo copiando la plantilla:');
    console.log('       ' + NEGRITA + 'cp .env.example .env' + FIN);
    console.log('');
    console.log('    Y luego ábrelo y pega tus datos adentro.');
    console.log('');
    process.exit(1);
  }

  let faltanImprescindibles = 0, plantillas = 0, opcionales = 0;

  for (const r of REVISIONES) {
    const v = (env[r.nombre] || '').trim();
    const etiqueta = '  ' + r.nombre.padEnd(20);

    if (!v) {
      if (r.imprescindible) {
        faltanImprescindibles++;
        console.log(etiqueta + ROJO + '✗ vacío' + FIN + GRIS + '  · ' + r.para + FIN);
        console.log(' '.repeat(22) + GRIS + 'Sácalo en: ' + r.donde + FIN);
      } else {
        opcionales++;
        console.log(etiqueta + AMARILLO + '○ vacío' + FIN + GRIS + '  · ' + r.para + FIN);
        if (r.siFalta) console.log(' '.repeat(22) + GRIS + r.siFalta + FIN);
      }
      continue;
    }

    if (esDePlantilla(v)) {
      plantillas++;
      if (r.imprescindible) faltanImprescindibles++;
      console.log(etiqueta + ROJO + '✗ ES TEXTO DE PLANTILLA' + FIN);
      console.log(' '.repeat(22) + 'Dice: ' + NEGRITA + v.slice(0, 46) + FIN);
      console.log(' '.repeat(22) + AMARILLO + 'Eso es el hueco, no el dato. Hay que reemplazarlo.' + FIN);
      console.log(' '.repeat(22) + GRIS + 'Sácalo en: ' + r.donde + FIN);
      continue;
    }

    const problema = r.comprobar(v);
    if (problema) {
      if (r.imprescindible) faltanImprescindibles++;
      const grave = problema.startsWith('PELIGRO');
      console.log(etiqueta + ROJO + '✗ ' + asomar(v) + FIN);
      console.log(' '.repeat(22) + (grave ? ROJO + NEGRITA : AMARILLO) + problema + FIN);
      continue;
    }

    console.log(etiqueta + VERDE + '✓ ' + asomar(v) + FIN + GRIS + '  · ' + r.para + FIN);
  }

  /* --- variables que sobran --------------------------------------------- */
  const sobran = Object.keys(YA_NO_SE_USAN).filter(k => env[k] !== undefined);
  if (sobran.length) {
    console.log('');
    console.log('  ' + AMARILLO + 'Variables que ya no se usan (puedes borrarlas):' + FIN);
    for (const k of sobran) {
      console.log('    · ' + k.padEnd(22) + GRIS + YA_NO_SE_USAN[k] + FIN);
    }
    console.log('    ' + GRIS + 'No estorban, pero si vienen de una plantilla vieja, esa' + FIN);
    console.log('    ' + GRIS + 'plantilla no corresponde a la versión actual del proyecto.' + FIN);
  }

  /* --- veredicto --------------------------------------------------------- */
  console.log('');
  console.log('  ' + '─'.repeat(44));

  if (plantillas) {
    console.log('');
    console.log('  ' + ROJO + NEGRITA + 'OJO: ' + plantillas + ' valor(es) son texto de plantilla.' + FIN);
    console.log('');
    console.log('  Un archivo .env de ejemplo se ve IGUAL que uno real. La');
    console.log('  diferencia es que el de ejemplo dice cosas como «tu_clave»');
    console.log('  donde debería ir la clave. Es un error facilísimo de cometer.');
  }

  console.log('');
  if (faltanImprescindibles === 0) {
    console.log('  ' + VERDE + NEGRITA + '✓ Lo necesario para entrar está listo.' + FIN);
    if (opcionales) {
      console.log('    ' + GRIS + 'Faltan ' + opcionales + ' cosa(s) opcional(es): la app corre igual.' + FIN);
    }
    console.log('');
    console.log('    Siguiente paso:');
    console.log('       ' + NEGRITA + 'cd frontend && python3 build.py && cd ..' + FIN);
    console.log('       ' + NEGRITA + 'npm start' + FIN);
  } else {
    console.log('  ' + ROJO + NEGRITA + '✗ Faltan ' + faltanImprescindibles + ' dato(s) para poder entrar a la app.' + FIN);
    console.log('');
    console.log('    Guía con capturas: ' + NEGRITA + 'docs/08-acceso-por-codigo.md' + FIN);
  }
  console.log('');
  process.exit(faltanImprescindibles ? 1 : 0);
}

if (require.main === module) main();
module.exports = { esDePlantilla };
