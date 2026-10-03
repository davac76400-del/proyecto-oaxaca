import '@fontsource/anton/latin-400.css';
import '@fontsource/sacramento/latin-400.css';
import './landing.css';

import { state } from '../../app/state';
import type { Role } from '../../core/types';
import { speakText } from '../../core/voice/speaker';
import { brandMark } from '../brand';
import { bindHold, holdRing } from '../components/hold';
import { reducedMotion, sleep } from '../dom';
import { icon } from '../icons';
import type { FieldControl, GravityField, Pointer } from './scene';

interface Options {
  jumpToRoles: boolean;
  onChoose: (role: Role) => void;
}

const PALETTES = [
  { color: '#2F69FF', swatch: '#2F69FF', name: 'Azul cobalto y perla', desc: 'Esferas cobalto en un estudio blanco y perla.' },
  { color: '#FFC5C2', swatch: '#FFA6B3', name: 'Rosa y crema', desc: 'Rosas dulces con acentos de fresa.' },
  { color: '#E1FC03', swatch: '#E1FC03', name: 'Lima eléctrica', desc: 'Lima neón contra un horizonte blanco.' },
  { color: '#96E5FF', swatch: '#96E5FF', name: 'Cielo ártico', desc: 'Azules de cristal con brillo translúcido.' },
];
const DEFAULT_COLOR = '#2F69FF';
const COLOR_KEY = 'voz-propia:esferas';

const HERO_BG: Record<string, string> = {
  '#2f69ff': 'radial-gradient(circle at center, #ffffff 0%, #ecefff 35%, #c2d1ff 100%)',
  '#ffc5c2': 'radial-gradient(circle at center, #ffffff 0%, #fff0f1 38%, #ffd1d5 100%)',
  '#e1fc03': 'radial-gradient(circle at center, #ffffff 0%, #fbffe5 38%, #e8ff9c 100%)',
  '#96e5ff': 'radial-gradient(circle at center, #ffffff 0%, #eefaff 38%, #c4efff 100%)',
};

const BAND = ['Sí', 'No', 'Tengo sed', 'Me duele', 'Tengo frío', 'Llama a mi familia', 'Tengo miedo', 'Gracias'];
const MARQUEE = ['Menos silencio', 'Más voz', 'Tus labios hablan', 'Sin internet'];

const readColor = () => {
  try {
    return localStorage.getItem(COLOR_KEY) || DEFAULT_COLOR;
  } catch {
    return DEFAULT_COLOR;
  }
};
const saveColor = (c: string) => {
  try {
    localStorage.setItem(COLOR_KEY, c);
  } catch {
    // Sin almacenamiento el color vuelve al azul la próxima vez.
  }
};

const orbChevron = (ic = 'chevron-right') => `<span class="l-orb" aria-hidden="true">${icon(ic, 16, 2.4)}</span>`;

function template(color: string) {
  const band = BAND.map((w, i) => `<span class="${i % 2 ? 'is-solid' : ''}">${w}</span><i>✦</i>`).join('');
  const marquee = MARQUEE.map((w) => `<span>${w}</span><i></i>`).join('');
  const card = (n: string, k: string, v: string, d: string) => `
    <div class="l-card"><div class="l-card__inner">
      <div class="l-card__head"><span>${n}</span><span>${k}</span><i></i></div>
      <p class="l-card__v">${v}</p>
      <p class="l-card__d">${d}</p>
    </div></div>`;
  const feature = (ic: string, t: string, d: string, i: number) => `
    <article class="l-feature" data-reveal style="--d:${i * 0.09}s">
      <span class="l-feature__icon">${icon(ic, 22, 1.8)}</span>
      <h3>${t}</h3>
      <p>${d}</p>
    </article>`;

  return `
  <div class="landing" data-stage="0">
    <div class="l-bg" aria-hidden="true">
      <i style="background:${HERO_BG[color.toLowerCase()] ?? HERO_BG['#2f69ff']}" data-layer="0"></i>
      <i data-layer="1"></i><i data-layer="2"></i><i data-layer="3"></i><i data-layer="4"><b class="l-stars"></b></i>
    </div>
    <div class="l-poster" aria-hidden="true">
      <p class="l-poster__over">Tus labios hablan · nosotros ponemos la</p>
      <p class="l-poster__word">Voz</p>
    </div>
    <div class="l-canvas" aria-hidden="true"><canvas></canvas></div>
    <div class="l-poster l-poster--front" aria-hidden="true">
      <p class="l-poster__over">Tus labios hablan · nosotros ponemos la</p>
      <p class="l-poster__word">Voz</p>
    </div>

    <div class="l-loader" data-loader role="status" aria-live="polite">
      <span class="l-loader__orb" aria-hidden="true"></span>
      <p class="l-loader__status" data-loader-status>Calibrando lectura de labios</p>
      <div class="l-loader__bar" aria-hidden="true"><i data-loader-bar></i></div>
      <p class="l-loader__count" data-loader-count>000%</p>
    </div>

    <header class="l-header">
      <a class="l-word" href="#top" data-scroll="top" aria-label="Voz Propia, arriba">${brandMark()}<span>Voz Propia</span></a>
      <nav class="l-nav" aria-label="Secciones del inicio">
        <a href="#historia" data-scroll="historia">Historia</a>
        <a href="#labios" data-scroll="labios">Labios</a>
        <a href="#como-funciona" data-scroll="como-funciona">Cómo funciona</a>
        <a href="#entrar" data-scroll="entrar">Entrar</a>
      </nav>
      <div class="l-header__right">
        <button class="l-glass-btn" type="button" data-drawer aria-label="Colores de las esferas">${icon('sliders', 17)}</button>
        <a class="l-pill" href="#entrar" data-scroll="entrar"><span>Comenzar</span>${orbChevron()}</a>
      </div>
    </header>

    <main class="l-main">
      <section class="l-sec l-hero" id="top" aria-labelledby="hero-title">
        <p class="l-hero__script" aria-hidden="true">propia</p>
        <div class="l-hero__row">
          <div class="l-hero__left">
            <p class="l-eyebrow l-in" style="--d:.15s">[ Lectura de labios sin internet ]</p>
            <h1 class="l-hero__title l-in" id="hero-title" style="--d:.28s"><span class="sr-only">Voz Propia. </span>Menos silencio.<br>Más voz.</h1>
          </div>
          <div class="l-hero__right l-in" style="--d:.45s">
            <p>Lee el movimiento de tus labios y lo dice en voz alta. Para quien perdió la voz, en su propio teléfono.</p>
            <p class="l-credit">© 2026 · Proyecto para SOLACYT Infomatrix</p>
            <p class="l-cue">${icon('arrow-down', 14)} Desliza</p>
          </div>
        </div>
      </section>

      <section class="l-sec l-drop" id="historia">
        <div class="l-band" aria-hidden="true"><div class="l-band__track">${band}${band}</div></div>
        <div class="l-wrap l-grid">
          <div class="l-grid__main">
            <p class="l-label" data-reveal>[ 02 · Silencio ]</p>
            <h2 class="l-h2" data-reveal style="--d:.1s">Cuando la voz<br>se cae.<span class="l-script l-script--drop" aria-hidden="true">sin voz</span></h2>
            <p class="l-p" data-reveal style="--d:.2s">Una traqueostomía, una cirugía de garganta o días en terapia intensiva. Las palabras siguen ahí, pero el sonido ya no sale. Desliza y mira cómo cada una cae al suelo, sin que nadie la escuche.</p>
          </div>
          <div class="l-grid__side l-cards" data-reveal style="--d:.25s">
            ${card('01', 'Visión', '478 puntos', 'De tu cara, leídos hasta 30 veces por segundo')}
            ${card('02', 'Aprende', '1 a 5 ejemplos', 'Bastan para enseñarle una frase nueva')}
            ${card('03', 'Privacidad', '0 videos', 'Nada sale de tu teléfono, ni una imagen')}
          </div>
        </div>
        <span class="l-sticker l-sticker--a" aria-hidden="true">Sin internet ✦</span>
      </section>

      <section class="l-sec l-form" id="labios">
        <div class="l-wrap l-form__top">
          <p class="l-label" data-reveal>[ 03 · Forma ]</p>
          <h2 class="l-h2" data-reveal style="--d:.1s">Del silencio,<br>una forma.<span class="l-script l-script--form" aria-hidden="true">tus labios</span></h2>
        </div>
        <div class="l-wrap l-form__bottom">
          <p class="l-p l-p--glass" data-reveal style="--d:.15s">Del caos, cada esfera encuentra su lugar: unos labios. Así aprende Voz Propia, con la forma de tu boca y no la de nadie más. Pasa el cursor por encima y mira cómo se desordena y vuelve.</p>
          <button class="l-hold" type="button" data-talk data-reveal style="--d:.28s">
            <span class="hold">${holdRing()}<span class="hold__core">${icon('volume', 18)}</span></span>
            <span class="l-hold__text">Mantén presionado<b>y escucha cómo hablan</b></span>
          </button>
        </div>
        <span class="l-sticker l-sticker--b" aria-hidden="true">Solo tu boca</span>
      </section>

      <section class="l-sec l-release" id="voz">
        <div class="l-release__inner">
          <p class="l-label" data-reveal>[ 04 · Voz ]</p>
          <h2 class="l-h2 l-h2--xl" data-reveal style="--d:.12s">Y entonces,<br>tu voz.<span class="l-script l-script--rel" aria-hidden="true">se escucha</span></h2>
          <p class="l-p l-p--glass" data-reveal style="--d:.24s">Cada palabra despega de tus labios y se vuelve sonido. Al instante, sin internet, con la voz que tu familia eligió para ti.</p>
        </div>
        <span class="l-sticker l-sticker--c" aria-hidden="true">Al instante</span>
        <span class="l-sticker l-sticker--d" aria-hidden="true">100% en tu teléfono</span>
        <span class="l-sticker l-sticker--e" aria-hidden="true">Sin servidores ✦</span>
      </section>

      <section class="l-how" id="como-funciona">
        <div class="l-wrap">
          <div class="l-head">
            <p class="l-eye" data-reveal>Así funciona</p>
            <h2 data-reveal style="--d:.08s">Una voz que vive en tu teléfono</h2>
            <p data-reveal style="--d:.16s">Sin servidores ni esperas. Voz Propia mira tus labios, los compara con tus propios ejemplos y habla en milisegundos.</p>
          </div>
          <div class="l-features">
            ${feature('scan-face', 'Mira tus labios', 'Sigue 478 puntos de tu cara y se queda con los 40 de la boca, aunque te muevas o te alejes.', 0)}
            ${feature('sparkles', 'Aprende contigo', 'Con 1 a 5 ejemplos por frase. Cada vez que eliges la opción correcta, aprende un poco más.', 1)}
            ${feature('volume', 'Habla por ti', 'Con la voz del teléfono o con un audio grabado por tu familia para cada frase.', 2)}
            ${feature('wifi-off', 'Funciona en modo avión', 'Todo corre dentro del teléfono. Ideal para un cuarto de hospital sin señal.', 3)}
            ${feature('shield-check', 'Tus datos, tuyos', 'No se graba ni se envía video. Solo números con la forma de tus labios.', 4)}
            ${feature('layout-grid', 'Respuestas rápidas', 'Sí, no, escala de dolor y frases por tema, a un toque y sin cámara.', 5)}
          </div>
          <div class="l-show">
            <div class="l-show__copy">
              <p class="l-eye" data-reveal>En tiempo real</p>
              <h2 data-reveal style="--d:.09s">Míralo leer mientras hablas</h2>
              <p data-reveal style="--d:.18s">Cada movimiento se compara con tus ejemplos en el momento. Si duda, te muestra tres opciones para que elijas, y de tu elección aprende.</p>
              <a class="l-btn" href="#entrar" data-scroll="entrar" data-reveal style="--d:.27s">Elegir cómo entrar ${icon('arrow-right', 17)}</a>
            </div>
            <div class="l-dash" data-reveal style="--d:.16s" aria-label="Ejemplo de lectura en vivo">
              <div class="l-dash__top"><span>Leyendo labios</span><span class="l-dash__live"><i></i>En vivo</span></div>
              <div class="l-dash__bars" aria-hidden="true">${[62, 88, 47, 95, 71, 80, 58].map((h, i) => `<i style="--h:${h}%;--i:${i}"></i>`).join('')}</div>
              <div class="l-dash__rows">
                ${[['Tengo sed', 92], ['Tengo frío', 5], ['Me duele', 3]].map(([t, w]) => `<div class="l-dash__row"><span>${t}</span><div class="l-dash__track"><i style="--w:${w}%"></i></div><b>${w}%</b></div>`).join('')}
              </div>
            </div>
          </div>
          <div class="l-stats">
            ${[['478', 'Puntos de tu cara'], ['30', 'Cuadros por segundo'], ['~6 ms', 'Para reconocer una frase'], ['0', 'Videos guardados']]
              .map(([v, l], i) => `<div class="l-stat" data-reveal style="--d:${i * 0.08}s"><p class="l-stat__v">${v}</p><p class="l-stat__l">${l}</p></div>`)
              .join('')}
          </div>
        </div>
      </section>

      <section class="l-roles" id="entrar">
        <div class="l-wrap">
          <div class="l-head">
            <p class="l-eye" data-reveal>Empecemos</p>
            <h2 data-reveal style="--d:.08s">¿Quién va a usar Voz Propia?</h2>
            <p data-reveal style="--d:.16s">Elige tu modo. Se puede cambiar después.</p>
          </div>
          <div class="l-role-grid">
            <button class="l-role l-role--user" type="button" data-role="usuario" data-reveal>
              <span class="l-role__balls" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              <span class="l-role__tag">${icon('user', 15)} Usuario</span>
              <span class="l-role__title">Soy usuario</span>
              <span class="l-role__desc">Para quien va a hablar. Usa las frases que su equipo ya preparó.</span>
              <span class="l-role__list"><span>${icon('check', 16, 2.6)} Habla moviendo los labios</span><span>${icon('check', 16, 2.6)} Tablero con Sí, No y dolor</span><span>${icon('check', 16, 2.6)} Nada que configurar</span></span>
              <span class="l-role__cta"><span>Entrar como usuario</span>${orbChevron()}</span>
            </button>
            <button class="l-role l-role--pro" type="button" data-role="programador" data-reveal style="--d:.12s">
              <span class="l-role__grid" aria-hidden="true"></span>
              <span class="l-role__tag">${icon('code', 15)} Programador</span>
              <span class="l-role__title">Soy programador</span>
              <span class="l-role__desc">Para quien prepara la app: familia, terapeuta o equipo de salud.</span>
              <span class="l-role__list"><span>${icon('check', 16, 2.6)} Entrena frases con la persona</span><span>${icon('check', 16, 2.6)} Elige voces y graba audios</span><span>${icon('check', 16, 2.6)} Ajusta la confianza y respaldos</span></span>
              <span class="l-role__cta"><span>Entrar como programador</span>${orbChevron()}</span>
            </button>
          </div>
          <p class="l-soon" data-reveal>${icon('lock', 15)} Muy pronto: inicia sesión o crea tu cuenta para guardar tu perfil.</p>
        </div>
      </section>
    </main>

    <footer class="l-footer">
      <i class="l-footer__glow l-footer__glow--a" aria-hidden="true"></i>
      <i class="l-footer__glow l-footer__glow--b" aria-hidden="true"></i>
      <div class="l-marquee" aria-hidden="true"><div class="l-marquee__track">${marquee}${marquee}</div></div>
      <div class="l-footer__body">
        <div class="l-footer__cta" data-reveal>
          <p class="l-footer__eye">[ Hagamos que te escuchen ]</p>
          <p class="l-footer__title">Tus labios<br>ya saben hablar.</p>
          <a class="l-footer__pill" href="#entrar" data-scroll="entrar"><span>Elegir cómo entrar</span><span class="l-orb l-orb--lg">${icon('arrow-up-right', 18, 2.2)}</span></a>
        </div>
        <div class="l-footer__cols">
          <div data-reveal><p class="l-footer__h">Voz Propia</p><ul>
            ${[['historia', 'Historia'], ['labios', 'Labios'], ['como-funciona', 'Cómo funciona'], ['entrar', 'Entrar']].map(([id, t]) => `<li><a href="#${id}" data-scroll="${id}">${t}${icon('arrow-up-right', 13)}</a></li>`).join('')}
          </ul></div>
          <div data-reveal style="--d:.08s"><p class="l-footer__h">Hecha para</p><ul>
            <li><span>Traqueostomía</span></li><li><span>Laringectomía</span></li><li><span>Terapia intensiva</span></li><li><span>Su familia</span></li>
          </ul></div>
          <div data-reveal style="--d:.16s"><p class="l-footer__h">Promesas</p><ul>
            <li><span>Sin internet</span></li><li><span>Sin video guardado</span></li><li><span>Aprende de ti</span></li><li><span>Tu voz, tu decisión</span></li>
          </ul></div>
        </div>
      </div>
      <div class="l-footer__bar">
        <p><b>Voz Propia</b><i></i><span>© 2026 · Una ayuda para comunicarse, no un dispositivo médico.</span></p>
        <a class="l-footer__top" href="#top" data-scroll="top" aria-label="Volver arriba">${icon('arrow-up-right', 16)}</a>
      </div>
    </footer>

    <div class="l-scrim" data-close-drawer hidden></div>
    <aside class="l-drawer" aria-label="Colores de las esferas" hidden>
      <div class="l-drawer__head">
        <p>${icon('sliders', 16)} Colores</p>
        <button class="l-glass-btn l-glass-btn--plain" type="button" data-close-drawer aria-label="Cerrar">${icon('x', 18)}</button>
      </div>
      <p class="l-drawer__note">Elige el color de las esferas del inicio. Al bajar se vuelven lima y luego rosa, cuando forman los labios.</p>
      <p class="l-drawer__title">${icon('sparkles', 13)} Paleta de las esferas</p>
      <div class="l-drawer__list">
        ${PALETTES.map(
          (p) => `<button class="l-swatch" type="button" data-color="${p.color}" aria-pressed="${p.color.toLowerCase() === color.toLowerCase()}">
            <span class="l-swatch__row"><b>${p.name}</b><i style="background:${p.swatch}"></i></span>
            <small>${p.desc}</small>
          </button>`,
        ).join('')}
      </div>
      <div class="l-drawer__foot">
        <p><span>Motor 3D</span><span>Three.js WebGL</span></p>
        <p><span>Física</span><span>Verlet con choques 3D</span></p>
        <button class="l-btn l-btn--ghost" type="button" data-color="${DEFAULT_COLOR}">${icon('rotate-ccw', 15)} Volver al azul</button>
      </div>
    </aside>

    <dialog class="l-entry" aria-labelledby="entry-title">
      <div class="l-entry__inner">
        <div class="l-entry__head">
          <div><p class="l-entry__kicker" data-entry-kicker></p><h2 id="entry-title">¿Cómo quieres entrar?</h2></div>
          <button class="l-glass-btn l-glass-btn--plain" type="button" data-close-entry aria-label="Cerrar">${icon('x', 18)}</button>
        </div>
        <button class="l-entry__opt is-main" type="button" data-enter>
          <span class="l-entry__ic">${icon('user', 20)}</span>
          <span><b>Continuar sin cuenta</b><small>Todo se guarda solo en este dispositivo.</small></span>
          ${orbChevron()}
        </button>
        <button class="l-entry__opt" type="button" disabled>
          <span class="l-entry__ic">${icon('log-in', 20)}</span>
          <span><b>Iniciar sesión</b><small>Para tener tus frases en varios dispositivos.</small></span>
          <em>Pronto</em>
        </button>
        <button class="l-entry__opt" type="button" disabled>
          <span class="l-entry__ic">${icon('user-plus', 20)}</span>
          <span><b>Crear cuenta</b><small>Guarda tu perfil y tus respaldos.</small></span>
          <em>Pronto</em>
        </button>
      </div>
    </dialog>
  </div>`;
}

export function mountLanding(app: HTMLElement, opts: Options) {
  const motionOk = !reducedMotion();
  let color = readColor();
  app.innerHTML = template(color);
  const root = app.querySelector<HTMLElement>('.landing')!;
  const canvasBox = root.querySelector<HTMLElement>('.l-canvas')!;
  const loader = root.querySelector<HTMLElement>('[data-loader]')!;
  const drawer = root.querySelector<HTMLElement>('.l-drawer')!;
  const scrim = root.querySelector<HTMLElement>('.l-scrim')!;
  const entry = root.querySelector<HTMLDialogElement>('.l-entry')!;
  const ac = new AbortController();
  const { signal } = ac;

  const control: FieldControl = { progress: 0, started: false };
  const pointer: Pointer = { x: 99, y: 99, isDown: false };
  let field: GravityField | null = null;
  let sceneReady = false;
  let disposed = false;

  /* ---------- Escena 3D (si el equipo no tiene WebGL, el inicio funciona igual sin ella) ---------- */

  const buildScene = async () => {
    try {
      const { createGravityField } = await import('./scene');
      if (disposed) return;
      const old = canvasBox.querySelector('canvas')!;
      const canvas = document.createElement('canvas');
      old.replaceWith(canvas);
      field = createGravityField(canvasBox, canvas, {
        ballColor: color,
        control,
        pointer,
        reducedMotion: !motionOk,
        onReady: () => (sceneReady = true),
      });
    } catch {
      root.classList.add('no-webgl');
      sceneReady = true;
    }
  };
  void buildScene();

  /* ---------- Loader: avanza solo hasta 92% y termina cuando la escena ya pintó ---------- */

  const bar = root.querySelector<HTMLElement>('[data-loader-bar]')!;
  const count = root.querySelector<HTMLElement>('[data-loader-count]')!;
  const status = root.querySelector<HTMLElement>('[data-loader-status]')!;
  let value = 0;
  let last = performance.now();
  let loaderRaf = 0;

  const reveal = () => {
    control.started = true;
    root.classList.add('is-revealed');
    if (opts.jumpToRoles) jumpTo('entrar', true);
  };

  const finishLoader = () => {
    setTimeout(() => {
      loader.classList.add('is-leaving');
      setTimeout(() => {
        loader.hidden = true;
        reveal();
      }, 520);
    }, 140);
  };

  const loaderTick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (sceneReady) {
      value += (100 - value) * 6 * dt;
      if (value >= 99.4) value = 100;
    } else {
      value += (92 - value) * 1.7 * dt;
    }
    bar.style.width = `${value}%`;
    count.textContent = `${String(Math.floor(value)).padStart(3, '0')}%`;
    if (value >= 100) status.textContent = 'Lista para escucharte';
    if (value >= 99.9 && sceneReady) return finishLoader();
    loaderRaf = requestAnimationFrame(loaderTick);
  };

  if (opts.jumpToRoles || !motionOk) {
    loader.hidden = true;
    requestAnimationFrame(reveal);
  } else {
    loaderRaf = requestAnimationFrame(loaderTick);
  }

  /* ---------- Scroll: progreso de la escena, color de fondo y encabezado ---------- */

  // El progreso se mide por secciones (0 inicio … 4 cómo funciona), no por pantallas: así la física
  // coincide con el texto aunque una sección mida más que la pantalla en el teléfono.
  const sections = ['top', 'historia', 'labios', 'voz', 'como-funciona'].map((id) => root.querySelector<HTMLElement>(`#${id}`)!);
  const progressAt = (y: number) => {
    const tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
    for (let i = 0; i < tops.length - 1; i++) {
      if (y < tops[i + 1]) return i + Math.max(0, y - tops[i]) / Math.max(1, tops[i + 1] - tops[i]);
    }
    return tops.length - 1 + (y - tops[tops.length - 1]) / (innerHeight || 1);
  };

  let scrollRaf = 0;
  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      const progress = progressAt(window.scrollY);
      control.progress = progress;
      // El lienzo 3D se apaga al entrar a la parte nocturna: ahí ya no hay esferas.
      canvasBox.style.opacity = String(1 - Math.min(1, Math.max(0, (progress - 3.5) / 0.5)));
      const stage = progress > 3.55 ? 4 : progress > 2.55 ? 3 : progress > 1.55 ? 2 : progress > 0.7 ? 1 : 0;
      if (root.dataset.stage !== String(stage)) root.dataset.stage = String(stage);
    });
  };
  addEventListener('scroll', onScroll, { passive: true, signal });
  addEventListener('resize', onScroll, { signal });
  onScroll();

  /* ---------- Scroll suave con la rueda (estilo Lenis): un deslizamiento con peso ---------- */

  let target = scrollY;
  let current = scrollY;
  let gliding = false;
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
  const glide = () => {
    if (disposed) return;
    current += (target - current) * 0.09;
    if (Math.abs(target - current) < 0.5) {
      current = target;
      gliding = false;
    }
    window.scrollTo(0, current);
    if (gliding) requestAnimationFrame(glide);
  };
  const startGlide = () => {
    if (!gliding) {
      gliding = true;
      current = scrollY;
      requestAnimationFrame(glide);
    }
  };
  if (motionOk) {
    addEventListener(
      'wheel',
      (e) => {
        if (e.ctrlKey || !drawer.hidden || entry.open) return;
        e.preventDefault();
        const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
        if (!gliding) target = scrollY;
        target = Math.max(0, Math.min(maxScroll(), target + delta));
        startGlide();
      },
      { passive: false, signal },
    );
    // Teclado, barra de desplazamiento o dedo: el destino sigue a la posición real.
    addEventListener('scroll', () => !gliding && (target = current = scrollY), { passive: true, signal });
  }

  function jumpTo(id: string, instant = false) {
    const el = id === 'top' ? root : root.querySelector<HTMLElement>(`#${id}`);
    if (!el) return;
    const y = id === 'top' ? 0 : el.getBoundingClientRect().top + scrollY;
    if (instant || !motionOk) {
      window.scrollTo(0, y);
      target = current = y;
      return;
    }
    target = Math.max(0, Math.min(maxScroll(), y));
    startGlide();
  }

  /* ---------- Cursor: las esferas se apartan, con más fuerza si el movimiento es rápido ---------- */

  // Mientras se mantiene presionado «escucha cómo hablan», el cursor no empuja los labios.
  let holdingTalk = false;
  addEventListener(
    'pointermove',
    (e) => {
      if (holdingTalk) return;
      pointer.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / innerHeight) * 2 + 1;
    },
    { signal },
  );
  addEventListener(
    'pointerdown',
    (e) => {
      holdingTalk = !!(e.target as Element).closest('[data-talk]');
      if (holdingTalk) pointer.x = pointer.y = 99;
      else pointer.isDown = true;
    },
    { signal },
  );
  addEventListener(
    'pointerup',
    (e) => {
      holdingTalk = false;
      pointer.isDown = false;
      // Con el dedo no hay cursor que se quede encima.
      if (e.pointerType !== 'mouse') pointer.x = pointer.y = 99;
    },
    { signal },
  );
  document.addEventListener('pointerleave', () => (pointer.x = pointer.y = 99), { signal });

  /* ---------- Aparición al entrar en pantalla ---------- */

  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    },
    { threshold: 0.3, rootMargin: '0px 0px -6% 0px' },
  );
  root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  /* ---------- Los labios hablan ---------- */

  const offHold = bindHold(root.querySelector<HTMLElement>('[data-talk]')!, 900, () => {
    const voice = speakText('Hola. Esta es mi voz.', state.settings);
    field?.talk(Promise.all([voice, sleep(1600)]));
  });

  /* ---------- Paleta de las esferas ---------- */

  const openDrawer = (open: boolean) => {
    drawer.hidden = !open;
    scrim.hidden = !open;
    requestAnimationFrame(() => root.classList.toggle('drawer-open', open));
    if (open) drawer.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
  };

  const setColor = (c: string) => {
    if (c.toLowerCase() === color.toLowerCase()) return;
    color = c;
    saveColor(c);
    root.querySelectorAll<HTMLElement>('[data-color]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color?.toLowerCase() === c.toLowerCase())));
    root.querySelector<HTMLElement>('[data-layer="0"]')!.style.background = HERO_BG[c.toLowerCase()] ?? HERO_BG['#2f69ff'];
    field?.dispose();
    field = null;
    void buildScene();
  };

  /* ---------- Elegir modo ---------- */

  let chosen: Role = 'usuario';
  const openEntry = (role: Role) => {
    chosen = role;
    root.querySelector<HTMLElement>('[data-entry-kicker]')!.textContent = role === 'usuario' ? '[ Modo usuario ]' : '[ Modo programador ]';
    entry.dataset.for = role;
    entry.showModal();
  };

  const enter = async () => {
    entry.close();
    root.classList.add('is-leaving');
    await sleep(motionOk ? 420 : 0);
    opts.onChoose(chosen);
  };

  root.addEventListener(
    'click',
    (e) => {
      const t = e.target as HTMLElement;
      const scroll = t.closest<HTMLElement>('[data-scroll]');
      if (scroll) {
        e.preventDefault();
        jumpTo(scroll.dataset.scroll!);
        return;
      }
      if (t.closest('[data-drawer]')) return openDrawer(true);
      if (t.closest('[data-close-drawer]')) return openDrawer(false);
      const sw = t.closest<HTMLElement>('[data-color]');
      if (sw) return setColor(sw.dataset.color!);
      const role = t.closest<HTMLElement>('[data-role]');
      if (role) return openEntry(role.dataset.role as Role);
      if (t.closest('[data-enter]')) return void enter();
      if (t.closest('[data-close-entry]') || t === entry) entry.close();
    },
    { signal },
  );
  addEventListener('keydown', (e) => e.key === 'Escape' && !drawer.hidden && openDrawer(false), { signal });

  return () => {
    disposed = true;
    ac.abort();
    io.disconnect();
    offHold();
    cancelAnimationFrame(loaderRaf);
    cancelAnimationFrame(scrollRaf);
    field?.dispose();
    if (entry.open) entry.close();
    app.innerHTML = '';
  };
}
