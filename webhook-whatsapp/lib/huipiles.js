/* ============================================================================
   OaxIntegra IA — Buscar huipiles oaxaqueños DE VERDAD
   ----------------------------------------------------------------------------
   Busca fotos de huipiles en la web, COMPRUEBA que sean realmente de Oaxaca,
   las recorta al formato de la app y las deja listas para mandar o mostrar.

   POR QUÉ ES TAN DESCONFIADO ESTE MÓDULO
   --------------------------------------
   Una foto mal etiquetada —un huipil de Chiapas o de Guatemala presentado como
   oaxaqueño— en una página que habla de autenticidad cultural es peor que no
   poner ninguna foto. Y los diseños no son adorno: identifican al pueblo que
   los teje. Un huipil de Yalálag no es uno de Pinotepa.

   Por eso NADA se acepta por su nombre. De cada foto se comprueba:
     1. Que su descripción mencione Oaxaca o un pueblo/lengua de Oaxaca
     2. Que su licencia permita usarla
     3. Que se sepa quién la tomó, para darle crédito

   Lo que no pasa los tres filtros, se rechaza y se dice por qué.

   DE DÓNDE BUSCA
   --------------
     · Wikimedia Commons — por defecto, no necesita llaves y trae la licencia
       y el autor en los datos. Es la fuente recomendada.
     · Google Custom Search — opcional. Necesita GOOGLE_API_KEY y GOOGLE_CX.
       Google NO entrega licencia ni autor fiables, así que las fotos que
       vengan de ahí se marcan como "revisar a mano" y NO se dan por buenas
       solas. Nunca se hace scraping del buscador: va contra sus términos y
       se rompe cada dos semanas.
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');

const CARPETA = path.join(__dirname, '..', 'huipiles');
fs.mkdirSync(CARPETA, { recursive: true });

const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const AGENTE = 'OaxIntegraIA/1.0 (proyecto educativo Oaxaca)';

/* Señas que confirman que la pieza es oaxaqueña: el estado, sus pueblos
   textileros y sus lenguas originarias. */
const SEÑAS_OAXACA = [
  'oaxaca', 'oaxaqu',
  'yalalag', 'yalálag', 'huazolotitlan', 'huazolotitlán',
  'juchitan', 'juchitán', 'tehuantepec', 'istmo',
  'mitla', 'teotitlan', 'teotitlán', 'coyotepec',
  'jamiltepec', 'pinotepa', 'tuxtepec', 'ocotlan', 'ocotlán',
  'zapotec', 'mixtec', 'amuzgo', 'mixe', 'triqui', 'chinantec',
  'huave', 'chatino', 'mazatec', 'cuicatec', 'zoque', 'chontal'
];

/* Licencias que permiten usar la foto dando crédito. */
const LICENCIAS_OK = ['cc-by', 'cc by', 'cc-sa', 'cc0', 'cc-zero',
                      'public domain', 'publicdomain', 'pd-'];

const BUSQUEDAS = [
  'huipil Oaxaca',
  'huipil oaxaqueño',
  'huipil Yalalag',
  'huipil istmo Tehuantepec',
  'textil zapoteco Oaxaca',
  'huipil mixteco Oaxaca'
];


/* --- helpers ------------------------------------------------------------- */

function sinEtiquetas(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function señasEncontradas(texto) {
  const t = String(texto || '').toLowerCase();
  return SEÑAS_OAXACA.filter(s => t.indexOf(s) !== -1);
}

function licenciaLibre(texto) {
  const t = String(texto || '').toLowerCase();
  return LICENCIAS_OK.some(ok => t.indexOf(ok) !== -1);
}


/* ---------------------------------------------------------------------------
   BUSCAR EN WIKIMEDIA COMMONS
   Trae, por cada foto: descripción, autor, licencia y la URL real.
   ------------------------------------------------------------------------ */
async function buscarEnCommons(consulta, cuantas) {
  /* 1. buscar los títulos */
  const busca = await axios.get(COMMONS, {
    params: {
      action: 'query', format: 'json', origin: '*',
      list: 'search', srsearch: 'filetype:bitmap ' + consulta,
      srnamespace: 6, srlimit: cuantas || 10
    },
    headers: { 'User-Agent': AGENTE },
    timeout: 25000
  });

  const titulos = ((busca.data.query || {}).search || []).map(x => x.title);
  if (!titulos.length) { return []; }

  /* 2. pedir los datos de cada una, de golpe */
  const info = await axios.get(COMMONS, {
    params: {
      action: 'query', format: 'json', origin: '*',
      titles: titulos.join('|'),
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|size|mime',
      iiurlwidth: 1400
    },
    headers: { 'User-Agent': AGENTE },
    timeout: 25000
  });

  const paginas = (info.data.query || {}).pages || {};
  const salida = [];

  Object.keys(paginas).forEach(k => {
    const pag = paginas[k];
    const ii = (pag.imageinfo || [])[0];
    if (!ii) { return; }
    const meta = ii.extmetadata || {};
    const dime = c => sinEtiquetas((meta[c] || {}).value);

    salida.push({
      fuente: 'Wikimedia Commons',
      titulo: pag.title,
      descripcion: dime('ImageDescription'),
      autor: dime('Artist') || '',
      licencia: dime('LicenseShortName') || dime('License') || '',
      licenciaUrl: (meta.LicenseUrl || {}).value || '',
      credito: dime('Credit'),
      pagina: ii.descriptionurl || '',
      url: ii.thumburl || ii.url,
      mime: ii.mime || 'image/jpeg'
    });
  });

  return salida;
}


/* ---------------------------------------------------------------------------
   BUSCAR CON GOOGLE (opcional)
   Google no entrega licencia ni autor de forma fiable, así que lo que salga
   de aquí queda marcado para revisar a mano. No se da por bueno solo.
   ------------------------------------------------------------------------ */
async function buscarEnGoogle(consulta, cuantas) {
  const llave = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  if (!llave || !cx) { return []; }

  const r = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      key: llave, cx: cx, q: consulta,
      searchType: 'image', num: Math.min(cuantas || 6, 10),
      /* solo lo que se puede reutilizar */
      rights: 'cc_publicdomain|cc_attribute|cc_sharealike',
      imgSize: 'large', safe: 'active'
    },
    timeout: 25000
  });

  return (r.data.items || []).map(x => ({
    fuente: 'Google',
    titulo: x.title || '',
    descripcion: (x.snippet || '') + ' ' + ((x.image || {}).contextLink || ''),
    autor: '',
    licencia: '',
    licenciaUrl: '',
    credito: (x.image || {}).contextLink || '',
    pagina: (x.image || {}).contextLink || '',
    url: x.link,
    mime: x.mime || 'image/jpeg',
    revisarAMano: true
  }));
}


/* ---------------------------------------------------------------------------
   EL FILTRO
   Devuelve { ok, motivo, señas }
   ------------------------------------------------------------------------ */
function revisar(c) {
  const texto = [c.titulo, c.descripcion, c.credito].join(' ');
  const señas = señasEncontradas(texto);

  if (!señas.length) {
    return { ok: false, motivo: 'la descripción no confirma que sea de Oaxaca' };
  }
  if (c.fuente === 'Wikimedia Commons') {
    if (!licenciaLibre(c.licencia + ' ' + c.licenciaUrl)) {
      return { ok: false, motivo: 'licencia no permitida (' + (c.licencia || '¿?') + ')' };
    }
    if (!c.autor) {
      return { ok: false, motivo: 'no dice quién la tomó, y hay que dar crédito' };
    }
  }
  return { ok: true, señas: señas };
}


/* ---------------------------------------------------------------------------
   PROCESAR: recortar y dejarla al formato de la app
   La app las usa a 1200×788 (la misma proporción de las tarjetas).
   ------------------------------------------------------------------------ */
async function procesar(bytes, destino, opciones) {
  const o = opciones || {};
  const an = o.ancho || 1200;
  const al = o.alto || 788;

  await sharp(bytes)
    .rotate()                                  /* respeta la orientación de la cámara */
    .resize(an, al, { fit: 'cover', position: 'attention' })  /* recorta a lo importante */
    .webp({ quality: 82 })
    .toFile(destino);

  return fs.statSync(destino).size;
}


/* ---------------------------------------------------------------------------
   LO QUE SE USA DESDE FUERA
   ------------------------------------------------------------------------ */
async function buscarHuipiles(opciones) {
  const o = opciones || {};
  const cuantas = o.cuantas || 3;
  const consultas = o.consultas || BUSQUEDAS;
  const hablar = o.silencio ? function () {} : console.log;

  hablar('');
  hablar('  Buscando huipiles oaxaqueños verificados');
  hablar('  ───────────────────────────────────────');

  /* 1. juntar candidatas de todas las búsquedas */
  const candidatas = [];
  const vistas = {};
  for (const q of consultas) {
    if (candidatas.length >= cuantas * 6) { break; }
    let lote = [];
    try {
      lote = await buscarEnCommons(q, 8);
    } catch (e) {
      hablar('  · no pude buscar "' + q + '": ' + e.message);
    }
    if (!lote.length) {
      try { lote = await buscarEnGoogle(q, 6); } catch (e) { /* opcional */ }
    }
    lote.forEach(c => {
      if (c.url && !vistas[c.url]) { vistas[c.url] = 1; candidatas.push(c); }
    });
  }

  if (!candidatas.length) {
    hablar('');
    hablar('  ✗ No pude conectarme a ninguna fuente de imágenes.');
    hablar('    Revisa tu internet, o si estás detrás de un proxy que las bloquee.');
    return { aceptadas: [], rechazadas: [] };
  }

  hablar('  ' + candidatas.length + ' candidatas encontradas. Revisando una por una…');
  hablar('');

  /* 2. filtrar, descargar y procesar */
  const aceptadas = [];
  const rechazadas = [];

  for (const c of candidatas) {
    if (aceptadas.length >= cuantas) { break; }
    const nombreCorto = c.titulo.replace(/^File:/, '').slice(0, 58);

    const v = revisar(c);
    if (!v.ok) {
      hablar('  ✗ ' + nombreCorto);
      hablar('      RECHAZADA: ' + v.motivo);
      rechazadas.push({ titulo: c.titulo, motivo: v.motivo });
      continue;
    }

    let bytes;
    try {
      const r = await axios.get(c.url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': AGENTE },
        timeout: 45000,
        maxContentLength: 30 * 1024 * 1024
      });
      bytes = Buffer.from(r.data);
    } catch (e) {
      hablar('  ✗ ' + nombreCorto);
      hablar('      no la pude descargar: ' + e.message);
      rechazadas.push({ titulo: c.titulo, motivo: 'no se pudo descargar' });
      continue;
    }

    const n = aceptadas.length + 1;
    const destino = path.join(CARPETA, 'huipil_' + String(n).padStart(2, '0') + '.webp');
    let peso;
    try {
      peso = await procesar(bytes, destino, o);
    } catch (e) {
      hablar('  ✗ ' + nombreCorto);
      hablar('      no la pude procesar: ' + e.message);
      rechazadas.push({ titulo: c.titulo, motivo: 'no se pudo procesar' });
      continue;
    }

    c.archivo = path.basename(destino);
    c.ruta = destino;
    c.señas = v.señas;
    c.peso = peso;
    aceptadas.push(c);

    hablar('  ✓ ' + nombreCorto);
    hablar('      confirma Oaxaca por: ' + v.señas.slice(0, 3).join(', '));
    hablar('      autor: ' + (c.autor || '(de Google, revisar a mano)').slice(0, 55));
    hablar('      licencia: ' + (c.licencia || 'revisar a mano'));
    hablar('      guardada: ' + c.archivo + ' (' + Math.round(peso / 1024) + ' KB)');
    if (c.revisarAMano) {
      hablar('      ⚠ vino de Google: confirma la licencia antes de publicarla');
    }
  }

  /* 3. créditos — las licencias los exigen */
  if (aceptadas.length) {
    const lineas = ['# Créditos de las fotos de huipiles', '',
      'Las licencias **exigen dar crédito**. No borres este archivo.', ''];
    aceptadas.forEach(c => {
      lineas.push('## ' + c.archivo, '',
        '- **Título:** ' + c.titulo,
        '- **Fuente:** ' + c.fuente,
        '- **Autor:** ' + (c.autor || 'sin indicar — REVISAR ANTES DE PUBLICAR'),
        '- **Licencia:** ' + (c.licencia || 'sin indicar — REVISAR ANTES DE PUBLICAR'),
        '- **Página original:** ' + c.pagina,
        '- **Confirma Oaxaca por:** ' + (c.señas || []).join(', '),
        '');
      if (c.descripcion) { lineas.push('- **Descripción:** ' + c.descripcion.slice(0, 300), ''); }
    });
    fs.writeFileSync(path.join(CARPETA, 'CREDITOS.md'), lineas.join('\n'), 'utf8');
  }

  hablar('');
  hablar('  Aceptadas: ' + aceptadas.length + '   ·   Rechazadas: ' + rechazadas.length);
  if (aceptadas.length) {
    hablar('  Guardadas en: webhook-whatsapp/huipiles/');
    hablar('  Créditos en:  webhook-whatsapp/huipiles/CREDITOS.md');
  }
  hablar('');

  return { aceptadas: aceptadas, rechazadas: rechazadas };
}


/* Las que ya se bajaron antes, para poder mandarlas sin volver a buscar. */
function huipilesGuardados() {
  try {
    return fs.readdirSync(CARPETA)
      .filter(f => /^huipil_\d+\.webp$/.test(f))
      .map(f => ({ archivo: f, ruta: path.join(CARPETA, f) }));
  } catch (e) { return []; }
}


module.exports = {
  buscarHuipiles, huipilesGuardados, procesar,
  buscarEnCommons, buscarEnGoogle, revisar,
  CARPETA
};

/* Se puede correr solo:  node lib/huipiles.js  */
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  buscarHuipiles({ cuantas: Number(process.argv[2]) || 3 })
    .then(r => process.exit(r.aceptadas.length ? 0 : 1))
    .catch(e => { console.error('  ✗ ' + e.message); process.exit(1); });
}
