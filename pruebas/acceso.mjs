import { chromium } from 'playwright';

const APP = 'http://localhost:3000/';
let fallos = 0, pasos = 0;

function ok(t)   { pasos++; console.log('  ✓ ' + t); }
function mal(t)  { fallos++; console.log('  ✗ ' + t); }
function comprobar(cond, t) { cond ? ok(t) : mal(t); }

await fetch('http://localhost:54321/__reset');   // cada corrida empieza limpia

const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });  // celular
const pag = await ctx.newPage();

const errores = [];
pag.on('pageerror', e => errores.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') errores.push('[consola] ' + m.text()); });

// ---------------------------------------------------------------- 1. portada
console.log('\n1 · LA PORTADA');
await pag.goto(APP, { waitUntil: 'networkidle' });

comprobar(await pag.isVisible('#portada'), 'la portada bloquea la entrada');
comprobar(await pag.isVisible('#correo-acceso'), 'hay un campo de correo');
comprobar(await pag.isVisible('#btn-acceso'), 'hay un botón de acceso');

const campos = await pag.locator('#portada input:visible, #portada select:visible').count();
comprobar(campos === 1, `un solo campo en toda la portada (hay ${campos})`);

for (const viejo of ['#reg-telefono', '#reg-lada', '#casillas-wa', '#casillas', '#log-usuario', '#tab-registro']) {
  comprobar(await pag.locator(viejo).count() === 0, `ya no existe ${viejo}`);
}

// ------------------------------------------------------- 2. correo inválido
console.log('\n2 · CORREO MAL ESCRITO');
await pag.fill('#correo-acceso', 'esto-no-es-correo');
await pag.click('#btn-acceso');
await pag.waitForTimeout(400);
comprobar(await pag.isVisible('#error-correo-acceso'), 'avisa que el correo está mal');
comprobar(await pag.isVisible('#vista-correo'), 'no avanza de pantalla');

// ---------------------------------------------------------- 3. pedir enlace
console.log('\n3 · PEDIR EL ENLACE');
await pag.fill('#correo-acceso', 'maria@ejemplo.com');
await pag.click('#btn-acceso');
await pag.waitForSelector('#vista-enviado:not([hidden])', { timeout: 5000 });
ok('pasa a «revisa tu correo»');
comprobar((await pag.textContent('#correo-enviado')) === 'maria@ejemplo.com', 'muestra el correo al que se mandó');

// ------------------------------------------------------- 4. límite de envíos
console.log('\n4 · DEMASIADOS ENVÍOS (429)');
await pag.click('#btn-otro-correo');
await pag.fill('#correo-acceso', 'lleno@ejemplo.com');
await pag.click('#btn-acceso');
await pag.waitForTimeout(600);
const txt429 = await pag.textContent('#error-correo-acceso');
comprobar(/espera|minuto/i.test(txt429 || ''), `lo explica en español: «${(txt429 || '').slice(0, 52)}…»`);

// ------------------------------------------- 5. volver desde el enlace
console.log('\n5 · VOLVER DESDE EL ENLACE DEL CORREO');
const r = await fetch('http://localhost:54321/__ultimo');
const { enlace } = await r.json();
console.log('    enlace: ' + enlace.replace(/^.*#/, '#').slice(0, 58) + '…');

// Como cuando le da clic desde el correo: pestaña nueva, carga completa.
await pag.goto('about:blank');
await pag.goto(enlace, { waitUntil: 'networkidle' });
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
ok('entra solo, sin escribir nada');
comprobar(!pag.url().includes('access_token'), 'el token se borró de la barra de direcciones');
await pag.click('#btn-menu');
comprobar(await pag.isVisible('#sesion-chip-movil'), 'en celular, la sesión aparece en el menú');
comprobar(await pag.isVisible('#btn-salir-movil'), 'y desde ahí SÍ se puede cerrar sesión');
await pag.click('#btn-menu');
comprobar((await pag.textContent('#sesion-nombre')) === 'maria', 'saluda con el nombre del correo');

// ------------------------------------------------------------- 6. el giro
console.log('\n6 · PREGUNTAR EL GIRO (ya adentro)');
comprobar(await pag.isVisible('#tira-giro'), 'la tira del giro aparece DENTRO, no en el acceso');
await pag.selectOption('#giro-rapido', 'textil');
await pag.waitForTimeout(700);
comprobar(await pag.locator('#tira-giro').isHidden(), 'al elegir, la tira se va');
const guardado = await pag.evaluate(() => JSON.parse(localStorage.getItem('oaxintegra.sesion')).giroTexto);
comprobar(guardado === 'Textiles, telar y bordado', `el giro quedó guardado: «${guardado}»`);

// ----------------------------------------------------- 7. sesión persistente
console.log('\n7 · RECARGAR LA PÁGINA');
await pag.reload({ waitUntil: 'networkidle' });
await pag.waitForTimeout(1200);
comprobar(await pag.locator('#portada').isHidden(), 'sigue dentro, no vuelve a pedir el correo');
comprobar(await pag.locator('#sesion-chip').getAttribute('hidden') === null, 'la sesión aguanta la recarga');

// ------------------------------------------------- 8. token que ya no vale
console.log('\n8 · TOKEN CADUCADO / INVÁLIDO');
await pag.evaluate(() => {
  const t = JSON.parse(localStorage.getItem('oaxintegra.tokens'));
  t.access_token = 'TOKEN_PODRIDO'; t.refresh_token = 'TAMBIEN_PODRIDO';
  t.vence = Date.now() + 3600000;
  localStorage.setItem('oaxintegra.tokens', JSON.stringify(t));
});
await pag.reload({ waitUntil: 'networkidle' });
await pag.waitForTimeout(1500);
comprobar(await pag.isVisible('#portada'), 'con un token falso NO deja entrar');
comprobar(await pag.isVisible('#vista-correo'), 'vuelve limpio a pedir el correo');
const limpio = await pag.evaluate(() => localStorage.getItem('oaxintegra.sesion'));
comprobar(limpio === null, 'y borra la sesión de mentiras');

// ------------------------------------- 8b. el enlace en una pestaña ya abierta
console.log('\n8b · PEGAR EL ENLACE CON LA APP YA ABIERTA');
await pag.goto(APP, { waitUntil: 'networkidle' });
await pag.waitForTimeout(500);
await pag.evaluate(e => { window.location.href = e; }, enlace);   // solo cambia el #
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
ok('entra igual, sin recargar la página');

// ------------------------------------------------------------ 9. cerrar sesión
console.log('\n9 · CERRAR SESIÓN');
await pag.setViewportSize({ width: 1280, height: 900 });   // el chip vive en la barra de arriba
await pag.goto('about:blank');
await pag.goto(enlace, { waitUntil: 'networkidle' });
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
await pag.click('#btn-salir');
await pag.waitForTimeout(800);
comprobar(await pag.isVisible('#portada'), 'vuelve a la portada');
const tokensFuera = await pag.evaluate(() => localStorage.getItem('oaxintegra.tokens'));
comprobar(tokensFuera === null, 'los tokens se borraron del navegador');

// -------------------------------------------------------------- 10. errores
console.log('\n10 · ERRORES DE JAVASCRIPT');
// Se descartan tres cosas que NO son fallos de la app:
//   · fonts.googleapis — esta máquina tiene la salida bloqueada
//   · el 429 — lo provoca a propósito el paso 4
//   · el 401 — lo provoca a propósito el paso 8 (token envenenado)
const ruido = /favicon|manifest|fonts\.googleapis|ERR_CONNECTION_RESET|status of (401|429)|net::ERR_FAILED.*api\/ia/i;
const reales = errores.filter(e => !ruido.test(e));
comprobar(reales.length === 0, reales.length ? `hay ${reales.length}: ${reales[0].slice(0, 110)}` : 'ninguno en toda la prueba');

await nav.close();
console.log(`\n${'─'.repeat(46)}\n${fallos === 0 ? '✓ TODO BIEN' : '✗ ' + fallos + ' FALLO(S)'}  ·  ${pasos - fallos}/${pasos} comprobaciones\n`);
process.exit(fallos ? 1 : 0);
