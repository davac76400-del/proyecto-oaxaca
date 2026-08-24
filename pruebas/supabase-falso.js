/* Supabase de mentiras, para probar el acceso sin tocar el de verdad.
   Imita lo que usa la app: mandar el código, verificarlo, fijar la
   contraseña, entrar con ella, y las funciones de las migraciones. */
const http = require('http');
const { randomInt } = require('crypto');

const ANON = process.argv[2] || 'anon';
const PUERTO = Number(process.env.PUERTO_FALSO || 54321);
/* Email OTP Length. De FÁBRICA Supabase manda 6; se puede subir a 8 en su
   panel. La prueba usa lo que diga PUERTO_FALSO... digo, LARGO_FALSO, para
   comprobar que la app aguanta las dos. */
const LARGO = Number(process.env.LARGO_FALSO || 6);
const MINIMO_CONTRASENA = 6;

let ultimoCodigo = null, ultimoEnlace = null;
const CODIGOS_EMITIDOS = [];
/* La plantilla de correo de fábrica solo trae el enlace. Con PLANTILLA=codigo
   se simula la plantilla ya cambiada, con {{ .Token }}. */
const PLANTILLA = process.env.PLANTILLA_FALSA || 'enlace';

/* Como el de verdad: uno nuevo, al azar, cada vez que se pide. */
function nuevoCodigo() {
  return String(randomInt(0, Math.pow(10, LARGO))).padStart(LARGO, '0');
}

const USUARIO = {
  id: '11111111-2222-3333-4444-555555555555',
  email: '',
  created_at: '2026-01-15T10:00:00Z',
  user_metadata: {}
};

let PERFILES = {};          // id -> { usuario, giro, giro_texto, tiene_recuperacion }
let CONTRASENA = null;      // el código de entrada, ya fijado
let RECUPERACION = null;    // el código de recuperación (en Supabase iría cifrado)
let FALLOS_REC = 0;

/* Usuarios que ya tiene otra gente, para probar el choque de nombres. */
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
      return json(res, 200, {
        codigo: ultimoCodigo, enlace: ultimoEnlace, plantilla: PLANTILLA,
        metadatos: USUARIO.user_metadata, correo: USUARIO.email,
        emitidos: CODIGOS_EMITIDOS.slice(),
        hayContrasena: CONTRASENA !== null,
        hayRecuperacion: RECUPERACION !== null,
        /* Solo para comprobar que nada de esto acaba en el navegador. */
        contrasena: CONTRASENA, recuperacion: RECUPERACION
      });
    }
    if (url.pathname === '/__reset') {
      ultimoCodigo = null; ultimoEnlace = null; CODIGOS_EMITIDOS.length = 0;
      USUARIO.email = ''; USUARIO.user_metadata = {};
      PERFILES = {}; CONTRASENA = null; RECUPERACION = null; FALLOS_REC = 0;
      return json(res, 200, { ok: true });
    }

    if (req.headers['apikey'] !== ANON) return json(res, 401, { msg: 'No API key found in request' });

    const aut = req.headers['authorization'] || '';
    const conSesion = aut === 'Bearer TOKEN_BUENO' || aut === 'Bearer TOKEN_NUEVO';
    let datos = {};
    try { datos = cuerpo ? JSON.parse(cuerpo) : {}; } catch (e) { datos = {}; }

    const sesionNueva = () => ({
      access_token: 'TOKEN_BUENO', refresh_token: 'REFRESCO',
      expires_in: 3600, token_type: 'bearer', user: USUARIO
    });

    /* ---------------- pedir el código ---------------- */
    if (url.pathname === '/auth/v1/otp' && req.method === 'POST') {
      if (!datos.email || datos.email.indexOf('@') === -1) {
        return json(res, 400, { msg: 'Unable to validate email address: invalid format' });
      }
      if (datos.email === 'lleno@ejemplo.com') {
        return json(res, 429, { msg: 'For security purposes, you can only request this after 47 seconds' });
      }
      USUARIO.email = datos.email;
      ultimoCodigo = nuevoCodigo();
      CODIGOS_EMITIDOS.push(ultimoCodigo);
      ultimoEnlace = (url.searchParams.get('redirect_to') || 'http://localhost:3000/') +
        '#access_token=TOKEN_BUENO&refresh_token=REFRESCO&expires_in=3600&token_type=bearer&type=magiclink';
      console.log('[falso] correo a ' + datos.email +
                  (PLANTILLA === 'codigo' ? ' → código ' + ultimoCodigo : ' → enlace (plantilla de fábrica)'));
      return json(res, 200, {});
    }

    /* ---------------- comprobar el código ---------------- */
    if (url.pathname === '/auth/v1/verify' && req.method === 'POST') {
      /* Solo vale el último, como en Supabase. */
      if (datos.token !== ultimoCodigo || datos.email !== USUARIO.email) {
        return json(res, 403, { msg: 'Token has expired or is invalid' });
      }
      return json(res, 200, sesionNueva());
    }

    /* ---------------- quién soy ---------------- */
    if (url.pathname === '/auth/v1/user' && req.method === 'GET') {
      if (!conSesion) return json(res, 401, { msg: 'invalid claim: missing sub claim' });
      return json(res, 200, USUARIO);
    }

    /* ---------------- fijar la contraseña ---------------- */
    if (url.pathname === '/auth/v1/user' && req.method === 'PUT') {
      if (!conSesion) return json(res, 401, { msg: 'invalid claim: missing sub claim' });
      if (typeof datos.password === 'string') {
        if (datos.password.length < MINIMO_CONTRASENA) {
          return json(res, 422, { msg: 'Password should be at least ' + MINIMO_CONTRASENA + ' characters' });
        }
        CONTRASENA = datos.password;
        console.log('[falso] código de entrada fijado (' + datos.password.length + ' números)');
      }
      if (datos.data) { USUARIO.user_metadata = Object.assign({}, USUARIO.user_metadata, datos.data); }
      return json(res, 200, USUARIO);
    }

    /* ---------------- entrar con contraseña, o renovar ---------------- */
    if (url.pathname === '/auth/v1/token' && req.method === 'POST') {
      if (url.searchParams.get('grant_type') === 'password') {
        /* El mismo error para correo malo y código malo: distinguirlos diría
           si esa cuenta existe. */
        if (!CONTRASENA || datos.email !== USUARIO.email || datos.password !== CONTRASENA) {
          return json(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
        }
        return json(res, 200, sesionNueva());
      }
      if (datos.refresh_token !== 'REFRESCO') return json(res, 401, { msg: 'Invalid Refresh Token' });
      return json(res, 200, { access_token: 'TOKEN_NUEVO', refresh_token: 'REFRESCO', expires_in: 3600 });
    }

    if (url.pathname === '/auth/v1/logout') return json(res, 204, {});

    /* ---------------- leer el perfil (RLS: solo el suyo) ---------------- */
    if (url.pathname === '/rest/v1/perfiles' && req.method === 'GET') {
      if (!conSesion) return json(res, 401, { message: 'JWT expired' });
      const p = PERFILES[USUARIO.id] || null;
      if ((req.headers['accept'] || '').indexOf('pgrst.object') !== -1) {
        if (!p) return json(res, 406, { message: 'JSON object requested, multiple (or no) rows returned' });
        return json(res, 200, p);
      }
      return json(res, 200, p ? [p] : []);
    }

    /* ---------------- las funciones de la base ---------------- */
    // usuario_libre: se puede sin sesión, porque al registrarse todavía no hay
    if (url.pathname === '/rest/v1/rpc/usuario_libre' && req.method === 'POST') {
      const n = datos.nombre;
      if (!reglaUsuario(n)) return json(res, 200, false);
      const mio = (PERFILES[USUARIO.id] || {}).usuario;
      return json(res, 200, !TOMADOS.has(n) || (mio && mio.toLowerCase() === n.toLowerCase()));
    }

    if (url.pathname === '/rest/v1/rpc/fijar_usuario' && req.method === 'POST') {
      if (!conSesion) return json(res, 401, { message: 'JWT expired' });
      const n = datos.nombre;
      if (!reglaUsuario(n)) return json(res, 200, { ok: false, motivo: 'formato' });
      if (TOMADOS.has(n)) return json(res, 200, { ok: false, motivo: 'ocupado' });
      PERFILES[USUARIO.id] = Object.assign({}, PERFILES[USUARIO.id], { usuario: n });
      console.log('[falso] usuario → ' + n);
      return json(res, 200, { ok: true, usuario: n });
    }

    if (url.pathname === '/rest/v1/rpc/fijar_giro' && req.method === 'POST') {
      if (!conSesion) return json(res, 401, { message: 'JWT expired' });
      PERFILES[USUARIO.id] = Object.assign({}, PERFILES[USUARIO.id], {
        giro: datos.clave, giro_texto: datos.texto
      });
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/rest/v1/rpc/fijar_recuperacion' && req.method === 'POST') {
      if (!conSesion) return json(res, 401, { message: 'JWT expired' });
      if (!/^[0-9]{8}$/.test(String(datos.codigo || ''))) {
        return json(res, 200, { ok: false, motivo: 'formato' });
      }
      RECUPERACION = datos.codigo;    // en Supabase esto va cifrado con bcrypt
      FALLOS_REC = 0;
      PERFILES[USUARIO.id] = Object.assign({}, PERFILES[USUARIO.id], { tiene_recuperacion: true });
      console.log('[falso] código de recuperación guardado');
      return json(res, 200, { ok: true });
    }

    // usar_recuperacion: la única sin sesión, porque la usa quien no puede entrar
    if (url.pathname === '/rest/v1/rpc/usar_recuperacion' && req.method === 'POST') {
      if (!/^[0-9]{8}$/.test(String(datos.codigo || ''))) {
        return json(res, 200, { ok: false, motivo: 'no_coincide' });
      }
      if (FALLOS_REC >= 5) {
        return json(res, 200, { ok: false, motivo: 'espera', minutos: 15 });
      }
      const mismoCorreo = String(datos.correo || '').toLowerCase() === String(USUARIO.email).toLowerCase();
      if (!RECUPERACION || !mismoCorreo || datos.codigo !== RECUPERACION) {
        FALLOS_REC++;
        return json(res, 200, { ok: false, motivo: 'no_coincide',
                                restantes: Math.max(0, 5 - FALLOS_REC) });
      }
      FALLOS_REC = 0;
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { msg: 'no existe: ' + req.method + ' ' + url.pathname });
  });
}).listen(PUERTO, () => console.log('[falso] Supabase de mentiras en http://localhost:' + PUERTO));
