/* Supabase de mentiras, para probar el acceso sin tocar el de verdad.
   Responde a lo que usa la app: pedir código, verificarlo, leer el perfil,
   y las tres funciones de 001_perfiles.sql. */
const http = require('http');

const ANON = process.argv[2] || 'anon';
const PUERTO = Number(process.env.PUERTO_FALSO || 54321);

let ultimoCodigo = null, ultimoEnlace = null;

const USUARIO = {
  id: '11111111-2222-3333-4444-555555555555',
  email: '',
  created_at: '2026-01-15T10:00:00Z',
  user_metadata: {}
};
/* La "tabla" perfiles: id -> { usuario, giro, giro_texto } */
let PERFILES = {};
/* Usuarios ya tomados por OTRA gente, para probar el choque de nombres. */
const TOMADOS = new Set(['MariaTelar23']);

function json(res, codigo, datos) {
  res.writeHead(codigo, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,OPTIONS'
  });
  res.end(JSON.stringify(datos));
}

function reglaUsuario(n) {
  return typeof n === 'string' && /^[A-Za-z0-9._-]{4,20}$/.test(n) && /[A-Z]/.test(n);
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return json(res, 204, {});

  let cuerpo = '';
  req.on('data', t => cuerpo += t);
  req.on('end', () => {
    /* --- ayudas solo para la prueba (no existen en Supabase) --- */
    if (url.pathname === '/__ultimo') {
      return json(res, 200, { codigo: ultimoCodigo, enlace: ultimoEnlace, correo: USUARIO.email });
    }
    if (url.pathname === '/__reset') {
      ultimoCodigo = null; ultimoEnlace = null;
      USUARIO.email = ''; USUARIO.user_metadata = {};
      PERFILES = {};
      return json(res, 200, { ok: true });
    }

    const apikey = req.headers['apikey'];
    if (apikey !== ANON) return json(res, 401, { msg: 'No API key found in request' });

    const aut = req.headers['authorization'] || '';
    const conSesion = aut === 'Bearer TOKEN_BUENO' || aut === 'Bearer TOKEN_NUEVO';
    let datos = {};
    try { datos = cuerpo ? JSON.parse(cuerpo) : {}; } catch (e) { datos = {}; }

    /* ---------------- 1. pedir el código ---------------- */
    if (url.pathname === '/auth/v1/otp' && req.method === 'POST') {
      if (!datos.email || datos.email.indexOf('@') === -1) {
        return json(res, 400, { msg: 'Unable to validate email address: invalid format' });
      }
      if (datos.email === 'lleno@ejemplo.com') {
        return json(res, 429, { msg: 'For security purposes, you can only request this after 47 seconds' });
      }
      USUARIO.email = datos.email;
      ultimoCodigo = '482913';
      ultimoEnlace = (url.searchParams.get('redirect_to') || '') +
        '#access_token=TOKEN_BUENO&refresh_token=REFRESCO&expires_in=3600&token_type=bearer&type=magiclink';
      console.log('[falso] código para ' + datos.email + ' → ' + ultimoCodigo);
      return json(res, 200, {});
    }

    /* ---------------- 2. comprobar el código ---------------- */
    if (url.pathname === '/auth/v1/verify' && req.method === 'POST') {
      if (datos.token === '000000') {
        return json(res, 403, { msg: 'Token has expired or is invalid' });
      }
      if (datos.token !== ultimoCodigo) {
        return json(res, 403, { msg: 'Token has expired or is invalid' });
      }
      if (datos.email !== USUARIO.email) {
        return json(res, 403, { msg: 'Token has expired or is invalid' });
      }
      return json(res, 200, {
        access_token: 'TOKEN_BUENO', refresh_token: 'REFRESCO',
        expires_in: 3600, token_type: 'bearer', user: USUARIO
      });
    }

    /* ---------------- 3. quién soy ---------------- */
    if (url.pathname === '/auth/v1/user' && req.method === 'GET') {
      if (!conSesion) return json(res, 401, { msg: 'invalid claim: missing sub claim' });
      return json(res, 200, USUARIO);
    }

    /* ---------------- 4. renovar ---------------- */
    if (url.pathname === '/auth/v1/token' && req.method === 'POST') {
      if (datos.refresh_token !== 'REFRESCO') return json(res, 401, { msg: 'Invalid Refresh Token' });
      return json(res, 200, { access_token: 'TOKEN_NUEVO', refresh_token: 'REFRESCO', expires_in: 3600 });
    }

    if (url.pathname === '/auth/v1/logout') return json(res, 204, {});

    /* ---------------- 5. leer el perfil (RLS: solo el suyo) ---------------- */
    if (url.pathname === '/rest/v1/perfiles' && req.method === 'GET') {
      if (!conSesion) return json(res, 401, { message: 'JWT expired' });
      const p = PERFILES[USUARIO.id] || null;
      /* Con Accept: application/vnd.pgrst.object+json devuelve el objeto solo,
         y 406 si no hay fila. La app trata eso como «todavía no hay perfil». */
      if ((req.headers['accept'] || '').indexOf('pgrst.object') !== -1) {
        if (!p) return json(res, 406, { message: 'JSON object requested, multiple (or no) rows returned' });
        return json(res, 200, p);
      }
      return json(res, 200, p ? [p] : []);
    }

    /* ---------------- 6. las funciones de la base ---------------- */
    if (url.pathname === '/rest/v1/rpc/usuario_libre' && req.method === 'POST') {
      if (!conSesion) return json(res, 401, { message: 'JWT expired' });
      const n = datos.nombre;
      if (!reglaUsuario(n)) return json(res, 200, false);
      const mio = (PERFILES[USUARIO.id] || {}).usuario;
      const chocado = TOMADOS.has(n) ||
        Object.keys(PERFILES).some(k => k !== USUARIO.id &&
          String(PERFILES[k].usuario || '').toLowerCase() === n.toLowerCase());
      return json(res, 200, !chocado || (mio && mio.toLowerCase() === n.toLowerCase()));
    }

    if (url.pathname === '/rest/v1/rpc/fijar_usuario' && req.method === 'POST') {
      if (!conSesion) return json(res, 401, { message: 'JWT expired' });
      const n = datos.nombre;
      if (!reglaUsuario(n)) return json(res, 200, { ok: false, motivo: 'formato' });
      if (TOMADOS.has(n)) return json(res, 200, { ok: false, motivo: 'ocupado' });
      PERFILES[USUARIO.id] = Object.assign({}, PERFILES[USUARIO.id], { usuario: n });
      console.log('[falso] usuario fijado → ' + n);
      return json(res, 200, { ok: true, usuario: n });
    }

    if (url.pathname === '/rest/v1/rpc/fijar_giro' && req.method === 'POST') {
      if (!conSesion) return json(res, 401, { message: 'JWT expired' });
      PERFILES[USUARIO.id] = Object.assign({}, PERFILES[USUARIO.id], {
        giro: datos.clave, giro_texto: datos.texto
      });
      console.log('[falso] giro → ' + datos.clave);
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { msg: 'no existe: ' + req.method + ' ' + url.pathname });
  });
}).listen(PUERTO, () => console.log('[falso] Supabase de mentiras en http://localhost:' + PUERTO));
