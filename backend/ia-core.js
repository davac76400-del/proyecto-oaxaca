/* ============================================================================
   OaxIntegra IA — Núcleo de la inteligencia artificial (LADO SERVIDOR)
   ----------------------------------------------------------------------------
   Aquí vive TODA la lógica de la IA y, sobre todo, aquí —y solo aquí— se leen
   las llaves de acceso. Este archivo nunca llega al navegador.

   Lo usan los tres envoltorios:
     · backend/servidor.js        → para trabajar en tu computadora
     · netlify/functions/ia.js    → si publicas en Netlify
     · api/ia.js                  → si publicas en Vercel

   Las llaves salen de las variables de entorno:
     OPENROUTER_API_KEY   → Llama 3.2 (el ayudante principal)
     GEMINI_API_KEY       → Gemini Flash (el respaldo)

   Requiere Node 18 o más nuevo (usa el fetch que ya trae Node).
   ========================================================================= */

'use strict';

/* Se puede afinar sin tocar el código, por si algún día cambia un modelo. */
const CONFIG = {
  LLAMA_URL:    process.env.OPENROUTER_URL   || 'https://openrouter.ai/api/v1/chat/completions',
  LLAMA_MODELO: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free',
  /* Para fotos hace falta un modelo que sepa VER. El de texto no puede.
     Este también es gratuito (termina en :free). */
  LLAMA_MODELO_FOTO: process.env.OPENROUTER_MODEL_VISION || 'meta-llama/llama-3.2-11b-vision-instruct:free',
  GEMINI_MODELO: process.env.GEMINI_MODEL    || 'gemini-2.0-flash',
  GEMINI_BASE:  process.env.GEMINI_URL_BASE  || 'https://generativelanguage.googleapis.com/v1beta/models/',
  LIMITE_MS:    Number(process.env.IA_TIMEOUT_MS || 20000),
  MAX_TOKENS:   900,
  TEMPERATURA:  0.7
};

const hayLlama  = () => !!process.env.OPENROUTER_API_KEY;
const hayGemini = () => !!process.env.GEMINI_API_KEY;
const hayIA     = () => hayLlama() || hayGemini();


/* ---------------------------------------------------------------------------
   EL ALMA DEL PROYECTO — la personalidad del asistente.
   Cuídalo: aquí vive el tono de OaxIntegra IA.
   ------------------------------------------------------------------------ */
function promptMaestro(datos) {
  const giro  = (datos && datos.businessType) || 'un negocio pequeño';
  const quien = (datos && datos.username)     || 'el emprendedor';

  return [
    'Eres el asistente de OaxIntegra IA, una plataforma hecha para emprendedores',
    'oaxaqueños tradicionales: gente del campo (milpa, hortaliza, ganado), artesanos,',
    'mezcaleros, cocineras, comerciantes y gente del turismo en Oaxaca, México.',
    '',
    'CON QUIÉN HABLAS:',
    '- Se llama ' + quien + ' y su negocio es de: ' + giro + '.',
    '- Puede tener poca práctica con la tecnología y algo de desconfianza hacia ella.',
    '- Valora profundamente su cultura y su oficio.',
    '',
    'CÓMO DEBES HABLAR:',
    '- Español mexicano cálido, cercano y respetuoso. Como un ayudante de confianza.',
    '- PROHIBIDO usar tecnicismos: nunca digas "prompt", "token", "IA generativa",',
    '  "endpoint", "algoritmo", "input". Di "escríbeme", "tu mensaje", "la máquina".',
    '- Frases cortas. Nada de párrafos densos.',
    '',
    'QUÉ DEBES ENTREGAR:',
    '- SIEMPRE material listo para usar, no consejos vagos.',
    '- Si pide una publicación: escríbela completa, lista para copiar y pegar.',
    '- Si pregunta por precios: da un rango concreto con su razonamiento en',
    '  lenguaje simple.',
    '- Si pide una descripción de producto: escríbela con el habla de la región.',
    '- Si manda una foto de una planta, cultivo o animal enfermo: describe lo que',
    '  ves y da lo más probable, pero dilo como posibilidad, no como receta médica',
    '  certera — y si se ve grave o no estás segura, dile claro que lo confirme con',
    '  alguien del campo o de agricultura cerca de él (no arriesgues su cosecha por',
    '  sonar seguro cuando no lo estás).',
    '- Usa ejemplos de SU giro (' + giro + '), no ejemplos genéricos.',
    '',
    'RESPETO CULTURAL:',
    '- La IA acompaña y ayuda, NUNCA reemplaza el trabajo artesanal.',
    '- Valora el oficio tradicional. Nunca sugieras industrializar ni abaratar',
    '  lo hecho a mano.',
    '',
    'LARGO: máximo 200 palabras, salvo que pidan explícitamente más.'
  ].join('\n');
}


/* --- saneado de lo que manda el navegador -------------------------------- */
const TOPE_MENSAJE = 4000;   // caracteres
const TOPE_TURNOS  = 6;      // vueltas de plática

function limpiarTexto(v, tope) {
  if (typeof v !== 'string') { return ''; }
  return v.slice(0, tope || TOPE_MENSAJE);
}

/* El historial llega del cliente, así que no se confía en él a ciegas:
   se recortan los textos, se limita el número de turnos y se descarta
   cualquier rol inventado. */
function limpiarHistorial(bruto) {
  if (!Array.isArray(bruto)) { return []; }
  return bruto
    .slice(-TOPE_TURNOS)
    .filter(t => t && (t.rol === 'user' || t.rol === 'assistant') && typeof t.texto === 'string')
    .map(t => ({ rol: t.rol, texto: limpiarTexto(t.texto) }));
}


/* La foto llega como "data:image/jpeg;base64,…". No se confía en ella:
   se comprueba el tipo y el tamaño antes de mandarla a ningún lado. */
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const TOPE_FOTO = 4 * 1024 * 1024;   /* 4 MB ya descodificada */

function limpiarFoto(bruto) {
  if (typeof bruto !== 'string' || !bruto) { return null; }
  const m = /^data:([a-z/+.-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(bruto.trim());
  if (!m) { return null; }
  const tipo = m[1].toLowerCase();
  if (TIPOS_FOTO.indexOf(tipo) === -1) { return null; }
  const datos = m[2];
  /* tamaño real aproximado a partir del base64 */
  if (datos.length * 0.75 > TOPE_FOTO) { return null; }
  return { tipo: tipo, datos: datos, uri: 'data:' + tipo + ';base64,' + datos };
}


/* Los avisos de error viajan al navegador para poder explicarle al usuario qué
   pasó. Antes de salir se tachan las llaves: si un proveedor devolviera la
   llave dentro de su mensaje (o si viniera en una URL), no debe escaparse. */
function tacharSecretos(txt) {
  if (typeof txt !== 'string') { return ''; }
  let s = txt;
  [process.env.OPENROUTER_API_KEY, process.env.GEMINI_API_KEY].forEach(llave => {
    if (llave && llave.length > 6) { s = s.split(llave).join('«llave oculta»'); }
  });
  return s
    .replace(/\b(sk-or-v1-|sk-ant-|sk-|gsk_|AIza)[A-Za-z0-9_\-]{8,}/g, '«llave oculta»')
    .replace(/([?&]key=)[^&\s"']+/gi, '$1«llave oculta»')
    .slice(0, 300);
}


/* --- una llamada con tiempo límite --------------------------------------- */
async function pedirConLimite(url, opciones) {
  const ctrl  = new AbortController();
  const corte = setTimeout(() => ctrl.abort(), CONFIG.LIMITE_MS);
  try {
    const r = await fetch(url, Object.assign({}, opciones, { signal: ctrl.signal }));
    if (!r.ok) {
      const cuerpo = await r.text().catch(() => '');
      throw new Error('HTTP ' + r.status + (cuerpo ? ' · ' + cuerpo.slice(0, 200) : ''));
    }
    return await r.json();
  } finally {
    clearTimeout(corte);
  }
}


/* --- 1. Llama 3.2, vía OpenRouter (formato OpenAI) ----------------------- */
async function pedirALlama(mensaje, sistema, historial, foto) {
  const messages = [{ role: 'system', content: sistema }];
  historial.forEach(t => messages.push({ role: t.rol, content: t.texto }));

  if (foto) {
    /* con foto, el mensaje va en partes: el texto y la imagen */
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: mensaje },
        { type: 'image_url', image_url: { url: foto.uri } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: mensaje });
  }

  const d = await pedirConLimite(CONFIG.LLAMA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
      /* OpenRouter pide identificar la app; es informativo. */
      'HTTP-Referer': process.env.PUBLIC_URL || 'https://oaxintegra.local',
      'X-Title': 'OaxIntegra IA'
    },
    body: JSON.stringify({
      model: foto ? CONFIG.LLAMA_MODELO_FOTO : CONFIG.LLAMA_MODELO,
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURA,
      messages
    })
  });

  return (d && d.choices && d.choices[0] && d.choices[0].message &&
          d.choices[0].message.content) || '';
}


/* --- 2. Gemini Flash (formato propio de Google) -------------------------- */
async function pedirAGemini(mensaje, sistema, historial, foto) {
  /* Gemini no acepta que la plática empiece hablando el modelo. */
  const previos = historial.slice();
  while (previos.length && previos[0].rol !== 'user') { previos.shift(); }

  const contents = previos.map(t => ({
    role: t.rol === 'user' ? 'user' : 'model',
    parts: [{ text: t.texto }]
  }));
  const trozos = [{ text: mensaje }];
  if (foto) {
    /* Gemini ya sabe ver: la foto va como otra parte del mismo mensaje */
    trozos.push({ inline_data: { mime_type: foto.tipo, data: foto.datos } });
  }
  contents.push({ role: 'user', parts: trozos });

  const url = CONFIG.GEMINI_BASE +
              encodeURIComponent(CONFIG.GEMINI_MODELO) + ':generateContent?key=' +
              encodeURIComponent(process.env.GEMINI_API_KEY);

  const d = await pedirConLimite(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: sistema }] },
      contents,
      generationConfig: { maxOutputTokens: CONFIG.MAX_TOKENS, temperature: CONFIG.TEMPERATURA }
    })
  });

  const c = d && d.candidates && d.candidates[0];
  const partes = (c && c.content && c.content.parts) || [];
  return partes.length ? (partes[0].text || '') : '';
}


/* ---------------------------------------------------------------------------
   LA CADENA COMPLETA. Devuelve siempre un objeto, nunca lanza al llamador:
     { output: 'texto…', origen: 'llama' | 'gemini' | '', fallos: {…} }
   Si output viene vacío, el navegador usa su motor local.
   ------------------------------------------------------------------------ */
async function responder(peticion) {
  const mensaje   = limpiarTexto(peticion && peticion.message);
  const historial = limpiarHistorial(peticion && peticion.historial);
  const foto      = limpiarFoto(peticion && peticion.imagen);
  const sistema   = (peticion && typeof peticion.system === 'string' && peticion.system.trim())
    ? limpiarTexto(peticion.system, 8000)
    : promptMaestro(peticion);

  /* Con foto se acepta que no venga texto: la persona manda la imagen y ya. */
  if (!mensaje && !foto) {
    return { output: '', origen: '', fallos: { general: 'No llegó ningún mensaje' } };
  }
  if (peticion && peticion.imagen && !foto) {
    return { output: '', origen: '',
             fallos: { general: 'Esa foto no la pude leer. Manda una imagen JPG, PNG o WebP de menos de 4 MB.' } };
  }
  const consulta = mensaje || 'Mira esta foto de mi negocio y dime cómo la puedo aprovechar para vender.';
  if (!hayIA()) {
    return { output: '', origen: '', fallos: { general: 'El servidor no tiene llaves configuradas' } };
  }

  const fallos = {};

  if (hayLlama()) {
    try {
      const t = await pedirALlama(consulta, sistema, historial, foto);
      if (t && t.trim()) { return { output: t, origen: 'llama', fallos }; }
      fallos.llama = 'contestó vacío';
    } catch (e) {
      fallos.llama = e.name === 'AbortError'
        ? 'tardó más de ' + (CONFIG.LIMITE_MS / 1000) + ' segundos'
        : tacharSecretos(e.message);
    }
  } else {
    fallos.llama = 'sin llave configurada';
  }

  if (hayGemini()) {
    try {
      const t = await pedirAGemini(consulta, sistema, historial, foto);
      if (t && t.trim()) { return { output: t, origen: 'gemini', fallos }; }
      fallos.gemini = 'contestó vacío';
    } catch (e) {
      fallos.gemini = e.name === 'AbortError'
        ? 'tardó más de ' + (CONFIG.LIMITE_MS / 1000) + ' segundos'
        : tacharSecretos(e.message);
    }
  } else {
    fallos.gemini = 'sin llave configurada';
  }

  return { output: '', origen: '', fallos };
}


/* Para que el navegador pueda mostrar el estado sin exponer nada sensible.
   Devuelve si hay llaves, JAMÁS las llaves. */
function estado() {
  return {
    listo: hayIA(),
    llama: hayLlama(),
    gemini: hayGemini(),
    /* si hay cualquiera de los dos, se pueden mandar fotos */
    fotos: hayIA(),
    modelos: { llama: CONFIG.LLAMA_MODELO, gemini: CONFIG.GEMINI_MODELO,
               llamaFoto: CONFIG.LLAMA_MODELO_FOTO }
  };
}

module.exports = { responder, estado, promptMaestro, CONFIG };
