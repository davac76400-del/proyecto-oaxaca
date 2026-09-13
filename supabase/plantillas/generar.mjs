/* ===========================================================================
   Genera las plantillas de correo de Supabase a partir del MISMO HTML que usa
   la función enviar-correo, cambiando el código por el hueco de Supabase
   ({{ .Token }}) y el enlace por {{ .ConfirmationURL }}.

   Existe para no tener el diseño del correo escrito dos veces. Con SMTP propio
   configurado, el correo lo manda Supabase con estas plantillas y la función
   deja de hacer falta; mientras las dos cosas convivan, esto las mantiene
   iguales. El porqué de todo: docs/12-correo-con-smtp.md

     node supabase/plantillas/generar.mjs
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';

const AQUI = path.dirname(new URL(import.meta.url).pathname);
const FUNCION = path.join(AQUI, '..', 'functions', 'enviar-correo', 'index.ts');

/* La función es de Deno y esto es Node: se le quitan las anotaciones de tipo
   y se le da un Deno de mentiras, igual que hace pruebas/correo-del-codigo.mjs */
const sinTipos = (s) => s
  .replace(/^\s*type\s+\w+\s*=\s*\{[\s\S]*?\n\};?\s*$/gm, '')
  .replace(/:\s*Promise<[^>]+>/g, '')
  .replace(/:\s*ReturnType<typeof \w+>/g, '')
  .replace(/\bfunction (\w+)\(([^)]*)\):\s*\w+/g, 'function $1($2)')
  .replace(/(\w+):\s*(string|Headers|Uint8Array|Request|DatosCorreo)\b/g, '$1')
  .replace(/\bas\s+\w+(\[\])?/g, '')
  .replace(/!\./g, '.');

globalThis.Deno = { env: { get: () => '' }, serve: () => {} };

const src = sinTipos(fs.readFileSync(FUNCION, 'utf-8'));
await import('data:text/javascript;base64,' + Buffer.from(
  `${src}\nglobalThis.__partes = { armarHtml, armarTexto, textosSegun };\n`
).toString('base64'));

const { armarHtml, armarTexto, textosSegun } = globalThis.__partes;

/* Cada plantilla de Supabase con el tipo de correo que le toca. Los nombres
   de archivo son los del panel, para no dudar cuál va en cuál. */
const PLANTILLAS = [
  ['confirmar-registro', 'signup'],
  ['recuperar-contrasena', 'recovery'],
  ['enlace-magico', 'magiclink'],
  ['cambiar-correo', 'email_change'],
  ['invitacion', 'invite'],
  ['reautenticacion', 'reauthentication']
];

for (const [archivo, tipo] of PLANTILLAS) {
  const t = textosSegun(tipo);
  const html = armarHtml('{{ .Token }}', '{{ .ConfirmationURL }}', t);
  fs.writeFileSync(path.join(AQUI, `${archivo}.html`), html);
  fs.writeFileSync(path.join(AQUI, `${archivo}.asunto.txt`), t.asunto + '\n');
  console.log(`  ${archivo}.html  ·  asunto: ${t.asunto}`);
}

console.log(`\n✓ ${PLANTILLAS.length} plantillas en supabase/plantillas/`);
console.log('  Cópialas en Authentication → Emails (necesita SMTP propio).');
