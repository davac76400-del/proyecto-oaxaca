import { chromium } from 'playwright';

const APP   = process.env.APP_URL   || 'http://localhost:3000/';
const FALSO = process.env.FALSO_URL || 'http://localhost:54321';
const CHROME = process.env.CHROME_PATH || undefined;

let fallos = 0, pasos = 0;
const ok   = t => { pasos++; console.log('  ✓ ' + t); };
const mal  = t => { pasos++; fallos++; console.log('  ✗ ' + t); };
const comprobar = (c, t) => c ? ok(t) : mal(t);

await fetch(FALSO + '/__reset');

const nav = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });   // celular
const pag = await ctx.newPage();

const errores = [];
pag.on('pageerror', e => errores.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') errores.push('[consola] ' + m.text()); });

const ultimo = async () => (await (await fetch(FALSO + '/__ultimo')).json());

/* Esperar a que algo TENGA texto, en vez de dormir un rato fijo. Con sleeps
   la prueba fallaba de vez en cuando: si el servidor tardaba más de la cuenta,
   se leía la caja del error antes de que se escribiera. */
const esperarTexto = async (sel, ms = 9000) => {
  await pag.waitForFunction(
    s => { const e = document.querySelector(s); return e && e.textContent.trim().length > 0; },
    sel, { timeout: ms });
  return (await pag.textContent(sel)).trim();
};

/* La pista del usuario pasa por «Comprobando si está libre…» antes del
   veredicto, así que aquí hay que esperar al veredicto, no al primer texto. */
const esperarPista = async (ms = 9000) => {
  await pag.waitForFunction(() => {
    const e = document.querySelector('#pista-usuario');
    /* Ojo: «Comprobando si está libre…» también contiene «libre», así que
       buscar esa palabra se cumplía sola. El veredicto es lo único que
       empieza con la palomita o la cruz. */
    return e && !e.hidden && /^[\u2713\u2717]/.test(e.textContent.trim());
  }, null, { timeout: ms });
  return (await pag.textContent('#pista-usuario')).trim();
};

// ═══════════════════════════════════════════════ 1
console.log('\n1 · LA PORTADA');
await pag.goto(APP, { waitUntil: 'networkidle' });
comprobar(await pag.isVisible('#portada'), 'la portada bloquea la entrada');
comprobar(await pag.isVisible('#correo-acceso'), 'pide el correo');
comprobar((await pag.textContent('#vista-correo')).includes('Paso 1 de 3'), 'dice «Paso 1 de 3»');
comprobar(await pag.isVisible('#btn-olvide'), 'hay salida para «Olvidé mi usuario»');
for (const viejo of ['#reg-telefono', '#reg-lada', '#casillas-wa', '#tab-registro']) {
  comprobar(await pag.locator(viejo).count() === 0, `ya no existe ${viejo}`);
}

// ═══════════════════════════════════════════════ 2
console.log('\n2 · CORREO MAL ESCRITO');
await pag.fill('#correo-acceso', 'no-es-correo');
await pag.click('#btn-acceso');
await esperarTexto('#error-correo-acceso');
comprobar(await pag.isVisible('#error-correo-acceso'), 'avisa que está mal');
comprobar(await pag.isVisible('#vista-correo'), 'no avanza');

// ═══════════════════════════════════════════════ 3
console.log('\n3 · PEDIR EL CÓDIGO');
await pag.fill('#correo-acceso', 'maria@ejemplo.com');
await pag.click('#btn-acceso');
await pag.waitForSelector('#vista-codigo:not([hidden])', { timeout: 6000 });
ok('pasa a la pantalla del código');
comprobar((await pag.textContent('#correo-enviado')) === 'maria@ejemplo.com', 'muestra a qué correo se mandó');
comprobar(await pag.locator('#casillas-codigo .casilla').count() === 6, 'hay 6 casillas');
const { codigo } = await ultimo();
comprobar(/^\d{6}$/.test(codigo || ''), `el servidor generó un código de 6 números: ${codigo}`);

// ═══════════════════════════════════════════════ 4
console.log('\n4 · CÓDIGO EQUIVOCADO');
await pag.fill('#casillas-codigo .casilla >> nth=0', '0');
for (let i = 1; i < 6; i++) await pag.fill(`#casillas-codigo .casilla >> nth=${i}`, '0');
const errMal = await esperarTexto('#error-codigo');
comprobar(/no coincide|venció|nuevo/i.test(errMal || ''), `lo explica en español: «${(errMal||'').slice(0,46)}…»`);
comprobar(await pag.isVisible('#vista-codigo'), 'no deja pasar');

// ═══════════════════════════════════════════════ 5
console.log('\n5 · CÓDIGO CORRECTO → PEDIR USUARIO');
await pag.waitForTimeout(900);   // el marcarMal limpia solo a los 700ms
for (let i = 0; i < 6; i++) await pag.fill(`#casillas-codigo .casilla >> nth=${i}`, codigo[i]);
await pag.waitForSelector('#vista-usuario:not([hidden])', { timeout: 8000 });
ok('entra y pide elegir usuario (obligatorio la 1ª vez)');
comprobar((await pag.textContent('#vista-usuario')).includes('Paso 3 de 3'), 'dice «Paso 3 de 3»');
const aviso = await pag.textContent('#aviso-recuerda');
comprobar(/RECUERDA TU USUARIO/.test(aviso), 'el aviso grande dice RECUERDA TU USUARIO');
comprobar(await pag.isVisible('#portada'), 'todavía NO deja entrar sin usuario');

// ═══════════════════════════════════════════════ 6
console.log('\n6 · LAS REGLAS DEL USUARIO');
await pag.fill('#reg-usuario', 'ana');            // corto y sin mayúscula
await pag.click('#btn-guardar-usuario');
await esperarTexto('#error-reg-usuario');
comprobar(await pag.isVisible('#error-reg-usuario'), 'rechaza uno que no cumple');
comprobar(await pag.isVisible('#vista-usuario'), 'sigue sin dejar pasar');

await pag.fill('#reg-usuario', 'MariaTelar23');   // ya lo tiene alguien
const pista = await esperarPista();
comprobar(/ya lo tiene|ocupado/i.test(pista || ''), `avisa mientras escribe: «${(pista||'').slice(0,42)}»`);

await pag.click('#btn-guardar-usuario');
const errOcupado = await esperarTexto('#error-reg-usuario');
comprobar(/ya lo tiene/i.test(errOcupado || ''), 'y también al intentar guardarlo');

// ═══════════════════════════════════════════════ 7
console.log('\n7 · USUARIO BUENO → ADENTRO');
await pag.fill('#reg-usuario', 'RosaBarro77');
const pistaOk = await esperarPista();
comprobar(/libre/i.test(pistaOk || ''), 'dice que está libre');
await pag.click('#btn-guardar-usuario');
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
ok('ya está dentro');
comprobar((await pag.textContent('#sesion-nombre')) === 'RosaBarro77', 'lo saluda por su usuario');

// ═══════════════════════════════════════════════ 8
console.log('\n8 · EL GIRO, YA ADENTRO');
comprobar(await pag.isVisible('#tira-giro'), 'la tira aparece dentro, no en el acceso');
await pag.selectOption('#giro-rapido', 'barro');
await pag.waitForTimeout(800);
comprobar(await pag.locator('#tira-giro').isHidden(), 'al elegir se va');

// ═══════════════════════════════════════════════ 9
console.log('\n9 · RECARGAR');
await pag.reload({ waitUntil: 'networkidle' });
await pag.waitForTimeout(1500);
comprobar(await pag.locator('#portada').isHidden(), 'sigue dentro');
comprobar((await pag.textContent('#sesion-nombre')) === 'RosaBarro77', 'y se acuerda del usuario');
const perfil = await pag.evaluate(() => JSON.parse(localStorage.getItem('oaxintegra.sesion')));
comprobar(perfil.giroTexto === 'Barro, talla de madera y alebrijes', `el giro viajó con la cuenta: «${perfil.giroTexto}»`);

// ═══════════════════════════════════════════════ 10
console.log('\n10 · TOKEN INVÁLIDO');
await pag.evaluate(() => {
  const t = JSON.parse(localStorage.getItem('oaxintegra.tokens'));
  t.access_token = 'PODRIDO'; t.refresh_token = 'PODRIDO'; t.vence = Date.now() + 3600000;
  localStorage.setItem('oaxintegra.tokens', JSON.stringify(t));
});
await pag.reload({ waitUntil: 'networkidle' });
await pag.waitForTimeout(1800);
comprobar(await pag.isVisible('#portada'), 'con un token falso NO deja entrar');
comprobar(await pag.isVisible('#vista-correo'), 'vuelve limpio al paso 1');
comprobar(await pag.evaluate(() => localStorage.getItem('oaxintegra.sesion')) === null, 'y borra la sesión de mentiras');

// ═══════════════════════════════════════════════ 11
console.log('\n11 · EL ENLACE DEL CORREO TAMBIÉN SIRVE');
const { enlace } = await ultimo();
await pag.goto('about:blank');
await pag.goto(enlace, { waitUntil: 'networkidle' });
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 9000 });
ok('quien prefiera darle clic al enlace, entra igual');
comprobar(!pag.url().includes('access_token'), 'y el token se borra de la barra de direcciones');

// ═══════════════════════════════════════════════ 12
console.log('\n12 · VER MI USUARIO CUANDO SE OLVIDA');
await pag.click('#btn-menu');
await pag.waitForTimeout(300);
comprobar(await pag.isVisible('#sesion-chip-movil'), 'en celular la sesión está en el menú');
await pag.click('#sesion-nombre-movil');
await pag.waitForTimeout(600);
const modal = await pag.textContent('body');
comprobar(/Tu usuario es RosaBarro77/.test(modal), 'desde «Mi perfil» ve su usuario otra vez');

// ═══════════════════════════════════════════════ 13
console.log('\n13 · CERRAR SESIÓN');
await pag.setViewportSize({ width: 1280, height: 900 });
await pag.goto(APP, { waitUntil: 'networkidle' });
await pag.waitForTimeout(1500);
await pag.click('#btn-salir');
await pag.waitForTimeout(1000);
comprobar(await pag.isVisible('#portada'), 'vuelve a la portada');
comprobar(await pag.evaluate(() => localStorage.getItem('oaxintegra.tokens')) === null, 'los tokens se borraron');

// ═══════════════════════════════════════════════ 14
console.log('\n14 · ERRORES DE JAVASCRIPT');
// No son fallos de la app: la red de esta máquina bloquea Google Fonts, y la
// propia prueba provoca a posta un 400/403/429 y un token podrido.
const ruido = /favicon|manifest|fonts\.googleapis|ERR_CONNECTION_RESET|ERR_TUNNEL_CONNECTION_FAILED|status of (400|401|403|406|429)|net::ERR_FAILED.*api\/ia/i;
const reales = errores.filter(e => !ruido.test(e));
comprobar(reales.length === 0, reales.length ? `hay ${reales.length}: ${reales[0].slice(0, 120)}` : 'ninguno en toda la prueba');

await nav.close();
console.log(`\n${'─'.repeat(48)}\n${fallos === 0 ? '✓ TODO BIEN' : '✗ ' + fallos + ' FALLO(S)'}  ·  ${pasos - fallos}/${pasos} comprobaciones\n`);
process.exit(fallos ? 1 : 0);
