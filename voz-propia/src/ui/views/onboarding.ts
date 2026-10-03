import { go } from '../../app/router';
import { updateSettings } from '../../app/state';
import { orb } from '../components/orb';
import { on } from '../dom';
import { icon } from '../icons';

const SLIDES = [
  () => `
    <div class="ob-hero">
      ${orb('lg')}
      <div class="ob-copy">
        <p class="kicker">${icon('sparkles', 16)} Voz Propia</p>
        <h1>Tus labios hablan.<br><span class="hl">Tu teléfono pone la voz.</span></h1>
        <p class="lead">Para quien no puede hablar por una traqueostomía, un cáncer de laringe o mientras está en terapia intensiva.</p>
        <div class="chips"><span class="chip">Traqueostomía</span><span class="chip">Laringectomía</span><span class="chip">Terapia intensiva</span></div>
      </div>
    </div>`,
  () => `
    <div class="ob-block">
      <p class="kicker">Así funciona</p>
      <h2>Tres pasos y ya te entiende</h2>
      <div class="steps3">
        ${[
          ['sparkles', 'Enséñale', 'Graba cada frase 3 veces, moviendo los labios sin voz. Unos 5 segundos cada vez.'],
          ['scan-face', 'Habla sin voz', 'Mira a la cámara y di tu frase. La app sigue 40 puntos de tus labios.'],
          ['volume', 'Se escucha', 'Tu teléfono la dice en voz alta. Si duda, te muestra 3 opciones para elegir.'],
        ]
          .map(
            ([ic, t, d], i) => `
          <article class="step-card" data-tilt="10" style="--i:${i}">
            <span class="step-card__n">${i + 1}</span>
            <span class="bubble-3d">${icon(ic, 26)}</span>
            <h3>${t}</h3>
            <p>${d}</p>
          </article>`,
          )
          .join('')}
      </div>
    </div>`,
  () => `
    <div class="ob-block">
      <p class="kicker">Hecha para un hospital de verdad</p>
      <h2>Privada, sin internet y aprende de ti</h2>
      <ul class="feature-list">
        <li><span class="bubble-3d bubble-3d--sage">${icon('wifi-off', 22)}</span><div><h3>Funciona en modo avión</h3><p>Todo corre dentro del teléfono. Sin señal también funciona.</p></div></li>
        <li><span class="bubble-3d bubble-3d--sage">${icon('shield-check', 22)}</span><div><h3>Tu cara no sale de aquí</h3><p>No se graba video. Solo se guarda la forma de tus labios en números.</p></div></li>
        <li><span class="bubble-3d bubble-3d--sage">${icon('sparkles', 22)}</span><div><h3>Mejora cada día</h3><p>Cuando eliges la opción correcta, la app aprende de ese ejemplo.</p></div></li>
      </ul>
      <p class="fineprint">${icon('info', 14)} Es una ayuda para comunicarse, no un dispositivo médico.</p>
    </div>`,
  () => `
    <div class="ob-block">
      <p class="kicker">Empecemos</p>
      <h2>¿Quién la va a usar ahora?</h2>
      <div class="choice">
        <button class="choice__card" type="button" data-choose="entrenar" data-tilt="8">
          <span class="bubble-3d">${icon('smile', 28)}</span>
          <h3>Soy el paciente</h3>
          <p>Vamos a enseñarle tus primeras frases. Toma unos 3 minutos.</p>
          <span class="choice__go">Entrenar mis frases ${icon('arrow-right', 18)}</span>
        </button>
        <button class="choice__card" type="button" data-choose="tablero" data-tilt="8">
          <span class="bubble-3d bubble-3d--sage">${icon('stethoscope', 28)}</span>
          <h3>Soy familia o personal de salud</h3>
          <p>Empieza con el tablero de frases. Funciona al instante, sin cámara.</p>
          <span class="choice__go">Abrir el tablero ${icon('arrow-right', 18)}</span>
        </button>
      </div>
    </div>`,
];

export function showOnboarding(): Promise<void> {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'onboarding';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Bienvenida a Voz Propia');
    el.tabIndex = -1;
    el.innerHTML = `
      <div class="onboarding__bg" aria-hidden="true"></div>
      <button class="link-btn onboarding__skip" type="button" data-skip>Saltar</button>
      <div class="onboarding__slide" data-slide aria-live="polite"></div>
      <footer class="onboarding__nav">
        <button class="icon-btn" type="button" data-prev aria-label="Anterior">${icon('chevron-left', 22)}</button>
        <div class="dots-nav" data-dots>${SLIDES.map((_, i) => `<button type="button" data-dot="${i}" aria-label="Paso ${i + 1}"></button>`).join('')}</div>
        <button class="btn btn--primary" type="button" data-next><span>Siguiente</span>${icon('arrow-right', 18)}</button>
      </footer>`;
    document.body.append(el);
    const app = document.getElementById('app');
    app?.setAttribute('inert', '');

    const slide = el.querySelector<HTMLElement>('[data-slide]')!;
    const next = el.querySelector<HTMLButtonElement>('[data-next]')!;
    const prev = el.querySelector<HTMLButtonElement>('[data-prev]')!;
    let i = -1;
    let dir = 1;

    const show = (n: number) => {
      n = Math.max(0, Math.min(SLIDES.length - 1, n));
      if (n === i) return;
      dir = n > i ? 1 : -1;
      i = n;
      slide.innerHTML = SLIDES[i]();
      slide.style.setProperty('--dir', String(dir));
      slide.classList.remove('enter');
      void slide.offsetWidth;
      slide.classList.add('enter');
      el.querySelectorAll<HTMLElement>('[data-dot]').forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
      prev.style.visibility = i === 0 ? 'hidden' : 'visible';
      next.hidden = i === SLIDES.length - 1;
      next.querySelector('span')!.textContent = i === 0 ? 'Empezar' : 'Siguiente';
    };

    const finish = async (route: 'entrenar' | 'tablero' | null) => {
      removeEventListener('keydown', onKey);
      await updateSettings({ onboarded: true });
      el.classList.add('is-leaving');
      app?.removeAttribute('inert');
      setTimeout(() => el.remove(), 260);
      if (route) go(route);
      resolve();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') show(i + 1);
      else if (e.key === 'ArrowLeft') show(i - 1);
      else if (e.key === 'Escape') void finish(null);
    };
    addEventListener('keydown', onKey);

    on(el, 'click', '[data-next]', () => show(i + 1));
    on(el, 'click', '[data-prev]', () => show(i - 1));
    on(el, 'click', '[data-dot]', (_, d) => show(Number(d.dataset.dot)));
    on(el, 'click', '[data-skip]', () => void finish(null));
    on(el, 'click', '[data-choose]', (_, c) => void finish(c.dataset.choose as 'entrenar' | 'tablero'));

    // Deslizar con el dedo entre pasos.
    let x0: number | null = null;
    el.addEventListener('pointerdown', (e) => (x0 = e.clientX));
    el.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 60) show(i + (dx < 0 ? 1 : -1));
    });

    show(0);
    el.focus();
  });
}
