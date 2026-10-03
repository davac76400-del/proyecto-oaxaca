import { icon } from '../icons';
import { reducedMotion } from '../dom';
import { bindHold } from './hold';

export const HOLD_MS = 2000;

/** Botón que se llena de agua mientras se mantiene presionado; al llenarse salpica y regresa. */
export const waterBackHTML = () => `
  <button class="water-back" type="button" data-water-back aria-label="Regresar al inicio. Mantén presionado dos segundos">
    <span class="water-back__label">
      ${icon('arrow-left', 20, 2.6)}
      <span class="water-back__text"><b>Regresar al inicio</b><small><span class="wb-idle">Mantén presionado 2 segundos</span><span class="wb-busy">Sigue presionando…</span></small></span>
    </span>
    <span class="water-back__fill" aria-hidden="true">
      <svg class="water-back__wave water-back__wave--b" viewBox="0 0 240 16" preserveAspectRatio="none"><path d="M0 8 Q30 0 60 8 T120 8 T180 8 T240 8 V16 H0Z"/></svg>
      <svg class="water-back__wave" viewBox="0 0 240 16" preserveAspectRatio="none"><path d="M0 8 Q30 16 60 8 T120 8 T180 8 T240 8 V16 H0Z"/></svg>
      <span class="water-back__clip">
        <span class="water-back__label water-back__label--on">
          ${icon('arrow-left', 20, 2.6)}
          <span class="water-back__text"><b>Regresar al inicio</b><small>Mantén presionado 2 segundos</small></span>
        </span>
      </span>
    </span>
  </button>`;

function splash(from: HTMLElement, done: () => void) {
  if (reducedMotion()) return done();
  const r = from.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const reach = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40;

  const veil = document.createElement('div');
  veil.className = 'splash';
  veil.setAttribute('aria-hidden', 'true');
  const disc = document.createElement('i');
  disc.className = 'splash__disc';
  Object.assign(disc.style, { left: `${cx}px`, top: `${cy}px`, width: `${reach * 2}px`, height: `${reach * 2}px` });
  veil.append(disc);

  const drops: Animation[] = [];
  for (let i = 0; i < 16; i++) {
    const d = document.createElement('i');
    d.className = 'splash__drop';
    const size = 8 + Math.random() * 16;
    Object.assign(d.style, { left: `${cx}px`, top: `${cy}px`, width: `${size}px`, height: `${size}px` });
    veil.append(d);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7;
    const dist = 90 + Math.random() * 190;
    const x = Math.cos(a) * dist;
    const y = Math.sin(a) * dist;
    drops.push(
      d.animate(
        [
          { transform: 'translate(-50%,-50%) scale(0.4)', opacity: 1 },
          { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y - 40}px)) scale(1)`, opacity: 1, offset: 0.45 },
          { transform: `translate(calc(-50% + ${x * 1.15}px), calc(-50% + ${y + 120}px)) scale(0.7)`, opacity: 0 },
        ],
        { duration: 760, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' },
      ),
    );
  }
  document.body.append(veil);

  const grow = disc.animate(
    [{ transform: 'translate(-50%,-50%) scale(0)' }, { transform: 'translate(-50%,-50%) scale(1)' }],
    { duration: 620, delay: 80, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'both' },
  );
  void grow.finished.then(() => {
    done();
    const out = veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, delay: 160, easing: 'ease-out', fill: 'forwards' });
    void out.finished.then(() => veil.remove());
  });
}

export function bindWaterBack(btn: HTMLElement, onDone: () => void) {
  let busy = false;
  const off = bindHold(btn, HOLD_MS, () => {
    if (busy) return;
    busy = true;
    btn.classList.add('is-done');
    splash(btn, onDone);
  });
  return () => off();
}
