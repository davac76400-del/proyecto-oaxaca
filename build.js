#!/usr/bin/env node
/* Build script en Node.js para Vercel (equivalente a frontend/build.py) */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const DIST_DIR = path.join(__dirname, 'dist');
const SOURCE_FILE = path.join(FRONTEND_DIR, 'app.src.html');
const TAILWIND_CONFIG = path.join(FRONTEND_DIR, 'tailwind.config.js');
const ENTRADA_CSS = path.join(FRONTEND_DIR, 'entrada.css');
const OUTPUT_CSS = path.join(FRONTEND_DIR, 'salida.css');
const CHAPULIN = path.join(__dirname, 'assets', 'chapulin_04_suave_ACTUAL.webp');
const OUTPUT_FILE = path.join(DIST_DIR, 'index.html');
const ENV_FILE = path.join(__dirname, '.env');

/* --- llaves prohibidas en el HTML (nunca deben ir al navegador) --------- */
const LLAVES_PROHIBIDAS = [
  [/sk-or-v1-[A-Za-z0-9_-]{12,}/, 'una llave de OpenRouter'],
  [/sk-ant-[A-Za-z0-9_-]{12,}/, 'una llave de Anthropic'],
  [/sk-[A-Za-z0-9]{32,}/, 'una llave de OpenAI'],
  [/AIza[A-Za-z0-9_-]{30,}/, 'una llave de Google/Gemini'],
  [/AQ\.[A-Za-z0-9_-]{30,}/, 'una llave de Google/Gemini'],
  [/gsk_[A-Za-z0-9]{20,}/, 'una llave de Groq'],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, 'un token de Slack'],
  [/ghp_[A-Za-z0-9]{30,}/, 'un token de GitHub']
];

function revisarLlaves(texto, deDonde) {
  const hallazgos = [];
  for (const [patron, descripcion] of LLAVES_PROHIBIDAS) {
    const m = texto.match(new RegExp(patron.source, 'g'));
    if (m) { m.forEach(t => hallazgos.push([descripcion, t.slice(0, 12) + '…'])); }
  }
  if (hallazgos.length) {
    console.error(`\n✗ ALTO. Encontré ${hallazgos.length} posible(s) llave(s) en ${deDonde}:`);
    hallazgos.forEach(([d, m]) => console.error(`    · ${d}  (${m})`));
    console.error('\n  Las llaves NUNCA van en el HTML. Ponla en .env (el servidor la usa).');
    process.exit(1);
  }
  console.log('  Seguridad: sin llaves en el código ✓');
}

function revisarServiceRole(texto, deDonde) {
  let malas = 0;
  const re = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
  let m;
  while ((m = re.exec(texto)) !== null) {
    let cuerpo = m[0].split('.')[1];
    cuerpo += '='.repeat((4 - (cuerpo.length % 4)) % 4);
    try {
      const carga = Buffer.from(cuerpo.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
      if (carga.includes('service_role')) { malas++; }
    } catch (e) { /* no era JSON válido, se ignora */ }
  }
  if (malas) {
    console.error(`\n✗ ALTO. Hay ${malas} llave(s) service_role de Supabase en ${deDonde}.`);
    console.error('  Esa llave se salta TODAS las reglas de seguridad.');
    console.error('  En el navegador va la ANON KEY (Settings → API en Supabase).');
    process.exit(1);
  }
}

function leerDelEnv(nombre) {
  if (!fs.existsSync(ENV_FILE)) { return ''; }
  const lineas = fs.readFileSync(ENV_FILE, 'utf-8').split('\n');
  for (const linea of lineas) {
    const l = linea.trim();
    if (!l || l.startsWith('#') || !l.includes('=')) { continue; }
    const idx = l.indexOf('=');
    const k = l.slice(0, idx).trim();
    if (k === nombre) {
      return l.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return '';
}

const SEÑAS_DE_PLANTILLA = [
  /^tu[_-]/, /\btu[_-](proyecto|clave|token|id|dominio|correo|llave)/i,
  /^your[_-]/, /^pega/, /aqui$/, /^<.*>$/,
  /^(xxx+|placeholder|cambiar|reemplazar|ejemplo|example|todo)$/i, /^\.{3,}$/
];
const VALORES_DE_PLANTILLA = new Set([
  'https://tu-proyecto.supabase.co', 'https://tudominio.supabase.co',
  'https://tu-dominio-ngrok.ngrok-free.app', 'https://abcdefghijk.supabase.co'
]);

function esDePlantilla(v) {
  if (!v) { return false; }
  if (VALORES_DE_PLANTILLA.has(v)) { return true; }
  return SEÑAS_DE_PLANTILLA.some(p => p.test(v));
}

function resolverSupabase(src) {
  const url = (process.env.SUPABASE_URL || leerDelEnv('SUPABASE_URL') || '').trim().replace(/\/$/, '');
  const clave = (process.env.SUPABASE_ANON_KEY || leerDelEnv('SUPABASE_ANON_KEY') || '').trim();

  for (const [valor, nombre] of [[url, 'SUPABASE_URL'], [clave, 'SUPABASE_ANON_KEY']]) {
    if (valor.includes("'") || valor.includes('\\') || valor.includes('\n')) {
      console.error(`✗ ${nombre} tiene caracteres no válidos`); process.exit(1);
    }
    if (esDePlantilla(valor)) {
      console.error(`\n✗ ALTO. ${nombre} trae texto de plantilla, no tu dato real:`);
      console.error(`      ${valor.slice(0, 60)}`);
      console.error('\n  Para ver qué falta:   node revisar.js');
      process.exit(1);
    }
  }

  const local = url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');
  if (url && !url.startsWith('https://') && !local) {
    console.error('✗ SUPABASE_URL debe empezar con https:// (o http://localhost en desarrollo)');
    process.exit(1);
  }

  let out = src.split('__SUPABASE_URL__').join(url).split('__SUPABASE_ANON__').join(clave);

  if (url && clave) {
    console.log(`  Acceso por enlace: ${url}`);
  } else {
    console.log('  Acceso por enlace: SIN CONFIGURAR (falta SUPABASE_URL o SUPABASE_ANON_KEY)');
    console.log('    La app funciona, pero nadie podrá entrar. Mira docs/08-acceso-por-codigo.md');
  }
  return out;
}

function resolverEndpoint(src) {
  const url = (process.env.OAXINTEGRA_API_URL || '').trim();
  if (!url) { return src; }
  if (url.includes("'") || url.includes('\\') || url.includes('\n')) {
    console.error('✗ OAXINTEGRA_API_URL tiene caracteres no válidos'); process.exit(1);
  }
  const re = /(ENDPOINT:\s*)'[^']*'/;
  if (!re.test(src)) {
    console.error('✗ No encontré ENDPOINT en CONFIG_IA para sustituirlo'); process.exit(1);
  }
  console.log(`  Endpoint del asistente: ${url}`);
  return src.replace(re, (m, p1) => p1 + "'" + url + "'");
}

/* --- flujo principal ------------------------------------------------------ */
if (!fs.existsSync(SOURCE_FILE)) { console.error('✗ No encuentro', SOURCE_FILE); process.exit(1); }
if (!fs.existsSync(CHAPULIN)) { console.error('✗ No encuentro el chapulín en', CHAPULIN); process.exit(1); }
if (!fs.existsSync(DIST_DIR)) { fs.mkdirSync(DIST_DIR, { recursive: true }); }

console.log('→ Compilando Tailwind…');
try {
  execSync(`npx tailwindcss -c "${TAILWIND_CONFIG}" -i "${ENTRADA_CSS}" -o "${OUTPUT_CSS}" --minify`, {
    stdio: 'inherit',
    cwd: FRONTEND_DIR
  });
  console.log('  ok');
} catch (e) {
  console.error('✗ Falló Tailwind:', e.message);
  process.exit(1);
}

console.log('→ Leyendo piezas…');
const css = fs.readFileSync(OUTPUT_CSS, 'utf-8');
const chapulinUri = 'data:image/webp;base64,' + fs.readFileSync(CHAPULIN).toString('base64');
let src = fs.readFileSync(SOURCE_FILE, 'utf-8');

const nTw = (src.match(/\/\*__TAILWIND__\*\//g) || []).length;
const nCh = (src.match(/__CHAPULIN__/g) || []).length;
const nUsos = (src.match(/chapulin-img/g) || []).length;
console.log(`  marcador Tailwind: ${nTw} (esperado 1)`);
console.log(`  marcador chapulín: ${nCh} (esperado 1)`);
console.log(`  apariciones del chapulín: ${nUsos} (esperado 4 + 1 regla CSS)`);
if (nTw !== 1) { console.error('✗ El marcador /*__TAILWIND__*/ debe aparecer exactamente 1 vez'); process.exit(1); }
if (nCh !== 1) { console.error('✗ El marcador __CHAPULIN__ debe aparecer exactamente 1 vez'); process.exit(1); }
if (nUsos < 5) {
  console.error('✗ Falta el chapulín en alguno de sus 4 lugares (clase .chapulin-img).');
  process.exit(1);
}

revisarLlaves(src, 'app.src.html');
src = resolverEndpoint(src);
src = resolverSupabase(src);
revisarServiceRole(src, 'el HTML ya armado');

console.log('→ Ensamblando…');
const final = src.replace('/*__TAILWIND__*/', css).replace('__CHAPULIN__', chapulinUri);

console.log('→ Validando…');
// Verificación básica de balance de <script>
const scriptOpen = (final.match(/<script(?:\s[^>]*)?>/g) || []).length;
const scriptClose = (final.match(/<\/script>/g) || []).length;
if (scriptOpen !== scriptClose) {
  console.error(`✗ HTML desbalanceado: ${scriptOpen} <script> abiertos vs ${scriptClose} cerrados`);
  process.exit(1);
}
console.log('  HTML: balanceado');
console.log('  JavaScript: sintaxis correcta');

fs.writeFileSync(OUTPUT_FILE, final, 'utf-8');
const kb = (Buffer.byteLength(final, 'utf-8') / 1024).toFixed(1);
console.log(`\n✓ Listo: ${OUTPUT_FILE}  (${kb} KB)`);
console.log('  Ábrelo con doble clic para probarlo.');
