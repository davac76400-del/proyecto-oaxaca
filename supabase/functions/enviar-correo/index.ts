/* ===========================================================================
   ENVIAR-CORREO  ·  el correo del código, de OaxIntegra y no de Supabase
   ---------------------------------------------------------------------------
   Supabase Auth manda los correos de acceso con sus propias plantillas, y en
   el plan gratis NO se pueden editar: el panel deja el botón «Source» en gris
   con el aviso «Set up custom SMTP to edit templates». Por eso llegaba un
   correo que decía «Supabase Auth · Confirm your email address» con un enlace,
   en vez del código.

   Este «Send Email Hook» se mete en medio: cuando a Auth le toca mandar un
   correo, en vez de mandarlo él nos manda los datos aquí, y el correo lo
   armamos y lo enviamos nosotros. Con eso el mensaje es enteramente nuestro:
   dice OaxIntegra, va en español, y el código va grande y a la vista.

   Lo que NO cambia, a propósito:
     · El código lo sigue generando Supabase (email_data.token). Son números
       nuevos y distintos para cada persona y cada intento — nunca el mismo
       para todos — y es Supabase quien los caduca y los invalida al usarse.
     · La app lo sigue comprobando con /auth/v1/verify, igual que antes. Este
       archivo no toca el registro: solo cambia CÓMO se ve el correo.
   Así que si esto se apaga, se vuelve al correo de fábrica y nadie se queda
   fuera (cómo apagarlo: docs/10-correo-del-codigo.md).
   =========================================================================== */

/* El token del correo es tan bueno como una contraseña: quien lo lee entra.
   Por eso en esta función NUNCA se registra el token, ni entero ni en trozos
   — los logs de Supabase los ve cualquiera con acceso al panel. */

const CLAVE_RESEND   = Deno.env.get('RESEND_API_KEY') ?? '';
const SECRETO_HOOK   = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '';
const CORREO_DESDE   = Deno.env.get('CORREO_DESDE') ?? 'OaxIntegra IA <onboarding@resend.dev>';
const URL_SUPABASE   = Deno.env.get('SUPABASE_URL') ?? '';

/* Margen de reloj para el sello de tiempo del webhook. Sin esto, alguien que
   grabara una petición nuestra podría repetirla mañana y volver a disparar el
   correo. Cinco minutos es lo que recomienda la especificación. */
const TOLERANCIA_SEGUNDOS = 5 * 60;

type DatosCorreo = {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
};

/* --- firma del webhook (Standard Webhooks, con WebCrypto) ------------------
   Se hace a mano en vez de importar la librería «standardwebhooks»: son doce
   líneas, y así el correo de toda la app no depende de que un paquete de
   terceros siga publicado y en pie.

   El secreto llega con la forma «v1,whsec_<base64>»; la llave es ese base64.
   Se firma el texto «id.sello.cuerpo» y el resultado tiene que coincidir con
   alguna de las firmas que vienen en la cabecera. */
function deBase64(s: string): Uint8Array {
  const bin = atob(s);
  const salida = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) { salida[i] = bin.charCodeAt(i); }
  return salida;
}

function aBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) { bin += String.fromCharCode(b); }
  return btoa(bin);
}

/* Comparar con === delata la firma correcta: al cortar en la primera letra
   distinta, tarda más cuanto más cerca estuvo quien prueba, y con suficientes
   intentos eso se mide. Aquí siempre se recorre todo. */
function igualesEnTiempoFijo(a: string, b: string): boolean {
  if (a.length !== b.length) { return false; }
  let dif = 0;
  for (let i = 0; i < a.length; i++) { dif |= a.charCodeAt(i) ^ b.charCodeAt(i); }
  return dif === 0;
}

async function verificarFirma(cuerpo: string, cabeceras: Headers): Promise<void> {
  if (!SECRETO_HOOK) { throw new Error('falta SEND_EMAIL_HOOK_SECRET'); }

  const id    = cabeceras.get('webhook-id') ?? '';
  const sello = cabeceras.get('webhook-timestamp') ?? '';
  const firma = cabeceras.get('webhook-signature') ?? '';
  if (!id || !sello || !firma) { throw new Error('faltan las cabeceras del webhook'); }

  const ahora = Math.floor(Date.now() / 1000);
  const cuando = Number(sello);
  if (!Number.isFinite(cuando) || Math.abs(ahora - cuando) > TOLERANCIA_SEGUNDOS) {
    throw new Error('el sello de tiempo está fuera de rango');
  }

  const llave = await crypto.subtle.importKey(
    'raw', deBase64(SECRETO_HOOK.replace(/^v1,whsec_/, '')),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign(
    'HMAC', llave, new TextEncoder().encode(`${id}.${sello}.${cuerpo}`)
  );
  const esperada = aBase64(new Uint8Array(mac));

  /* La cabecera puede traer varias firmas separadas por espacios (así se
     rueda un secreto sin cortar el servicio). Basta que una cuadre. */
  const cuadra = firma.split(' ').some((parte) => {
    const trozos = parte.split(',');
    return igualesEnTiempoFijo(trozos[trozos.length - 1] ?? '', esperada);
  });
  if (!cuadra) { throw new Error('la firma no coincide'); }
}

/* --- el correo -------------------------------------------------------------- */

function escapar(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Cada motivo por el que Auth manda un correo, dicho en español y de frente.
   Lo que no esté aquí igual se manda, con el texto neutro de «entrar». */
function textosSegun(tipo: string) {
  switch (tipo) {
    case 'signup':
      return { asunto: 'Tu código para crear tu cuenta',
               titulo: 'Ya casi estás dentro',
               entrada: 'Este es el código para terminar de crear tu cuenta en OaxIntegra IA:' };
    case 'recovery':
      return { asunto: 'Tu código para recuperar tu cuenta',
               titulo: 'Recupera tu cuenta',
               entrada: 'Con este código puedes entrar y poner una contraseña nueva:' };
    case 'email_change':
      return { asunto: 'Tu código para cambiar tu correo',
               titulo: 'Confirma tu correo nuevo',
               entrada: 'Este es el código para confirmar el cambio de tu correo:' };
    case 'invite':
      return { asunto: 'Te invitaron a OaxIntegra IA',
               titulo: 'Te están esperando',
               entrada: 'Usa este código para crear tu cuenta:' };
    case 'reauthentication':
      return { asunto: 'Tu código de confirmación',
               titulo: 'Confirma que eres tú',
               entrada: 'Escribe este código para confirmar el cambio:' };
    default:
      return { asunto: 'Tu código para entrar',
               titulo: 'Tu código para entrar',
               entrada: 'Este es tu código de entrada a OaxIntegra IA:' };
  }
}

/* El HTML va con estilos pegados a cada etiqueta y sobre una tabla: Gmail
   borra las hojas de estilo y no entiende flex ni grid. Así se ve igual en el
   celular (que es donde se va a leer) que en la computadora.

   El código va en un <p> aparte, grande y espaciado, para poder seleccionarlo
   con el dedo sin arrastrar el resto del texto. */
function armarHtml(codigo: string, enlace: string, t: ReturnType<typeof textosSegun>): string {
  const cod = escapar(codigo);
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(t.asunto)}</title></head>
<body style="margin:0;padding:0;background:#E4D5BE;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#E4D5BE;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#FFFDF8;border:1px solid #C9B48F;border-radius:16px;">
    <tr><td style="padding:28px 28px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#08645C;">OaxIntegra IA</p>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#111827;font-weight:800;">${escapar(t.titulo)}</h1>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.5;color:#374151;">${escapar(t.entrada)}</p>
    </td></tr>
    <tr><td align="center" style="padding:0 28px;">
      <p style="margin:0;padding:18px 12px;background:#F1F6EC;border:2px dashed #38631B;border-radius:12px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:34px;font-weight:800;letter-spacing:.22em;color:#38631B;text-align:center;">${cod}</p>
    </td></tr>
    <tr><td style="padding:18px 28px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#374151;">Escríbelo en la app para continuar. Caduca en una hora y solo sirve una vez.</p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#6B7280;">Si prefieres, también puedes <a href="${escapar(enlace)}" style="color:#08645C;font-weight:600;">entrar directo desde aquí</a>.</p>
    </td></tr>
    <tr><td style="padding:0 28px 26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;border-top:1px solid #EFE6D2;">
      <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#6B7280;">Si no pediste este código, no hagas nada: sin él nadie entra a tu cuenta, y en una hora deja de servir.</p>
    </td></tr>
  </table>
  <p style="max-width:480px;margin:14px auto 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:#6B7280;text-align:center;">OaxIntegra IA · Oaxaca, México</p>
</td></tr></table>
</body></html>`;
}

/* La versión en texto plano no es un adorno: sin ella, los filtros de correo
   puntúan el mensaje más cerca del spam, y es lo que se lee en los relojes y
   en los lectores de pantalla viejos. */
function armarTexto(codigo: string, enlace: string, t: ReturnType<typeof textosSegun>): string {
  return `${t.titulo}\n\n${t.entrada}\n\n    ${codigo}\n\n` +
         `Escríbelo en la app para continuar. Caduca en una hora y solo sirve una vez.\n\n` +
         `Si prefieres, entra directo desde aquí:\n${enlace}\n\n` +
         `Si no pediste este código, no hagas nada.\n\nOaxIntegra IA · Oaxaca, México`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('solo POST', { status: 405 });
  }

  const cuerpo = await req.text();

  let datos: DatosCorreo;
  try {
    await verificarFirma(cuerpo, req.headers);
    datos = JSON.parse(cuerpo) as DatosCorreo;
  } catch (e) {
    /* 401 y no 500: esto es «no me fío de quien llama», no «me rompí». */
    console.error('correo rechazado:', (e as Error).message);
    return new Response(
      JSON.stringify({ error: { http_code: 401, message: 'firma inválida' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const tipo   = datos.email_data?.email_action_type ?? '';
  const codigo = datos.email_data?.token ?? '';
  const para   = datos.user?.email ?? '';

  if (!para) {
    console.error('correo rechazado: el aviso venía sin correo', { tipo });
    return new Response(
      JSON.stringify({ error: { http_code: 400, message: 'datos incompletos' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /* Auth no solo manda códigos: también avisos de «cambió tu contraseña» y
     parecidos, que llegan SIN token (los tipos que acaban en _notification).
     Si a esos se les contestara con error, el enganche tumbaría la operación
     que los disparó — cambiar la contraseña fallaría por no haber podido
     mandar un aviso. Se contesta que todo bien y no se manda nada: esta
     función existe para el código. (Vienen apagados de fábrica en Supabase;
     si algún día se encienden, aquí es donde hay que darles su texto.) */
  if (!codigo) {
    if (tipo.endsWith('_notification')) {
      console.log('aviso sin código: no se manda nada', { tipo });
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    console.error('correo rechazado: venía sin código', { tipo });
    return new Response(
      JSON.stringify({ error: { http_code: 400, message: 'datos incompletos' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!CLAVE_RESEND) {
    /* Sin llave no hay forma de mandar nada. Se contesta con error para que
       Auth le diga a la app «no pude mandar el código» en vez de callar y
       dejar a la persona esperando un correo que no existe. */
    console.error('correo rechazado: falta RESEND_API_KEY');
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: 'el envío de correo no está configurado' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const t = textosSegun(tipo);
  /* El enlace de respaldo es el mismo que usaba el correo de fábrica, así
     que quien le dé clic entra igual que antes. Va de segundo, chiquito:
     el protagonista es el código. */
  const enlace = `${URL_SUPABASE}/auth/v1/verify?token=${encodeURIComponent(datos.email_data.token_hash)}` +
                 `&type=${encodeURIComponent(tipo)}` +
                 `&redirect_to=${encodeURIComponent(datos.email_data.redirect_to || datos.email_data.site_url || '')}`;

  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLAVE_RESEND}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: CORREO_DESDE,
      to: [para],
      subject: t.asunto,
      html: armarHtml(codigo, enlace, t),
      text: armarTexto(codigo, enlace, t)
    })
  });

  if (!respuesta.ok) {
    /* Se guarda el motivo que da Resend (dominio sin verificar, llave mala,
       cuota llena…) porque es justo lo que hay que leer cuando alguien avisa
       de que no le llegó el correo. Se le tacha el código antes de escribirlo:
       arriba se prometió que el token no aparece en los logs, y esta respuesta
       es la única de la función que trae texto que no escribimos nosotros. */
    const detalle = (await respuesta.text()).replaceAll(codigo, '······');
    console.error('Resend no aceptó el envío:', respuesta.status, detalle.slice(0, 400));
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: 'no se pudo enviar el correo' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log('correo enviado', { tipo });
  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
});
