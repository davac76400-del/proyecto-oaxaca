/* Prueba la función enviar-correo/index.ts SIN Deno: se le quitan las
   anotaciones de tipo y se evalúa el código real en Node 22, que ya trae
   WebCrypto, atob/btoa, Headers y TextEncoder igual que Deno.

   Se prueba el manejador COMPLETO, no solo las funciones sueltas: el stub de
   Deno.serve se queda con el manejador y se le mandan peticiones de verdad,
   con Resend interceptado. La firma se compara contra crypto.createHmac de
   Node, una implementación independiente y de sobra probada. */

import fs from 'node:fs';
import crypto from 'node:crypto';

const RUTA = new URL('../supabase/functions/enviar-correo/index.ts', import.meta.url);
const SECRETO_BASE64 = Buffer.from('un-secreto-de-prueba-para-firmar').toString('base64');

function sinTipos(src) {
  if (!src.includes('Deno.serve(')) { throw new Error('no encontré Deno.serve — ¿cambió el archivo?'); }
  return src
    .replace(/^type DatosCorreo = \{[\s\S]*?\n\};\n/m, '')
    .replace(/:\s*ReturnType<typeof textosSegun>/g, '')
    .replace(/:\s*Promise<(void|Response)>/g, '')
    .replace(/:\s*DatosCorreo;/g, ';')
    .replace(/:\s*(string|Uint8Array|boolean|Headers|number|Request|Response)\b/g, '')
    .replace(/\bas\s+(Error|DatosCorreo)\b/g, '');
}

/* Se carga el módulo de nuevo por cada escenario, porque las variables de
   entorno se leen una sola vez al cargarlo (const CLAVE_RESEND = …). */
let nCarga = 0;
async function cargar({ conLlaveResend = true, conSecreto = true } = {}) {
  const env = {
    SEND_EMAIL_HOOK_SECRET: conSecreto ? `v1,whsec_${SECRETO_BASE64}` : '',
    RESEND_API_KEY: conLlaveResend ? 'llave-de-prueba' : '',
    SUPABASE_URL: 'https://pnexvkjnwbyaiwcwyrev.supabase.co'
  };
  let manejador = null;
  globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { manejador = h; } };

  const src = sinTipos(fs.readFileSync(RUTA, 'utf-8'));
  await import('data:text/javascript;base64,' + Buffer.from(
    `${src}\nglobalThis.__probar = { verificarFirma, armarHtml, armarTexto, textosSegun };\n` +
    `/* carga ${++nCarga} */`
  ).toString('base64'));
  return { manejador, ...globalThis.__probar };
}

/* --- referencia independiente de la firma -------------------------------- */
function firmar(id, sello, cuerpo) {
  return crypto.createHmac('sha256', Buffer.from(SECRETO_BASE64, 'base64'))
               .update(`${id}.${sello}.${cuerpo}`).digest('base64');
}

const ID = 'msg_2abc';
function peticionFirmada(cuerpo, { sello = Math.floor(Date.now() / 1000), firma } = {}) {
  return new Request('https://x/functions/v1/enviar-correo', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': ID,
      'webhook-timestamp': String(sello),
      'webhook-signature': firma ?? `v1,${firmar(ID, String(sello), cuerpo)}`
    },
    body: cuerpo
  });
}

function aviso(tipo, token = '472915') {
  return JSON.stringify({
    user: { email: 'davac76400@gmail.com' },
    email_data: {
      token, token_hash: 'abc123def456abc789',
      redirect_to: 'https://oaxintegra.vercel.app/', email_action_type: tipo,
      site_url: 'https://oaxintegra.vercel.app', token_new: '', token_hash_new: ''
    }
  });
}

/* --- Resend y los logs, interceptados ------------------------------------ */
let enviados = [];
let registrado = [];
globalThis.fetch = async (url, opciones) => {
  enviados.push({ url, cabeceras: opciones.headers, cuerpo: JSON.parse(opciones.body) });
  return respuestaDeResend;
};
let respuestaDeResend = new Response('{"id":"abc"}', { status: 200 });
for (const nivel of ['log', 'error']) {
  const orig = console[nivel];
  /* Los objetos se serializan en vez de pasar por String(): Deno escribe su
     contenido en los logs, y con String() quedaban como «[object Object]».
     Importa para la prueba de que el código nunca se escribe: si algún día
     viajara dentro de un objeto, con String() la prueba lo daría por bueno. */
  console[nivel] = (...a) => {
    registrado.push(a.map((x) => (x && typeof x === 'object') ? JSON.stringify(x) : String(x)).join(' '));
  };
  console[`_${nivel}`] = orig;
}
function limpiar() { enviados = []; registrado = []; respuestaDeResend = new Response('{"id":"abc"}', { status: 200 }); }

let fallos = 0;
function revisar(nombre, condicion) {
  console._log(`${condicion ? '  ok  ' : '  FALLA'}  ${nombre}`);
  if (!condicion) { fallos++; }
}
function titulo(t) { console._log(`\n${t}\n`); }

/* ======================= FIRMA ======================= */
titulo('FIRMA DEL WEBHOOK');
const app = await cargar();
const CUERPO = aviso('signup');

async function estado(peticion) { return (await app.manejador(peticion)).status; }

limpiar();
revisar('acepta una firma correcta', await estado(peticionFirmada(CUERPO)) === 200);

limpiar();
revisar('acepta cuando vienen varias firmas (rotación de secreto)',
  await estado(peticionFirmada(CUERPO, {
    firma: `v1,${Buffer.from('vieja').toString('base64')} v1,${firmar(ID, String(Math.floor(Date.now() / 1000)), CUERPO)}`
  })) === 200);

limpiar();
revisar('rechaza una firma equivocada con 401',
  await estado(peticionFirmada(CUERPO, { firma: `v1,${Buffer.from('inventada-por-alguien').toString('base64')}` })) === 401);

limpiar();
const manipulado = CUERPO.replace('davac76400@gmail.com', 'ladron@ejemplo.com');
revisar('rechaza si el cuerpo fue manipulado', (await app.manejador(new Request('https://x/', {
  method: 'POST',
  headers: { 'webhook-id': ID, 'webhook-timestamp': String(Math.floor(Date.now() / 1000)),
             'webhook-signature': `v1,${firmar(ID, String(Math.floor(Date.now() / 1000)), CUERPO)}` },
  body: manipulado
}))).status === 401);

limpiar();
revisar('rechaza un sello de tiempo viejo (repetición)',
  await estado(peticionFirmada(CUERPO, { sello: Math.floor(Date.now() / 1000) - 3600 })) === 401);

limpiar();
revisar('rechaza un sello del futuro',
  await estado(peticionFirmada(CUERPO, { sello: Math.floor(Date.now() / 1000) + 3600 })) === 401);

limpiar();
revisar('rechaza si faltan las cabeceras', (await app.manejador(
  new Request('https://x/', { method: 'POST', body: CUERPO }))).status === 401);

limpiar();
revisar('contesta 405 a un GET', (await app.manejador(new Request('https://x/'))).status === 405);

limpiar();
const sinSecreto = await cargar({ conSecreto: false });
revisar('sin SEND_EMAIL_HOOK_SECRET no deja pasar nada',
  (await sinSecreto.manejador(peticionFirmada(CUERPO))).status === 401);

/* ======================= ENVÍO ======================= */
titulo('LO QUE SE LE MANDA A RESEND');

limpiar();
await app.manejador(peticionFirmada(CUERPO));
const env = enviados[0];
revisar('llama a Resend una sola vez', enviados.length === 1);
revisar('va a la API de Resend', env.url === 'https://api.resend.com/emails');
revisar('lleva la llave en la cabecera', env.cabeceras.Authorization === 'Bearer llave-de-prueba');
revisar('el remitente dice OaxIntegra', env.cuerpo.from.startsWith('OaxIntegra IA <'));
revisar('se lo manda a quien pidió el código', env.cuerpo.to[0] === 'davac76400@gmail.com');
revisar('el asunto es el del registro', env.cuerpo.subject === 'Tu código para crear tu cuenta');
revisar('el código va en el HTML', env.cuerpo.html.includes('472915'));
revisar('el código va también en el texto plano', env.cuerpo.text.includes('472915'));
revisar('no menciona Supabase en ninguna parte visible',
  !env.cuerpo.html.includes('Supabase') && !env.cuerpo.subject.includes('Supabase'));
revisar('el enlace de respaldo apunta al proyecto correcto',
  env.cuerpo.html.includes('pnexvkjnwbyaiwcwyrev.supabase.co/auth/v1/verify'));
revisar('nunca escribe el código en los logs', !registrado.join(' ').includes('472915'));

limpiar();
await app.manejador(peticionFirmada(aviso('recovery')));
revisar('la recuperación lleva su propio asunto',
  enviados[0].cuerpo.subject === 'Tu código para recuperar tu cuenta');

limpiar();
await app.manejador(peticionFirmada(aviso('un_tipo_que_supabase_invente_mañana')));
revisar('un tipo nuevo igual se manda, no se pierde',
  enviados.length === 1 && enviados[0].cuerpo.subject === 'Tu código para entrar');

/* ======================= CASOS QUE ROMPÍAN ======================= */
titulo('AVISOS SIN CÓDIGO Y FALLOS DE RESEND');

limpiar();
const avisoSinToken = JSON.stringify({
  user: { email: 'davac76400@gmail.com' },
  email_data: { token: '', token_hash: '', redirect_to: '', site_url: '',
                email_action_type: 'password_changed_notification' }
});
const r = await app.manejador(peticionFirmada(avisoSinToken));
revisar('un aviso sin código contesta 200 (si no, tumbaría el cambio de contraseña)', r.status === 200);
revisar('y no manda ningún correo', enviados.length === 0);

limpiar();
revisar('un código que falta donde SÍ debería venir se reporta como error',
  (await app.manejador(peticionFirmada(aviso('signup', '')))).status === 400);

limpiar();
const sinCorreo = JSON.stringify({ user: {}, email_data: { token: '123456', email_action_type: 'signup' } });
revisar('un aviso sin correo se reporta como error',
  (await app.manejador(peticionFirmada(sinCorreo))).status === 400);

limpiar();
respuestaDeResend = new Response('{"statusCode":403,"message":"You can only send testing emails to your own email address"}', { status: 403 });
revisar('si Resend rechaza, contesta 500 (Auth le dirá a la app que no pudo)',
  (await app.manejador(peticionFirmada(CUERPO))).status === 500);
revisar('y deja escrito el motivo para poder leerlo después',
  registrado.join(' ').includes('You can only send testing emails'));

limpiar();
respuestaDeResend = new Response(`{"message":"algo con el codigo 472915 dentro"}`, { status: 500 });
await app.manejador(peticionFirmada(CUERPO));
revisar('tacha el código si Resend lo devolviera en su error',
  !registrado.join(' ').includes('472915') && registrado.join(' ').includes('······'));

limpiar();
const sinResend = await cargar({ conLlaveResend: false });
revisar('sin RESEND_API_KEY contesta 500 en vez de callar',
  (await sinResend.manejador(peticionFirmada(CUERPO))).status === 500);
revisar('y no intenta mandar nada', enviados.length === 0);

/* El identificador de Resend es lo único con lo que se puede comprobar
   después si un correo aceptado aquí llegó de verdad al buzón. */
limpiar();
await app.manejador(peticionFirmada(CUERPO));
revisar('apunta el identificador del envío, para poder rastrearlo',
  registrado.join(' ').includes('abc'));

/* Un correo ya entregado a Resend no se puede «desmandar»: si la respuesta
   viniera sin JSON, contestar 500 le diría a Auth que falló un envío que sí
   salió, y la persona pediría otro código sin necesidad. */
limpiar();
respuestaDeResend = new Response('no soy json', { status: 200 });
revisar('si Resend contesta algo raro, el envío sigue valiendo',
  (await app.manejador(peticionFirmada(CUERPO))).status === 200);
revisar('y lo apunta como «sin id» en vez de romperse',
  registrado.join(' ').includes('sin id'));

/* ======================= HTML ======================= */
titulo('EL HTML DEL CORREO');

const t = app.textosSegun('signup');
const html = app.armarHtml('472915', 'https://pnexvkjnwbyaiwcwyrev.supabase.co/auth/v1/verify?token=abc', t);
revisar('cada motivo tiene su propio asunto',
  new Set(['signup', 'recovery', 'magiclink', 'email_change'].map(x => app.textosSegun(x).asunto)).size === 4);
revisar('las tablas quedan cerradas',
  (html.match(/<table/g) || []).length === (html.match(/<\/table>/g) || []).length);
revisar('escapa lo que le meten en el enlace',
  !app.armarHtml('1', '"><script>alert(1)</script>', t).includes('<script>'));

/* GUARDAR_HTML=algo.html deja el correo en un archivo para abrirlo y verlo. */
if (process.env.GUARDAR_HTML) { fs.writeFileSync(process.env.GUARDAR_HTML, html); }

console._log(`\n${fallos === 0 ? '✓ todo bien' : '✗ ' + fallos + ' falla(s)'}\n`);
process.exit(fallos === 0 ? 0 : 1);
