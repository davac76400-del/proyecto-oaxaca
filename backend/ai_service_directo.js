/* ============================================================================
   OaxIntegra IA — Servicio de IA DIRECTO (sin n8n)
   ----------------------------------------------------------------------------
   Reemplaza la llamada al webhook por una llamada directa al proveedor de IA.
   Elimina la capa de n8n, que es la que ha estado fallando (CORS / flujo
   inactivo).

   CÓMO USARLO EN app.src.html:
   1. Copia este archivo dentro del <script> de la app (o inclúyelo aparte)
   2. En CONFIG, pon tu clave y el proveedor
   3. Sustituye la llamada `enviarWebhook(CONFIG.WEBHOOK_ASISTENTE, {...})`
      por `pedirALaIA(consulta, sesion)`

   ⚠️ SEGURIDAD: poner la clave aquí la expone a cualquiera que vea el código
   fuente. Aceptable para prueba personal. Para producción usa el proxy
   serverless del final de este archivo.
   ========================================================================= */

var CONFIG_IA = {
  /* Elige uno: 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'gemini' */
  PROVEEDOR: 'openai',

  CLAVES: {
    openai:    'sk-TU_CLAVE_AQUI',
    anthropic: 'sk-ant-TU_CLAVE_AQUI',
    groq:      'gsk_TU_CLAVE_AQUI',
    deepseek:  'sk-TU_CLAVE_AQUI',
    gemini:    'TU_CLAVE_AQUI'
  },

  MODELOS: {
    openai:    'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku-20241022',
    groq:      'llama-3.3-70b-versatile',
    deepseek:  'deepseek-chat',
    gemini:    'gemini-2.0-flash'
  },

  LIMITE_MS: 20000,

  /* Si prefieres un proxy propio (recomendado en producción), pon aquí su URL
     y se usará en lugar de llamar al proveedor directamente. */
  PROXY: ''   /* ej: 'https://tu-sitio.netlify.app/.netlify/functions/ia' */
};


/* ---------------------------------------------------------------------------
   PROMPT MAESTRO — el alma de OaxIntegra IA
   Este texto define la personalidad. Cuídalo: aquí vive el tono del proyecto.
   ------------------------------------------------------------------------ */
function promptMaestro(sesion) {
  var giro = (sesion && sesion.giroTexto) ? sesion.giroTexto : 'un negocio pequeño';
  var quien = (sesion && sesion.usuario) ? sesion.usuario : 'el emprendedor';

  return [
    'Eres el asistente de OaxIntegra IA, una plataforma hecha para emprendedores',
    'oaxaqueños tradicionales: artesanos, mezcaleros, cocineras, comerciantes y',
    'gente del turismo en Oaxaca, México.',
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


/* ---------------------------------------------------------------------------
   LLAMADA PRINCIPAL — úsala desde la app
   Devuelve una Promesa con el texto, o null si falla (→ motor local)
   ------------------------------------------------------------------------ */
function pedirALaIA(consulta, sesion) {
  var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var corte = setTimeout(function () { if (ctrl) { ctrl.abort(); } }, CONFIG_IA.LIMITE_MS);

  var peticion = CONFIG_IA.PROXY
    ? armarProxy(consulta, sesion)
    : armarProveedor(consulta, sesion);

  var opc = {
    method: 'POST',
    headers: peticion.headers,
    body: JSON.stringify(peticion.body)
  };
  if (ctrl) { opc.signal = ctrl.signal; }

  return fetch(peticion.url, opc)
    .then(function (r) {
      clearTimeout(corte);
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      return r.json();
    })
    .then(function (d) { return extraerTextoIA(d); })
    .catch(function (err) {
      clearTimeout(corte);
      if (err && err.name === 'AbortError') {
        console.info('[OaxIntegra] La IA tardó demasiado; uso modo local.');
      } else {
        console.info('[OaxIntegra] Sin respuesta de la IA:', err.message);
      }
      return null;
    });
}


/* --- armado de la petición según el proveedor --------------------------- */
function armarProveedor(consulta, sesion) {
  var p = CONFIG_IA.PROVEEDOR;
  var clave = CONFIG_IA.CLAVES[p];
  var modelo = CONFIG_IA.MODELOS[p];
  var sistema = promptMaestro(sesion);

  /* OpenAI, Groq y DeepSeek comparten el formato de OpenAI */
  if (p === 'openai' || p === 'groq' || p === 'deepseek') {
    var urls = {
      openai:   'https://api.openai.com/v1/chat/completions',
      groq:     'https://api.groq.com/openai/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/chat/completions'
    };
    return {
      url: urls[p],
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + clave
      },
      body: {
        model: modelo,
        max_tokens: 900,
        messages: [
          { role: 'system', content: sistema },
          { role: 'user',   content: consulta }
        ]
      }
    };
  }

  if (p === 'anthropic') {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': clave,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: {
        model: modelo,
        max_tokens: 900,
        system: sistema,
        messages: [{ role: 'user', content: consulta }]
      }
    };
  }

  if (p === 'gemini') {
    return {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/'
           + modelo + ':generateContent?key=' + clave,
      headers: { 'Content-Type': 'application/json' },
      body: {
        system_instruction: { parts: [{ text: sistema }] },
        contents: [{ parts: [{ text: consulta }] }]
      }
    };
  }

  throw new Error('Proveedor no reconocido: ' + p);
}

/* --- si usas tu propio proxy serverless --------------------------------- */
function armarProxy(consulta, sesion) {
  return {
    url: CONFIG_IA.PROXY,
    headers: { 'Content-Type': 'application/json' },
    body: {
      message: consulta,
      username: sesion ? sesion.usuario : 'invitado',
      businessType: sesion ? sesion.giroTexto : '',
      system: promptMaestro(sesion)
    }
  };
}


/* --- extractor universal: sirve para cualquier proveedor ---------------- */
function extraerTextoIA(d) {
  if (!d) { return ''; }
  if (typeof d === 'string') { return d; }

  /* OpenAI / Groq / DeepSeek */
  if (d.choices && d.choices[0] && d.choices[0].message) {
    return d.choices[0].message.content || '';
  }
  /* Anthropic */
  if (d.content && d.content.length) {
    var t = '';
    for (var i = 0; i < d.content.length; i++) {
      if (d.content[i].type === 'text') { t += d.content[i].text; }
    }
    if (t) { return t; }
  }
  /* Gemini */
  if (d.candidates && d.candidates[0] && d.candidates[0].content) {
    var partes = d.candidates[0].content.parts || [];
    if (partes.length) { return partes[0].text || ''; }
  }
  /* proxy propio u otros formatos */
  var llaves = ['output','respuesta','reply','text','message','answer','content','result','data'];
  for (var j = 0; j < llaves.length; j++) {
    var v = d[llaves[j]];
    if (typeof v === 'string' && v.trim()) { return v; }
    if (v && typeof v === 'object') { var an = extraerTextoIA(v); if (an) { return an; } }
  }
  return '';
}


/* ============================================================================
   PROXY SERVERLESS RECOMENDADO PARA PRODUCCIÓN
   ----------------------------------------------------------------------------
   Guarda esto como netlify/functions/ia.js y despliega en Netlify.
   La clave queda en las variables de entorno del servidor, nunca en el navegador.

   exports.handler = async (event) => {
     const headers = {
       'Access-Control-Allow-Origin': '*',
       'Access-Control-Allow-Headers': 'Content-Type',
       'Access-Control-Allow-Methods': 'POST, OPTIONS'
     };
     if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

     const { message, system } = JSON.parse(event.body || '{}');

     const r = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
       },
       body: JSON.stringify({
         model: 'gpt-4o-mini',
         max_tokens: 900,
         messages: [
           { role: 'system', content: system },
           { role: 'user', content: message }
         ]
       })
     });
     const d = await r.json();
     return {
       statusCode: 200,
       headers: { ...headers, 'Content-Type': 'application/json' },
       body: JSON.stringify({ output: d.choices?.[0]?.message?.content || '' })
     };
   };
   ========================================================================= */
