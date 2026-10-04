import '@fontsource/anton/latin-400.css';
import { go } from '../../app/router';
import { on, reducedMotion, rich } from '../dom';
import { icon } from '../icons';

/* ---------- Contenido ---------- */

const READY: [string, string, string][] = [
  ['sun', 'Luz de frente', 'Que la luz te dé en la cara, no por detrás.'],
  ['scan-face', 'Teléfono a la altura de tu cara', 'Ni muy arriba ni muy abajo.'],
  ['hand', 'A un brazo de distancia', 'Que se vea toda tu cara en la pantalla.'],
  ['eye', 'Labios a la vista', 'Sin cubrebocas ni mano frente a la boca.'],
  ['zap', 'Batería cargada', 'Con más de la mitad, para todo el día.'],
  ['volume', 'Volumen alto', 'Para que te escuchen desde lejos.'],
];

const LIPS: Record<'si' | 'no', [string, string][]> = {
  si: [
    ['Como si hablaras', 'Mueve los labios igual que antes, *a tu ritmo*.'],
    ['Una frase a la vez', 'Di una frase completa y *haz una pausa* al terminar.'],
    ['Cara quieta', 'Mueve la boca, *no la cabeza*.'],
    ['Si no te entiende', 'Repítela *con calma*, un poco más despacio.'],
  ],
  no: [
    ['Exagerar', 'Abrir la boca de más *la confunde*: mejor natural.'],
    ['Hablar de lado', 'Si giras la cara, *no ve bien tus labios*.'],
    ['Tapar la boca', 'Cubrebocas, mano o sábana *ocultan las palabras*.'],
    ['Ir muy rápido', 'Encadenar frases sin pausa *las mezcla*.'],
  ],
};

const PARTS: [string, string, string][] = [
  ['cabeza', 'Cabeza', 'Me duele la cabeza'],
  ['garganta', 'Garganta o cánula', 'Me duele la garganta'],
  ['pecho', 'Pecho', 'Me duele el pecho'],
  ['estomago', 'Estómago', 'Me duele el estómago'],
  ['brazo-d', 'Brazo derecho', 'Me duele el brazo'],
  ['brazo-i', 'Brazo izquierdo', 'Me duele el brazo'],
  ['pierna-d', 'Pierna derecha', 'Me duele la pierna'],
  ['pierna-i', 'Pierna izquierda', 'Me duele la pierna'],
];
const BODY: [string, string][] = [
  ['cabeza', '<circle cx="100" cy="44" r="30"/>'],
  ['garganta', '<rect x="86" y="74" width="28" height="22" rx="8"/>'],
  ['pecho', '<rect x="60" y="98" width="80" height="66" rx="20"/>'],
  ['estomago', '<rect x="64" y="166" width="72" height="62" rx="18"/>'],
  ['brazo-d', '<rect x="28" y="102" width="28" height="126" rx="14"/>'],
  ['brazo-i', '<rect x="144" y="102" width="28" height="126" rx="14"/>'],
  ['pierna-d', '<rect x="66" y="232" width="31" height="150" rx="15"/>'],
  ['pierna-i', '<rect x="103" y="232" width="31" height="150" rx="15"/>'],
];

const DOUBT: [string, string][] = [
  ['Te muestra opciones', 'Si dos palabras se parecen, aparecen *2 o 3 opciones* en la pantalla.'],
  ['Tocas la correcta', 'Con un toque eliges *lo que quisiste decir*.'],
  ['La dice en voz alta', 'Así nunca dice algo que *no quisiste decir*.'],
];
const OPTS = ['Tengo sed', 'Tengo frío', 'Me duele'];

const PHONE: [string, string, string][] = [
  ['zap', 'Siempre cargado', 'Déjalo conectado de noche, cerca de la cama.'],
  ['bed', 'Usa un soporte', 'Un soporte o atril lo deja *quieto y a la altura* de tu cara.'],
  ['eye', 'Limpia la cámara', 'Una cámara con huellas *ve borroso* tus labios.'],
  ['download', 'Instálala como app', 'Desde el navegador: *«Agregar a pantalla de inicio»*. Abre más rápido.'],
  ['wifi-off', 'Sin señal, funciona igual', 'Puede estar en *modo avión*: todo pasa dentro del teléfono.'],
  ['volume', 'Volumen arriba', 'Revisa que no esté en silencio antes de empezar.'],
];

const FAMILY: [string, string, string][] = [
  ['check', 'Haz preguntas de sí o no', 'En lugar de «¿qué necesitas?», pregunta «¿tienes sed?». Es *más rápido y cansa menos*.'],
  ['gauge', 'Dale tiempo', 'Espera a que termine de mover los labios. *No completes sus frases* sin preguntar.'],
  ['eye', 'Ponte de frente', 'Con buena luz y a su altura, para ver *sus labios y sus gestos*.'],
  ['refresh-ccw', 'Repite para confirmar', '«Entendí que te duele el pecho, ¿sí?». Así *nadie adivina*.'],
  ['volume', 'Habla normal', 'Perdió la voz, no el oído. *No hace falta gritar* ni hablarle como a un niño.'],
  ['phone', 'El teléfono a la mano', 'Cargado, cerca de su mano y con *Voz Propia abierta*.'],
];

const NAV: [string, string][] = [
  ['cs-top', 'Inicio'],
  ['cs-listo', '¿Todo listo?'],
  ['cs-labios', 'Cómo mover los labios'],
  ['cs-dolor', 'Decir dónde duele'],
  ['cs-duda', 'Si la app duda'],
  ['cs-telefono', 'Cuida tu teléfono'],
  ['cs-familia', 'Para la familia'],
];

/* ---------- Plantilla ---------- */

function template() {
  const ready = READY.map(
    ([ic, t, d], i) => `<li><button class="cs-check" type="button" data-ready="${i}" aria-pressed="false"><span class="cs-check__box">${icon('check', 20, 3)}</span><span class="cs-check__ic">${icon(ic, 22, 2)}</span><span><b>${t}</b><small>${d}</small></span></button></li>`,
  ).join('');
  const body = BODY.map(([id, shape]) => `<g class="hz-part" data-part="${id}" role="button" tabindex="0" aria-label="${PARTS.find((p) => p[0] === id)![1]}">${shape}</g>`).join('');
  const partBtns = PARTS.map(([id, name]) => `<button class="hz-chip" type="button" data-part="${id}" aria-pressed="false">${name}</button>`).join('');
  const doubt = DOUBT.map(([t, d], i) => `<li class="cs-step" data-rv style="--d:${i * 0.08}s"><b>${i + 1}</b><h3>${t}</h3><p>${rich(d)}</p></li>`).join('');
  const opts = OPTS.map((t, i) => `<button class="cs-opt" type="button" data-opt="${i}" aria-pressed="false">${t}</button>`).join('');
  const cards = (list: [string, string, string][]) => list.map(([ic, t, d], i) => `<li class="hz-tip" data-rv style="--d:${i * 0.06}s"><span>${icon(ic, 22, 2)}</span><h3>${t}</h3><p>${rich(d)}</p></li>`).join('');
  const idx = NAV.map(([id, t], i) => `<li><button type="button" data-jump="${id}" data-idx-item="${id}"><b>${String(i + 1).padStart(2, '0')}</b>${t}</button></li>`).join('');

  return `
  <div class="hz" data-hz>
    <i class="hz-progress" aria-hidden="true"></i>
    <button class="hz-idx-btn" type="button" data-idx aria-expanded="false" aria-controls="cs-idx">${icon('layout-grid', 18)}<span>Índice</span></button>
    <nav class="hz-idx" id="cs-idx" aria-label="Índice de consejos" hidden><p>Ir a…</p><ol>${idx}</ol></nav>

    <section class="hz-sec hz-hero" id="cs-top" data-tone="paper" aria-labelledby="cs-h1">
      <p class="hz-over" data-rv>[ Consejos de uso ]</p>
      <h1 class="hz-h1" id="cs-h1" data-rv style="--d:.08s">Para que Voz Propia<br><em>te entienda.</em></h1>
      <p class="hz-lead" data-rv style="--d:.16s">${rich('Voz Propia lee *el movimiento de tus labios*. Con estos consejos te entiende mejor y más rápido, desde el primer día.')}</p>
      <div class="hz-grid">
        <button class="hz-card hz-card--lime" type="button" data-jump="cs-listo">${icon('check', 26, 2.6)}<b>¿Todo listo?</b><span>Revisa antes de empezar</span></button>
        <button class="hz-card hz-card--ink" type="button" data-jump="cs-labios">${icon('scan-face', 26, 2.2)}<b>Cómo mover los labios</b><span>Así sí, y así no</span></button>
        <button class="hz-card hz-card--coral" type="button" data-jump="cs-dolor">${icon('activity', 26, 2.2)}<b>Decir dónde duele</b><span>Qué frase usar</span></button>
        <button class="hz-card hz-card--cobalt" type="button" data-jump="cs-duda">${icon('help', 26, 2.2)}<b>Si la app duda</b><span>Te pregunta, no adivina</span></button>
        <button class="hz-card hz-card--mint" type="button" data-jump="cs-telefono">${icon('phone', 26, 2.2)}<b>Cuida tu teléfono</b><span>Cargado, quieto y limpio</span></button>
        <button class="hz-card hz-card--card" type="button" data-jump="cs-familia">${icon('hand-heart', 26, 2.2)}<b>Para la familia</b><span>Cómo hablar sin voz</span></button>
      </div>
    </section>

    <section class="hz-sec" id="cs-listo" data-tone="lime" aria-labelledby="cs-ready-t">
      <p class="hz-over" data-rv>[ 01 · Antes de empezar ]</p>
      <h2 class="hz-h2" id="cs-ready-t" data-rv>¿Todo listo?</h2>
      <p class="hz-p" data-rv>${rich('Toca cada punto cuando lo tengas. Con los seis, *Voz Propia te ve y te entiende mejor*.')}</p>
      <div class="cs-meter" aria-live="polite"><i><b data-ready-bar></b></i><span data-ready-out>0 de 6 listos</span></div>
      <ul class="cs-checks">${ready}</ul>
    </section>

    <section class="hz-sec" id="cs-labios" data-tone="night" aria-labelledby="cs-lips-t">
      <p class="hz-over" data-rv>[ 02 · Cómo mover los labios ]</p>
      <h2 class="hz-h2" id="cs-lips-t" data-rv>Natural, a tu ritmo.</h2>
      <div class="cs-switch" role="radiogroup" aria-label="Ver" data-rv>
        <button type="button" role="radio" aria-checked="true" data-lips="si">${icon('check', 18, 2.8)}Así sí</button>
        <button type="button" role="radio" aria-checked="false" data-lips="no">${icon('x', 18, 2.8)}Así no</button>
      </div>
      <ul class="cs-lips" data-lips-panel aria-live="polite"></ul>
    </section>

    <section class="hz-sec" id="cs-dolor" data-tone="paper" aria-labelledby="cs-pain-t">
      <p class="hz-over" data-rv>[ 03 · Decir dónde duele ]</p>
      <h2 class="hz-h2" id="cs-pain-t" data-rv>Toca dónde, y te decimos qué frase usar.</h2>
      <div class="hz-pain">
        <div class="hz-body">
          <svg viewBox="0 0 200 390" aria-label="Cuerpo de frente. Tu derecha queda a la izquierda.">${body}</svg>
          <p class="hz-note">Tu derecha queda a la izquierda, como en un espejo.</p>
        </div>
        <div>
          <div class="hz-chips" role="group" aria-label="Partes del cuerpo">${partBtns}</div>
          <div class="cs-say" aria-live="polite">
            <small>Mueve los labios y di:</small>
            <p data-pain-out>Toca una parte del cuerpo.</p>
          </div>
          <h3 class="hz-h3">Si te preguntan cuánto duele</h3>
          <p class="hz-p">${rich('Di un número del *0 al 10*: 0 es sin dolor y 10 el peor dolor.')}</p>
          <div class="cs-scale" aria-hidden="true">${Array.from({ length: 11 }, (_, n) => `<i style="--k:${n / 10}">${n}</i>`).join('')}</div>
          <div class="cs-scale__lab"><span>Sin dolor</span><span>El peor dolor</span></div>
        </div>
      </div>
    </section>

    <section class="hz-sec" id="cs-duda" data-tone="cobalt" aria-labelledby="cs-doubt-t">
      <p class="hz-over" data-rv>[ 04 · Si la app duda ]</p>
      <h2 class="hz-h2" id="cs-doubt-t" data-rv>No adivina: te pregunta.</h2>
      <ol class="cs-steps">${doubt}</ol>
      <div class="cs-demo" data-rv>
        <p>Ejemplo: así se ven las opciones. Toca la que quisiste decir.</p>
        <div class="cs-opts">${opts}</div>
        <p class="cs-demo__out" data-opt-out aria-live="polite"></p>
      </div>
    </section>

    <section class="hz-sec" id="cs-telefono" data-tone="forest" aria-labelledby="cs-ph-t">
      <p class="hz-over" data-rv>[ 05 · Cuida tu teléfono ]</p>
      <h2 class="hz-h2" id="cs-ph-t" data-rv>Tu teléfono es tu voz.</h2>
      <ul class="hz-tips cs-tips--dark">${cards(PHONE)}</ul>
    </section>

    <section class="hz-sec" id="cs-familia" data-tone="sand" aria-labelledby="cs-fa-t">
      <p class="hz-over" data-rv>[ 06 · Para la familia y el personal ]</p>
      <h2 class="hz-h2" id="cs-fa-t" data-rv>Cómo hablar con alguien sin voz.</h2>
      <ul class="hz-tips">${cards(FAMILY)}</ul>
      <div class="hz-row cs-end">
        <button class="hz-btn hz-btn--ink" type="button" data-to="guia">${icon('user', 18, 2.2)}<span>Ver la guía de uso</span></button>
        <button class="hz-btn" type="button" data-to="ayuda">${icon('info', 18, 2.2)}<span>Datos y cómo te ayuda</span></button>
        <button class="hz-btn" type="button" data-jump="cs-top">${icon('arrow-up', 18, 2.4)}<span>Volver arriba</span></button>
      </div>
      <p class="hz-fine">Voz Propia es una ayuda para comunicarse. No reemplaza la atención del personal de salud.</p>
    </section>
  </div>`;
}

/* ---------- Vista ---------- */

export function consejosView(root: HTMLElement) {
  root.innerHTML = template();
  const el = root.querySelector<HTMLElement>('[data-hz]')!;
  const still = reducedMotion();
  if (still) el.classList.add('is-static');
  const ac = new AbortController();
  const { signal } = ac;

  const reveal = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.add('is-in');
        reveal.unobserve(en.target);
      }
    },
    { threshold: 0.1 },
  );
  el.querySelectorAll('[data-rv]').forEach((n) => reveal.observe(n));

  const bar = el.querySelector<HTMLElement>('.hz-progress')!;
  let raf = 0;
  addEventListener(
    'scroll',
    () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : '0');
      });
    },
    { passive: true, signal },
  );

  /* Índice */
  const idx = el.querySelector<HTMLElement>('.hz-idx')!;
  const idxBtn = el.querySelector<HTMLElement>('[data-idx]')!;
  const openIdx = (open: boolean) => {
    idx.hidden = !open;
    idxBtn.setAttribute('aria-expanded', String(open));
    if (open) idx.querySelector<HTMLElement>('.is-on, button')?.focus();
  };
  addEventListener('pointerdown', (e) => !idx.hidden && !(e.target as Element).closest('.hz-idx, [data-idx]') && openIdx(false), { signal });
  addEventListener('keydown', (e) => e.key === 'Escape' && !idx.hidden && (openIdx(false), idxBtn.focus()), { signal });
  const idxItems = Array.from(el.querySelectorAll<HTMLElement>('[data-idx-item]'));
  const spy = new IntersectionObserver(
    (entries) => {
      for (const en of entries) if (en.isIntersecting) idxItems.forEach((b) => b.classList.toggle('is-on', b.dataset.idxItem === en.target.id));
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  NAV.forEach(([id]) => spy.observe(el.querySelector(`#${id}`)!));
  const jump = (id: string) => {
    openIdx(false);
    el.querySelector(`#${id}`)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  };

  /* ¿Todo listo? */
  const readyBar = el.querySelector<HTMLElement>('[data-ready-bar]')!;
  const readyOut = el.querySelector<HTMLElement>('[data-ready-out]')!;
  const updateReady = () => {
    const n = el.querySelectorAll('[data-ready][aria-pressed="true"]').length;
    readyBar.style.setProperty('--p', String(n / READY.length));
    readyOut.textContent = n === READY.length ? '¡Todo listo! Ya puedes empezar.' : `${n} de ${READY.length} listos`;
    el.querySelector('.cs-meter')!.classList.toggle('is-done', n === READY.length);
  };

  /* Labios: así sí / así no */
  const lipsPanel = el.querySelector<HTMLElement>('[data-lips-panel]')!;
  const setLips = (k: 'si' | 'no') => {
    el.querySelectorAll<HTMLElement>('[data-lips]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lips === k)));
    lipsPanel.dataset.kind = k;
    lipsPanel.innerHTML = LIPS[k].map(([t, d]) => `<li><span>${icon(k === 'si' ? 'check' : 'x', 20, 2.8)}</span><h3>${t}</h3><p>${rich(d)}</p></li>`).join('');
    lipsPanel.classList.remove('is-swap');
    void lipsPanel.offsetWidth;
    lipsPanel.classList.add('is-swap');
  };
  setLips('si');

  /* Dónde duele */
  let part = '';
  const painOut = el.querySelector<HTMLElement>('[data-pain-out]')!;
  const pickPart = (id: string) => {
    part = part === id ? '' : id;
    el.querySelectorAll<HTMLElement>('[data-part]').forEach((b) => {
      const sel = b.dataset.part === part;
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(sel));
      else b.classList.toggle('is-on', sel);
    });
    const p = PARTS.find((x) => x[0] === part);
    painOut.textContent = p ? `«${p[2]}»` : 'Toca una parte del cuerpo.';
  };

  const offs = [
    on(el, 'click', '[data-idx]', () => openIdx(Boolean(idx.hidden))),
    on(el, 'click', '[data-jump]', (e, b) => {
      e.preventDefault();
      jump(b.dataset.jump!);
    }),
    on(el, 'click', '[data-to]', (_, b) => go(b.dataset.to as 'guia' | 'ayuda')),
    on(el, 'click', '[data-ready]', (_, b) => {
      b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      updateReady();
    }),
    on(el, 'click', '[data-lips]', (_, b) => setLips(b.dataset.lips as 'si' | 'no')),
    on(el, 'click', '[data-part]', (_, b) => pickPart(b.dataset.part!)),
    on(el, 'keydown', 'g[data-part]', (e, b) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      pickPart(b.dataset.part!);
    }),
    on(el, 'click', '[data-opt]', (_, b) => {
      el.querySelectorAll<HTMLElement>('[data-opt]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      el.querySelector<HTMLElement>('[data-opt-out]')!.innerHTML = `${icon('volume', 18)} Voz Propia diría: <b>«${OPTS[Number(b.dataset.opt)]}»</b>`;
    }),
  ];

  return () => {
    ac.abort();
    offs.forEach((off) => off());
    cancelAnimationFrame(raf);
    reveal.disconnect();
    spy.disconnect();
  };
}
