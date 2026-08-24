/* ============================================================================
   ¿FUNCIONA LA APP SIN CONFIGURAR NADA EN SUPABASE?
   ----------------------------------------------------------------------------
   Supabase de fábrica manda un CORREO CON UN ENLACE, no con números, y sus
   códigos son de 6 dígitos. Esta prueba levanta el Supabase de mentiras tal
   cual (sin LARGO_FALSO ni PLANTILLA_FALSA) y comprueba que aun así:

     · la persona se registra
     · le da clic al enlace del correo
     · la app le inventa un código de 8 números y se lo enseña
     · con ese código entra después, sin correo de por medio

   O sea: cambiar la plantilla del correo en Supabase es una MEJORA, no un
   requisito. Si nunca se toca, la app sigue funcionando.
   ============================================================================ */
import { chromium } from 'playwright';

const APP    = process.env.APP_URL   || 'http://localhost:3000/';
const FALSO  = process.env.FALSO_URL || 'http://localhost:54321';
const CHROME = process.env.CHROME_PATH || undefined;

let fallos = 0, pasos = 0;
const ok  = t => { pasos++; console.log('  ✓ ' + t); };
const mal = t => { pasos++; fallos++; console.log('  ✗ ' + t); };
const comprobar = (c, t) => c ? ok(t) : mal(t);

await fetch(FALSO + '/__reset');
const ultimo = async () => (await (await fetch(FALSO + '/__ultimo')).json());

const estado = await ultimo();
if (estado.plantilla !== 'enlace') {
  console.error('\n  Esta prueba necesita el Supabase de mentiras SIN configurar.');
  console.error('  Arráncalo sin PLANTILLA_FALSA:  node pruebas/supabase-falso.js <llave>\n');
  process.exit(2);
}

const nav = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const pag = await (await nav.newContext({ viewport: { width: 390, height: 844 } })).newPage();

const errores = [];
pag.on('pageerror', e => errores.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') errores.push('[consola] ' + m.text()); });

const escribir = async (rejilla, codigo) => {
  for (let i = 0; i < codigo.length; i++) {
    await pag.fill(`${rejilla} .casilla >> nth=${i}`, codigo[i]);
  }
};

// ═══════════════════════════════════════════════════════════ 1
console.log('\n1 · REGISTRARSE CON SUPABASE DE FÁBRICA');
await pag.goto(APP, { waitUntil: 'networkidle' });
await pag.click('#btn-ir-registro');
await pag.waitForSelector('#vista-registro:not([hidden])', { timeout: 5000 });
await pag.fill('#reg-usuario', 'RosaBarro77');
await pag.fill('#reg-correo', 'rosa@ejemplo.com');
await pag.click('#btn-registro');
await pag.waitForSelector('#vista-codigo:not([hidden])', { timeout: 8000 });
ok('se registra y llega a la pantalla del código');

const { codigo, enlace } = await ultimo();
comprobar(codigo.length === 6, `Supabase de fábrica manda ${codigo.length} números, no 8`);
comprobar(!!enlace && enlace.includes('access_token'), 'y el correo lleva un enlace');
comprobar(/enlace en vez de números/i.test(await pag.textContent('#vista-codigo')),
          'la pantalla avisa que el enlace también sirve');

// ═══════════════════════════════════════════════════════════ 2
console.log('\n2 · EL CÓDIGO DE 6 TAMBIÉN SE ACEPTA');
await escribir('#casillas-codigo', codigo);        // 6 de las 8 casillas
await pag.click('#btn-comprobar');
await pag.waitForSelector('#vista-guardalo:not([hidden])', { timeout: 9000 });
ok('con 6 números en 8 casillas, pasa igual');
const mostrado1 = (await pag.textContent('#codigo-guardalo')).replace(/\s/g, '');
comprobar(mostrado1 === codigo, `y le enseña el suyo: ${mostrado1}`);
comprobar((await ultimo()).contrasena === codigo, 'quedó fijado como contraseña');

// ═══════════════════════════════════════════════════════════ 3
console.log('\n3 · Y AHORA POR EL ENLACE, DESDE CERO');
await fetch(FALSO + '/__reset');
await pag.evaluate(() => localStorage.clear());
await pag.goto(APP, { waitUntil: 'networkidle' });
await pag.click('#btn-ir-registro');
await pag.fill('#reg-usuario', 'JuanMezcal44');
await pag.fill('#reg-correo', 'juan@ejemplo.com');
await pag.click('#btn-registro');
await pag.waitForSelector('#vista-codigo:not([hidden])', { timeout: 8000 });

const { enlace: enlace2 } = await ultimo();
await pag.goto('about:blank');
await pag.goto(enlace2, { waitUntil: 'networkidle' });      // como darle clic desde el correo
await pag.waitForSelector('#vista-guardalo:not([hidden])', { timeout: 10000 });
ok('le da clic al enlace y la app le INVENTA un código');

const generado = (await pag.textContent('#codigo-guardalo')).replace(/\s/g, '');
comprobar(/^\d{8}$/.test(generado), `son 8 números: ${generado}`);
comprobar((await ultimo()).contrasena === generado, 'y quedó fijado como contraseña');
comprobar((await ultimo()).metadatos.clave_puesta === true, 'queda constancia de que ya tiene clave');
comprobar(!pag.url().includes('access_token'), 'el token se borró de la barra de direcciones');

// ═══════════════════════════════════════════════════════════ 4
console.log('\n4 · CON ESE CÓDIGO INVENTADO, ENTRA DESPUÉS');
await pag.click('#btn-ya-lo-anote');
await pag.waitForTimeout(600);
await pag.evaluate(() => localStorage.clear());          // como en otro teléfono
await pag.goto(APP, { waitUntil: 'networkidle' });
await pag.waitForTimeout(800);
await pag.click('#btn-ir-entrar');
await pag.fill('#correo-entrar', 'juan@ejemplo.com');
await escribir('#casillas-entrar', generado);
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 10000 });
ok('entra con el código que la app le inventó, sin correo de por medio');

// ═══════════════════════════════════════════════════════════ 5
console.log('\n5 · VOLVER A DARLE CLIC AL MISMO ENLACE NO CAMBIA SU CÓDIGO');
await pag.evaluate(() => localStorage.clear());
await pag.goto('about:blank');
await pag.goto(enlace2, { waitUntil: 'networkidle' });
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 10000 });
ok('entra directo, sin enseñarle un código nuevo');
comprobar((await ultimo()).contrasena === generado, 'y su código sigue siendo el mismo');

// ═══════════════════════════════════════════════════════════ 6
console.log('\n6 · ERRORES DE JAVASCRIPT');
const ruido = /favicon|manifest|fonts\.googleapis|ERR_CONNECTION_RESET|ERR_TUNNEL_CONNECTION_FAILED|status of (400|401|403|406|429)|net::ERR_FAILED.*api\/ia/i;
const reales = errores.filter(e => !ruido.test(e));
comprobar(reales.length === 0, reales.length ? `hay ${reales.length}: ${reales[0].slice(0, 120)}` : 'ninguno');

await nav.close();
console.log(`\n${'─'.repeat(48)}\n${fallos === 0 ? '✓ FUNCIONA SIN CONFIGURAR NADA' : '✗ ' + fallos + ' FALLO(S)'}  ·  ${pasos - fallos}/${pasos} comprobaciones\n`);
process.exit(fallos ? 1 : 0);
