/* Supabase de mentiras, solo para probar el flujo del enlace mágico.
   Responde a las cuatro llamadas que hace la app y nada más. */
const http = require('http');

const ANON = process.argv[2] || 'anon';
let ultimoEnlace = null;

function json(res, codigo, datos) {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(codigo, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS'
  });
  res.end(cuerpo);
}

const USUARIO = {
  id: '11111111-2222-3333-4444-555555555555',
  email: 'maria@ejemplo.com',
  created_at: '2026-01-15T10:00:00Z',
  user_metadata: {}
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { return json(res, 204, {}); }

  let cuerpo = '';
  req.on('data', t => cuerpo += t);
  req.on('end', () => {
    if (url.pathname === '/__ultimo') { return json(res, 200, { enlace: ultimoEnlace }); }
    if (url.pathname === '/__reset')  { USUARIO.user_metadata = {}; ultimoEnlace = null; return json(res, 200, { ok: true }); }

    const apikey = req.headers['apikey'];
    if (apikey !== ANON) { return json(res, 401, { msg: 'No API key found in request' }); }

    // 1. pedir el enlace
    if (url.pathname === '/auth/v1/otp' && req.method === 'POST') {
      const datos = JSON.parse(cuerpo || '{}');
      const regreso = url.searchParams.get('redirect_to');
      if (!datos.email || datos.email.indexOf('@') === -1) {
        return json(res, 400, { msg: 'Invalid email address' });
      }
      if (datos.email === 'lleno@ejemplo.com') {
        return json(res, 429, { msg: 'For security purposes, you can only request this after 60 seconds' });
      }
      ultimoEnlace = regreso + '#access_token=TOKEN_BUENO&refresh_token=REFRESCO&expires_in=3600&token_type=bearer&type=magiclink';
      console.log('[falso] enlace generado -> ' + ultimoEnlace);
      return json(res, 200, {});
    }

    // 2. quién soy
    if (url.pathname === '/auth/v1/user' && req.method === 'GET') {
      const aut = req.headers['authorization'] || '';
      if (aut !== 'Bearer TOKEN_BUENO' && aut !== 'Bearer TOKEN_NUEVO') {
        return json(res, 401, { msg: 'invalid claim: missing sub claim' });
      }
      return json(res, 200, USUARIO);
    }

    // 3. guardar el giro
    if (url.pathname === '/auth/v1/user' && req.method === 'PUT') {
      const datos = JSON.parse(cuerpo || '{}');
      USUARIO.user_metadata = Object.assign({}, USUARIO.user_metadata, datos.data || {});
      console.log('[falso] giro guardado -> ' + JSON.stringify(USUARIO.user_metadata));
      return json(res, 200, USUARIO);
    }

    // 4. renovar
    if (url.pathname === '/auth/v1/token' && req.method === 'POST') {
      const datos = JSON.parse(cuerpo || '{}');
      if (datos.refresh_token !== 'REFRESCO') { return json(res, 401, { msg: 'Invalid Refresh Token' }); }
      return json(res, 200, {
        access_token: 'TOKEN_NUEVO', refresh_token: 'REFRESCO', expires_in: 3600
      });
    }

    if (url.pathname === '/auth/v1/logout') { return json(res, 204, {}); }
    if (url.pathname === '/__ultimo') { return json(res, 200, { enlace: ultimoEnlace }); }

    return json(res, 404, { msg: 'no existe: ' + url.pathname });
  });
}).listen(54321, () => console.log('[falso] Supabase de mentiras en http://localhost:54321'));
