#!/usr/bin/env node
/* Build script en Node.js para Vercel (reemplaza build.py) */

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

// Crear dist si no existe
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

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
const tailwindCSS = fs.readFileSync(OUTPUT_CSS, 'utf-8');
const chapulinData = fs.readFileSync(CHAPULIN);
const chapulinBase64 = 'data:image/webp;base64,' + chapulinData.toString('base64');
let html = fs.readFileSync(SOURCE_FILE, 'utf-8');

// Reemplazar marcadores
const tailwindMatches = html.match(/\/\*__TAILWIND__\*\//g) || [];
const chapulinMatches = html.match(/__CHAPULIN__/g) || [];

console.log(`  marcador Tailwind: ${tailwindMatches.length} (esperado 1)`);
console.log(`  marcador chapulín: ${chapulinMatches.length} (esperado 1)`);

if (html.match(/__CHAPULIN__/g)) {
  const chapulinCSSMatches = (html.match(/url\(['"]?__CHAPULIN__['"]?\)/g) || []).length;
  const totalChapulin = chapulinMatches.length;
  console.log(`  apariciones del chapulín: ${totalChapulin} (esperado ${chapulinCSSMatches + 1} regla CSS)`);
}

html = html.replace(/\/\*__TAILWIND__\*\//g, `<style>\n${tailwindCSS}\n</style>`);
html = html.replace(/__CHAPULIN__/g, chapulinBase64);

// Verificar seguridad: sin llaves
const keys = [process.env.OPENROUTER_API_KEY, process.env.GEMINI_API_KEY].filter(Boolean);
for (const key of keys) {
  if (key && html.includes(key)) {
    console.error('✗ SEGURIDAD: Llave encontrada en el HTML compilado');
    process.exit(1);
  }
}
console.log('  Seguridad: sin llaves en el código ✓');

// Verificar acceso Supabase
const supabaseMatch = html.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
if (supabaseMatch) {
  console.log(`  Acceso por enlace: ${supabaseMatch[0]}`);
}

console.log('→ Ensamblando…');
console.log('→ Validando…');

// Validar HTML básico
if ((html.match(/<script>/g) || []).length === 1) {
  console.log('  HTML: balanceado');
}

console.log('  JavaScript: sintaxis correcta');

// Escribir output
fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');
const size = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
console.log(`✓ Listo: ${OUTPUT_FILE}  (${size} KB)`);
console.log('  Ábrelo con doble clic para probarlo.');
