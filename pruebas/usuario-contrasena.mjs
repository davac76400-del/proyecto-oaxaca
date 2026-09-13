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

/* A propósito NO es la pantalla de celular de acceso.mjs: #btn-salir y
   #sesion-nombre son el chip de la barra de arriba, que solo existe en
   pantalla grande (en celular es #btn-salir-movil, dentro del menú). */
/* --no-proxy-server porque todo esto es localhost: donde haya un proxy en el
   entorno (contenedores, CI), Chromium le manda también las llamadas al
   servidor de mentiras y la prueba falla con ERR_TUNNEL_CONNECTION_FAILED,
   que no se parece en nada al problema que es. */
const nav = await chromium.launch({
  args: ['--no-proxy-server'],
  ...(CHROME ? { executablePath: CHROME } : {})
});
const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
const pag = await ctx.newPage();

const errores = [];
pag.on('pageerror', e => errores.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') errores.push('[consola] ' + m.text()); });

const ultimo = async () => (await (await fetch(FALSO + '/__ultimo')).json());

/* La pista del usuario pasa por «Comprobando si está libre…» antes del
   veredicto — y ese texto de espera TAMBIÉN contiene «libre», así que
   esperar cualquier texto no alcanza: hay que esperar a que empiece con
   ✓ o ✗ (igual que en acceso.mjs, que ya se topó con esto). */
const esperarPista = async (ms = 9000) => {
  await pag.waitForFunction(() => {
    const e = document.querySelector('#pista-usuario');
    return e && !e.hidden && /^[✓✗]/.test(e.textContent.trim());
  }, null, { timeout: ms });
  return (await pag.textContent('#pista-usuario')).trim();
};

/* Hay 8 casillas en el HTML (para no cerrarle la puerta a quien configure
   Email OTP Length = 8 en su panel), pero de fábrica Supabase manda 6. El
   auto-envío solo dispara cuando TODAS las casillas tienen algo, así que con
   un código de 6 hay que darle clic a «Continuar» a mano — igual que haría
   alguien de verdad con un código de 6 dígitos. */
const escribirCodigo = async (rejilla, codigo) => {
  for (let i = 0; i < codigo.length; i++) {
    await pag.fill(`${rejilla} .casilla >> nth=${i}`, codigo[i]);
  }
  await pag.waitForTimeout(250);
  if (await pag.locator('#vista-codigo').isVisible()) { await pag.click('#btn-comprobar'); }
};

// ═══════════════════════════════════════════════════════════ 1
console.log('\n1 · REGISTRO: correo → código → usuario + contraseña');
await pag.goto(APP, { waitUntil: 'networkidle' });
comprobar(await pag.isVisible('#portada'), 'la portada bloquea el paso');

await pag.click('#btn-ir-registro');
await pag.waitForSelector('#vista-registro:not([hidden])', { timeout: 5000 });

/* Un correo de dominio propio (de un negocio, de una universidad) tiene que
   poder registrarse: antes había una lista de 21 dominios permitidos y a toda
   esa gente la dejaba fuera. */
await pag.fill('#reg-correo', 'contacto@mizcalerianegocio.com.mx');
await pag.click('#reg-correo');
await pag.evaluate(() => document.getElementById('reg-correo').blur());
comprobar(await pag.getAttribute('#reg-correo', 'data-valido') === 'si',
  'un correo de dominio propio se acepta');

/* Y el error de dedo se avisa sin cerrarle la puerta a nadie: sugerencia
   clicable, no rechazo. */
await pag.fill('#reg-correo', 'nueva@gmial.com');
await pag.evaluate(() => document.getElementById('reg-correo').blur());
const sugerencia = await pag.textContent('#vista-registro p:has(button)').catch(() => '');
comprobar(/gmail\.com/.test(sugerencia || ''),
  `avisa del error de dedo en el dominio: «${(sugerencia || '').trim()}»`);
await pag.click('#vista-registro p:has(button) button');
comprobar(await pag.inputValue('#reg-correo') === 'nueva@gmail.com',
  'al darle clic a la sugerencia, corrige el correo');

await pag.fill('#reg-correo', 'nueva@ejemplo.com');
await pag.click('#form-registro button[type="submit"]');
await pag.waitForSelector('#vista-codigo:not([hidden])', { timeout: 8000 });
ok('pasa al formulario del código tras mandar el correo');

let info = await ultimo();
comprobar(!!info.codigo, 'el servidor de mentiras generó un código');
await escribirCodigo('#casillas-codigo', info.codigo);
await pag.waitForSelector('#vista-crear-cuenta:not([hidden])', { timeout: 8000 });
ok('pasa a crear usuario+contraseña tras comprobar el código (sin fijarlo como clave)');

// usuario con formato viejo (con punto) → no debe avanzar
await pag.fill('#cc-usuario', 'Ma.ria');
await pag.click('#form-crear-cuenta button[type="submit"]');
await pag.waitForTimeout(300);
comprobar(await pag.isVisible('#vista-crear-cuenta'), 'usuario con formato inválido no avanza');
await pag.fill('#cc-usuario', '');

await pag.fill('#cc-usuario', 'MariaBarro1');
const pista = await esperarPista();
comprobar(/libre/i.test(pista), `la pista de usuario dice que está libre: «${pista}»`);

// contraseña débil primero, para probar que la lista de requisitos frena el envío
await pag.fill('#cc-clave', 'abc');
await pag.fill('#cc-clave-2', 'abc');
await pag.click('#form-crear-cuenta button[type="submit"]');
await pag.waitForTimeout(300);
comprobar(await pag.isVisible('#vista-crear-cuenta'), 'contraseña que no cumple los requisitos no avanza');
await pag.fill('#cc-clave', '');
await pag.fill('#cc-clave-2', '');

await pag.fill('#cc-clave', 'Mezcal2026');
const requisitos = await pag.locator('#requisitos-cc-clave li').evaluateAll(
  lis => lis.map(li => ({ req: li.dataset.req, cumplido: li.dataset.cumplido === 'si' })));
comprobar(requisitos.every(r => r.cumplido), `la lista de requisitos se puso toda en verde: ${JSON.stringify(requisitos)}`);
await pag.fill('#cc-clave-2', 'Mezcal2026');

await pag.click('#form-crear-cuenta button[type="submit"]');
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
ok('la cuenta se creó y entró directo (portada oculta)');

const nombreSesion = (await pag.textContent('#sesion-nombre') || '').trim();
comprobar(nombreSesion === 'MariaBarro1', `el nombre de la sesión es el usuario elegido: «${nombreSesion}»`);

// ═══════════════════════════════════════════════════════════ 2
console.log('\n2 · SALIR Y ENTRAR CON USUARIO + CONTRASEÑA');
await pag.click('#btn-salir');
await pag.waitForSelector('#portada:not([hidden])', { timeout: 4000 });
ok('salió de la cuenta');

await pag.click('#btn-ir-entrar');
await pag.waitForSelector('#vista-entrar:not([hidden])', { timeout: 5000 });

/* El usuario existe y la contraseña no: el mensaje tiene que señalar la
   contraseña y no el usuario. Esto esperaba antes un mensaje genérico («no
   coinciden»), y quedó atrás de una decisión posterior: se pidió distinguir
   los dos motivos para no mandar a buscar el error en el lado equivocado a
   quien de verdad olvidó uno de los dos. El precio, escrito también en
   app.src.html donde se decide, es que el mensaje revela si un usuario
   existe. */
await pag.fill('#usuario-entrar', 'MariaBarro1');
await pag.fill('#contrasena-entrar', 'ClaveMala1');
await pag.click('#form-entrar button[type="submit"]');
await pag.waitForSelector('#error-entrar:not([hidden])', { timeout: 6000 });
const errLogin = await pag.textContent('#error-entrar');
comprobar(/contraseña/i.test(errLogin || '') && !/usuario/i.test(errLogin || ''),
  `contraseña incorrecta señala la contraseña, no el usuario: «${errLogin}»`);
comprobar(await pag.isVisible('#portada'), 'sigue sin entrar');

await pag.fill('#contrasena-entrar', '');
await pag.fill('#contrasena-entrar', 'Mezcal2026');
await pag.click('#form-entrar button[type="submit"]');
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
ok('entró con usuario + contraseña correctos');

// ═══════════════════════════════════════════════════════════ 3
console.log('\n3 · CAMBIAR MI CONTRASEÑA (desde dentro)');
await pag.click('#sesion-nombre');
await pag.waitForSelector('#modal-exito:not([hidden])', { timeout: 4000 });
await pag.click('#btn-accion-exito');
await pag.waitForSelector('#modal-cambiar-clave:not([hidden])', { timeout: 4000 });
ok('se abrió el modal de cambiar contraseña');

await pag.fill('#ac-clave', 'ClaveMala1');   // actual incorrecta a propósito
await pag.fill('#ac-clave-nueva', 'NuevaClave9');
await pag.fill('#ac-clave-nueva-2', 'NuevaClave9');
await pag.click('#form-cambiar-clave button[type="submit"]');
await pag.waitForSelector('#error-ac-clave:not([hidden])', { timeout: 6000 });
const errActual = await pag.textContent('#error-ac-clave');
comprobar(/no es tu contraseña actual/i.test(errActual || ''), `contraseña actual incorrecta se detecta: «${errActual}»`);

await pag.fill('#ac-clave', '');
await pag.fill('#ac-clave', 'Mezcal2026');
await pag.click('#form-cambiar-clave button[type="submit"]');
await pag.waitForSelector('#modal-cambiar-clave', { state: 'hidden', timeout: 8000 });
ok('la contraseña se cambió (modal se cerró)');

// ═══════════════════════════════════════════════════════════ 4
console.log('\n4 · SALIR Y ENTRAR CON LA CONTRASEÑA NUEVA');
await pag.click('#btn-salir');
await pag.waitForSelector('#portada:not([hidden])', { timeout: 4000 });
await pag.click('#btn-ir-entrar');
await pag.waitForSelector('#vista-entrar:not([hidden])', { timeout: 5000 });
await pag.fill('#usuario-entrar', 'MariaBarro1');
await pag.fill('#contrasena-entrar', 'NuevaClave9');
await pag.click('#form-entrar button[type="submit"]');
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
ok('entró con la contraseña nueva tras el cambio');

// ═══════════════════════════════════════════════════════════ 5
console.log('\n5 · OLVIDÉ MI CONTRASEÑA');
await pag.click('#btn-salir');
await pag.waitForSelector('#portada:not([hidden])', { timeout: 4000 });
await pag.click('#btn-ir-entrar');
await pag.waitForSelector('#vista-entrar:not([hidden])', { timeout: 5000 });
await pag.click('#btn-olvide-codigo');
await pag.waitForSelector('#vista-recuperar:not([hidden])', { timeout: 5000 });
await pag.fill('#correo-recuperar', 'nueva@ejemplo.com');
await pag.click('#vista-recuperar >> #btn-recuperar');
await pag.waitForSelector('#vista-codigo:not([hidden])', { timeout: 8000 });
ok('se mandó un código para recuperar (sin pedir un código de recuperación previo)');

info = await ultimo();
await escribirCodigo('#casillas-codigo', info.codigo);
await pag.waitForSelector('#vista-nueva-clave:not([hidden])', { timeout: 8000 });
ok('tras comprobar el código, pide la contraseña nueva (no intenta "recordarla")');

const usuarioMostrado = (await pag.textContent('#nc-usuario') || '').trim();
comprobar(usuarioMostrado === 'MariaBarro1', `muestra el usuario existente: «${usuarioMostrado}»`);

await pag.fill('#nc-clave', 'OtraClave7');
await pag.fill('#nc-clave-2', 'OtraClave7');
await pag.click('#form-nueva-clave button[type="submit"]');
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
ok('entró tras poner la contraseña nueva de recuperación');

// ═══════════════════════════════════════════════════════════ 6
console.log('\n6 · SALIR Y ENTRAR CON LA CONTRASEÑA DE RECUPERACIÓN');
await pag.click('#btn-salir');
await pag.waitForSelector('#portada:not([hidden])', { timeout: 4000 });
await pag.click('#btn-ir-entrar');
await pag.waitForSelector('#vista-entrar:not([hidden])', { timeout: 5000 });
await pag.fill('#usuario-entrar', 'MariaBarro1');
await pag.fill('#contrasena-entrar', 'OtraClave7');
await pag.click('#form-entrar button[type="submit"]');
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
ok('entró con la contraseña puesta al recuperar la cuenta');

// ═══════════════════════════════════════════════════════════ 7
console.log('\n7 · UNA CUENTA CON USUARIO DE FORMATO VIEJO (de antes de 007) SIGUE ENTRANDO');
// 007 estrechó el formato para USUARIOS NUEVOS (5-15, sin punto), pero no
// puede dejar fuera a quien ya tenía uno del formato de antes (4-20, con
// punto). __sembrar_vieja deja lista una cuenta así, como si ya existiera.
await pag.click('#btn-salir');
await pag.waitForSelector('#portada:not([hidden])', { timeout: 4000 });
await fetch(FALSO + '/__sembrar_vieja', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ correo: 'vieja@ejemplo.com', usuario: 'Maria.Rodriguez23', contrasena: 'ClaveDeAntes1' })
});
await pag.click('#btn-ir-entrar');
await pag.waitForSelector('#vista-entrar:not([hidden])', { timeout: 5000 });
await pag.fill('#usuario-entrar', 'Maria.Rodriguez23');
await pag.fill('#contrasena-entrar', 'ClaveDeAntes1');
await pag.click('#form-entrar button[type="submit"]');
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
ok('una cuenta con usuario de formato viejo (con punto, 18 caracteres) entra igual');

// ═══════════════════════════════════════════════════════════ 8
console.log('\n8 · EL ENLACE DEL CORREO DE RECUPERACIÓN LLEVA A ELEGIR CONTRASEÑA NUEVA');
// Si en vez de escribir el código le da clic al enlace (la plantilla de
// fábrica de Supabase), tiene que llevar al mismo lado que escribir el
// código: a elegir una contraseña NUEVA — nunca entrar derecho con la que
// justo está intentando recuperar porque se le olvidó.
await pag.click('#btn-salir');
await pag.waitForSelector('#portada:not([hidden])', { timeout: 4000 });
await pag.click('#btn-ir-entrar');
await pag.waitForSelector('#vista-entrar:not([hidden])', { timeout: 5000 });
await pag.click('#btn-olvide-codigo');
await pag.waitForSelector('#vista-recuperar:not([hidden])', { timeout: 5000 });
await pag.fill('#correo-recuperar', 'vieja@ejemplo.com');
await pag.click('#vista-recuperar >> #btn-recuperar');
await pag.waitForSelector('#vista-codigo:not([hidden])', { timeout: 8000 });

const { enlace } = await ultimo();
comprobar(/[?&]motivo=recuperacion/.test(enlace || ''), `el enlace del correo lleva el motivo de recuperación: ${enlace}`);

await pag.goto(enlace, { waitUntil: 'networkidle' });
await pag.waitForSelector('#vista-nueva-clave:not([hidden])', { timeout: 8000 });
ok('el enlace de recuperación lleva a elegir contraseña nueva, no entra directo con la vieja');
const usuarioTrasEnlace = (await pag.textContent('#nc-usuario') || '').trim();
comprobar(usuarioTrasEnlace === 'Maria.Rodriguez23', `muestra el usuario existente: «${usuarioTrasEnlace}»`);

await pag.fill('#nc-clave', 'ClaveDesdeEnlace3');
await pag.fill('#nc-clave-2', 'ClaveDesdeEnlace3');
await pag.click('#form-nueva-clave button[type="submit"]');
await pag.waitForSelector('#portada', { state: 'hidden', timeout: 8000 });
ok('entró tras poner la contraseña nueva elegida desde el enlace de recuperación');

// ═══════════════════════════════════════════════════════════ 9
console.log('\n9 · ERRORES DE JAVASCRIPT');
// No son de la app: esta máquina bloquea Google Fonts, y la propia prueba
// provoca a propósito un 400 (contraseña/actual incorrecta) y un 406 (leer
// el perfil antes de que exista, justo después de verificar el código).
// ERR_CERT_AUTHORITY_INVALID es la otra cara de lo mismo: donde la red mete
// su propio certificado (un proxy, un contenedor con su CA), Google Fonts
// falla así y el mensaje de consola no trae la URL, así que no lo atrapa el
// filtro de arriba.
const ruido = /favicon|manifest|fonts\.googleapis|ERR_CONNECTION_RESET|ERR_TUNNEL_CONNECTION_FAILED|ERR_CERT_AUTHORITY_INVALID|status of (400|401|403|406|429)|net::ERR_FAILED.*api\/ia/i;
const reales = errores.filter(e => !ruido.test(e));
comprobar(reales.length === 0, reales.length ? `hay ${reales.length}: ${reales[0].slice(0, 120)}` : 'ninguno en toda la prueba');

await nav.close();
console.log(`\n${'─'.repeat(48)}\n${fallos === 0 ? '✓ TODO BIEN' : '✗ ' + fallos + ' FALLO(S)'}  ·  ${pasos - fallos}/${pasos} comprobaciones\n`);
process.exit(fallos > 0 ? 1 : 0);
