import '@fontsource/anton/latin-400.css';
import '@fontsource/sacramento/latin-400.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { go } from '../../app/router';
import { state } from '../../app/state';
import { engine } from '../../core/engine';
import { speakPhrase } from '../../core/voice/speaker';
import { CATEGORY_LABEL } from '../../data/default-phrases';
import type { Category } from '../../core/types';
import { esc, on, reducedMotion } from '../dom';
import { icon } from '../icons';

gsap.registerPlugin(ScrollTrigger);

const ORDER: Category[] = ['respuesta', 'necesidad', 'cuerpo', 'emocion', 'social'];

const lips = (cls: string) =>
  `<svg class="${cls}" viewBox="0 0 100 60" aria-hidden="true"><ellipse class="m-in" cx="50" cy="31" rx="26" ry="9"/><path class="m-up" d="M16 30 C30 14 42 19 50 23 C58 19 70 14 84 30 C70 28 58 27 50 28 C42 27 30 28 16 30Z"/><path class="m-low" d="M16 30 C30 33 42 34 50 34 C58 34 70 33 84 30 C74 47 60 51 50 51 C40 51 26 47 16 30Z"/></svg>`;

const STEPS = [
  ['scan-face', 'Mira tus labios', 'La cámara sigue 478 puntos de tu cara y se queda con los 40 de la boca.', '#BFEBD4'],
  ['sparkles', 'Compara con tus ejemplos', 'Cada frase se aprendió con 1 a 5 grabaciones de ti, nadie más.', '#E4D4FF'],
  ['help', 'Pregunta si duda', 'Si no está segura, te muestra tres opciones. Tu elección la hace más lista.', '#FFD9C7'],
  ['volume', 'Habla por ti', 'La frase suena al instante, sin internet, con la voz que tu familia eligió.', '#CDE7FF'],
];

const HELP = ['Sin internet', 'Sin video guardado', 'Aprende de ti', 'Tu voz, tu decisión'];

function template() {
  const steps = STEPS.map(
    ([ic, t, d, c], i) => `
    <article class="g-step" style="--bg:${c}">
      <span class="g-step__n">0${i + 1}</span>
      <span class="g-step__ic">${icon(ic, 30, 1.8)}</span>
      <h3>${t}</h3>
      <p>${d}</p>
    </article>`,
  ).join('');
  const line = (a: string[]) => a.map((w) => `<span>${w}</span><i>✦</i>`).join('');
  return `
  <div class="guia" data-guia>
    <div class="g-cursor" aria-hidden="true">${lips('g-cursor__svg')}</div>

    <section class="g-hero" aria-labelledby="g-title">
      <i class="g-blob g-blob--a" data-speed="0.35"></i><i class="g-blob g-blob--b" data-speed="0.6"></i>
      <i class="g-blob g-blob--c" data-speed="0.25"></i><i class="g-blob g-blob--d" data-speed="0.8"></i>
      <p class="g-over g-in">[ Así trabajamos ]</p>
      <h1 class="g-letters" id="g-title"><span class="sr-only">Voz Propia</span>
        <b class="g-3d g-l1" style="--c:#FF6B4A;--d:#C93A1E" aria-hidden="true">V</b><b class="g-3d g-l2" style="--c:#FFC93D;--d:#D69400" aria-hidden="true">O</b><b class="g-3d g-l3" style="--c:#3DC794;--d:#14855E" aria-hidden="true">Z</b>
      </h1>
      <p class="g-script g-in" aria-hidden="true">propia</p>
      <p class="g-lead g-in">Tus labios hablan. Aquí te contamos cómo lo hacemos y con qué palabras contamos.</p>
      <p class="g-cue g-in">${icon('arrow-down', 15)} Desliza</p>
    </section>

    <section class="g-expand" aria-label="Todo empieza en los labios">
      <div class="g-expand__card">
        <div class="g-expand__body">
          ${lips('g-lips')}
          <h2>Todo empieza<br>en tus labios</h2>
          <p>Cada movimiento tiene una forma. Voz Propia aprende la tuya.</p>
        </div>
      </div>
    </section>

    <section class="g-steps" aria-label="Cómo funciona">
      <div class="g-steps__track">
        <div class="g-steps__intro">
          <p class="g-over">[ Paso a paso ]</p>
          <h2>Nosotros<br>trabajamos<br>así</h2>
          <p class="g-cue">${icon('arrow-right', 15)} Sigue bajando</p>
        </div>
        ${steps}
      </div>
    </section>

    <section class="g-words" aria-labelledby="g-words-t">
      <p class="g-over">[ Contamos con ]</p>
      <h2 id="g-words-t" class="g-h2">Contamos con<br>estas palabras</h2>
      <p class="g-sub">Toca una para escucharla. Cuando alguien de tu equipo agrega una nueva, aparece aquí.</p>
      <div data-words></div>
    </section>

    <section class="g-help" aria-label="En qué ayudamos">
      <p class="g-over g-over--light">[ Ayudamos en esto ]</p>
      <div class="g-line g-line--a" aria-hidden="true"><div>${line(['Traqueostomía', 'Laringectomía', 'Terapia intensiva'])}${line(['Traqueostomía', 'Laringectomía', 'Terapia intensiva'])}</div></div>
      <div class="g-line g-line--b" aria-hidden="true"><div>${line(HELP)}${line(HELP)}</div></div>
      <p class="g-help__p">Para quien tiene la voz callada pero las palabras listas.</p>
    </section>

    <section class="g-end">
      <h2>¿Listo?</h2>
      <button class="g-end__btn" type="button" data-home>${icon('arrow-left', 20)}<span>Regresar al inicio</span></button>
    </section>
  </div>`;
}

export function guiaView(root: HTMLElement) {
  root.innerHTML = template();
  const el = root.querySelector<HTMLElement>('[data-guia]')!;
  const wordsHost = el.querySelector<HTMLElement>('[data-words]')!;
  const still = reducedMotion();
  const fine = matchMedia('(pointer: fine)').matches;
  if (still) el.classList.add('is-static');

  /* ---------- Palabras que existen (se actualizan cuando el programador agrega una) ---------- */

  let wordTriggers: ScrollTrigger[] = [];
  const renderWords = () => {
    const groups = ORDER.map((c) => ({ c, items: engine.phrases.filter((p) => p.category === c) })).filter((g) => g.items.length);
    wordsHost.innerHTML = groups.length
      ? groups
          .map(
            (g) => `
      <div class="g-group">
        <h3><i class="cat-dot cat-dot--${g.c}" aria-hidden="true"></i>${CATEGORY_LABEL[g.c]}</h3>
        <div class="g-tiles">${g.items
          .map(
            (p) => `<button class="g-word g-word--${g.c}" type="button" data-say="${p.id}">
              <span class="sphere sphere--sm sphere--${g.c}">${icon(p.icon, 20)}</span>
              <span>${esc(p.text)}</span>
            </button>`,
          )
          .join('')}</div>
      </div>`,
          )
          .join('')
      : '<p class="g-empty">Pronto habrá palabras aquí.</p>';
    wordTriggers.forEach((t) => t.kill());
    wordTriggers = [];
    const tiles = wordsHost.querySelectorAll<HTMLElement>('.g-word');
    if (still || !tiles.length) return;
    gsap.set(tiles, { opacity: 0, y: 46, scale: 0.9 });
    wordTriggers = ScrollTrigger.batch(tiles, {
      start: 'top 92%',
      once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.5)', stagger: 0.06, overwrite: true }),
    });
    ScrollTrigger.refresh();
  };

  /* ---------- Labios que siguen al cursor: cerrados, se abren con el scroll y al tocar palabras ---------- */

  const cursor = el.querySelector<HTMLElement>('.g-cursor')!;
  const cLow = cursor.querySelector('.m-low')!;
  const cIn = cursor.querySelector('.m-in')!;
  gsap.set(cIn, { svgOrigin: '50 31', scaleY: 0.08 });
  let hoverOpen = 0;
  let scrollOpen = 0;
  const paint = () => {
    const o = Math.min(1, Math.max(hoverOpen, scrollOpen));
    gsap.to(cLow, { y: o * 9, duration: 0.25, overwrite: 'auto' });
    gsap.to(cIn, { scaleY: 0.08 + o * 1.3, duration: 0.25, overwrite: 'auto' });
  };
  const moveX = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const moveY = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
  const onMove = (e: PointerEvent) => {
    cursor.classList.add('is-on');
    moveX(e.clientX + 16);
    moveY(e.clientY + 18);
    const over = !!(e.target as Element).closest('.g-word, button, a');
    const next = over ? 1 : 0;
    if (next !== hoverOpen) {
      hoverOpen = next;
      paint();
    }
  };
  const onLeave = () => cursor.classList.remove('is-on');
  if (fine && !still) {
    addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onLeave);
  }

  /* ---------- Animaciones de scroll (GSAP + ScrollTrigger) ---------- */

  const ctx = gsap.context(() => {
    if (still) return;
    const q = gsap.utils.selector(el);

    gsap.from(q('.g-in'), { opacity: 0, y: 36, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.15 });
    gsap.from(q('.g-3d'), { yPercent: 70, opacity: 0, rotateX: -50, duration: 1.2, ease: 'back.out(1.6)', stagger: 0.14, transformOrigin: '50% 100%' });

    // Parallax del inicio: cada letra y cada esfera se mueve a su propia velocidad.
    const heroTrig = { trigger: '.g-hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(q('.g-l1'), { yPercent: -18, rotate: -6, scrollTrigger: heroTrig });
    gsap.to(q('.g-l2'), { yPercent: -38, scrollTrigger: heroTrig });
    gsap.to(q('.g-l3'), { yPercent: -10, rotate: 6, scrollTrigger: heroTrig });
    gsap.to(q('.g-script'), { yPercent: -120, xPercent: 12, scrollTrigger: heroTrig });
    q('.g-blob').forEach((b) => {
      gsap.to(b, { y: () => -Number(b.dataset.speed) * 420, scrollTrigger: heroTrig });
    });

    // La tarjeta se expande hasta llenar la pantalla; los labios se abren con el scroll.
    const ex = gsap.timeline({ scrollTrigger: { trigger: '.g-expand', start: 'top top', end: '+=160%', scrub: 0.6, pin: true, anticipatePin: 1 } });
    ex.fromTo(q('.g-expand__card'), { clipPath: 'inset(16% 24% round 56px)' }, { clipPath: 'inset(0% 0% round 0px)', ease: 'none', duration: 1 }, 0);
    ex.fromTo(q('.g-expand__card'), { scale: 1.12 }, { scale: 1, ease: 'none', duration: 1 }, 0);
    ex.fromTo(q('.g-expand__body'), { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.5 }, 0.35);
    gsap.set(q('.g-lips .m-in'), { svgOrigin: '50 31', scaleY: 0.08 });
    ex.to(q('.g-lips .m-low'), { y: 12, ease: 'none', duration: 0.9 }, 0.2);
    ex.to(q('.g-lips .m-in'), { scaleY: 1.5, ease: 'none', duration: 0.9 }, 0.2);

    // Los pasos se recorren de lado mientras se baja.
    const track = q('.g-steps__track')[0] as HTMLElement;
    gsap.to(track, {
      x: () => -(track.scrollWidth - innerWidth),
      ease: 'none',
      scrollTrigger: { trigger: '.g-steps', start: 'top top', end: () => `+=${track.scrollWidth - innerWidth}`, scrub: 0.6, pin: true, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    q('.g-step').forEach((s, i) => {
      gsap.from(s, { y: 80, rotate: i % 2 ? 4 : -4, opacity: 0.2, scrollTrigger: { trigger: s, containerAnimation: undefined, start: 'top bottom', end: 'top 55%', scrub: true } });
    });

    gsap.from(q('.g-words .g-h2, .g-words .g-sub'), { y: 60, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.g-words', start: 'top 70%' } });

    // Dos renglones gigantes que corren en sentidos contrarios.
    const lineTrig = { trigger: '.g-help', start: 'top bottom', end: 'bottom top', scrub: 0.8 };
    gsap.fromTo(q('.g-line--a div'), { xPercent: 0 }, { xPercent: -30, ease: 'none', scrollTrigger: lineTrig });
    gsap.fromTo(q('.g-line--b div'), { xPercent: -30 }, { xPercent: 0, ease: 'none', scrollTrigger: lineTrig });

    gsap.from(q('.g-end h2, .g-end__btn'), { y: 70, opacity: 0, stagger: 0.15, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.g-end', start: 'top 70%' } });

    // La velocidad del scroll abre los labios del cursor.
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = Math.min(1, Math.abs(self.getVelocity()) / 2600);
        if (Math.abs(v - scrollOpen) > 0.08) {
          scrollOpen = v;
          paint();
        }
      },
    });
  }, el);

  renderWords();

  const offs = [
    on(el, 'click', '[data-say]', (_, b) => {
      const p = engine.phrase(b.dataset.say!);
      if (!p) return;
      hoverOpen = 1;
      paint();
      void speakPhrase(p, state.settings).finally(() => {
        hoverOpen = 0;
        paint();
      });
    }),
    on(el, 'click', '[data-home]', () => go('inicio/elegir')),
    engine.onChange(renderWords),
  ];

  const onResize = () => ScrollTrigger.refresh();
  addEventListener('load', onResize);

  return () => {
    offs.forEach((off) => off());
    wordTriggers.forEach((t) => t.kill());
    removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    removeEventListener('load', onResize);
    ctx.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
  };
}
