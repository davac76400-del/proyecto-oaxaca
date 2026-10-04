import '@fontsource/anton/latin-400.css';
import { state } from '../../app/state';
import { speakText, stopSpeaking } from '../../core/voice/speaker';
import { esc, on, reducedMotion, rich, vibrate } from '../dom';
import { icon } from '../icons';

/* ---------- Contenido ---------- */

const PAIN = ['Sin dolor', 'Muy leve', 'Leve', 'Molesto', 'Molesto', 'Moderado', 'Moderado', 'Fuerte', 'Muy fuerte', 'Intenso', 'El peor dolor'];

/** Partes del cuerpo: id, nombre corto y cómo se dice. */
const PARTS: [string, string, string][] = [
  ['cabeza', 'Cabeza', 'Me duele la cabeza'],
  ['garganta', 'Garganta o cánula', 'Me duele la garganta'],
  ['pecho', 'Pecho', 'Me duele el pecho'],
  ['estomago', 'Estómago', 'Me duele el estómago'],
  ['espalda', 'Espalda', 'Me duele la espalda'],
  ['brazo-d', 'Brazo derecho', 'Me duele el brazo derecho'],
  ['brazo-i', 'Brazo izquierdo', 'Me duele el brazo izquierdo'],
  ['pierna-d', 'Pierna derecha', 'Me duele la pierna derecha'],
  ['pierna-i', 'Pierna izquierda', 'Me duele la pierna izquierda'],
];

/** Figura de frente: la derecha de la persona queda a la izquierda de quien mira. */
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

const NEEDS: { tab: string; icon: string; items: [string, string][] }[] = [
  {
    tab: 'Necesito',
    icon: 'hand',
    items: [
      ['glass-water', 'Tengo sed'],
      ['bath', 'Necesito ir al baño'],
      ['activity', 'Necesito aspiración'],
      ['refresh-ccw', 'Cámbiame de posición'],
      ['bed', 'Súbeme la cabecera'],
      ['lightbulb', 'Apaga la luz'],
      ['pill', 'Necesito mi medicina'],
      ['utensils', 'Tengo hambre'],
    ],
  },
  {
    tab: 'Mi cuerpo',
    icon: 'heart',
    items: [
      ['wind', 'Me falta el aire'],
      ['snowflake', 'Tengo frío'],
      ['sun', 'Tengo calor'],
      ['frown', 'Tengo náuseas'],
      ['eye', 'Me pica'],
      ['moon', 'Quiero dormir'],
    ],
  },
  {
    tab: 'Me siento',
    icon: 'smile',
    items: [
      ['heart', 'Tengo miedo'],
      ['frown', 'Estoy triste'],
      ['zap', 'Estoy desesperado'],
      ['smile', 'Estoy bien'],
      ['hand-heart', 'Gracias'],
      ['user', 'No me dejes solo'],
    ],
  },
  {
    tab: 'Preguntas',
    icon: 'help',
    items: [
      ['help', '¿Qué me pasó?'],
      ['sun', '¿Qué hora es?'],
      ['phone', '¿Dónde está mi familia?'],
      ['stethoscope', '¿Cuándo me quitan el tubo?'],
      ['heart', '¿Voy a estar bien?'],
      ['message-circle', '¿Me lo repites, por favor?'],
    ],
  },
  {
    tab: 'Personas',
    icon: 'user',
    items: [
      ['phone', 'Llama a mi familia'],
      ['bell', 'Llama a la enfermera'],
      ['stethoscope', 'Quiero hablar con el médico'],
      ['hand-heart', 'Te quiero'],
      ['user', 'Quiero estar solo un rato'],
      ['tv', 'Prende la tele'],
    ],
  },
];

const TIPS: [string, string, string][] = [
  ['check', 'Haz preguntas de sí o no', 'En lugar de «¿qué necesitas?», pregunta «¿tienes sed?». Es *más rápido y cansa menos*.'],
  ['gauge', 'Dale tiempo', 'Espera a que termine de mover los labios. *No completes sus frases* sin preguntar.'],
  ['eye', 'Ponte de frente', 'Con buena luz y a su altura, para ver *sus labios y sus gestos*.'],
  ['refresh-ccw', 'Repite para confirmar', '«Entendí que te duele el pecho, ¿sí?». Así *nadie adivina*.'],
  ['volume', 'Habla normal', 'Perdió la voz, no el oído. *No hace falta gritar* ni hablarle como a un niño.'],
  ['phone', 'El teléfono a la mano', 'Cargado, cerca de su mano y con *Voz Propia abierta*.'],
];

const FIELDS: [string, string, string, boolean][] = [
  ['nombre', 'Me llamo', 'Tu nombre', false],
  ['comunico', 'Cómo me comunico', 'Muevo los labios. Hazme preguntas de sí o no.', true],
  ['motivo', 'Por qué no puedo hablar', 'Por ejemplo: tengo traqueostomía', true],
  ['alergias', 'Alergias', 'Por ejemplo: penicilina. Si no, «ninguna»', false],
  ['contacto', 'Contacto de emergencia', 'Nombre y teléfono', false],
];

const NAV: [string, string][] = [
  ['hz-top', 'Inicio'],
  ['hz-alerta', 'Pedir ayuda'],
  ['hz-sino', 'Sí y No'],
  ['hz-dolor', '¿Dónde te duele?'],
  ['hz-tablero', 'Necesito…'],
  ['hz-escribir', 'Escribir y hablar'],
  ['hz-ficha', 'Mi ficha'],
  ['hz-consejos', 'Para la familia'],
];

const KEY_FICHA = 'voz-propia:ficha';
const KEY_RECENT = 'voz-propia:recientes';

const load = <T>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
};

/* ---------- Plantilla ---------- */

function template() {
  const body = BODY.map(([id, shape]) => {
    const name = PARTS.find((p) => p[0] === id)![1];
    return `<g class="hz-part" data-part="${id}" role="button" tabindex="0" aria-label="${name}">${shape}</g>`;
  }).join('');
  const partBtns = PARTS.map(([id, name]) => `<button class="hz-chip" type="button" data-part="${id}" aria-pressed="false">${name}</button>`).join('');
  const pain = Array.from({ length: 11 }, (_, n) => `<button class="hz-pn" type="button" data-pain="${n}" style="--k:${n / 10}" aria-pressed="false" aria-label="Dolor ${n} de 10, ${PAIN[n]}">${n}</button>`).join('');
  const needTabs = NEEDS.map(
    (g, i) => `<button class="hz-tab" type="button" role="tab" id="hz-nt-${i}" aria-controls="hz-need-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-need="${i}">${icon(g.icon, 16, 2.2)}<span>${g.tab}</span></button>`,
  ).join('');
  const tips = TIPS.map(([ic, t, d], i) => `<li class="hz-tip" data-rv style="--d:${i * 0.06}s"><span>${icon(ic, 22, 2)}</span><h3>${t}</h3><p>${rich(d)}</p></li>`).join('');
  const fields = FIELDS.map(([k, label, ph, long]) =>
    long
      ? `<label class="hz-field"><span>${label}</span><textarea rows="2" data-f="${k}" placeholder="${ph}"></textarea></label>`
      : `<label class="hz-field"><span>${label}</span><input type="text" data-f="${k}" placeholder="${ph}" autocomplete="off"></label>`,
  ).join('');
  const idx = NAV.map(([id, t], i) => `<li><button type="button" data-jump="${id}" data-idx-item="${id}"><b>${String(i + 1).padStart(2, '0')}</b>${t}</button></li>`).join('');

  return `
  <div class="hz" data-hz>
    <i class="hz-progress" aria-hidden="true"></i>
    <button class="hz-idx-btn" type="button" data-idx aria-expanded="false" aria-controls="hz-idx">${icon('layout-grid', 18)}<span>Índice</span></button>
    <nav class="hz-idx" id="hz-idx" aria-label="Índice de herramientas" hidden><p>Ir a…</p><ol>${idx}</ol></nav>

    <section class="hz-sec hz-hero" id="hz-top" data-tone="paper" aria-labelledby="hz-h1">
      <p class="hz-over" data-rv>[ Herramientas ]</p>
      <h1 class="hz-h1" id="hz-h1" data-rv style="--d:.08s">Para decirlo<br><em>hoy mismo.</em></h1>
      <p class="hz-lead" data-rv style="--d:.16s">${rich('Funcionan *sin cámara y sin internet*. Toca y el teléfono lo dice en voz alta, o muéstralo en grande.')}</p>
      <div class="hz-grid">
        <button class="hz-card hz-card--coral" type="button" data-jump="hz-alerta">${icon('bell', 26, 2.2)}<b>Pedir ayuda</b><span>Alarma y pantalla que parpadea</span></button>
        <button class="hz-card hz-card--lime" type="button" data-jump="hz-sino">${icon('check', 26, 2.6)}<b>Sí y No</b><span>Gigantes, para responder</span></button>
        <button class="hz-card hz-card--cobalt" type="button" data-jump="hz-dolor">${icon('activity', 26, 2.2)}<b>¿Dónde te duele?</b><span>Toca el cuerpo y el nivel</span></button>
        <button class="hz-card hz-card--ink" type="button" data-jump="hz-tablero">${icon('hand', 26, 2.2)}<b>Necesito…</b><span>Frases de hospital, por tema</span></button>
        <button class="hz-card hz-card--card" type="button" data-jump="hz-escribir">${icon('pencil', 26, 2.2)}<b>Escribir y hablar</b><span>Lo que escribes, se escucha</span></button>
        <button class="hz-card hz-card--mint" type="button" data-jump="hz-ficha">${icon('user', 26, 2.2)}<b>Mi ficha</b><span>Para el personal de salud</span></button>
      </div>
    </section>

    <section class="hz-sec" id="hz-alerta" data-tone="coral" aria-labelledby="hz-al-t">
      <p class="hz-over" data-rv>[ 01 · Pedir ayuda ]</p>
      <h2 class="hz-h2" id="hz-al-t" data-rv>Cuando nadie te escucha.</h2>
      <p class="hz-p" data-rv>${rich('Suena una alarma y la pantalla parpadea con *«Necesito ayuda»*. Toca la pantalla para apagarla.')}</p>
      <button class="hz-alarm" type="button" data-alarm>${icon('bell', 40, 2.4)}<span>Necesito ayuda</span><small>Toca para pedir ayuda</small></button>
    </section>

    <section class="hz-sec" id="hz-sino" data-tone="night" aria-labelledby="hz-yn-t">
      <p class="hz-over" data-rv>[ 02 · Sí y No ]</p>
      <h2 class="hz-h2" id="hz-yn-t" data-rv>La respuesta más rápida.</h2>
      <p class="hz-p" data-rv>${rich('Toca para decirlo en voz alta. *Mantén presionado* para mostrarlo en toda la pantalla.')}</p>
      <div class="hz-yn">
        <button class="hz-yn__b hz-yn__b--yes" type="button" data-yn="Sí">${icon('check', 56, 3)}<span>Sí</span></button>
        <button class="hz-yn__b hz-yn__b--no" type="button" data-yn="No">${icon('x', 56, 3)}<span>No</span></button>
      </div>
      <div class="hz-yn hz-yn--small">
        <button class="hz-say" type="button" data-say="No sé">${icon('help', 18)}<span>No sé</span></button>
        <button class="hz-say" type="button" data-say="Espera, por favor">${icon('gauge', 18)}<span>Espera</span></button>
        <button class="hz-say" type="button" data-say="Otra vez, por favor">${icon('rotate-ccw', 18)}<span>Otra vez</span></button>
      </div>
    </section>

    <section class="hz-sec" id="hz-dolor" data-tone="paper" aria-labelledby="hz-pain-t">
      <p class="hz-over" data-rv>[ 03 · ¿Dónde te duele? ]</p>
      <h2 class="hz-h2" id="hz-pain-t" data-rv>Señala dónde y cuánto.</h2>
      <p class="hz-p" data-rv>${rich('Toca la parte del cuerpo y luego un número del 0 al 10. Después toca *«Decirlo»*.')}</p>
      <div class="hz-pain">
        <div class="hz-body">
          <svg viewBox="0 0 200 390" aria-label="Cuerpo de frente. Tu derecha queda a la izquierda.">${body}</svg>
          <p class="hz-note">Tu derecha queda a la izquierda, como en un espejo.</p>
        </div>
        <div class="hz-pain__ctl">
          <div class="hz-chips" role="group" aria-label="Partes del cuerpo">${partBtns}</div>
          <h3 class="hz-h3">¿Cuánto duele?</h3>
          <div class="hz-scale" role="group" aria-label="Escala de dolor del 0 al 10">${pain}</div>
          <div class="hz-out" aria-live="polite"><p data-pain-out>Elige dónde y cuánto.</p></div>
          <div class="hz-row">
            <button class="hz-btn hz-btn--ink" type="button" data-pain-say>${icon('volume', 18, 2.4)}<span>Decirlo</span></button>
            <button class="hz-btn" type="button" data-pain-big>${icon('eye', 18, 2.2)}<span>Mostrar en grande</span></button>
          </div>
        </div>
      </div>
    </section>

    <section class="hz-sec" id="hz-tablero" data-tone="lime" aria-labelledby="hz-tab-t">
      <p class="hz-over" data-rv>[ 04 · Necesito… ]</p>
      <h2 class="hz-h2" id="hz-tab-t" data-rv>Lo que más se pide en un hospital.</h2>
      <div class="hz-tabs" role="tablist" aria-label="Temas">${needTabs}</div>
      <div class="hz-needs" id="hz-need-panel" role="tabpanel" aria-labelledby="hz-nt-0" data-need-panel></div>
    </section>

    <section class="hz-sec" id="hz-escribir" data-tone="cobalt" aria-labelledby="hz-wr-t">
      <p class="hz-over" data-rv>[ 05 · Escribir y hablar ]</p>
      <h2 class="hz-h2" id="hz-wr-t" data-rv>Si puedes escribir, el teléfono lo dice.</h2>
      <p class="hz-p" data-rv>${rich('Para lo que no está en el tablero. *Nada se envía*: todo se queda en este teléfono.')}</p>
      <div class="hz-write">
        <label class="sr-only" for="hz-text">Escribe lo que quieres decir</label>
        <textarea id="hz-text" rows="3" maxlength="240" placeholder="Escribe aquí lo que quieres decir…" data-text></textarea>
        <div class="hz-row">
          <button class="hz-btn hz-btn--acc" type="button" data-text-say>${icon('volume', 18, 2.4)}<span>Decirlo</span></button>
          <button class="hz-btn" type="button" data-text-big>${icon('eye', 18, 2.2)}<span>Mostrar en grande</span></button>
          <button class="hz-btn" type="button" data-text-clear>${icon('trash', 18, 2.2)}<span>Borrar</span></button>
        </div>
      </div>
      <h3 class="hz-h3" data-rv>Lo último que dijiste</h3>
      <div class="hz-recent" data-recent aria-live="polite"></div>
    </section>

    <section class="hz-sec" id="hz-ficha" data-tone="forest" aria-labelledby="hz-fi-t">
      <p class="hz-over" data-rv>[ 06 · Mi ficha ]</p>
      <h2 class="hz-h2" id="hz-fi-t" data-rv>Lo que el personal debe saber de ti.</h2>
      <p class="hz-p" data-rv>${rich('Llénala una vez. *Se guarda solo en este teléfono* y la puedes mostrar en grande a quien te atiende.')}</p>
      <form class="hz-form" data-ficha>
        ${fields}
        <div class="hz-row">
          <button class="hz-btn hz-btn--acc" type="submit">${icon('check', 18, 2.6)}<span>Guardar</span></button>
          <button class="hz-btn" type="button" data-ficha-show>${icon('eye', 18, 2.2)}<span>Mostrar mi ficha</span></button>
        </div>
        <p class="hz-saved" data-ficha-msg aria-live="polite"></p>
      </form>
    </section>

    <section class="hz-sec" id="hz-consejos" data-tone="sand" aria-labelledby="hz-ti-t">
      <p class="hz-over" data-rv>[ 07 · Para la familia y el personal ]</p>
      <h2 class="hz-h2" id="hz-ti-t" data-rv>Cómo hablar con alguien sin voz.</h2>
      <ul class="hz-tips">${tips}</ul>
      <p class="hz-fine">Voz Propia es una ayuda para comunicarse. No reemplaza la atención del personal de salud.</p>
      <button class="hz-btn hz-btn--ghost" type="button" data-jump="hz-top">${icon('arrow-up', 18, 2.4)}<span>Volver arriba</span></button>
    </section>

    <div class="hz-big" data-big hidden role="dialog" aria-modal="true" aria-label="Mensaje en grande">
      <div class="hz-big__in" data-big-text></div>
      <p class="hz-big__hint">Toca la pantalla para cerrar</p>
    </div>
  </div>`;
}

/* ---------- Vista ---------- */

export function herramientasView(root: HTMLElement) {
  root.innerHTML = template();
  const el = root.querySelector<HTMLElement>('[data-hz]')!;
  const still = reducedMotion();
  if (still) el.classList.add('is-static');
  const ac = new AbortController();
  const { signal } = ac;
  const offs: (() => void)[] = [];
  const say = (t: string) => speakText(t, state.settings);

  /* ---------- Aparición, barra de avance e índice ---------- */

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

  const idx = el.querySelector<HTMLElement>('.hz-idx')!;
  const idxBtn = el.querySelector<HTMLElement>('[data-idx]')!;
  const openIdx = (open: boolean) => {
    idx.hidden = !open;
    idxBtn.setAttribute('aria-expanded', String(open));
    if (open) idx.querySelector<HTMLElement>('.is-on, button')?.focus();
  };
  addEventListener('pointerdown', (e) => !idx.hidden && !(e.target as Element).closest('.hz-idx, [data-idx]') && openIdx(false), { signal });
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

  /* ---------- Pantalla grande y alarma ---------- */

  const big = el.querySelector<HTMLElement>('[data-big]')!;
  const bigText = el.querySelector<HTMLElement>('[data-big-text]')!;
  let audio: AudioContext | null = null;
  let beepTimer = 0;
  let alarmStop = 0;

  const stopAlarm = () => {
    clearInterval(beepTimer);
    clearTimeout(alarmStop);
    beepTimer = 0;
    void audio?.close().catch(() => {});
    audio = null;
    big.classList.remove('is-alarm');
  };
  const closeBig = () => {
    stopAlarm();
    big.hidden = true;
    document.documentElement.classList.remove('hz-locked');
  };
  const showBig = (html: string, kind = '') => {
    bigText.innerHTML = html;
    big.dataset.kind = kind;
    big.hidden = false;
    document.documentElement.classList.add('hz-locked');
  };
  const beep = () => {
    if (!audio) return;
    const t = audio.currentTime;
    for (const [dt, f] of [[0, 880], [0.22, 1175], [0.44, 880]] as const) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + dt);
      g.gain.exponentialRampToValueAtTime(0.25, t + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.2);
      o.connect(g).connect(audio.destination);
      o.start(t + dt);
      o.stop(t + dt + 0.21);
    }
    vibrate([200, 80, 200]);
  };
  const startAlarm = () => {
    stopSpeaking();
    showBig(`${icon('bell', 72, 2.4)}<b>Necesito ayuda</b>`, 'alarm');
    if (!still) big.classList.add('is-alarm');
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audio = new Ctx();
      beep();
      beepTimer = window.setInterval(beep, 1100);
      // Se apaga sola después de un minuto, por si nadie la cierra.
      alarmStop = window.setTimeout(stopAlarm, 60_000);
    } catch {
      // Sin audio, queda la pantalla que parpadea.
    }
  };
  big.addEventListener('click', closeBig, { signal });
  addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape') return;
      if (!big.hidden) closeBig();
      else if (!idx.hidden) {
        openIdx(false);
        idxBtn.focus();
      }
    },
    { signal },
  );

  /* ---------- Sí y No: tocar dice, mantener muestra en grande ---------- */

  let holdTimer = 0;
  let held = false;
  offs.push(
    on(el, 'pointerdown', '[data-yn]', (_, b) => {
      held = false;
      clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => {
        held = true;
        const yes = b.dataset.yn === 'Sí';
        showBig(`${icon(yes ? 'check' : 'x', 96, 3)}<b>${b.dataset.yn}</b>`, yes ? 'yes' : 'no');
        void say(b.dataset.yn!);
      }, 600);
    }),
    on(el, 'pointerup', '[data-yn]', () => clearTimeout(holdTimer)),
    on(el, 'pointerleave', '[data-yn]', () => clearTimeout(holdTimer)),
    on(el, 'click', '[data-yn]', (_, b) => {
      if (held) return;
      b.classList.add('is-saying');
      void say(b.dataset.yn!).finally(() => b.classList.remove('is-saying'));
      remember(b.dataset.yn!);
    }),
  );

  /* ---------- ¿Dónde te duele? ---------- */

  let part = '';
  let level = -1;
  const painOut = el.querySelector<HTMLElement>('[data-pain-out]')!;
  const painPhrase = () => {
    const p = PARTS.find((x) => x[0] === part);
    if (!p && level < 0) return '';
    if (!p) return `Mi dolor es ${level} de 10. ${PAIN[level]}.`;
    return level < 0 ? `${p[2]}.` : `${p[2]}. Es ${level} de 10, ${PAIN[level].toLowerCase()}.`;
  };
  const updatePain = () => {
    el.querySelectorAll<HTMLElement>('[data-part]').forEach((b) => {
      const on = b.dataset.part === part;
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(on));
      else b.classList.toggle('is-on', on);
    });
    el.querySelectorAll<HTMLElement>('[data-pain]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.pain) === level)));
    painOut.textContent = painPhrase() || 'Elige dónde y cuánto.';
  };
  const pickPart = (id: string) => {
    part = part === id ? '' : id;
    updatePain();
  };

  /* ---------- Tablero por tema ---------- */

  const needPanel = el.querySelector<HTMLElement>('[data-need-panel]')!;
  const needBtns = Array.from(el.querySelectorAll<HTMLElement>('[data-need]'));
  const setNeed = (i: number, focus = false) => {
    needBtns.forEach((b, n) => {
      b.setAttribute('aria-selected', String(n === i));
      b.tabIndex = n === i ? 0 : -1;
    });
    if (focus) needBtns[i].focus();
    needPanel.setAttribute('aria-labelledby', `hz-nt-${i}`);
    needPanel.innerHTML = NEEDS[i].items
      .map(([ic, t]) => `<button class="hz-need" type="button" data-say="${t}"><span>${icon(ic, 24, 2)}</span><b>${t}</b>${icon('volume', 18)}</button>`)
      .join('');
    needPanel.classList.remove('is-swap');
    void needPanel.offsetWidth;
    needPanel.classList.add('is-swap');
  };
  setNeed(0);

  /* ---------- Escribir y recientes ---------- */

  const text = el.querySelector<HTMLTextAreaElement>('[data-text]')!;
  const recentEl = el.querySelector<HTMLElement>('[data-recent]')!;
  let recent = load<string[]>(KEY_RECENT, []).filter((s) => typeof s === 'string').slice(0, 8);
  const renderRecent = () => {
    recentEl.innerHTML = recent.length
      ? recent.map((t, i) => `<button class="hz-say hz-say--light" type="button" data-recent-i="${i}">${icon('rotate-ccw', 16)}<span>${esc(t)}</span></button>`).join('')
      : '<p class="hz-note">Aquí aparecen las últimas frases que dijiste, para repetirlas con un toque.</p>';
  };
  function remember(t: string) {
    const clean = t.trim();
    if (!clean) return;
    recent = [clean, ...recent.filter((x) => x !== clean)].slice(0, 8);
    save(KEY_RECENT, recent);
    renderRecent();
  }
  renderRecent();

  /* ---------- Mi ficha ---------- */

  const form = el.querySelector<HTMLFormElement>('[data-ficha]')!;
  const msg = el.querySelector<HTMLElement>('[data-ficha-msg]')!;
  const inputs = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-f]'));
  const ficha = load<Record<string, string>>(KEY_FICHA, {});
  inputs.forEach((i) => (i.value = typeof ficha[i.dataset.f!] === 'string' ? ficha[i.dataset.f!] : ''));
  const readFicha = () => Object.fromEntries(inputs.map((i) => [i.dataset.f!, i.value.trim()]));
  form.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      msg.textContent = save(KEY_FICHA, readFicha()) ? 'Guardada en este teléfono.' : 'Este navegador no deja guardar; se verá mientras la página esté abierta.';
    },
    { signal },
  );
  const showFicha = () => {
    const f = readFicha();
    const rows = FIELDS.filter(([k]) => f[k]).map(([k, label]) => `<div><small>${label}</small><p>${esc(f[k])}</p></div>`).join('');
    showBig(rows ? `<div class="hz-card-id">${icon('user', 40, 2)}${rows}</div>` : '<b class="hz-big__s">Primero llena tu ficha.</b>', 'ficha');
  };

  /* ---------- Acciones ---------- */

  offs.push(
    on(el, 'click', '[data-idx]', () => openIdx(Boolean(idx.hidden))),
    on(el, 'click', '[data-jump]', (e, b) => {
      e.preventDefault();
      jump(b.dataset.jump!);
    }),
    on(el, 'click', '[data-alarm]', startAlarm),
    on(el, 'click', '[data-say]', (_, b) => {
      b.classList.add('is-saying');
      void say(b.dataset.say!).finally(() => b.classList.remove('is-saying'));
      remember(b.dataset.say!);
    }),
    on(el, 'click', '[data-part]', (_, b) => pickPart(b.dataset.part!)),
    on(el, 'keydown', 'g[data-part]', (e, b) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      pickPart(b.dataset.part!);
    }),
    on(el, 'click', '[data-pain]', (_, b) => {
      level = Number(b.dataset.pain);
      updatePain();
    }),
    on(el, 'click', '[data-pain-say]', () => {
      const t = painPhrase();
      if (!t) return void (painOut.textContent = 'Primero toca dónde te duele o un número.');
      void say(t);
      remember(t);
    }),
    on(el, 'click', '[data-pain-big]', () => {
      const t = painPhrase();
      showBig(t ? `${icon('activity', 72, 2.4)}<b class="hz-big__s">${esc(t)}</b>` : '<b class="hz-big__s">Primero toca dónde te duele.</b>', 'pain');
    }),
    on(el, 'click', '[data-need]', (_, b) => setNeed(Number(b.dataset.need))),
    on(el, 'keydown', '[data-need]', (e, b) => {
      const n = NEEDS.length;
      const i = Number(b.dataset.need);
      const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n : -1;
      if (next < 0) return;
      e.preventDefault();
      setNeed(next, true);
    }),
    on(el, 'click', '[data-text-say]', () => {
      const t = text.value.trim();
      if (!t) return text.focus();
      void say(t);
      remember(t);
    }),
    on(el, 'click', '[data-text-big]', () => {
      const t = text.value.trim();
      if (!t) return text.focus();
      showBig(`<b class="hz-big__s">${esc(t)}</b>`, 'text');
    }),
    on(el, 'click', '[data-text-clear]', () => {
      text.value = '';
      text.focus();
    }),
    on(el, 'click', '[data-recent-i]', (_, b) => {
      const t = recent[Number(b.dataset.recentI)];
      if (t) void say(t);
    }),
    on(el, 'click', '[data-ficha-show]', showFicha),
  );

  return () => {
    closeBig();
    stopSpeaking();
    ac.abort();
    offs.forEach((off) => off());
    clearTimeout(holdTimer);
    cancelAnimationFrame(raf);
    reveal.disconnect();
    spy.disconnect();
  };
}
