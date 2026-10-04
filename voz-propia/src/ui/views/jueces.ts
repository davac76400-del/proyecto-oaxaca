import '@fontsource/anton/latin-400.css';
import { go } from '../../app/router';
import { state } from '../../app/state';
import { speakText, stopSpeaking } from '../../core/voice/speaker';
import { on, reducedMotion, rich, sleep } from '../dom';
import { icon } from '../icons';

/* ---------- Contenido (las ideas clave van entre *asteriscos*) ---------- */

const PITCH = [
  'En México, unas *742 mil personas* tienen mucha dificultad para hablar, o no pueden hacerlo.',
  'Una traqueostomía, una cirugía de laringe, un tubo en terapia intensiva o la ELA pueden quitar la voz.',
  'Pero *los labios se siguen moviendo*.',
  'Voz Propia mira ese movimiento con la cámara del teléfono y *dice la palabra en voz alta*.',
  'Funciona *sin internet*, no graba video y usa el teléfono que la familia ya tiene.',
  'Si duda entre dos palabras, *no adivina: pregunta*.',
  'Empezamos con las frases que más se piden en un hospital: tengo sed, me duele, tengo frío.',
  'La meta: que *nadie se quede callado* cuando más necesita hablar.',
  'Voz Propia. *Tus labios hablan, tu teléfono pone la voz.*',
];

const STRIP = ['742 mil personas en México casi no pueden hablar', 'Funciona sin internet', '200 mil casos de cáncer de laringe al año', 'No graba video', '80 a 95% de las personas con ELA', 'Usa el teléfono que ya tienes'];

const TOTAL = 6_400_000;
const SPEECH = 742_000;
const DIFF: [string, number][] = [
  ['Caminar, subir o bajar', 49.1],
  ['Ver, aun con lentes', 41.8],
  ['Oír, aun con aparato', 20.2],
  ['Recordar o concentrarse', 16.5],
  ['Bañarse, vestirse o comer', 16.3],
  ['Hablar o comunicarse', 11.6],
];
const SPEECH_ROW = DIFF.length - 1;

type Mark = 'y' | 'n' | 'm';
const OPTIONS = ['Pizarrón o papel', 'Tablero de imágenes', 'App para escribir', 'Equipo que sigue la mirada', 'Voz Propia'];
const COMPARE: [string, Mark[]][] = [
  ['No necesita usar las manos', ['n', 'm', 'n', 'y', 'y']],
  ['Dice la palabra en voz alta', ['n', 'n', 'y', 'y', 'y']],
  ['Funciona sin internet', ['y', 'y', 'm', 'm', 'y']],
  ['Sin comprar equipo especial', ['y', 'y', 'y', 'n', 'y']],
  ['Se comunica moviendo la boca, como siempre', ['n', 'n', 'n', 'n', 'y']],
];

const METHOD: [string, string][] = [
  ['Pregunta', '¿Puede un teléfono reconocer frases básicas de hospital *solo con el movimiento de los labios*, sin internet?'],
  ['Hipótesis', 'Con un grupo pequeño de frases preparadas, sí: la mayoría de las veces acertará, o *pedirá confirmar* antes de equivocarse.'],
  ['Qué mediremos', 'Porcentaje de aciertos, *tiempo hasta que suena la voz* y cuántas veces pide confirmar.'],
  ['Cómo', 'Pruebas con voluntarios en distintas luces y distancias. Después, con *personal de salud y familias*.'],
  ['Cuidados', 'Cada prueba se hace con permiso. *Nada se graba* y los resultados no identifican a nadie.'],
];

interface Crit {
  tab: string;
  icon: string;
  title: string;
  text: string;
  points: string[];
  action: [string, string];
}

const CRITERIA: Crit[] = [
  {
    tab: 'Innovación',
    icon: 'sparkles',
    title: 'Leer labios con el teléfono, sin internet.',
    text: 'Convierte el movimiento de la boca en voz, *dentro del teléfono*, en español y con frases pensadas para un hospital.',
    points: ['Sin aparatos extra', 'Sin grabar video', 'Pregunta si duda'],
    action: ['Ver la guía paso a paso', 'go:guia'],
  },
  {
    tab: 'Impacto social',
    icon: 'hand-heart',
    title: 'Para quien perdió la voz, no las palabras.',
    text: 'En México, *742 mil personas* tienen mucha dificultad para hablar o no pueden (INEGI, 2025). Se usa con el teléfono que la familia ya tiene.',
    points: ['Traqueostomía y laringectomía', 'Terapia intensiva', 'ELA y su familia'],
    action: ['Ver los datos y sus fuentes', 'go:ayuda'],
  },
  {
    tab: 'Viabilidad',
    icon: 'check',
    title: 'Funciona con lo que ya existe.',
    text: 'Es una *app web*: se abre en el navegador y se instala como app. No hay que comprar equipo ni depender de la señal.',
    points: ['Un teléfono con cámara', 'Modo avión', 'Instalable'],
    action: ['Probar frases aquí', 'jump:jz-prueba'],
  },
  {
    tab: 'Método',
    icon: 'activity',
    title: 'Pregunta, hipótesis y cómo medirlo.',
    text: 'El plan de prueba define *qué se mide* (aciertos, tiempo y confirmaciones) y con quién se prueba, paso a paso.',
    points: ['Variables claras', 'Pruebas por etapas', 'Con permiso'],
    action: ['Ver el método', 'jump:jz-metodo'],
  },
  {
    tab: 'Ética',
    icon: 'shield-check',
    title: 'Primero, cuidar a la persona.',
    text: '*No graba ni envía video.* Si no está segura, pregunta. Y dice con claridad que *no es un dispositivo médico*.',
    points: ['Privacidad por diseño', 'Alcances y límites claros', 'Sin cuentas para empezar'],
    action: ['Ver alcances y límites', 'go:ayuda'],
  },
  {
    tab: 'Comunicación',
    icon: 'message-circle',
    title: 'Fácil de entender, para cualquiera.',
    text: 'Una guía de pantalla en pantalla, una página de datos con fuentes y *esta ficha* para el jurado.',
    points: ['Todo en español', 'Letras grandes', 'Seis paletas de colores'],
    action: ['Escuchar el pitch', 'pitch'],
  },
];

const ODS: { n: number; name: string; color: string; text: string }[] = [
  { n: 3, name: 'Salud y bienestar', color: '#4C9F38', text: 'Ayuda a pedir lo urgente *a tiempo*: dolor, sed, frío o falta de aire.' },
  { n: 9, name: 'Industria, innovación e infraestructura', color: '#FD6925', text: 'Tecnología que funciona *sin internet*, pensada para hospitales con poca señal.' },
  { n: 10, name: 'Reducción de las desigualdades', color: '#DD1367', text: 'Da voz a quien la perdió *con un teléfono común*, sin equipo costoso.' },
];

const STAGES: [string, string][] = [
  ['Primera versión', 'La app abre en el teléfono y *funciona sin internet*.'],
  ['Dos modos', 'Uno para la persona que habla y otro para el equipo que *prepara las palabras*.'],
  ['Guía paso a paso', 'Una guía de pantalla en pantalla que explica cómo se usa, *sin tecnicismos*.'],
  ['Datos reales', 'Una página con cifras de México y del mundo, *cada una con su fuente*.'],
  ['Diseño accesible', 'Letras grandes, botones fáciles de tocar y *seis paletas de colores*.'],
  ['Escala de dolor', 'Del 0 al 10, *en voz alta*, y la velocidad de la voz a elegir.'],
  ['Datos 2025 y 2026', 'Cifras actualizadas con la *Encuesta Intercensal 2025* de INEGI.'],
  ['Ficha para jueces', 'Esta página: el proyecto completo, *en una sola ficha*.'],
];

const TRY = ['Sí', 'No', 'Me duele', 'Tengo sed', 'Tengo frío', 'Gracias', 'Llama a mi familia', 'Tengo miedo'];
const PAIN = ['Sin dolor', 'Muy leve', 'Leve', 'Molesto', 'Molesto', 'Moderado', 'Moderado', 'Fuerte', 'Muy fuerte', 'Intenso', 'El peor dolor'];

const FAQ: [string, string][] = [
  ['¿Ya funciona?', 'La guía, la página de datos, esta ficha y el modo del equipo para preparar palabras *funcionan hoy*. Las primeras palabras están en preparación; después se abre «Iniciar a utilizar».'],
  ['¿Por qué leer labios y no escribir?', 'Muchas personas sin voz están acostadas, débiles o con las manos ocupadas. *Mover los labios es lo más natural* y no cansa.'],
  ['¿Qué pasa si se equivoca?', 'Si no está segura, *muestra las opciones y la persona elige*. Prefiere preguntar antes que decir algo equivocado.'],
  ['¿Qué se necesita para usarla?', '*Un teléfono con cámara* y un navegador. Se abre como página web y se puede instalar como app.'],
  ['¿Y la privacidad?', '*No graba ni envía video.* Todo pasa dentro del teléfono, incluso sin señal.'],
  ['¿Es un dispositivo médico?', '*No.* Es una ayuda para comunicarse. No reemplaza la atención del personal de salud.'],
  ['¿Qué sigue?', 'Preparar las primeras palabras, probarla con voluntarios y después con *personal de salud y familias*.'],
];

const NAV: [string, string][] = [
  ['jz-top', 'Inicio'],
  ['jz-pitch', 'Pitch de 1 minuto'],
  ['jz-resumen', 'En 30 segundos'],
  ['jz-datos', 'Los datos'],
  ['jz-calc', 'Calculadora de alcance'],
  ['jz-compara', 'Comparación'],
  ['jz-metodo', 'Método'],
  ['jz-criterios', 'Criterios del jurado'],
  ['jz-ods', 'Objetivos de la ONU'],
  ['jz-etapas', 'Etapas'],
  ['jz-prueba', 'Pruébalo'],
  ['jz-preguntas', 'Preguntas'],
];

const fmt = new Intl.NumberFormat('es-MX');
const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('es-MX', { maximumFractionDigits: 1 })} M` : `${fmt.format(Math.round(n / 1000))} mil`);
const people = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('es-MX', { maximumFractionDigits: 2 })} millones de personas` : `${fmt.format(Math.round(n / 1000))} mil personas`;
const plain = (s: string) => s.replace(/\*/g, '');

const LIPS = `<svg class="jz-lips" viewBox="0 0 200 100" aria-hidden="true">
  <path class="jz-lips__up" d="M8 50 C38 18 70 16 100 34 C130 16 162 18 192 50 C150 45 128 51 100 51 C72 51 50 45 8 50 Z"/>
  <path class="jz-lips__low" d="M8 52 C50 57 72 59 100 59 C128 59 150 57 192 52 C160 88 130 95 100 95 C70 95 40 88 8 52 Z"/>
</svg>`;

/* ---------- Plantilla ---------- */

function template() {
  const strip = STRIP.map((t) => `<span>${t}</span><i aria-hidden="true">✦</i>`).join('');
  const eq = Array.from({ length: 24 }, (_, i) => `<i style="--k:${i};--h:${(0.35 + 0.65 * Math.abs(Math.sin(i * 0.9))).toFixed(2)}"></i>`).join('');
  const lines = PITCH.map((t, i) => `<li><button class="jz-line" type="button" data-line="${i}"><b>${String(i + 1).padStart(2, '0')}</b><span>${rich(t)}</span></button></li>`).join('');
  const bars = DIFF.map(
    ([t, v], i) => `<button class="jz-row${i === SPEECH_ROW ? ' is-key' : ''}" type="button" data-row="${i}" aria-pressed="${i === SPEECH_ROW}" style="--w:${(v / 50).toFixed(3)};--n:${i}">
      <span class="jz-row__t">${t}</span><span class="jz-row__track"><i></i></span><b class="jz-row__v" data-pct="${v}" data-abs="${short((TOTAL * v) / 100)}">${v}%</b>
    </button>`,
  ).join('');
  const dots = Array.from({ length: 100 }, () => '<i></i>').join('');
  const col = (i: number) => (i === OPTIONS.length - 1 ? ' class="is-us" data-col="us"' : ` data-col="${i}"`);
  const head = OPTIONS.map((o, i) => `<th scope="col"${col(i)}>${o}</th>`).join('');
  const picks = OPTIONS.slice(0, -1)
    .map((o, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-pick="${i}">${o}</button>`)
    .join('');
  const markCell = (m: Mark) =>
    m === 'y'
      ? `<span class="jz-mk jz-mk--y">${icon('check', 18, 2.8)}<span class="sr-only">Sí</span></span>`
      : m === 'n'
        ? `<span class="jz-mk jz-mk--n">${icon('x', 16, 2.6)}<span class="sr-only">No</span></span>`
        : '<span class="jz-mk jz-mk--m">Depende</span>';
  const rows = COMPARE.map(([t, ms]) => `<tr><th scope="row">${t}</th>${ms.map((m, i) => `<td${col(i)}>${markCell(m)}</td>`).join('')}</tr>`).join('');
  const method = METHOD.map(([t, d], i) => `<li class="jz-step" data-rv style="--d:${i * 0.08}s"><b>${String(i + 1).padStart(2, '0')}</b><h3>${t}</h3><p>${rich(d)}</p></li>`).join('');
  const critTabs = CRITERIA.map(
    (c, i) => `<button class="jz-chip" type="button" role="tab" id="jz-ct-${i}" aria-controls="jz-crit-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-crit="${i}">${icon(c.icon, 16, 2.2)}<span>${c.tab}</span></button>`,
  ).join('');
  const ods = ODS.map(
    (o) => `<li><button class="jz-ods" type="button" data-ods aria-pressed="false" style="--c:${o.color}" aria-label="Objetivo ${o.n}: ${o.name}. Toca para ver cómo se relaciona.">
      <span class="jz-ods__in">
        <span class="jz-ods__f"><b>${o.n}</b><span>${o.name}</span><small>${icon('refresh-ccw', 14)} Toca para voltear</small></span>
        <span class="jz-ods__b"><small>Objetivo ${o.n}</small><span>${rich(o.text)}</span></span>
      </span>
    </button></li>`,
  ).join('');
  const stages = STAGES.map(([t, d], i) => `<li class="jz-stage" data-rv><span class="jz-stage__n">Etapa ${i + 1}</span><h3>${t}</h3><p>${rich(d)}</p></li>`).join('');
  const tryBtns = TRY.map((t) => `<button class="jz-say" type="button" data-say="${t}">${icon('volume', 18)}<span>${t}</span></button>`).join('');
  const pain = Array.from({ length: 11 }, (_, n) => `<button class="jz-pn" type="button" data-pain="${n}" style="--k:${n / 10}" aria-pressed="false">${n}</button>`).join('');
  const faq = FAQ.map(([q, a]) => `<details class="jz-q"><summary>${q}<i aria-hidden="true">${icon('plus', 20, 2.4)}</i></summary><p>${rich(a)}</p></details>`).join('');
  const idx = NAV.map(([id, t], i) => `<li><button type="button" data-jump="${id}" data-idx-item="${id}"><b>${String(i + 1).padStart(2, '0')}</b>${t}</button></li>`).join('');

  return `
  <div class="jz" data-jz>
    <i class="jz-progress" aria-hidden="true"></i>
    <button class="jz-idx-btn" type="button" data-idx aria-expanded="false" aria-controls="jz-idx">${icon('layout-grid', 18)}<span>Índice</span></button>
    <nav class="jz-idx" id="jz-idx" aria-label="Índice de la ficha" hidden><p>Ir a…</p><ol>${idx}</ol></nav>

    <section class="jz-sec jz-hero" id="jz-top" data-tone="paper" aria-labelledby="jz-h1">
      <div class="jz-hero__copy">
        <p class="jz-over" data-rv>[ Para jueces y evaluadores ]</p>
        <h1 class="jz-h1" id="jz-h1" data-rv style="--d:.08s">Voz Propia,<br><em>en una ficha.</em></h1>
        <p class="jz-lead" data-rv style="--d:.16s">${rich('El problema, la solución, el impacto y el plan. *Todo en una página*, con datos de 2025 y 2026.')}</p>
        <div class="jz-actions" data-rv style="--d:.24s">
          <button class="jz-btn jz-btn--ink" type="button" data-pitch-start>${icon('play', 18, 2.4)}<span>Escuchar el pitch de 1 minuto</span></button>
          <button class="jz-btn" type="button" data-jump="jz-datos">${icon('activity', 18, 2.2)}<span>Ver los datos</span></button>
          <button class="jz-btn" type="button" data-print>${icon('download', 18, 2.2)}<span>Imprimir ficha</span></button>
        </div>
        <ul class="jz-mini" data-rv style="--d:.32s">
          <li><b data-count="742">0</b><span>mil personas en México casi no pueden hablar</span></li>
          <li><b>0</b><span>videos guardados</span></li>
          <li><b>1</b><span>teléfono, nada más</span></li>
        </ul>
      </div>
      <div class="jz-hero__art" aria-hidden="true">
        <div class="jz-orb">
          <i class="jz-orb__ring"></i><i class="jz-orb__ring jz-orb__ring--2"></i>
          ${LIPS}
          <div class="jz-eq">${eq}</div>
        </div>
        <span class="jz-sticker jz-sticker--a">Sin internet</span>
        <span class="jz-sticker jz-sticker--b">No graba video</span>
        <span class="jz-sticker jz-sticker--c">Hecha en México</span>
      </div>
    </section>

    <div class="jz-strip" aria-hidden="true"><div class="jz-strip__track">${strip}${strip}</div></div>

    <section class="jz-sec jz-pitch" id="jz-pitch" data-tone="night" aria-labelledby="jz-pitch-t">
      <div class="jz-pitch__head">
        <p class="jz-over" data-rv>[ 01 · Pitch ]</p>
        <h2 class="jz-h2" id="jz-pitch-t" data-rv>El proyecto en un minuto, en voz alta.</h2>
        <p class="jz-p" data-rv>${rich('Toca reproducir y escucha. La frase que suena se ilumina. *Toca cualquier frase* para empezar desde ahí.')}</p>
        <div class="jz-player" data-rv>
          <button class="jz-play" type="button" data-pitch-toggle aria-label="Reproducir el pitch">${icon('play', 28, 2.4)}</button>
          <div class="jz-player__info">
            <span class="jz-player__now" data-pitch-label>Listo para empezar</span>
            <i class="jz-bar" aria-hidden="true"><b data-pitch-bar></b></i>
          </div>
          <button class="jz-round" type="button" data-pitch-restart aria-label="Empezar desde el principio">${icon('rotate-ccw', 20, 2.4)}</button>
        </div>
      </div>
      <ol class="jz-lines" data-lines>${lines}</ol>
    </section>

    <section class="jz-sec" id="jz-resumen" data-tone="paper" aria-labelledby="jz-res-t">
      <p class="jz-over" data-rv>[ 02 · En 30 segundos ]</p>
      <h2 class="jz-h2" id="jz-res-t" data-rv>Lo esencial, de un vistazo.</h2>
      <div class="jz-bento">
        <article class="jz-cell jz-cell--coral" data-rv>
          <small>Problema</small>
          <p class="jz-big"><b data-count="742">0</b> mil</p>
          <p>${rich('personas en México tienen mucha dificultad para hablar o no pueden. *Pizarrones y señas cansan y se malentienden.*')}</p>
        </article>
        <article class="jz-cell jz-cell--cobalt" data-rv style="--d:.08s">
          <small>Solución</small>
          <p class="jz-cell__h">Tus labios hablan. Tu teléfono pone la voz.</p>
          <p>${rich('Mira el movimiento de los labios con la cámara y *dice la palabra en voz alta*.')}</p>
        </article>
        <article class="jz-cell jz-cell--lime" data-rv style="--d:.12s">
          <small>Para quién</small>
          <ul class="jz-tags"><li>Traqueostomía</li><li>Laringectomía</li><li>Terapia intensiva</li><li>ELA</li></ul>
        </article>
        <article class="jz-cell jz-cell--ink" data-rv style="--d:.16s">
          <small>Diferencia</small>
          <p class="jz-cell__h">Sin internet. Sin aparatos extra. Sin grabar video.</p>
        </article>
        <article class="jz-cell jz-cell--card" data-rv style="--d:.2s">
          <small>Hoy</small>
          <p>${rich('Guía, datos, esta ficha y el modo del equipo *funcionando*. Primeras palabras en preparación.')}</p>
          <span class="jz-status"><i></i>En desarrollo activo</span>
        </article>
      </div>
    </section>

    <section class="jz-sec" id="jz-datos" data-tone="sand" aria-labelledby="jz-dat-t">
      <div class="jz-split">
        <div>
          <p class="jz-over" data-rv>[ 03 · Los datos ]</p>
          <h2 class="jz-h2" id="jz-dat-t" data-rv>6.4 millones de personas con discapacidad en México.</h2>
          <p class="jz-p" data-rv>${rich('Así se reparten las dificultades, según la *Encuesta Intercensal 2025* de INEGI. Toca una barra para ver cuántas personas son.')}</p>
          <div class="jz-switch" role="radiogroup" aria-label="Mostrar como" data-rv>
            <button type="button" role="radio" aria-checked="true" data-unit="pct">Porcentaje</button>
            <button type="button" role="radio" aria-checked="false" data-unit="abs">Personas</button>
          </div>
        </div>
        <div class="jz-chart" data-chart>
          ${bars}
          <p class="jz-detail" data-detail aria-live="polite"></p>
          <p class="jz-note">Una persona puede tener más de una dificultad: por eso la suma pasa de 100%. Las personas son aproximadas.</p>
          <a class="jz-src" href="https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/ei/EIC2025-def_RR.pdf" target="_blank" rel="noopener noreferrer">${icon('external', 14)}Fuente: INEGI, Encuesta Intercensal 2025 (septiembre de 2026)</a>
        </div>
      </div>
    </section>

    <section class="jz-sec" id="jz-calc" data-tone="forest" aria-labelledby="jz-calc-t">
      <p class="jz-over" data-rv>[ 04 · Calculadora de alcance ]</p>
      <h2 class="jz-h2" id="jz-calc-t" data-rv>Imagina hasta dónde puede llegar.</h2>
      <p class="jz-p" data-rv>${rich('Mueve los controles. Parte de las *742 mil personas* que casi no pueden hablar en México.')}</p>
      <div class="jz-calc">
        <div class="jz-calc__ctl" data-rv>
          <label class="jz-range"><span>Personas que la usan <output data-out-reach>10%</output></span><input type="range" min="1" max="100" value="10" data-reach aria-describedby="jz-calc-note"></label>
          <label class="jz-range"><span>Frases que dice cada una al día <output data-out-phr>10</output></span><input type="range" min="1" max="40" value="10" data-phrases aria-describedby="jz-calc-note"></label>
          <div class="jz-dots" aria-hidden="true" data-dots>${dots}</div>
          <p class="jz-note">Cada punto es el 1% de las 742 mil personas.</p>
        </div>
        <div class="jz-calc__out" data-rv style="--d:.1s" aria-live="polite">
          <div><small>Personas con voz</small><b data-r-people>74,200</b></div>
          <div><small>Frases dichas al día</small><b data-r-day>742,000</b></div>
          <div><small>Frases dichas al año</small><b data-r-year>270,830,000</b></div>
        </div>
      </div>
      <p class="jz-note" id="jz-calc-note">Es un ejercicio para imaginar el alcance, no una predicción.</p>
    </section>

    <section class="jz-sec" id="jz-compara" data-tone="paper" aria-labelledby="jz-cmp-t">
      <p class="jz-over" data-rv>[ 05 · Comparación ]</p>
      <h2 class="jz-h2" id="jz-cmp-t" data-rv>Frente a lo que se usa hoy.</h2>
      <p class="jz-p" data-rv>${rich('Las otras opciones ayudan mucho. Voz Propia suma algo que ninguna tiene: *hablar moviendo la boca, como siempre*.')}</p>
      <div class="jz-pick" role="radiogroup" aria-label="Comparar Voz Propia con" data-rv><span>Comparar con:</span>${picks}</div>
      <div class="jz-table" data-rv data-pick="0" tabindex="0" role="region" aria-label="Tabla de comparación">
        <table>
          <caption class="sr-only">Comparación entre Voz Propia y otras formas de comunicarse sin voz</caption>
          <thead><tr><td></td>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="jz-note">Comparación general. Cada persona y cada hospital son distintos.</p>
    </section>

    <section class="jz-sec" id="jz-metodo" data-tone="violet" aria-labelledby="jz-met-t">
      <p class="jz-over" data-rv>[ 06 · Método ]</p>
      <h2 class="jz-h2" id="jz-met-t" data-rv>Cómo vamos a comprobar que funciona.</h2>
      <span class="jz-badge" data-rv>${icon('activity', 16, 2.2)}Plan de prueba, en preparación</span>
      <ol class="jz-steps">${method}</ol>
    </section>

    <section class="jz-sec" id="jz-criterios" data-tone="ink" aria-labelledby="jz-cri-t">
      <p class="jz-over" data-rv>[ 07 · Criterios del jurado ]</p>
      <h2 class="jz-h2" id="jz-cri-t" data-rv>Lo que se suele evaluar, y dónde verlo.</h2>
      <div class="jz-chips" role="tablist" aria-label="Criterios" data-rv>${critTabs}</div>
      <div class="jz-crit" id="jz-crit-panel" role="tabpanel" aria-labelledby="jz-ct-0" data-crit-panel></div>
    </section>

    <section class="jz-sec" id="jz-ods" data-tone="paper" aria-labelledby="jz-ods-t">
      <p class="jz-over" data-rv>[ 08 · Agenda 2030 ]</p>
      <h2 class="jz-h2" id="jz-ods-t" data-rv>Tres Objetivos de Desarrollo Sostenible.</h2>
      <p class="jz-p" data-rv>Toca cada tarjeta para ver cómo se relaciona con Voz Propia.</p>
      <ul class="jz-odsl">${ods}</ul>
    </section>

    <section class="jz-sec" id="jz-etapas" data-tone="cobalt" aria-labelledby="jz-eta-t">
      <p class="jz-over" data-rv>[ 09 · Etapas ]</p>
      <h2 class="jz-h2" id="jz-eta-t" data-rv>Cómo ha crecido el proyecto.</h2>
      <ol class="jz-tl" data-tl><i class="jz-tl__fill" aria-hidden="true" data-tl-fill></i>${stages}</ol>
    </section>

    <section class="jz-sec" id="jz-prueba" data-tone="lime" aria-labelledby="jz-try-t">
      <p class="jz-over" data-rv>[ 10 · Pruébalo ]</p>
      <h2 class="jz-h2" id="jz-try-t" data-rv>Así suena una frase.</h2>
      <p class="jz-p" data-rv>${rich('Toca una frase y escúchala con la voz de este dispositivo. *Aquí no se usa la cámara.*')}</p>
      <div class="jz-says" data-rv>${tryBtns}</div>
      <h3 class="jz-h3" data-rv>¿Cuánto duele?</h3>
      <div class="jz-pain" role="group" aria-label="Escala de dolor del 0 al 10" data-rv>${pain}</div>
      <p class="jz-pain__out" data-pain-out aria-live="polite">Elige un número del 0 al 10.</p>
    </section>

    <section class="jz-sec" id="jz-preguntas" data-tone="sand" aria-labelledby="jz-faq-t">
      <p class="jz-over" data-rv>[ 11 · Preguntas ]</p>
      <h2 class="jz-h2" id="jz-faq-t" data-rv>Lo que suele preguntar el jurado.</h2>
      <div class="jz-faq" data-rv>${faq}</div>
    </section>

    <section class="jz-sec jz-end" data-tone="night" aria-labelledby="jz-end-t">
      <p class="jz-over" data-rv>[ Sigue recorriendo ]</p>
      <h2 class="jz-h2" id="jz-end-t" data-rv>Mira la app por dentro.</h2>
      <div class="jz-go">
        <button class="jz-go__card" type="button" data-to="guia" data-rv>${icon('user', 24)}<b>La guía del usuario</b><span>Pantalla por pantalla, cómo se usa.</span>${icon('arrow-right', 20, 2.4)}</button>
        <button class="jz-go__card" type="button" data-to="ayuda" data-rv style="--d:.08s">${icon('info', 24)}<b>Datos, fuentes y preguntas</b><span>Cifras, a quién ayuda, privacidad y límites.</span>${icon('arrow-right', 20, 2.4)}</button>
        <button class="jz-go__card" type="button" data-print data-rv style="--d:.16s">${icon('download', 24)}<b>Imprimir esta ficha</b><span>O guardarla como PDF desde la ventana de impresión.</span>${icon('arrow-right', 20, 2.4)}</button>
      </div>
      <button class="jz-btn jz-btn--ghost" type="button" data-jump="jz-top">${icon('arrow-up', 18, 2.4)}<span>Volver arriba</span></button>
      <p class="jz-fine">Voz Propia es una ayuda para comunicarse, no un dispositivo médico.</p>
    </section>
  </div>`;
}

/* ---------- Vista ---------- */

export function juecesView(root: HTMLElement) {
  root.innerHTML = template();
  const el = root.querySelector<HTMLElement>('[data-jz]')!;
  const still = reducedMotion();
  if (still) el.classList.add('is-static');
  const ac = new AbortController();
  const { signal } = ac;
  const offs: (() => void)[] = [];
  let disposed = false;

  const say = (t: string) => speakText(t, state.settings);

  /* ---------- Barra de avance y línea de tiempo ---------- */

  const bar = el.querySelector<HTMLElement>('.jz-progress')!;
  const tl = el.querySelector<HTMLElement>('[data-tl]')!;
  const tlFill = el.querySelector<HTMLElement>('[data-tl-fill]')!;
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : '0');
      const r = tl.getBoundingClientRect();
      const k = (innerHeight * 0.6 - r.top) / Math.max(1, r.height);
      tlFill.style.setProperty('--f', Math.min(1, Math.max(0, k)).toFixed(3));
    });
  };
  addEventListener('scroll', onScroll, { passive: true, signal });
  onScroll();

  /* ---------- Aparición y conteo de cifras ---------- */

  const countUp = (b: HTMLElement) => {
    const to = Number(b.dataset.count);
    if (still) {
      b.textContent = fmt.format(to);
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 1300);
      b.textContent = fmt.format(Math.round(to * (1 - (1 - k) ** 3)));
      if (k < 1 && !disposed) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.add('is-in');
        en.target.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
        reveal.unobserve(en.target);
      }
    },
    { threshold: 0.12 },
  );
  el.querySelectorAll('[data-rv], [data-chart], [data-dots]').forEach((n) => reveal.observe(n));
  const counted = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        countUp(en.target as HTMLElement);
        counted.unobserve(en.target);
      }
    },
    { threshold: 0.5 },
  );
  el.querySelectorAll<HTMLElement>('[data-count]').forEach((b) => {
    if (!b.closest('[data-rv]')) counted.observe(b);
  });

  /* ---------- Índice ---------- */

  const idx = el.querySelector<HTMLElement>('.jz-idx')!;
  const idxBtn = el.querySelector<HTMLElement>('[data-idx]')!;
  const openIdx = (open: boolean) => {
    idx.hidden = !open;
    idxBtn.setAttribute('aria-expanded', String(open));
    if (open) idx.querySelector<HTMLElement>('.is-on, button')?.focus();
  };
  addEventListener('pointerdown', (e) => !idx.hidden && !(e.target as Element).closest('.jz-idx, [data-idx]') && openIdx(false), { signal });
  addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && !idx.hidden) {
        openIdx(false);
        idxBtn.focus();
      }
    },
    { signal },
  );
  const idxItems = Array.from(el.querySelectorAll<HTMLElement>('[data-idx-item]'));
  const spy = new IntersectionObserver(
    (entries) => {
      for (const en of entries) if (en.isIntersecting) idxItems.forEach((b) => b.classList.toggle('is-on', b.dataset.idxItem === en.target.id));
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  NAV.forEach(([id]) => {
    const s = el.querySelector(`#${id}`);
    if (s) spy.observe(s);
  });
  const jump = (id: string) => {
    openIdx(false);
    el.querySelector(`#${id}`)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  };

  /* ---------- Pitch en voz alta ---------- */

  const lineBtns = Array.from(el.querySelectorAll<HTMLElement>('[data-line]'));
  const toggle = el.querySelector<HTMLElement>('[data-pitch-toggle]')!;
  const label = el.querySelector<HTMLElement>('[data-pitch-label]')!;
  const pBar = el.querySelector<HTMLElement>('[data-pitch-bar]')!;
  let pitchRun = 0;
  let pitchAt = 0;
  let playing = false;
  const mark = (i: number) => {
    lineBtns.forEach((b, n) => {
      b.classList.toggle('is-now', n === i);
      b.classList.toggle('is-past', i >= 0 && n < i);
      if (n === i) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    pBar.style.setProperty('--p', String(i < 0 ? 0 : (i + 1) / PITCH.length));
    label.textContent = i < 0 ? 'Listo para empezar' : `Frase ${i + 1} de ${PITCH.length}`;
  };
  const setPlaying = (v: boolean) => {
    playing = v;
    el.classList.toggle('is-playing', v);
    toggle.innerHTML = icon(v ? 'square' : 'play', 26, 2.4);
    toggle.setAttribute('aria-label', v ? 'Pausar el pitch' : 'Reproducir el pitch');
  };
  const stopPitch = () => {
    pitchRun++;
    stopSpeaking();
    setPlaying(false);
  };
  const playPitch = async (from: number) => {
    const run = ++pitchRun;
    setPlaying(true);
    for (let i = from; i < PITCH.length; i++) {
      if (run !== pitchRun || disposed) return;
      pitchAt = i;
      mark(i);
      const words = PITCH[i].split(/\s+/).length;
      // Algunos navegadores nunca avisan que la voz terminó: después de un tiempo razonable se sigue.
      await Promise.race([Promise.all([say(plain(PITCH[i])), sleep(still ? 600 : words * 280)]), sleep(words * 650 + 2500)]);
    }
    if (run !== pitchRun || disposed) return;
    pitchAt = 0;
    setPlaying(false);
    label.textContent = 'Terminó. Toca para escucharlo otra vez.';
  };

  /* ---------- Gráfica de datos ---------- */

  const rowsEl = Array.from(el.querySelectorAll<HTMLElement>('[data-row]'));
  const detail = el.querySelector<HTMLElement>('[data-detail]')!;
  const showRow = (i: number) => {
    rowsEl.forEach((r, n) => r.setAttribute('aria-pressed', String(n === i)));
    const [t, v] = DIFF[i];
    detail.innerHTML = `${icon('info', 18)}<span><b>${t}:</b> ${v}% de las personas con discapacidad, unas <b>${people((TOTAL * v) / 100)}</b>.</span>`;
  };
  const setUnit = (u: 'pct' | 'abs') => {
    el.querySelectorAll<HTMLElement>('[data-unit]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.unit === u)));
    el.querySelectorAll<HTMLElement>('.jz-row__v').forEach((b) => (b.textContent = u === 'pct' ? `${b.dataset.pct}%` : b.dataset.abs!));
  };
  showRow(SPEECH_ROW);

  /* ---------- Calculadora ---------- */

  const reach = el.querySelector<HTMLInputElement>('[data-reach]')!;
  const phrases = el.querySelector<HTMLInputElement>('[data-phrases]')!;
  const dotEls = Array.from(el.querySelectorAll<HTMLElement>('[data-dots] i'));
  const out = (sel: string) => el.querySelector<HTMLElement>(sel)!;
  const calc = () => {
    const p = Number(reach.value);
    const f = Number(phrases.value);
    const n = Math.round((SPEECH * p) / 100);
    out('[data-out-reach]').textContent = `${p}%`;
    out('[data-out-phr]').textContent = String(f);
    out('[data-r-people]').textContent = fmt.format(n);
    out('[data-r-day]').textContent = fmt.format(n * f);
    out('[data-r-year]').textContent = fmt.format(n * f * 365);
    reach.style.setProperty('--v', String((p - 1) / 99));
    phrases.style.setProperty('--v', String((f - 1) / 39));
    dotEls.forEach((d, k) => d.classList.toggle('is-on', k < p));
  };
  reach.addEventListener('input', calc, { signal });
  phrases.addEventListener('input', calc, { signal });
  calc();

  /* ---------- Criterios: pestañas con teclado ---------- */

  const critPanel = el.querySelector<HTMLElement>('[data-crit-panel]')!;
  const critBtns = Array.from(el.querySelectorAll<HTMLElement>('[data-crit]'));
  const setCrit = (i: number, focus = false) => {
    critBtns.forEach((b, n) => {
      b.setAttribute('aria-selected', String(n === i));
      b.tabIndex = n === i ? 0 : -1;
    });
    if (focus) critBtns[i].focus();
    const c = CRITERIA[i];
    critPanel.setAttribute('aria-labelledby', `jz-ct-${i}`);
    critPanel.innerHTML = `
      <span class="jz-crit__ic">${icon(c.icon, 30, 1.9)}</span>
      <h3>${c.title}</h3>
      <p>${rich(c.text)}</p>
      <ul>${c.points.map((p) => `<li>${icon('check', 16, 2.6)}${p}</li>`).join('')}</ul>
      <button class="jz-btn jz-btn--acc" type="button" data-act="${c.action[1]}">${icon('arrow-right', 18, 2.4)}<span>${c.action[0]}</span></button>`;
    critPanel.classList.remove('is-swap');
    void critPanel.offsetWidth;
    critPanel.classList.add('is-swap');
  };
  setCrit(0);

  /* ---------- Acciones ---------- */

  const runAction = (a: string) => {
    if (a === 'pitch') return void startPitchFromTop();
    const [kind, arg] = a.split(':');
    if (kind === 'go') go(arg as 'guia' | 'ayuda');
    else if (kind === 'jump') jump(arg);
  };
  const startPitchFromTop = () => {
    jump('jz-pitch');
    void playPitch(0);
  };

  offs.push(
    on(el, 'click', '[data-idx]', () => openIdx(Boolean(idx.hidden))),
    on(el, 'click', '[data-jump]', (e, b) => {
      e.preventDefault();
      jump(b.dataset.jump!);
    }),
    on(el, 'click', '[data-print]', () => print()),
    on(el, 'click', '[data-to]', (_, b) => go(b.dataset.to as 'guia' | 'ayuda')),
    on(el, 'click', '[data-pitch-start]', startPitchFromTop),
    on(el, 'click', '[data-pitch-toggle]', () => (playing ? stopPitch() : void playPitch(pitchAt))),
    on(el, 'click', '[data-pitch-restart]', () => void playPitch(0)),
    on(el, 'click', '[data-line]', (_, b) => void playPitch(Number(b.dataset.line))),
    on(el, 'click', '[data-row]', (_, b) => showRow(Number(b.dataset.row))),
    on(el, 'click', '[data-pick]', (_, b) => {
      el.querySelectorAll<HTMLElement>('button[data-pick]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      el.querySelector<HTMLElement>('.jz-table')!.dataset.pick = b.dataset.pick!;
    }),
    on(el, 'click', '[data-unit]', (_, b) => setUnit(b.dataset.unit as 'pct' | 'abs')),
    on(el, 'click', '[data-crit]', (_, b) => setCrit(Number(b.dataset.crit))),
    on(el, 'keydown', '[data-crit]', (e, b) => {
      const n = CRITERIA.length;
      const i = Number(b.dataset.crit);
      const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n : -1;
      if (next < 0) return;
      e.preventDefault();
      setCrit(next, true);
    }),
    on(el, 'click', '[data-act]', (_, b) => runAction(b.dataset.act!)),
    on(el, 'click', '[data-ods]', (_, b) => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))),
    on(el, 'click', '[data-say]', (_, b) => {
      stopPitch();
      b.classList.add('is-saying');
      void say(b.dataset.say!).finally(() => b.classList.remove('is-saying'));
    }),
    on(el, 'click', '[data-pain]', (_, b) => {
      stopPitch();
      const n = Number(b.dataset.pain);
      el.querySelectorAll<HTMLElement>('[data-pain]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      el.querySelector<HTMLElement>('[data-pain-out]')!.innerHTML = `${icon('volume', 18)} <b>${n}</b> de 10: ${PAIN[n]}`;
      void say(`Mi dolor es ${n} de 10. ${PAIN[n]}.`);
    }),
  );

  return () => {
    disposed = true;
    stopPitch();
    ac.abort();
    offs.forEach((off) => off());
    cancelAnimationFrame(raf);
    reveal.disconnect();
    counted.disconnect();
    spy.disconnect();
  };
}
