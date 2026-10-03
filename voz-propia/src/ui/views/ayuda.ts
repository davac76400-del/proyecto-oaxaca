import '@fontsource/anton/latin-400.css';
import { go } from '../../app/router';
import { state } from '../../app/state';
import { speakText } from '../../core/voice/speaker';
import { on, reducedMotion, sleep } from '../dom';
import { icon } from '../icons';
import type { Field, Shape } from './ayuda-field';

const SHAPES: Shape[] = [
  { draw: 'lips' },
  { text: '945 MIL' },
  { text: '189 MIL' },
  { text: '+58 MIL' },
  { text: '54%' },
  { text: '1 DE 3' },
  { draw: 'heart' },
  { draw: 'wave' },
  { text: '478' },
  { text: 'VOZ' },
];

interface Source {
  id: string;
  name: string;
  url: string;
}

const SOURCES: Source[] = [
  { id: 'inegi', name: 'INEGI. Estadísticas a propósito del Día Internacional de las Personas con Discapacidad (Censo 2020), comunicado 713/21.', url: 'https://www.inegi.org.mx/contenidos/saladeprensa/aproposito/2021/EAP_PersDiscap21.pdf' },
  { id: 'globocan', name: 'GLOBOCAN 2022, Agencia Internacional para la Investigación del Cáncer (OMS). Ficha de cáncer de laringe.', url: 'https://gco.iarc.who.int/media/globocan/factsheets/cancers/14-larynx-fact-sheet.pdf' },
  { id: 'traqueo', name: 'Epidemiología de la traqueostomía en Estados Unidos, 2002 a 2017. Critical Care Explorations, 2021.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8437212/' },
  { id: 'happ15', name: 'Happ y colaboradores. Pacientes con ventilador que pueden comunicarse, 2,671 pacientes. Heart & Lung, 2015.', url: 'https://healthmanagement.org/s/over-half-of-icu-patients-on-ventilators-able-to-communicate' },
  { id: 'happ11', name: 'Happ y colaboradores. Comunicación entre enfermería y pacientes intubados en terapia intensiva.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3222584/' },
];

const src = (id: string) => {
  const n = SOURCES.findIndex((s) => s.id === id) + 1;
  return `<a class="a-src" href="#a-fuentes" data-jump="a-fuentes">${icon('info', 15)}Fuente ${n}: ${SOURCES[n - 1].name.split('.')[0]}</a>`;
};

const DATA: { shape: number; over: string; count: number; unit: string; title: string; body: string; source: string }[] = [
  {
    shape: 1,
    over: 'México',
    count: 945,
    unit: 'mil personas',
    title: 'no pueden hablar, o les cuesta muchísimo.',
    body: 'Es lo que contó el Censo 2020: personas con mucha dificultad para hablar o comunicarse, o que no pueden hacerlo. Detrás de cada número hay alguien que sí tiene qué decir.',
    source: 'inegi',
  },
  {
    shape: 2,
    over: 'El mundo',
    count: 189,
    unit: 'mil casos nuevos',
    title: 'de cáncer de laringe en un solo año.',
    body: 'Fue en 2022. Más de 17 mil fueron en América Latina y el Caribe. La cirugía de laringe puede quitar la voz, pero los labios se siguen moviendo.',
    source: 'globocan',
  },
  {
    shape: 3,
    over: 'Traqueostomía',
    count: 58,
    unit: 'mil o más al año',
    title: 'traqueostomías, solo en Estados Unidos.',
    body: 'Entre 2002 y 2017 fueron de 58 mil a casi 90 mil cada año. Con la cánula en el cuello, el aire ya no pasa por las cuerdas vocales y la voz no sale. La boca sí se mueve, y eso es lo que Voz Propia lee.',
    source: 'traqueo',
  },
  {
    shape: 4,
    over: 'Terapia intensiva',
    count: 54,
    unit: 'por ciento',
    title: 'de los pacientes con ventilador están despiertos y podrían comunicarse.',
    body: 'Un estudio con 2,671 pacientes encontró que más de la mitad estaba alerta y respondía. Pero el tubo no les deja hablar.',
    source: 'happ15',
  },
  {
    shape: 5,
    over: 'El dolor',
    count: 1,
    unit: 'de cada 3',
    title: 'conversaciones sobre el dolor no se entienden.',
    body: 'En terapia intensiva, el 37.7% de los intentos de un paciente intubado por explicar su dolor fallaron. Decir «me duele» a tiempo lo cambia todo.',
    source: 'happ11',
  },
];

const WHO: { id: string; tab: string; icon: string; title: string; body: string; points: string[] }[] = [
  {
    id: 'traqueo',
    tab: 'Traqueostomía',
    icon: 'wind',
    title: 'Respiras por la cánula, hablas con los labios.',
    body: 'La cánula desvía el aire y la voz no sale. Tus labios siguen formando cada palabra: Voz Propia las lee y las dice.',
    points: ['Sin tapar la cánula', 'Funciona acostado o sentado', 'Frases para pedir lo urgente'],
  },
  {
    id: 'laringe',
    tab: 'Laringectomía',
    icon: 'heart',
    title: 'Después de la cirugía, tu voz no se queda atrás.',
    body: 'Mientras aprendes otras formas de hablar, Voz Propia te da una voz desde el primer día, con la que tu familia eligió.',
    points: ['Desde el primer día', 'Voz elegida por tu familia', 'Sin aparatos extra'],
  },
  {
    id: 'uci',
    tab: 'Terapia intensiva',
    icon: 'bed',
    title: 'Despierto, con tubo y sin poder decir «me duele».',
    body: 'En un cuarto de hospital sin señal, Voz Propia funciona igual: todo corre dentro del teléfono, sin internet.',
    points: ['Funciona sin internet', 'Sí, no y escala de dolor', 'Pregunta si duda'],
  },
  {
    id: 'familia',
    tab: 'Su familia',
    icon: 'hand-heart',
    title: 'Dejar de adivinar.',
    body: 'Señas, pizarrones y papelitos cansan y se malentienden. Con Voz Propia la familia escucha la palabra exacta.',
    points: ['Menos frustración', 'Respuestas al instante', 'Nada se graba ni se envía'],
  },
];

const STEPS: [string, string, string][] = [
  ['scan-face', 'Mira', 'La cámara sigue 478 puntos de tu cara y se queda con los 40 de la boca.'],
  ['activity', 'Compara', 'Compara tu movimiento con las palabras que preparó nuestro equipo.'],
  ['help', 'Pregunta', 'Si dos palabras se parecen, te muestra las opciones y tú eliges.'],
  ['volume', 'Habla', 'La palabra suena al instante, sin internet.'],
];

const DEMO = ['Tengo sed', 'Me duele', 'Tengo frío', 'Llama a mi familia'];

const COMPARE: [string, string][] = [
  ['Escribir en un papel, con las manos cansadas', 'Mover los labios, como siempre'],
  ['Señas que se malentienden', 'La palabra exacta, en voz alta'],
  ['Esperar a que alguien adivine', 'Al instante, en milisegundos'],
  ['Apps que necesitan internet', 'Funciona en modo avión'],
];

function template() {
  const data = DATA.map(
    (d, i) => `
    <section class="a-sec a-data" data-shape="${d.shape}" aria-labelledby="a-d${i}">
      <div class="a-copy">
        <p class="a-over">[ 0${i + 1} · ${d.over} ]</p>
        <h2 class="a-num" id="a-d${i}"><b data-count="${d.count}">0</b><span>${d.unit}</span></h2>
        <p class="a-title">${d.title}</p>
        <p class="a-body">${d.body}</p>
        ${src(d.source)}
      </div>
    </section>`,
  ).join('');

  const tabs = WHO.map(
    (w, i) => `<button class="a-tab" type="button" role="tab" id="a-tab-${w.id}" aria-controls="a-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-who="${i}">${icon(w.icon, 18)}<span>${w.tab}</span></button>`,
  ).join('');

  const steps = STEPS.map(
    ([ic, t, d], i) => `<li class="a-step" style="--i:${i}"><span class="a-step__n">${i + 1}</span><span class="a-step__ic">${icon(ic, 22, 1.9)}</span><h3>${t}</h3><p>${d}</p></li>`,
  ).join('');

  const demo = DEMO.map((t, i) => `<button class="a-chip" type="button" data-demo="${i}" aria-pressed="false">${t}</button>`).join('');
  const rows = DEMO.map((t) => `<div class="a-row"><span>${t}</span><div class="a-track"><i></i></div><b>0%</b></div>`).join('');

  const compare = COMPARE.map(
    ([a, b]) => `<li><span class="a-cmp__before">${icon('x', 18, 2.4)}${a}</span><span class="a-cmp__after">${icon('check', 18, 2.6)}${b}</span></li>`,
  ).join('');

  const app = [
    ['478', 'puntos de tu cara'],
    ['40', 'puntos de tu boca'],
    ['30', 'lecturas por segundo'],
    ['0', 'videos guardados'],
  ]
    .map(([v, l]) => `<li><b data-count="${v}">0</b><span>${l}</span></li>`)
    .join('');

  const sources = SOURCES.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}${icon('external', 14)}</a></li>`).join('');

  return `
  <div class="ayuda" data-ayuda-page>
    <div class="a-stage" aria-hidden="true"><canvas></canvas></div>

    <section class="a-sec a-hero" data-shape="0" aria-labelledby="a-hero-t">
      <div class="a-copy">
        <p class="a-over">[ Cómo funciona y cómo te ayuda ]</p>
        <h1 class="a-h1" id="a-hero-t">Perdieron la voz.<br><em>No las palabras.</em></h1>
        <p class="a-body a-body--lead">Datos reales, a quién ayuda Voz Propia y cómo lee tus labios, paso a paso.</p>
        <p class="a-hint">${icon('pointer', 16)} Mueve el mouse o toca la pantalla: los puntos te siguen. Haz clic y suéltalo.</p>
        <p class="a-cue">${icon('arrow-down', 16)} Desliza</p>
      </div>
    </section>

    ${data}

    <section class="a-sec a-who" data-shape="6" aria-labelledby="a-who-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ A quién ayuda ]</p>
        <h2 class="a-h2" id="a-who-t">Hecha para quien todavía mueve los labios.</h2>
        <div class="a-tabs" role="tablist" aria-label="A quién ayuda">${tabs}</div>
        <div class="a-panel" id="a-panel" role="tabpanel" aria-labelledby="a-tab-${WHO[0].id}" data-panel></div>
      </div>
    </section>

    <section class="a-sec a-how" data-shape="7" aria-labelledby="a-how-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Cómo funciona ]</p>
        <h2 class="a-h2" id="a-how-t">Cuatro pasos, menos de un segundo.</h2>
        <ol class="a-steps">${steps}</ol>
        <div class="a-demo" aria-labelledby="a-demo-t">
          <div class="a-demo__top"><h3 id="a-demo-t">Míralo leer</h3><span class="a-live" data-live>${icon('scan-face', 16)} Elige una palabra</span></div>
          <p class="a-demo__p">Toca una palabra: así compara tu movimiento con las que preparamos y elige la más parecida.</p>
          <div class="a-chips" role="group" aria-label="Palabras de ejemplo">${demo}</div>
          <div class="a-rows" aria-live="polite">${rows}</div>
          <p class="a-said" data-said hidden></p>
          <p class="a-note">Ejemplo ilustrativo: aquí no se usa la cámara.</p>
        </div>
      </div>
    </section>

    <section class="a-sec a-cmp" data-shape="8" aria-labelledby="a-cmp-t">
      <div class="a-copy a-copy--wide">
        <p class="a-over">[ Cómo te ayuda ]</p>
        <h2 class="a-h2" id="a-cmp-t">Antes y con Voz Propia.</h2>
        <div class="a-switch" role="radiogroup" aria-label="Comparar">
          <button type="button" role="radio" aria-checked="false" data-cmp="0">Sin Voz Propia</button>
          <button type="button" role="radio" aria-checked="true" data-cmp="1">Con Voz Propia</button>
        </div>
        <ul class="a-cmp__list" data-cmp-list data-on="1">${compare}</ul>
        <ul class="a-app">${app}</ul>
      </div>
    </section>

    <section class="a-sec a-end" data-shape="9" aria-labelledby="a-end-t">
      <div class="a-copy">
        <p class="a-over">[ Empieza ]</p>
        <h2 class="a-h2" id="a-end-t">Tus labios ya saben hablar.</h2>
        <p class="a-body">Entra como usuario para ver, pantalla por pantalla, cómo se usa.</p>
        <button class="a-cta" type="button" data-to-guide>${icon('user', 20)}<span>Entrar como usuario</span>${icon('arrow-right', 20)}</button>
      </div>
    </section>

    <section class="a-sources" id="a-fuentes" aria-labelledby="a-src-t">
      <h2 id="a-src-t">Fuentes</h2>
      <ol>${sources}</ol>
      <p>Las cifras describen a toda la población con esas condiciones. Voz Propia está pensada para quienes de ellas todavía pueden mover los labios. Es una ayuda para comunicarse, no un dispositivo médico.</p>
    </section>
  </div>`;
}

export function ayudaView(root: HTMLElement) {
  root.innerHTML = template();
  const el = root.querySelector<HTMLElement>('[data-ayuda-page]')!;
  const stage = el.querySelector<HTMLElement>('.a-stage')!;
  const still = reducedMotion();
  if (still) el.classList.add('is-static');
  let field: Field | null = null;
  let disposed = false;
  let active = 0;

  void (async () => {
    try {
      const { createField } = await import('./ayuda-field');
      if (disposed) return;
      field = createField(stage, stage.querySelector('canvas')!, SHAPES, { reducedMotion: still });
      field.setShape(active);
      el.classList.add('has-field');
    } catch {
      el.classList.add('no-webgl');
    }
  })();

  /* ---------- Qué sección está al centro: cambia la figura de los puntos ---------- */

  const secs = Array.from(el.querySelectorAll<HTMLElement>('[data-shape]'));
  const center = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        active = Number((en.target as HTMLElement).dataset.shape);
        field?.setShape(active);
      }
    },
    { rootMargin: '-48% 0px -48% 0px' },
  );
  secs.forEach((s) => center.observe(s));

  const srcBox = el.querySelector<HTMLElement>('.a-sources')!;
  const tail = new IntersectionObserver(([en]) => field?.setVisible(!en.isIntersecting || en.intersectionRatio < 0.5), { threshold: [0, 0.5] });
  tail.observe(srcBox);

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
    { threshold: 0.25 },
  );
  el.querySelectorAll('.a-copy, .a-sources').forEach((n) => reveal.observe(n));

  /* ---------- A quién ayuda: pestañas ---------- */

  const panel = el.querySelector<HTMLElement>('[data-panel]')!;
  const tabs = Array.from(el.querySelectorAll<HTMLElement>('[data-who]'));
  const showWho = (i: number, focus = false) => {
    const w = WHO[i];
    tabs.forEach((t, n) => {
      t.setAttribute('aria-selected', String(n === i));
      t.tabIndex = n === i ? 0 : -1;
    });
    if (focus) tabs[i].focus();
    panel.setAttribute('aria-labelledby', `a-tab-${w.id}`);
    panel.innerHTML = `
      <span class="a-panel__ic">${icon(w.icon, 28, 1.8)}</span>
      <h3>${w.title}</h3>
      <p>${w.body}</p>
      <ul>${w.points.map((p) => `<li>${icon('check', 16, 2.6)}${p}</li>`).join('')}</ul>`;
    panel.classList.remove('is-swap');
    void panel.offsetWidth;
    panel.classList.add('is-swap');
  };
  showWho(0);

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

  /* ---------- Antes y con Voz Propia ---------- */

  const cmpList = el.querySelector<HTMLElement>('[data-cmp-list]')!;

  const offs = [
    on(el, 'click', '[data-who]', (_, b) => showWho(Number(b.dataset.who))),
    on(el, 'keydown', '[data-who]', (e, b) => {
      const k = (e as KeyboardEvent).key;
      const i = Number(b.dataset.who);
      const n = k === 'ArrowRight' ? (i + 1) % WHO.length : k === 'ArrowLeft' ? (i - 1 + WHO.length) % WHO.length : -1;
      if (n < 0) return;
      e.preventDefault();
      showWho(n, true);
    }),
    on(el, 'click', '[data-demo]', (_, b) => void runDemo(Number(b.dataset.demo))),
    on(el, 'click', '[data-cmp]', (_, b) => {
      const v = b.dataset.cmp!;
      el.querySelectorAll<HTMLElement>('[data-cmp]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      cmpList.dataset.on = v;
    }),
    on(el, 'click', '[data-jump]', (e, a) => {
      e.preventDefault();
      el.querySelector(`#${a.dataset.jump}`)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    }),
    on(el, 'click', '[data-to-guide]', () => go('guia')),
  ];

  return () => {
    disposed = true;
    offs.forEach((off) => off());
    center.disconnect();
    tail.disconnect();
    reveal.disconnect();
    field?.dispose();
  };
}
