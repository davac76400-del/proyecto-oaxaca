/* ============================================================================
   RETIRADO el 11 de septiembre de 2026: esto prueba la forma de entrar
   ANTERIOR (código de 8 números que se fijaba como contraseña; usuario
   elegido antes que el correo, en el mismo paso). Esa pantalla ya no existe
   — #reg-usuario, #vista-guardalo y #vista-crear-recuperacion se quitaron
   del HTML — así que este archivo ya no corre contra la app actual.

   La forma de entrar de ahora (usuario + contraseña, elegidos DESPUÉS de
   comprobar el correo) se prueba en pruebas/usuario-contrasena.mjs. El porqué
   del cambio está en docs/08-acceso-por-codigo.md.

   Se deja aquí como referencia histórica, no se borra por las dudas.
   ========================================================================= */
import { chromium } from 'playwright';

const APP    = process.env.APP_URL   || 'http://localhost:3000/';
const FALSO  = process.env.FALSO_URL || 'http://localhost:54321';
const CHROME = process.env.CHROME_PATH || undefined;
const ANON   = process.env.ANON_KEY || 'anon';

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

/* Esperar a que algo tenga texto, en vez de dormir un rato fijo: con sleeps
   la prueba fallaba cuando el servidor tardaba más que el reloj. */
const esperarTexto = async (sel, ms = 9000) => {
  await pag.waitForFunction(
    s => { const e = document.querySelector(s); return e && e.textContent.trim().length > 0; },
    sel, { timeout: ms });
  return (await pag.textContent(sel)).trim();
};

/* La pista del usuario pasa por «Comprobando si está libre…» antes del
   veredicto. Y ojo: ese texto TAMBIÉN contiene «libre», así que buscar esa
   palabra se cumplía sola. El veredicto es lo único que empieza con ✓ o ✗. */
const esperarPista = async (ms = 9000) => {
  await pag.waitForFunction(() => {
    const e = document.querySelector('#pista-usuario');
    return e && !e.hidden && /^[✓✗]/.test(e.textContent.trim());
  }, null, { timeout: ms });
  return (await pag.textContent('#pista-usuario')).trim();
};

const escribir = async (rejilla, codigo) => {
  for (let i = 0; i < codigo.length; i++) {
    await pag.fill(`${rejilla} .casilla >> nth=${i}`, codigo[i]);
  }
};

// ═══════════════════════════════════════════════════════════ 1
console.log('\n1 · LA PORTADA: DOS BOTONES, NO DOS FORMAS DE ENTRAR');
await pag.goto(APP, { waitUntil: 'networkidle' });
comprobar(await pag.isVisible('#portada'), 'la portada bloquea la entrada');
comprobar(await pag.isVisible('#btn-ir-entrar'), 'hay «Iniciar sesión»');
comprobar(await pag.isVisible('#btn-ir-registro'), 'hay «Registrarme»');
comprobar(await pag.locator('#vista-entrar').isHidden(), 'no se ve el formulario de entrar todavía');
comprobar(await pag.locator('#vista-registro').isHidden(), 'ni el de registro');

// ═══════════════════════════════════════════════════════════ 2
console.log('\n2 · REGISTRARSE');
await pag.click('#btn-ir-registro');
await pag.waitForSelector('#vista-registro:not([hidden])', { timeout: 5000 });
comprobar((await pag.textContent('#vista-registro')).includes('Paso 1 de 3'), 'dice «Paso 1 de 3»');

await pag.fill('#reg-usuario', 'MariaTelar23');        // ya lo tiene alguien
const pistaMal = await esperarPista();
comprobar(/ya lo tiene/i.test(pistaMal), `avisa sin sesión: «${pistaMal.slice(0, 40)}»`);

await pag.fill('#reg-usuario', 'RosaBarro77');
const pistaOk = await esperarPista();
comprobar(/libre/i.test(pistaOk), 'y dice cuál sí está libre');

await pag.fill('#reg-correo', 'rosa@ejemplo.com');
await pag.click('#btn-registro');
await pag.waitForSelector('#vista-codigo:not([hidden])', { timeout: 8000 });
ok('pasa a escribir el código');
comprobar((await pag.textContent('#correo-enviado')) === 'rosa@ejemplo.com', 'muestra a qué correo se mandó');
comprobar(await pag.locator('#casillas-codigo .casilla').count() === 8, 'son 8 casillas');

const { codigo } = await ultimo();
comprobar(/^\d{8}$/.test(codigo || ''), `llegó un código de 8 números: ${codigo}`);

// ═══════════════════════════════════════════════════════════ 3
console.log('\n3 · CADA QUIEN RECIBE EL SUYO');
const vistos = new Set([codigo]);
for (let i = 0; i < 5; i++) {
  await fetch(`${FALSO}/auth/v1/otp`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `otra${i}@ejemplo.com`, create_user: true })
  });
  vistos.add((await ultimo()).codigo);
}
comprobar(vistos.size === 6, `6 peticiones → ${vistos.size} códigos distintos`);

// Volver a dejar el correo bueno como el vigente.
await pag.click('#btn-reenviar');
await pag.waitForTimeout(1200);
const CLAVE = (await ultimo()).codigo;
comprobar(/^\d{8}$/.test(CLAVE), 'se pide otro y llega uno nuevo');

// ═══════════════════════════════════════════════════════════ 4
console.log('\n4 · CÓDIGO EQUIVOCADO');
await escribir('#casillas-codigo', '00000000');
const errMal = await esperarTexto('#error-codigo');
comprobar(/no coincide|venció/i.test(errMal), `lo explica: «${errMal.slice(0, 44)}…»`);
comprobar(await pag.isVisible('#vista-codigo'), 'y no deja pasar');

// ═══════════════════════════════════════════════════════════ 5
console.log('\n5 · CÓDIGO BUENO → «GUÁRDALO»');
await pag.waitForTimeout(900);          // marcarMal limpia a los 700ms
await escribir('#casillas-codigo', CLAVE);
await pag.waitForSelector('#vista-guardalo:not([hidden])', { timeout: 9000 });
ok('llega a la pantalla de guardar el código');
const mostrado = (await pag.textContent('#codigo-guardalo')).replace(/\s/g, '');
comprobar(mostrado === CLAVE, `enseña el código: ${mostrado}`);
comprobar(/ANÓTALO DONDE NO SE TE PIERDA/.test(await pag.textContent('#vista-guardalo')),
          'avisa en grande que hay que anotarlo');
comprobar((await ultimo()).hayContrasena === true,
          'el código quedó FIJADO como contraseña (si no, mañana no serviría)');
comprobar((await ultimo()).contrasena === CLAVE, 'y es exactamente el que le llegó al correo');

// ═══════════════════════════════════════════════════════════ 6
console.log('\n6 · EL CÓDIGO DE RECUPERACIÓN');
await pag.click('#btn-ya-lo-anote');
await pag.waitForSelector('#vista-crear-recuperacion:not([hidden])', { timeout: 6000 });
ok('después de guardarlo, ofrece el de recuperación');
comprobar(await pag.locator('#casillas-crear-rec .casilla').count() === 8, 'son 8 casillas');

for (const [flojo, porque] of [['11111111', 'todo el mismo número'],
                               ['12345678', 'en orden'],
                               ['12121212', 'dos repetidos']]) {
  await escribir('#casillas-crear-rec', flojo);
  await pag.click('#btn-guardar-rec');
  const e = await esperarTexto('#error-crear-rec');
  comprobar(e.length > 0, `rechaza ${flojo} (${porque})`);
  await pag.waitForTimeout(850);
}

const RECU = '48207391';
await escribir('#casillas-crear-rec', RECU);
await pag.click('#btn-guardar-rec');
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 9000 });
ok('guarda el bueno y entra');
comprobar((await pag.textContent('#sesion-nombre')) === 'RosaBarro77', 'lo saluda por su usuario');
comprobar((await ultimo()).hayRecuperacion === true, 'quedó guardado en el servidor');

const enNavegador = await pag.evaluate(() => JSON.stringify(localStorage));
comprobar(!enNavegador.includes(CLAVE), 'el código de entrada NO queda en el navegador');
comprobar(!enNavegador.includes(RECU), 'el de recuperación tampoco');

// ═══════════════════════════════════════════════════════════ 7
console.log('\n7 · RECARGAR');
await pag.reload({ waitUntil: 'networkidle' });
await pag.waitForTimeout(1500);
comprobar(await pag.locator('#portada').isHidden(), 'sigue dentro');
comprobar((await pag.textContent('#sesion-nombre')) === 'RosaBarro77', 'y se acuerda de quién es');

// ═══════════════════════════════════════════════════════════ 8
console.log('\n8 · ENTRAR CON EL CÓDIGO, SIN CORREO DE POR MEDIO');
await pag.evaluate(() => localStorage.clear());        // como en otro teléfono
await pag.goto(APP, { waitUntil: 'networkidle' });
await pag.waitForTimeout(800);
await pag.click('#btn-ir-entrar');
await pag.waitForSelector('#vista-entrar:not([hidden])', { timeout: 5000 });

await pag.fill('#correo-entrar', 'rosa@ejemplo.com');
await escribir('#casillas-entrar', '99999999');
const errEntrar = await esperarTexto('#error-entrar');
comprobar(/no coinciden/i.test(errEntrar), `código malo → «${errEntrar.slice(0, 40)}…»`);

await pag.waitForTimeout(900);
await escribir('#casillas-entrar', CLAVE);
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 9000 });
ok('con el código bueno entra directo, sin pedir correo');
comprobar((await pag.textContent('#sesion-nombre')) === 'RosaBarro77', 'y es la misma cuenta');

// ═══════════════════════════════════════════════════════════ 9
console.log('\n9 · OLVIDÉ MI CÓDIGO');
await pag.evaluate(() => localStorage.clear());
await pag.goto(APP, { waitUntil: 'networkidle' });
await pag.waitForTimeout(800);
await pag.click('#btn-ir-entrar');
await pag.click('#btn-olvide-codigo');
await pag.waitForSelector('#vista-recuperar:not([hidden])', { timeout: 5000 });
ok('hay salida «Olvidé mi código»');

// Recuperación equivocada.
await pag.fill('#correo-recuperar', 'rosa@ejemplo.com');
await escribir('#casillas-recuperar', '55555550');
const errRec = await esperarTexto('#error-recuperar');
comprobar(/no coinciden/i.test(errRec), `recuperación mala → «${errRec.slice(0, 42)}…»`);
comprobar(/quedan \d+ intentos/i.test(errRec), 'y avisa cuántos intentos quedan');

// La buena → llega un código nuevo.
await pag.waitForTimeout(900);
await escribir('#casillas-recuperar', RECU);
await pag.waitForSelector('#vista-codigo:not([hidden])', { timeout: 9000 });
ok('con la recuperación buena, manda un código nuevo al correo');

const NUEVA = (await ultimo()).codigo;
comprobar(NUEVA !== CLAVE, 'y el nuevo es distinto del anterior');

await escribir('#casillas-codigo', NUEVA);
await pag.waitForSelector('#vista-guardalo:not([hidden])', { timeout: 9000 });
ok('lo escribe y le enseña su código nuevo');
comprobar((await ultimo()).contrasena === NUEVA, 'el nuevo quedó fijado como contraseña');

await pag.click('#btn-ya-lo-anote');
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 9000 });
ok('y entra');

// El viejo ya no debe servir.
const rViejo = await fetch(`${FALSO}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'rosa@ejemplo.com', password: CLAVE })
});
comprobar(rViejo.status === 400, `el código viejo ya no abre nada (HTTP ${rViejo.status})`);

// ═══════════════════════════════════════════════════════════ 10
console.log('\n10 · MI CUENTA');
await pag.click('#btn-menu');
await pag.waitForTimeout(300);
await pag.click('#sesion-nombre-movil');
await pag.waitForTimeout(700);
const cuenta = await pag.textContent('body');
comprobar(/Tu usuario es RosaBarro77/.test(cuenta), 'enseña el usuario');
comprobar(/código de recuperación puesto/i.test(cuenta), 'y dice que sí tiene recuperación');

// ═══════════════════════════════════════════════════════════ 11
console.log('\n11 · CERRAR SESIÓN');
await pag.setViewportSize({ width: 1280, height: 900 });
await pag.goto(APP, { waitUntil: 'networkidle' });
await pag.waitForTimeout(1500);
await pag.click('#btn-salir');
await pag.waitForTimeout(1000);
comprobar(await pag.isVisible('#portada'), 'vuelve a la portada');
comprobar(await pag.isVisible('#vista-inicio'), 'y a los dos botones del principio');
comprobar(await pag.evaluate(() => localStorage.getItem('oaxintegra.tokens')) === null,
          'los tokens se borraron');

// ═══════════════════════════════════════════════════════════ 12
console.log('\n12 · ERRORES DE JAVASCRIPT');
// No son de la app: esta máquina bloquea Google Fonts, y la propia prueba
// provoca a posta un 400/403/406/429 y un token podrido.
const ruido = /favicon|manifest|fonts\.googleapis|ERR_CONNECTION_RESET|ERR_TUNNEL_CONNECTION_FAILED|status of (400|401|403|406|429)|net::ERR_FAILED.*api\/ia/i;
const reales = errores.filter(e => !ruido.test(e));
comprobar(reales.length === 0, reales.length ? `hay ${reales.length}: ${reales[0].slice(0, 120)}` : 'ninguno en toda la prueba');

await nav.close();
console.log(`\n${'─'.repeat(48)}\n${fallos === 0 ? '✓ TODO BIEN' : '✗ ' + fallos + ' FALLO(S)'}  ·  ${pasos - fallos}/${pasos} comprobaciones\n`);
process.exit(fallos ? 1 : 0);
