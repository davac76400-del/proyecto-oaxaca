import '@fontsource/anton/latin-400.css';
import { go } from '../../app/router';
import { state } from '../../app/state';
import { speakText } from '../../core/voice/speaker';
import { CATEGORY_LABEL, DEFAULT_PHRASES } from '../../data/default-phrases';
import { bindPalette, currentTheme, paletteHTML, type Theme } from '../components/theme';
import { esc, on, reducedMotion, rich, sleep } from '../dom';
import { icon } from '../icons';
import type { Field, Shape } from './ayuda-field';

/* ---------- Figuras que forman los puntos de fondo ---------- */

const SHAPES: Shape[] = [];
const sh = (s: Shape) => SHAPES.push(s) - 1;
const S = {
  lips: sh({ draw: 'lips' }),
  voz: sh({ text: 'VOZ' }),
  datos: sh({ text: 'DATOS' }),
  mx: sh({ text: '945 MIL' }),
  mundo: sh({ text: '189 MIL' }),
  traqueo: sh({ text: '+58 MIL' }),
  ela: sh({ text: 'ELA' }),
  uci: sh({ text: '54%' }),
  dolor: sh({ text: '1 DE 3' }),
  corazon: sh({ draw: 'heart' }),
  onda: sh({ draw: 'wave' }),
  hola: sh({ text: 'HOLA' }),
  cero: sh({ text: '0 VIDEOS' }),
  tuvoz: sh({ text: 'TU VOZ' }),
  limites: sh({ text: 'SÍ Y NO' }),
  duda: sh({ text: '?' }),
  ruta: sh({ text: 'HOY' }),
};

/* ---------- Fuentes ---------- */

interface Source {
  id: string;
  short: string;
  name: string;
  url: string;
}

const SOURCES: Source[] = [
  { id: 'inegi', short: 'INEGI', name: 'INEGI. Estadísticas a propósito del Día Internacional de las Personas con Discapacidad (Censo 2020), comunicado 713/21.', url: 'https://www.inegi.org.mx/contenidos/saladeprensa/aproposito/2021/EAP_PersDiscap21.pdf' },
  { id: 'globocan', short: 'GLOBOCAN (OMS)', name: 'GLOBOCAN 2022, Agencia Internacional para la Investigación del Cáncer (OMS). Ficha de cáncer de laringe.', url: 'https://gco.iarc.who.int/media/globocan/factsheets/cancers/14-larynx-fact-sheet.pdf' },
  { id: 'lac', short: 'Cáncer de laringe 2022', name: 'Estadísticas mundiales de cáncer de laringe en 2022: un estudio poblacional (resumen del Instituto Nacional del Cáncer de Francia).', url: 'https://en-www.cancer.fr/professionnels-de-sante/veille/nota-bene-cancer/bulletin-n-676-du-2-mars-2026/global-laryngeal-cancer-statistics-in-2022-a-population-based-study' },
  { id: 'traqueo', short: 'Critical Care Explorations', name: 'Epidemiología de la traqueostomía en Estados Unidos, 2002 a 2017. Critical Care Explorations, 2021.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8437212/' },
  { id: 'ela', short: 'Estudio en ELA', name: 'Factores demográficos y disfunción de los órganos del habla en pacientes con ELA esporádica.', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7466202/' },
  { id: 'happ15', short: 'Happ y cols., 2015', name: 'Happ y colaboradores. Pacientes con ventilador que pueden comunicarse, 2,671 pacientes. Heart & Lung, 2015.', url: 'https://healthmanagement.org/s/over-half-of-icu-patients-on-ventilators-able-to-communicate' },
  { id: 'happ11', short: 'Happ y cols.', name: 'Happ y colaboradores. Comunicación entre enfermería y pacientes intubados en terapia intensiva.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3222584/' },
];

const srcLinks = (ids: string[]) =>
  `<span class="a-srcs">${ids
    .map((id) => {
      const n = SOURCES.findIndex((s) => s.id === id) + 1;
      return `<a class="a-src" href="#a-fuentes" data-jump="a-fuentes">${icon('info', 15)}Fuente ${n}: ${SOURCES[n - 1].short}</a>`;
    })
    .join('')}</span>`;

/* ---------- Contenido (las ideas clave van entre *asteriscos*) ---------- */

interface Fact {
  shape: number;
  over: string;
  count: number | null;
  big?: string;
  unit: string;
  title: string;
  body: string;
  extra?: string;
  sources: string[];
  /** Resumen para la vista «en una mirada». */
  gu: string;
  gl: string;
}

const FACTS: Fact[] = [
  {
    shape: S.mx,
    over: 'México',
    count: 945,
    unit: 'mil personas',
    title: 'no pueden hablar, o les cuesta muchísimo.',
    body: 'Es lo que contó el Censo 2020: personas con *mucha dificultad* para hablar o comunicarse, o que *no pueden hacerlo*. Detrás de cada número hay alguien que sí tiene qué decir.',
    extra: 'De 126 millones de habitantes, *7.2 millones (5.7%)* tienen alguna discapacidad o condición mental. Hablar o comunicarse es la dificultad que menos se reporta.',
    sources: ['inegi'],
    gu: 'mil',
    gl: 'personas en México no pueden hablar o les cuesta muchísimo',
  },
  {
    shape: S.mundo,
    over: 'El mundo',
    count: 189,
    unit: 'mil casos nuevos',
    title: 'de cáncer de laringe en un solo año.',
    body: 'Fue en 2022. Más de *17 mil* fueron en *América Latina y el Caribe*. La cirugía de laringe puede quitar la voz, pero *los labios se siguen moviendo*.',
    sources: ['globocan', 'lac'],
    gu: 'mil',
    gl: 'casos nuevos de cáncer de laringe en el mundo, en 2022',
  },
  {
    shape: S.traqueo,
    over: 'Traqueostomía',
    count: 58,
    unit: 'mil o más al año',
    title: 'traqueostomías, solo en Estados Unidos.',
    body: 'Entre 2002 y 2017 fueron de *58 mil a casi 90 mil* cada año. Con la cánula en el cuello, el aire ya no pasa por las cuerdas vocales y *la voz no sale*. *La boca sí se mueve*, y eso es lo que Voz Propia lee.',
    sources: ['traqueo'],
    gu: 'mil o más',
    gl: 'traqueostomías al año, solo en Estados Unidos',
  },
  {
    shape: S.ela,
    over: 'ELA',
    count: null,
    big: 'La mayoría',
    unit: '',
    title: 'de las personas con ELA pierde el habla con el avance de la enfermedad.',
    body: 'La esclerosis lateral amiotrófica debilita poco a poco los músculos. En un estudio con pacientes con ELA esporádica, *alrededor de 3 de cada 10* ya tenían problemas del habla al ser diagnosticados.',
    extra: 'Mientras *los labios todavía se muevan*, Voz Propia puede acompañar esa etapa.',
    sources: ['ela'],
    gu: '',
    gl: 'de las personas con ELA pierde el habla con la enfermedad',
  },
  {
    shape: S.uci,
    over: 'Terapia intensiva',
    count: 54,
    unit: 'por ciento',
    title: 'de los pacientes con ventilador están despiertos y podrían comunicarse.',
    body: 'Un estudio con 2,671 pacientes encontró que *más de la mitad* estaba alerta y respondía. Pero *el tubo no les deja hablar*.',
    sources: ['happ15'],
    gu: '%',
    gl: 'de los pacientes con ventilador están despiertos y podrían comunicarse',
  },
  {
    shape: S.dolor,
    over: 'El dolor',
    count: 1,
    unit: 'de cada 3',
    title: 'conversaciones sobre el dolor no se entienden.',
    body: 'En terapia intensiva, el *37.7%* de los intentos de un paciente intubado por explicar su dolor fallaron. Decir «me duele» *a tiempo lo cambia todo*.',
    sources: ['happ11'],
    gu: 'de cada 3',
    gl: 'intentos de explicar el dolor fallan en terapia intensiva',
  },
];

const SUMMARY: [string, string, string][] = [
  ['Problema', 'help', 'Muchas personas *pierden la voz* por una traqueostomía, una cirugía de laringe, una intubación o una enfermedad. Pero *siguen moviendo los labios*.'],
  ['Solución', 'sparkles', '*Voz Propia* lee ese movimiento con la cámara del teléfono y *lo dice en voz alta*.'],
  ['Cómo', 'scan-face', 'Sigue *478 puntos* de la cara, usa los *40 de la boca* y los compara con *palabras preparadas*.'],
  ['Privacidad', 'shield-check', '*No graba ni envía video.* Funciona *sin internet*, dentro del teléfono.'],
  ['Hoy', 'check', 'Guía, página de datos y *modo programador* para preparar palabras. Las *primeras palabras están en preparación*.'],
  ['Sigue', 'arrow-right', '*Iniciar a utilizar* con la cámara, más palabras preparadas y cuentas para guardar tu perfil.'],
];

const PILLARS: [string, string, string][] = [
  ['scan-face', 'Lee tus labios', 'Sigue *478 puntos* de tu cara y se queda con los *40 de la boca*.'],
  ['sparkles', 'Palabras preparadas', 'Las prepara *nuestro equipo*, con cuidado.'],
  ['volume', 'Habla en voz alta', 'La palabra suena al instante, con *la voz de tu teléfono*.'],
  ['wifi-off', 'Sin internet', 'Todo corre dentro del teléfono, *incluso sin señal*.'],
];

interface Who {
  id: string;
  tab: string;
  icon: string;
  title: string;
  body: string;
  before: string;
  after: string;
  points: string[];
  note?: string;
}

const WHO: Who[] = [
  {
    id: 'traqueo',
    tab: 'Traqueostomía',
    icon: 'wind',
    title: 'Respiras por la cánula, hablas con los labios.',
    body: 'La cánula desvía el aire y la voz no sale. *Tus labios siguen formando cada palabra*: Voz Propia las lee y las dice.',
    before: 'Pizarrón, señas o esperar a que alguien adivine.',
    after: 'Mueves los labios y *suena tu palabra*.',
    points: ['Sin tapar la cánula', 'Acostado o sentado', 'Frases para pedir lo urgente'],
    note: 'Funciona mientras puedas mover los labios.',
  },
  {
    id: 'laringe',
    tab: 'Laringectomía',
    icon: 'heart',
    title: 'Después de la cirugía, tu voz no se queda atrás.',
    body: 'Mientras aprendes otras formas de hablar, Voz Propia te da *una voz desde el primer día*, con la que tu familia eligió.',
    before: 'Días sin poder pedir lo más básico.',
    after: '*Una voz lista* desde el primer día.',
    points: ['Desde el primer día', 'Voz elegida por tu familia', 'Sin aparatos extra'],
  },
  {
    id: 'uci',
    tab: 'Terapia intensiva',
    icon: 'bed',
    title: 'Despierto, con tubo y sin poder decir «me duele».',
    body: 'En un cuarto de hospital sin señal, Voz Propia funciona igual: *todo corre dentro del teléfono*, sin internet.',
    before: 'El *37.7%* de los intentos de explicar el dolor fallan.',
    after: 'Dices «Me duele» y *el equipo lo escucha*.',
    points: ['Funciona sin internet', 'Sí, no y dolor', 'Pregunta si duda'],
  },
  {
    id: 'ela',
    tab: 'ELA',
    icon: 'activity',
    title: 'Mientras puedas mover los labios, puedes seguir diciendo.',
    body: 'Con ELA el habla se debilita poco a poco. Voz Propia puede *acompañar esa etapa*. No reemplaza otras ayudas de comunicación.',
    before: 'Cada vez es más difícil que te entiendan.',
    after: 'Palabras *claras*, con la voz del teléfono.',
    points: ['Acompaña la etapa con labios', 'Palabras preparadas con cuidado', 'Complementa otras ayudas'],
    note: 'Cuando los labios ya no se muevan, harán falta otras ayudas.',
  },
  {
    id: 'salud',
    tab: 'Personal de salud',
    icon: 'stethoscope',
    title: 'Entender a la primera.',
    body: 'Cuando la persona puede decir lo que necesita, el equipo *responde más rápido* y con menos adivinanzas.',
    before: 'Preguntar una y otra vez, y leer gestos.',
    after: 'Recibir *la palabra exacta*: dolor, sed, falta de aire.',
    points: ['Frases básicas de hospital', 'Sin instalar equipos', 'Funciona sin internet'],
    note: 'Es una ayuda para comunicarse. No sustituye la valoración clínica.',
  },
  {
    id: 'familia',
    tab: 'Su familia',
    icon: 'hand-heart',
    title: 'Dejar de adivinar.',
    body: 'Señas, pizarrones y papelitos cansan y se malentienden. Con Voz Propia la familia escucha *la palabra exacta*.',
    before: 'Adivinar, preguntar una y otra vez.',
    after: 'Escuchar la palabra exacta, *sin adivinar*.',
    points: ['Menos frustración', 'Respuestas al instante', 'Nada se graba ni se envía'],
  },
];

interface Step {
  name: string;
  icon: string;
  title: string;
  body: string;
  tech: string;
}

const STEPS: Step[] = [
  { name: 'Mira', icon: 'scan-face', title: 'La cámara sigue tu cara.', body: 'Sigue *478 puntos* de tu cara, hasta *30 veces por segundo*. *No graba video.*', tech: 'Detector de rostro MediaPipe, dentro del teléfono.' },
  { name: 'Boca', icon: 'activity', title: 'Se queda con tus labios.', body: 'De esos puntos usa *los 40 que dibujan la boca*. Aunque te muevas o te alejes, la forma se mide igual.', tech: 'Los números se ajustan al tamaño de tu cara.' },
  { name: 'Compara', icon: 'brain', title: 'Compara con lo preparado.', body: 'Pone la *secuencia de formas* de tus labios junto a cada palabra que preparó nuestro equipo.', tech: 'Alineación en el tiempo (DTW): da igual si hablas más rápido o más lento.' },
  { name: 'Elige', icon: 'help', title: 'Elige, o te pregunta.', body: 'Si una palabra gana con claridad, la elige. *Si dos se parecen, te muestra las opciones* y tú eliges.', tech: 'Con poca seguridad, pide confirmar antes de hablar.' },
  { name: 'Habla', icon: 'volume', title: 'Suena al instante.', body: 'La palabra se dice *en voz alta* con la voz de tu teléfono, la que tu familia eligió.', tech: 'Voz del dispositivo. No necesita internet.' },
];

const TAGS: [string, string][] = [
  ['scan-face', 'Detección de rostro (MediaPipe)'],
  ['brain', 'Comparación en el tiempo (DTW)'],
  ['download', 'App web instalable (PWA)'],
  ['wifi-off', 'Funciona sin internet'],
  ['volume', 'Voz del dispositivo'],
  ['lock', 'Datos solo en tu dispositivo'],
];

const DEMO = ['Tengo sed', 'Me duele', 'Tengo frío', 'Llama a mi familia'];

const PREP: [string, string, string][] = [
  ['Grabamos', 'camera', 'De *1 a 5 ejemplos* de la palabra, con la cámara.'],
  ['Convertimos', 'cpu', 'Cada ejemplo se vuelve *números* con la forma de los labios.'],
  ['Probamos', 'activity', 'Revisamos que *no se confunda* con otras palabras.'],
  ['Publicamos', 'sparkles', 'La palabra aparece en la guía, *lista para escucharse*.'],
];

interface Layer {
  name: string;
  icon: string;
  saved: boolean;
  text: string;
}

const LAYERS: Layer[] = [
  { name: 'La cámara', icon: 'camera', saved: false, text: 'Ve tu cara solo mientras hablas. *El video no se graba ni se envía* a ningún lado.' },
  { name: '478 puntos', icon: 'scan-face', saved: false, text: 'Tu cara se convierte en puntos al momento. Los puntos *se usan y se descartan*.' },
  { name: '40 de la boca', icon: 'activity', saved: false, text: 'Se queda solo con los puntos de tus labios para medir su forma.' },
  { name: 'Números', icon: 'cpu', saved: true, text: 'La forma de los labios en números. *Es lo único que se guarda*, y vive solo en el dispositivo.' },
];

const PROMISES: [string, string, string][] = [
  ['wifi-off', 'Sin internet', 'Todo corre dentro del teléfono.'],
  ['shield-check', 'Sin video guardado', 'Solo números con la forma de los labios.'],
  ['sparkles', 'Palabras preparadas', 'Nuestro equipo cuida cada palabra.'],
  ['volume', 'Tu voz, tu decisión', 'Suena con la voz que tu familia eligió.'],
];

const MOMENTS: { tab: string; icon: string; before: string; after: string }[] = [
  { tab: 'De madrugada', icon: 'moon', before: 'Tienes sed y no hay nadie cerca. Intentas llamar, pero sin voz.', after: 'Mueves los labios: «Tengo sed». *El teléfono lo dice en voz alta.*' },
  { tab: 'Con el equipo médico', icon: 'stethoscope', before: 'Quieres decir que te duele y te responden con preguntas que no puedes contestar.', after: 'Dices «Me duele». Si dudan, *tú respondes «Sí» o «No»*.' },
  { tab: 'Con tu familia', icon: 'hand-heart', before: 'Tu familia adivina y tú niegas con la cabeza.', after: 'Dices «Gracias» o «Llama a mi familia», *con tu voz*.' },
];

const COMPARE: [string, string][] = [
  ['Escribir en un papel, con las manos cansadas', 'Mover los labios, como siempre'],
  ['Señas que se malentienden', 'La palabra exacta, en voz alta'],
  ['Esperar a que alguien adivine', 'Al instante, en milisegundos'],
  ['Apps que necesitan internet', 'Funciona en modo avión'],
];

const LIMITS: { tab: string; icon: string; items: string[] }[] = [
  {
    tab: 'Lo que hace hoy',
    icon: 'check',
    items: [
      'Lee tus labios con la cámara del teléfono.',
      'Dice la palabra *en voz alta*.',
      'Funciona *sin internet*.',
      'Si duda, *te pregunta* y tú eliges.',
      '*No graba ni envía video.*',
    ],
  },
  {
    tab: 'Lo que todavía no',
    icon: 'x',
    items: [
      'Entender cualquier frase: *solo las palabras preparadas*.',
      'Leer labios tapados con cubrebocas o con la mano.',
      'Funcionar bien con poca luz: *mejor con luz de frente*.',
      'Reemplazar la atención del personal de salud.',
      'Guardar tu perfil en una cuenta (*muy pronto*).',
    ],
  },
];

const EASY: [string, string][] = [
  ['type', 'Letras grandes y buen contraste'],
  ['hand', 'Botones grandes, fáciles de tocar'],
  ['user', 'Sin cuenta para empezar'],
  ['message-circle', 'Todo en español'],
  ['wifi-off', 'Funciona sin internet'],
  ['eye', 'Un paso a la vez'],
];

const FAQ: [string, string][] = [
  ['¿Necesita internet?', '*No.* Después de abrirla por primera vez con internet, todo corre dentro del teléfono, incluso en un cuarto de hospital sin señal.'],
  ['¿Guarda mi video?', '*No.* La cámara no graba ni envía video. Solo trabaja con números de la forma de tus labios.'],
  ['¿Qué pasa si se equivoca?', 'Si no está segura, *te muestra las opciones y tú eliges*. Con poca seguridad, te pide confirmar antes de hablar.'],
  ['¿Cuántas palabras entiende?', 'Las que prepara nuestro equipo. *Las primeras están en preparación* y se irán sumando.'],
  ['¿Quién prepara las palabras?', '*Nuestro equipo.* Graba varios ejemplos de cada palabra y los convierte en números. La persona usuaria no tiene que crear nada.'],
  ['¿Funciona con cubrebocas o con la mano en la boca?', '*No.* Necesita ver tus labios. Sin cubrebocas y sin tapar la boca.'],
  ['¿Qué luz necesita?', 'Mejor con *buena luz de frente*, no por detrás. El teléfono a la altura de tu cara, a un brazo de distancia.'],
  ['¿Qué tan rápido es?', 'Compara en *milisegundos*. La palabra suena casi al mismo tiempo que terminas de decirla.'],
  ['¿Se puede instalar en el teléfono?', '*Sí.* Es una app web: se puede instalar desde el navegador y abrirse como cualquier app.'],
  ['¿Es un dispositivo médico?', '*No.* Es una ayuda para comunicarse. No reemplaza la atención del personal de salud.'],
];

const TERMS: [string, string][] = [
  ['Traqueostomía', 'Una abertura en el cuello, con una cánula, por donde entra el aire. Si el aire no pasa por las cuerdas vocales, *la voz no sale*.'],
  ['Laringectomía', 'Cirugía que quita la laringe, donde están las cuerdas vocales. Se hace, por ejemplo, por *cáncer de laringe*.'],
  ['Intubación', 'Un tubo que pasa por la boca hasta la tráquea para ayudar a respirar. *Con él no se puede hablar.*'],
  ['ELA', 'Esclerosis lateral amiotrófica. Enfermedad que *debilita poco a poco los músculos*, incluidos los del habla.'],
  ['Disartria', 'Dificultad para pronunciar por *debilidad de los músculos del habla*.'],
  ['Afonía', 'Pérdida de la voz: la persona *mueve la boca*, pero el sonido no sale.'],
];

const ROUTE: { when: string; icon: string; items: string[] }[] = [
  { when: 'Hoy', icon: 'check', items: ['Guía de cómo funciona', 'Página de datos y fuentes', 'Modo programador para preparar palabras', 'Funciona sin internet'] },
  { when: 'Muy pronto', icon: 'lock', items: ['Iniciar a utilizar con la cámara', 'Inicio de sesión y cuenta'] },
  { when: 'Después', icon: 'sparkles', items: ['Más palabras preparadas', 'Pruebas con personal de salud y familias'] },
];

const NAV: [string, string][] = [
  ['a-top', 'Inicio'],
  ['a-resumen', 'Resumen'],
  ['a-que', 'Qué es'],
  ['a-datos', 'Datos'],
  ['a-quien', 'A quién ayuda'],
  ['a-como', 'Cómo funciona'],
  ['a-demo', 'Pruébalo'],
  ['a-palabras', 'Palabras'],
  ['a-priv', 'Privacidad'],
  ['a-ayuda', 'Cómo te ayuda'],
  ['a-limites', 'Alcances y límites'],
  ['a-faq', 'Preguntas'],
  ['a-ruta', 'Ruta'],
  ['a-fuentes', 'Fuentes'],
];

/* ---------- Plantilla ---------- */

function template() {
  const facts = FACTS.map(
    (d, i) => `
    <section class="a-sec a-data" id="a-f${i}" data-nav="a-datos" data-shape="${d.shape}" aria-labelledby="a-d${i}">
      <div class="a-copy">
        <p class="a-over">[ 0${i + 1} · ${d.over} ]</p>
        <h3 class="a-num" id="a-d${i}">${d.count === null ? `<b class="a-num__txt">${d.big}</b>` : `<b data-count="${d.count}">0</b>`}${d.unit ? `<span>${d.unit}</span>` : ''}</h3>
        <p class="a-title">${d.title}</p>
        <p class="a-body">${rich(d.body)}</p>
        ${d.extra ? `<p class="a-extra">${icon('info', 18)}<span>${rich(d.extra)}</span></p>` : ''}
        ${srcLinks(d.sources)}
      </div>
    </section>`,
  ).join('');

  const glance = FACTS.map(
    (d, i) => `<li><button class="a-gl" type="button" data-jump="a-f${i}">
      <b>${d.count === null ? d.big : `<span data-count="${d.count}">0</span> ${d.gu}`}</b>
      <span>${d.gl}</span><i aria-hidden="true">${icon('arrow-right', 16, 2.4)}</i>
    </button></li>`,
  ).join('');

  const summary = SUMMARY.map(
    ([t, ic, d]) => `<li class="a-sum__i"><span class="a-sum__ic">${icon(ic, 22, 1.9)}</span><small>${t}</small><p>${rich(d)}</p></li>`,
  ).join('');

  const pillars = PILLARS.map(
    ([ic, t, d]) => `<li class="a-pillar"><span class="a-pillar__ic">${icon(ic, 24, 1.9)}</span><h3>${t}</h3><p>${rich(d)}</p></li>`,
  ).join('');

  const whoTabs = WHO.map(
    (w, i) => `<button class="a-tab" type="button" role="tab" id="a-tab-${w.id}" aria-controls="a-who-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-who="${i}">${icon(w.icon, 18)}<span>${w.tab}</span></button>`,
  ).join('');

  const stepNav = STEPS.map(
    (s, i) => `<button class="a-sn" type="button" role="tab" id="a-sn-${i}" aria-controls="a-step-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-step="${i}"><b>${i + 1}</b><span>${s.name}</span></button>`,
  ).join('');

  const tags = TAGS.map(([ic, t]) => `<li>${icon(ic, 16)}<span>${t}</span></li>`).join('');

  const demoChips = DEMO.map((t, i) => `<button class="a-chip" type="button" data-demo="${i}" aria-pressed="false">${t}</button>`).join('');
  const demoRows = DEMO.map((t) => `<div class="a-row"><span>${t}</span><div class="a-track"><i></i></div><b>0%</b></div>`).join('');

  const cats = Array.from(new Set(DEFAULT_PHRASES.map((p) => p.category)));
  const catTabs = cats
    .map((c, i) => `<button class="a-tab a-tab--sm" type="button" role="tab" id="a-cat-${c}" aria-controls="a-cat-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-cat="${i}"><span>${CATEGORY_LABEL[c]}</span></button>`)
    .join('');

  const prep = PREP.map(
    ([t, ic, d], i) => `<li class="a-prep__i"><span class="a-prep__n">${i + 1}</span><span class="a-prep__ic">${icon(ic, 20)}</span><div><h4>${t}</h4><p>${rich(d)}</p></div></li>`,
  ).join('');

  const layerTabs = LAYERS.map(
    (l, i) => `<button class="a-layer" type="button" role="tab" id="a-ly-${i}" aria-controls="a-layer-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-layer="${i}"><span class="a-layer__ic">${icon(l.icon, 20)}</span><span>${l.name}</span>${i < LAYERS.length - 1 ? `<i class="a-layer__arrow" aria-hidden="true">${icon('chevron-right', 16)}</i>` : ''}</button>`,
  ).join('');

  const promises = PROMISES.map(
    ([ic, t, d]) => `<li class="a-promise"><span class="a-promise__ic">${icon(ic, 22, 1.9)}</span><div><h3>${t}</h3><p>${d}</p></div></li>`,
  ).join('');

  const momentTabs = MOMENTS.map(
    (m, i) => `<button class="a-tab a-tab--sm" type="button" role="tab" id="a-mo-${i}" aria-controls="a-moment-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-moment="${i}">${icon(m.icon, 16)}<span>${m.tab}</span></button>`,
  ).join('');

  const compare = COMPARE.map(
    ([a, b]) => `<li><span class="a-cmp__before">${icon('x', 18, 2.4)}${a}</span><span class="a-cmp__after">${icon('check', 18, 2.6)}${b}</span></li>`,
  ).join('');

  const stats = [
    ['478', 'puntos de tu cara'],
    ['40', 'puntos de tu boca'],
    ['30', 'lecturas por segundo'],
    ['0', 'videos guardados'],
  ]
    .map(([v, l]) => `<li><b data-count="${v}">0</b><span>${l}</span></li>`)
    .join('');

  const limTabs = LIMITS.map(
    (l, i) => `<button class="a-tab a-tab--sm" type="button" role="tab" id="a-lim-${i}" aria-controls="a-lim-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-lim="${i}">${icon(l.icon, 16, 2.4)}<span>${l.tab}</span></button>`,
  ).join('');

  const easy = EASY.map(([ic, t]) => `<li>${icon(ic, 18)}<span>${t}</span></li>`).join('');

  const faq = FAQ.map(([q, a]) => `<details class="a-q"><summary>${q}<i aria-hidden="true">${icon('chevron-right', 20, 2.4)}</i></summary><p>${rich(a)}</p></details>`).join('');

  const termTabs = TERMS.map(([t], i) => `<button class="a-term" type="button" aria-pressed="${i === 0}" data-term="${i}">${t}</button>`).join('');

  const route = ROUTE.map(
    (r) => `<li class="a-rt"><h3>${icon(r.icon, 18, 2.4)}${r.when}</h3><ul>${r.items.map((t) => `<li>${t}</li>`).join('')}</ul></li>`,
  ).join('');

  const sources = SOURCES.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}${icon('external', 14)}</a></li>`).join('');

  const idx = NAV.map(([id, t], i) => `<li><button type="button" data-jump="${id}" data-idx-item="${id}"><b>${String(i + 1).padStart(2, '0')}</b>${t}</button></li>`).join('');

  return `
  <div class="ayuda" data-ayuda-page>
    <div class="a-stage" aria-hidden="true"><canvas></canvas></div>
    <i class="a-progress" aria-hidden="true"></i>
    ${paletteHTML()}
    <button class="a-idx-btn" type="button" data-idx aria-expanded="false" aria-controls="a-idx">${icon('layout-grid', 18)}<span>Índice</span></button>
    <nav class="a-idx" id="a-idx" aria-label="Índice de la página" hidden><p>Ir a…</p><ol>${idx}</ol></nav>

    <section class="a-sec a-hero" id="a-top" data-nav="a-top" data-shape="${S.lips}" aria-labelledby="a-hero-t">
      <div class="a-copy">
        <p class="a-over">[ Cómo funciona y cómo te ayuda ]</p>
        <h1 class="a-h1" id="a-hero-t">Perdieron la voz.<br><em>No las palabras.</em></h1>
        <p class="a-body a-body--lead">Datos reales, a quién ayuda Voz Propia y cómo lee tus labios, paso a paso.</p>
        <div class="a-actions">
          <button class="a-btn a-btn--main" type="button" data-jump="a-datos">${icon('arrow-down', 18, 2.4)}<span>Ver los datos</span></button>
          <button class="a-btn" type="button" data-jump="a-demo">${icon('play', 18, 2.2)}<span>Probar la demo</span></button>
          <button class="a-btn" type="button" data-jump="a-faq">${icon('help', 18, 2.2)}<span>Preguntas</span></button>
        </div>
        <p class="a-hint">${icon('pointer', 16)} Mueve el mouse o toca la pantalla: los puntos te siguen. Haz clic y suéltalo.</p>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-resumen" data-nav="a-resumen" data-shape="${S.lips}" aria-labelledby="a-sum-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Resumen ]</p>
        <h2 class="a-h2" id="a-sum-t">El proyecto en una pantalla.</h2>
        <ul class="a-sum">${summary}</ul>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-que" data-nav="a-que" data-shape="${S.voz}" aria-labelledby="a-que-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Qué es ]</p>
        <h2 class="a-h2" id="a-que-t">Una voz que vive en tu teléfono.</h2>
        <p class="a-body">${rich('Voz Propia lee *el movimiento de tus labios* y lo dice en voz alta. Es para quien *perdió la voz*, pero todavía puede mover la boca.')}</p>
        <ul class="a-pillars">${pillars}</ul>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-datos" data-nav="a-datos" data-shape="${S.datos}" aria-labelledby="a-dat-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Datos ]</p>
        <h2 class="a-h2" id="a-dat-t">Los números, en una mirada.</h2>
        <p class="a-body">Cifras reales de México y del mundo. Toca una para ver el detalle y su fuente.</p>
        <ul class="a-glance">${glance}</ul>
      </div>
    </section>

    ${facts}

    <section class="a-sec a-dense" id="a-quien" data-nav="a-quien" data-shape="${S.corazon}" aria-labelledby="a-who-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ A quién ayuda ]</p>
        <h2 class="a-h2" id="a-who-t">Hecha para quien todavía mueve los labios.</h2>
        <div class="a-tabs" role="tablist" aria-label="A quién ayuda">${whoTabs}</div>
        <div class="a-panel" id="a-who-panel" role="tabpanel" aria-labelledby="a-tab-${WHO[0].id}" data-who-panel></div>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-como" data-nav="a-como" data-shape="${S.onda}" aria-labelledby="a-how-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Cómo funciona ]</p>
        <h2 class="a-h2" id="a-how-t">Cinco pasos, menos de un segundo.</h2>
        <div class="a-stepper">
          <div class="a-stepper__nav" role="tablist" aria-label="Pasos">${stepNav}</div>
          <div class="a-panel a-panel--step" id="a-step-panel" role="tabpanel" aria-labelledby="a-sn-0" data-step-panel></div>
          <div class="a-stepper__ctl">
            <button class="a-round" type="button" data-step-prev aria-label="Paso anterior">${icon('chevron-left', 20, 2.4)}</button>
            <i class="a-bar" aria-hidden="true"><b data-step-bar></b></i>
            <button class="a-round" type="button" data-step-next aria-label="Paso siguiente">${icon('chevron-right', 20, 2.4)}</button>
          </div>
        </div>
        <h3 class="a-h3">Hecha con</h3>
        <ul class="a-tags">${tags}</ul>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-demo" data-nav="a-demo" data-shape="${S.lips}" aria-labelledby="a-demo-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Pruébalo ]</p>
        <h2 class="a-h2" id="a-demo-t">Míralo leer.</h2>
        <div class="a-demo">
          <div class="a-demo__top"><h3>Elige una palabra</h3><span class="a-live" data-live>${icon('scan-face', 16)} Esperando</span></div>
          <p class="a-demo__p">Toca una palabra: así compara tu movimiento con las que preparamos y elige la más parecida.</p>
          <div class="a-chips" role="group" aria-label="Palabras de ejemplo">${demoChips}</div>
          <div class="a-rows" aria-live="polite">${demoRows}</div>
          <p class="a-said" data-said hidden></p>
          <p class="a-note">Ejemplo ilustrativo: aquí no se usa la cámara.</p>
        </div>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-palabras" data-nav="a-palabras" data-shape="${S.hola}" aria-labelledby="a-pal-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Palabras ]</p>
        <h2 class="a-h2" id="a-pal-t">Las que prepara el equipo.</h2>
        <p class="a-body">${rich('Estas son las frases que más piden las personas sin voz en un hospital. *Nuestro equipo las está preparando una por una.* Toca una para escucharla.')}</p>
        <div class="a-tabs" role="tablist" aria-label="Categorías de palabras">${catTabs}</div>
        <div class="a-panel a-panel--words" id="a-cat-panel" role="tabpanel" aria-labelledby="a-cat-${cats[0]}" data-cat-panel></div>
        <p class="a-note">Todavía no están todas listas. Cuando una esté lista, aparece en la guía.</p>
        <h3 class="a-h3">Cómo preparamos cada palabra</h3>
        <ol class="a-prep">${prep}</ol>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-priv" data-nav="a-priv" data-shape="${S.cero}" aria-labelledby="a-priv-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Privacidad ]</p>
        <h2 class="a-h2" id="a-priv-t">Tu cara se queda contigo.</h2>
        <p class="a-body">${rich('Toca cada paso para ver qué pasa con tu imagen y *qué se guarda*.')}</p>
        <div class="a-layers" role="tablist" aria-label="Qué pasa con tu imagen">${layerTabs}</div>
        <div class="a-panel a-panel--layer" id="a-layer-panel" role="tabpanel" aria-labelledby="a-ly-0" data-layer-panel></div>
        <ul class="a-promises">${promises}</ul>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-ayuda" data-nav="a-ayuda" data-shape="${S.tuvoz}" aria-labelledby="a-cmp-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Cómo te ayuda ]</p>
        <h2 class="a-h2" id="a-cmp-t">Antes y con Voz Propia.</h2>
        <div class="a-switch" role="radiogroup" aria-label="Comparar">
          <button type="button" role="radio" aria-checked="false" data-cmp="0">Sin Voz Propia</button>
          <button type="button" role="radio" aria-checked="true" data-cmp="1">Con Voz Propia</button>
        </div>
        <ul class="a-cmp__list" data-cmp-list data-on="1">${compare}</ul>
        <h3 class="a-h3">Un momento cualquiera</h3>
        <div class="a-tabs" role="tablist" aria-label="Momentos">${momentTabs}</div>
        <div class="a-panel a-panel--moment" id="a-moment-panel" role="tabpanel" aria-labelledby="a-mo-0" data-moment-panel></div>
        <p class="a-note">Ejemplos ilustrativos.</p>
        <ul class="a-app">${stats}</ul>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-limites" data-nav="a-limites" data-shape="${S.limites}" aria-labelledby="a-lim-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Alcances y límites ]</p>
        <h2 class="a-h2" id="a-lim-t">Lo que hace, y lo que todavía no.</h2>
        <p class="a-body">${rich('Decir con claridad *hasta dónde llega* también es parte de cuidar a quien la usa.')}</p>
        <div class="a-tabs" role="tablist" aria-label="Alcances y límites">${limTabs}</div>
        <div class="a-panel a-panel--lim" id="a-lim-panel" role="tabpanel" aria-labelledby="a-lim-0" data-lim-panel></div>
        <h3 class="a-h3">Pensada para ser fácil</h3>
        <ul class="a-easy">${easy}</ul>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-faq" data-nav="a-faq" data-shape="${S.duda}" aria-labelledby="a-faq-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Preguntas ]</p>
        <h2 class="a-h2" id="a-faq-t">Lo que más se pregunta.</h2>
        <div class="a-faq">${faq}</div>
        <h3 class="a-h3">Palabras que conviene conocer</h3>
        <div class="a-terms" role="group" aria-label="Glosario">${termTabs}</div>
        <p class="a-def" data-term-panel aria-live="polite"></p>
      </div>
    </section>

    <section class="a-sec a-dense" id="a-ruta" data-nav="a-ruta" data-shape="${S.ruta}" aria-labelledby="a-rt-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Ruta ]</p>
        <h2 class="a-h2" id="a-rt-t">Dónde estamos y lo que sigue.</h2>
        <ul class="a-route">${route}</ul>
      </div>
    </section>

    <section class="a-sec a-end" data-nav="a-fuentes" data-shape="${S.voz}" aria-labelledby="a-end-t">
      <div class="a-copy">
        <p class="a-over">[ Empieza ]</p>
        <h2 class="a-h2" id="a-end-t">Tus labios ya saben hablar.</h2>
        <p class="a-body">Entra como usuario para ver, pantalla por pantalla, cómo se usa.</p>
        <div class="a-actions">
          <button class="a-cta" type="button" data-to-guide>${icon('user', 20)}<span>Entrar como usuario</span>${icon('arrow-right', 20)}</button>
          <button class="a-btn" type="button" data-jump="a-top">${icon('arrow-up', 18, 2.4)}<span>Volver arriba</span></button>
        </div>
      </div>
    </section>

    <section class="a-sources" id="a-fuentes" aria-labelledby="a-src-t">
      <h2 id="a-src-t">Fuentes</h2>
      <ol>${sources}</ol>
      <p>Las cifras describen a toda la población con esas condiciones. Voz Propia está pensada para quienes de ellas todavía pueden mover los labios. Es una ayuda para comunicarse, no un dispositivo médico.</p>
    </section>
  </div>`;
}

/* ---------- Vista ---------- */

export function ayudaView(root: HTMLElement) {
  root.innerHTML = template();
  const el = root.querySelector<HTMLElement>('[data-ayuda-page]')!;
  const stage = el.querySelector<HTMLElement>('.a-stage')!;
  const still = reducedMotion();
  if (still) el.classList.add('is-static');
  const ac = new AbortController();
  const { signal } = ac;
  let field: Field | null = null;
  let disposed = false;
  let active = 0;

  void (async () => {
    try {
      const { createField } = await import('./ayuda-field');
      if (disposed) return;
      field = createField(stage, stage.querySelector('canvas')!, SHAPES, { reducedMotion: still, palette: currentTheme() });
      field.setShape(active);
      el.classList.add('has-field');
    } catch {
      el.classList.add('no-webgl');
    }
  })();

  const offPalette = bindPalette(el);
  addEventListener('palette', (e) => field?.setPalette((e as CustomEvent<Theme>).detail), { signal });

  /* ---------- Sección al centro: cambia la figura de los puntos y marca el índice ---------- */

  const idxItems = Array.from(el.querySelectorAll<HTMLElement>('[data-idx-item]'));
  const secs = Array.from(el.querySelectorAll<HTMLElement>('[data-shape]'));
  const center = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const t = en.target as HTMLElement;
        active = Number(t.dataset.shape);
        field?.setShape(active);
        idxItems.forEach((b) => b.classList.toggle('is-on', b.dataset.idxItem === t.dataset.nav));
      }
    },
    { rootMargin: '-48% 0px -48% 0px' },
  );
  secs.forEach((s) => center.observe(s));

  const srcBox = el.querySelector<HTMLElement>('.a-sources')!;
  const tail = new IntersectionObserver(([en]) => field?.setVisible(!en.isIntersecting || en.intersectionRatio < 0.5), { threshold: [0, 0.5] });
  tail.observe(srcBox);

  /* ---------- Barra de avance ---------- */

  const bar = el.querySelector<HTMLElement>('.a-progress')!;
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : '0');
    });
  };
  addEventListener('scroll', onScroll, { passive: true, signal });
  onScroll();

  /* ---------- Aparición y conteo de cifras ---------- */

  const fmt = new Intl.NumberFormat('es-MX');
  const countUp = (b: HTMLElement) => {
    const to = Number(b.dataset.count);
    if (still || to <= 1) {
      b.textContent = fmt.format(to);
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 1400);
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
    { threshold: 0.08 },
  );
  el.querySelectorAll('.a-copy, .a-sources').forEach((n) => reveal.observe(n));

  /* ---------- Pestañas con teclado ---------- */

  const offs: (() => void)[] = [];
  const tabs = (attr: string, show: (i: number) => void) => {
    const all = () => Array.from(el.querySelectorAll<HTMLElement>(`[data-${attr}]`));
    const set = (i: number, focus = false) => {
      const list = all();
      list.forEach((t, n) => {
        t.setAttribute('aria-selected', String(n === i));
        t.tabIndex = n === i ? 0 : -1;
      });
      if (focus) list[i]?.focus();
      show(i);
    };
    offs.push(on(el, 'click', `[data-${attr}]`, (_, b) => set(Number(b.dataset[attr]))));
    offs.push(
      on(el, 'keydown', `[data-${attr}]`, (e, b) => {
        const n = all().length;
        const i = Number(b.dataset[attr]);
        const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n : -1;
        if (next < 0) return;
        e.preventDefault();
        set(next, true);
      }),
    );
    return set;
  };
  const swap = (p: HTMLElement) => {
    p.classList.remove('is-swap');
    void p.offsetWidth;
    p.classList.add('is-swap');
  };

  /* A quién ayuda */
  const whoPanel = el.querySelector<HTMLElement>('[data-who-panel]')!;
  const setWho = tabs('who', (i) => {
    const w = WHO[i];
    whoPanel.setAttribute('aria-labelledby', `a-tab-${w.id}`);
    whoPanel.innerHTML = `
      <span class="a-panel__ic">${icon(w.icon, 28, 1.8)}</span>
      <h3>${w.title}</h3>
      <p>${rich(w.body)}</p>
      <div class="a-ba">
        <div class="a-ba__b"><small>Antes</small><span>${rich(w.before)}</span></div>
        <div class="a-ba__a"><small>Con Voz Propia</small><span>${rich(w.after)}</span></div>
      </div>
      <ul>${w.points.map((p) => `<li>${icon('check', 16, 2.6)}${p}</li>`).join('')}</ul>
      ${w.note ? `<p class="a-panel__note">${icon('info', 16)}${w.note}</p>` : ''}`;
    swap(whoPanel);
  });
  setWho(0);

  /* Cómo funciona: pasos */
  const stepPanel = el.querySelector<HTMLElement>('[data-step-panel]')!;
  const stepBar = el.querySelector<HTMLElement>('[data-step-bar]')!;
  let stepIdx = 0;
  const setStep = tabs('step', (i) => {
    stepIdx = i;
    const s = STEPS[i];
    stepPanel.setAttribute('aria-labelledby', `a-sn-${i}`);
    stepPanel.innerHTML = `
      <span class="a-panel__ic a-panel__ic--lg">${icon(s.icon, 34, 1.8)}</span>
      <p class="a-panel__n">Paso ${i + 1} de ${STEPS.length}</p>
      <h3>${s.title}</h3>
      <p>${rich(s.body)}</p>
      <p class="a-tech">${icon('cpu', 16)}<span>${s.tech}</span></p>`;
    stepBar.style.setProperty('--p', String((i + 1) / STEPS.length));
    swap(stepPanel);
  });
  setStep(0);
  offs.push(on(el, 'click', '[data-step-next]', () => setStep((stepIdx + 1) % STEPS.length)));
  offs.push(on(el, 'click', '[data-step-prev]', () => setStep((stepIdx - 1 + STEPS.length) % STEPS.length)));

  /* Palabras: se escuchan al tocarlas */
  const cats = Array.from(new Set(DEFAULT_PHRASES.map((p) => p.category)));
  const catPanel = el.querySelector<HTMLElement>('[data-cat-panel]')!;
  const setCat = tabs('cat', (i) => {
    const c = cats[i];
    catPanel.setAttribute('aria-labelledby', `a-cat-${c}`);
    catPanel.innerHTML = `<div class="a-says">${DEFAULT_PHRASES.filter((p) => p.category === c)
      .map((p) => `<button class="a-say" type="button" data-say="${esc(p.text)}"><span class="a-say__ic">${icon(p.icon, 20)}</span><span>${esc(p.text)}</span>${icon('volume', 18)}</button>`)
      .join('')}</div>`;
    swap(catPanel);
  });
  setCat(0);
  offs.push(
    on(el, 'click', '[data-say]', (_, b) => {
      b.classList.add('is-saying');
      void speakText(b.dataset.say!, state.settings).finally(() => b.classList.remove('is-saying'));
    }),
  );

  /* Privacidad por capas */
  const layerPanel = el.querySelector<HTMLElement>('[data-layer-panel]')!;
  const setLayer = tabs('layer', (i) => {
    const l = LAYERS[i];
    layerPanel.setAttribute('aria-labelledby', `a-ly-${i}`);
    layerPanel.innerHTML = `
      <span class="a-badge ${l.saved ? 'a-badge--on' : ''}">${icon(l.saved ? 'cpu' : 'shield-check', 16, 2.2)}${l.saved ? 'Solo números, en tu dispositivo' : 'No se guarda'}</span>
      <h3>${l.name}</h3>
      <p>${rich(l.text)}</p>`;
    swap(layerPanel);
  });
  setLayer(0);

  /* Momentos */
  const momentPanel = el.querySelector<HTMLElement>('[data-moment-panel]')!;
  const setMoment = tabs('moment', (i) => {
    const m = MOMENTS[i];
    momentPanel.setAttribute('aria-labelledby', `a-mo-${i}`);
    momentPanel.innerHTML = `
      <div class="a-ba">
        <div class="a-ba__b"><small>Antes</small><span>${rich(m.before)}</span></div>
        <div class="a-ba__a"><small>Con Voz Propia</small><span>${rich(m.after)}</span></div>
      </div>`;
    swap(momentPanel);
  });
  setMoment(0);

  /* Alcances y límites */
  const limPanel = el.querySelector<HTMLElement>('[data-lim-panel]')!;
  const setLim = tabs('lim', (i) => {
    const l = LIMITS[i];
    limPanel.setAttribute('aria-labelledby', `a-lim-${i}`);
    limPanel.classList.toggle('is-no', i === 1);
    limPanel.innerHTML = `<ul class="a-ticks">${l.items.map((t) => `<li>${icon(l.icon, 18, 2.6)}<span>${rich(t)}</span></li>`).join('')}</ul>`;
    swap(limPanel);
  });
  setLim(0);

  /* Glosario */
  const termPanel = el.querySelector<HTMLElement>('[data-term-panel]')!;
  const showTerm = (i: number) => {
    el.querySelectorAll<HTMLElement>('[data-term]').forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
    termPanel.innerHTML = `<b>${TERMS[i][0]}.</b> ${rich(TERMS[i][1])}`;
    swap(termPanel);
  };
  showTerm(0);
  offs.push(on(el, 'click', '[data-term]', (_, b) => showTerm(Number(b.dataset.term))));

  /* ---------- Demostración: elige una palabra y mira cómo «lee» ---------- */

  const rowsEl = Array.from(el.querySelectorAll<HTMLElement>('.a-row'));
  const said = el.querySelector<HTMLElement>('[data-said]')!;
  const live = el.querySelector<HTMLElement>('[data-live]')!;
  let demoRun = 0;
  const runDemo = async (pick: number) => {
    const run = ++demoRun;
    el.querySelectorAll<HTMLElement>('[data-demo]').forEach((b, n) => b.setAttribute('aria-pressed', String(n === pick)));
    said.hidden = true;
    live.classList.add('is-on');
    live.innerHTML = `${icon('scan-face', 16)} Leyendo labios…`;
    const top = 88 + Math.round(Math.random() * 8);
    const scores = DEMO.map(() => 0);
    scores[pick] = top;
    let left = 100 - top;
    const others = DEMO.map((_, n) => n).filter((n) => n !== pick);
    others.forEach((n, k) => {
      const v = k === others.length - 1 ? left : Math.round((100 - top) * [0.6, 0.3][k]);
      scores[n] = v;
      left -= v;
    });
    rowsEl.forEach((r) => {
      r.style.setProperty('--w', '0');
      r.querySelector('b')!.textContent = '0%';
      r.classList.remove('is-top');
    });
    await sleep(still ? 0 : 450);
    if (run !== demoRun || disposed) return;
    rowsEl.forEach((r, n) => {
      r.style.setProperty('--w', String(scores[n] / 100));
      r.querySelector('b')!.textContent = `${scores[n]}%`;
      r.classList.toggle('is-top', n === pick);
    });
    await sleep(still ? 0 : 900);
    if (run !== demoRun || disposed) return;
    live.classList.remove('is-on');
    live.innerHTML = `${icon('check', 16, 2.6)} Listo`;
    said.hidden = false;
    said.innerHTML = `${icon('volume', 20)} Dice: <b>«${DEMO[pick]}»</b>`;
    void speakText(DEMO[pick], state.settings);
  };

  /* ---------- Índice y saltos ---------- */

  const idx = el.querySelector<HTMLElement>('.a-idx')!;
  const idxBtn = el.querySelector<HTMLElement>('[data-idx]')!;
  const openIdx = (open: boolean) => {
    idx.hidden = !open;
    idxBtn.setAttribute('aria-expanded', String(open));
    if (open) idx.querySelector<HTMLElement>('.is-on, button')?.focus();
  };
  addEventListener(
    'pointerdown',
    (e) => {
      if (!idx.hidden && !(e.target as Element).closest('.a-idx, [data-idx]')) openIdx(false);
    },
    { signal },
  );
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

  offs.push(
    on(el, 'click', '[data-idx]', () => openIdx(Boolean(idx.hidden))),
    on(el, 'click', '[data-demo]', (_, b) => void runDemo(Number(b.dataset.demo))),
    on(el, 'click', '[data-cmp]', (_, b) => {
      el.querySelectorAll<HTMLElement>('[data-cmp]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      el.querySelector<HTMLElement>('[data-cmp-list]')!.dataset.on = b.dataset.cmp!;
    }),
    on(el, 'click', '[data-jump]', (e, a) => {
      e.preventDefault();
      openIdx(false);
      el.querySelector(`#${a.dataset.jump}`)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    }),
    on(el, 'click', '[data-to-guide]', () => go('guia')),
  );

  return () => {
    disposed = true;
    offPalette();
    ac.abort();
    offs.forEach((off) => off());
    cancelAnimationFrame(raf);
    center.disconnect();
    tail.disconnect();
    reveal.disconnect();
    field?.dispose();
  };
}
