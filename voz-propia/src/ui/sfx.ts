/**
 * Efectos de sonido de la entrada, sintetizados al momento con Web Audio (sin archivos de audio:
 * pesan cero y funcionan sin internet). Los navegadores solo dejan sonar después de un toque,
 * así que antes de eso todo queda en silencio y se activa solo al primer toque.
 */

const KEY = 'voz-propia:sonido';
const PENT = [0, 2, 4, 7, 9];
const hz = (semi: number, base = 523.25) => base * 2 ** (semi / 12);

export function createSfx(inject?: BaseAudioContext) {
  let ctx: BaseAudioContext | null = inject ?? null;
  let dry!: GainNode;
  let send!: GainNode;
  let noiseBuf: AudioBuffer | null = null;
  let enabled = true;
  try {
    enabled = localStorage.getItem(KEY) !== 'off';
  } catch {
    // Sin almacenamiento: queda activo.
  }
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((fn) => fn());

  const ensure = (): BaseAudioContext | null => {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC({ latencyHint: 'interactive' });
      } catch {
        return null;
      }
      ctx.addEventListener('statechange', notify);
    }
    if (!dry) {
      const c = ctx;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 5;
      const master = c.createGain();
      master.gain.value = 0.8;
      dry = c.createGain();
      send = c.createGain();
      send.gain.value = 0.34;
      const verb = c.createConvolver();
      const len = Math.floor(c.sampleRate * 1.7);
      const ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
      }
      verb.buffer = ir;
      dry.connect(master);
      send.connect(verb);
      verb.connect(master);
      master.connect(comp);
      comp.connect(c.destination);
    }
    return ctx;
  };
  const live = () => {
    if (!enabled) return null;
    const c = ensure();
    if (!c) return null;
    return inject || c.state === 'running' ? c : null;
  };
  const noise = (c: BaseAudioContext) => {
    if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  };
  /** Salida con paneo y envío a la reverberación. */
  const out = (c: BaseAudioContext, pan = 0, wet = 0.6) => {
    const g = c.createGain();
    const p = c.createStereoPanner?.();
    if (p) {
      p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p);
      p.connect(dry);
      const s = c.createGain();
      s.gain.value = wet;
      p.connect(s);
      s.connect(send);
    } else {
      g.connect(dry);
    }
    return g;
  };
  const env = (g: AudioParam, t: number, a: number, peak: number, d: number) => {
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(peak, t + a);
    g.exponentialRampToValueAtTime(0.0001, t + a + d);
  };
  const osc = (c: BaseAudioContext, type: OscillatorType, f: number, t: number, dur: number, to?: number) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    o.start(t);
    o.stop(t + dur + 0.05);
    return o;
  };
  /** Campanita de cristal: fundamental + parciales inarmónicos. */
  const bell = (c: BaseAudioContext, f: number, t: number, v = 0.22, pan = 0, d = 0.9) => {
    const g = out(c, pan, 0.75);
    env(g.gain, t, 0.004, v, d);
    for (const [m, a] of [[1, 1], [2.756, 0.28], [5.4, 0.1]] as const) osc(c, 'sine', f * m, t, d).connect(withGain(c, a, g));
  };
  const withGain = (c: BaseAudioContext, v: number, to: AudioNode) => {
    const g = c.createGain();
    g.gain.value = v;
    g.connect(to);
    return g;
  };
  const burst = (c: BaseAudioContext, t: number, dur: number, type: BiquadFilterType, f: number, v: number, pan = 0, f2?: number, q = 1) => {
    const s = c.createBufferSource();
    s.buffer = noise(c);
    s.loop = true;
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    fl.Q.value = q;
    const g = out(c, pan, 0.5);
    env(g.gain, t, Math.min(0.02, dur / 4), v, dur);
    s.connect(fl);
    fl.connect(g);
    s.start(t);
    s.stop(t + dur + 0.1);
  };

  /* ---- Sonidos sueltos ---- */

  const word = (i: number, x: number) => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    const f = hz(PENT[i % 5] + 12 * Math.floor(i / 5));
    bell(c, f, t, 0.45, (x / 50 - 1) * 0.8, 0.85);
    bell(c, f * 2, t + 0.05, 0.12, (x / 50 - 1) * 0.8, 0.5);
  };
  const mouth = (i: number, x: number) => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    const g = out(c, (x / 50 - 1) * 0.8, 0.5);
    env(g.gain, t, 0.01, 0.4, 0.22);
    osc(c, 'sine', 280, t, 0.18, 760).connect(g);
    bell(c, hz(PENT[(i + 2) % 5] + 12, 523.25), t + 0.08, 0.25, (x / 50 - 1) * 0.8, 0.6);
  };
  const full = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.02;
    [0, 4, 7, 12, 16].forEach((s, k) => bell(c, hz(s), t + k * 0.045, 0.2, (k - 2) * 0.3, 1.5));
    burst(c, t, 0.7, 'highpass', 6000, 0.05);
  };
  /** Rayo: chasquido eléctrico, trueno grave y golpe de bajo. */
  const crack = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.02;
    burst(c, t, 0.32, 'highpass', 1800, 0.9, 0, undefined, 0.7);
    burst(c, t, 0.9, 'bandpass', 3200, 0.35, 0, 600, 2);
    const z = out(c, 0, 0.4);
    env(z.gain, t, 0.003, 0.28, 0.4);
    const zap = osc(c, 'sawtooth', 2400, t, 0.38, 70);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 1.4;
    zap.connect(bp);
    bp.connect(z);
    const lfo = osc(c, 'square', 38, t, 0.4);
    const lg = c.createGain();
    lg.gain.value = 0.5;
    lfo.connect(lg);
    lg.connect(z.gain);
    // Trueno
    burst(c, t + 0.05, 1.9, 'lowpass', 280, 0.9, 0, 70, 0.8);
    const sub = out(c, 0, 0.2);
    env(sub.gain, t, 0.01, 0.9, 1.3);
    osc(c, 'sine', 110, t, 1.3, 32).connect(sub);
  };
  const split = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    burst(c, t, 1.0, 'bandpass', 500, 0.5, -0.9, 3200, 1.2);
    burst(c, t, 1.0, 'bandpass', 500, 0.5, 0.9, 3200, 1.2);
    const sub = out(c, 0, 0.3);
    env(sub.gain, t, 0.01, 0.8, 1.0);
    osc(c, 'sine', 70, t, 1.0, 28).connect(sub);
    for (let k = 0; k < 12; k++) {
      const at = t + 0.12 + Math.random() * 0.9;
      bell(c, hz(PENT[k % 5] + 24 + (k % 2) * 12), at, 0.07, Math.random() * 1.6 - 0.8, 0.5);
    }
  };
  const card = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    burst(c, t, 0.7, 'bandpass', 400, 0.12, 0, 4000, 1);
    bell(c, hz(4, 1046.5), t + 0.25, 0.24, 0, 1.2);
    bell(c, hz(12, 1046.5), t + 0.33, 0.16, 0.3, 1.2);
  };
  const tick = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.005;
    const g = out(c, 0, 0.25);
    env(g.gain, t, 0.002, 0.5, 0.07);
    osc(c, 'triangle', 1500, t, 0.07, 900).connect(g);
  };
  const hello = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    bell(c, hz(7), t, 0.34, -0.2, 1.1);
    bell(c, hz(12), t + 0.11, 0.38, 0.2, 1.4);
  };
  /** Círculo completo: arpegio brillante, brisa que sube y golpe grave. */
  const success = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    [0, 4, 7, 12, 16, 19, 24].forEach((s, k) => bell(c, hz(s), t + k * 0.07, 0.2, (k / 6) * 1.2 - 0.6, 1.6));
    burst(c, t, 0.9, 'bandpass', 300, 0.3, 0, 7000, 0.9);
    const sub = out(c, 0, 0.3);
    env(sub.gain, t + 0.05, 0.02, 0.8, 0.9);
    osc(c, 'sine', 98, t + 0.05, 0.9, 40).connect(sub);
    burst(c, t + 0.35, 0.8, 'highpass', 5000, 0.07);
  };

  /* ---- Sonidos de la app ---- */

  /** Cambio de página: brisa corta. */
  const swipe = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    burst(c, t, 0.34, 'bandpass', 500, 0.5, -0.3, 2600, 1.1);
    bell(c, hz(7, 783.99), t + 0.14, 0.1, 0.2, 0.5);
  };
  /** Capítulo nuevo de la guía: campanita cuya nota sube con cada capítulo. */
  const chapter = (i: number) => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    const f = hz(PENT[i % 5] + 12 * Math.floor(i / 5));
    bell(c, f, t, 0.38, 0, 1.2);
    bell(c, f * 1.5, t + 0.06, 0.14, 0.3, 0.8);
  };
  /** Chapoteo: ruido de agua que sube, burbujas y un golpe grave. */
  const splash = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    burst(c, t, 0.9, 'bandpass', 250, 0.55, 0, 1800, 0.9);
    burst(c, t + 0.05, 0.6, 'highpass', 4500, 0.1);
    const sub = out(c, 0, 0.3);
    env(sub.gain, t, 0.01, 0.8, 0.7);
    osc(c, 'sine', 120, t, 0.7, 40).connect(sub);
    for (let k = 0; k < 9; k++) {
      const at = t + 0.08 + Math.random() * 0.7;
      const g = out(c, Math.random() * 1.6 - 0.8, 0.5);
      env(g.gain, at, 0.005, 0.2, 0.12);
      const f0 = 300 + Math.random() * 500;
      osc(c, 'sine', f0, at, 0.12, f0 * 2.2).connect(g);
    }
  };
  /** Destello de color (cambiar paleta, marcar algo). */
  const sparkle = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    [0, 4, 7, 12, 16].forEach((st, k) => bell(c, hz(st, 1046.5), t + k * 0.05, 0.14, (k - 2) * 0.35, 0.7));
  };
  /** Aviso bueno / aviso suave. */
  const ok = () => hello();
  const warn = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    bell(c, hz(-5, 523.25), t, 0.3, 0, 0.7);
    bell(c, hz(-8, 523.25), t + 0.12, 0.3, 0, 0.9);
  };

  /* ---- Sonidos continuos ---- */

  let rise: { stop: () => void; set: (p: number) => void } | null = null;
  const riser = (p: number) => {
    if (!rise) {
      const c = live();
      if (!c) return;
      const t = c.currentTime;
      const g = out(c, 0, 0.5);
      g.gain.setValueAtTime(0.0001, t);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      lp.connect(g);
      const o1 = osc(c, 'triangle', 98, t, 600);
      const o2 = osc(c, 'sawtooth', 98.6, t, 600);
      o1.connect(withGain(c, 1, lp));
      o2.connect(withGain(c, 0.35, lp));
      rise = {
        set: (v) => {
          const n = c.currentTime;
          g.gain.setTargetAtTime(0.012 + v * 0.07, n, 0.1);
          o1.frequency.setTargetAtTime(98 * 4 ** v, n, 0.1);
          o2.frequency.setTargetAtTime(98.6 * 4 ** v, n, 0.1);
          lp.frequency.setTargetAtTime(380 + v * 2400, n, 0.1);
        },
        stop: () => {
          const n = c.currentTime;
          g.gain.setTargetAtTime(0.0001, n, 0.08);
          o1.stop(n + 0.5);
          o2.stop(n + 0.5);
        },
      };
    }
    rise.set(p);
  };
  const riserStop = () => {
    rise?.stop();
    rise = null;
  };

  let pen: { stop: () => void; set: (p: number) => void } | null = null;
  let lastStep = 0;
  /** Mientras se dibuja el círculo: un tono que sube con el trazo y marcas como un dial. */
  const draw = (p: number) => {
    if (!pen) {
      const c = live();
      if (!c) return;
      const t = c.currentTime;
      const g = out(c, 0, 0.55);
      g.gain.setValueAtTime(0.0001, t);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      lp.connect(g);
      const o1 = osc(c, 'sine', 220, t, 600);
      const o2 = osc(c, 'triangle', 220 * 1.004, t, 600);
      const lfo = osc(c, 'sine', 6, t, 600);
      const lg = c.createGain();
      lg.gain.value = 3;
      lfo.connect(lg);
      lg.connect(o1.frequency);
      o1.connect(withGain(c, 0.8, lp));
      o2.connect(withGain(c, 0.4, lp));
      lastStep = 0;
      pen = {
        set: (v) => {
          const n = c.currentTime;
          g.gain.setTargetAtTime(0.05 + v * 0.07, n, 0.05);
          o1.frequency.setTargetAtTime(220 * 4 ** v, n, 0.04);
          o2.frequency.setTargetAtTime(220 * 1.004 * 4 ** v, n, 0.04);
        },
        stop: () => {
          const n = c.currentTime;
          g.gain.setTargetAtTime(0.0001, n, 0.06);
          o1.stop(n + 0.4);
          o2.stop(n + 0.4);
          lfo.stop(n + 0.4);
        },
      };
    }
    pen.set(p);
    const step = Math.floor(p * 12);
    if (step > lastStep) {
      lastStep = step;
      tick();
    } else if (step < lastStep) lastStep = step;
  };
  const drawStop = () => {
    pen?.stop();
    pen = null;
  };

  const stopAll = () => {
    riserStop();
    drawStop();
  };

  return {
    word,
    mouth,
    full,
    crack,
    split,
    card,
    tick,
    hello,
    success,
    swipe,
    chapter,
    splash,
    sparkle,
    ok,
    warn,
    riser,
    riserStop,
    draw,
    drawStop,
    stopAll,
    /** Lo llama el primer toque: los navegadores solo dejan sonar después. */
    unlock() {
      const c = ensure();
      if (c && 'resume' in c && c.state !== 'running') void (c as AudioContext).resume().then(notify, () => {});
    },
    get running() {
      return !!ctx && ctx.state === 'running';
    },
    get enabled() {
      return enabled;
    },
    setEnabled(v: boolean) {
      enabled = v;
      try {
        localStorage.setItem(KEY, v ? 'on' : 'off');
      } catch {
        // No se pudo guardar; solo vale en esta visita.
      }
      if (!v) stopAll();
      notify();
    },
    onChange(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export const sfx = createSfx();

/** Botón de sonido (silenciar / activar) para cualquier pantalla. */
export const soundBtnHTML = (iconOn: string, iconOff: string, cls = '') =>
  `<button class="l-snd ${cls}" type="button" data-sound aria-pressed="true"><span class="l-snd__on">${iconOn}</span><span class="l-snd__off">${iconOff}</span></button>`;

/** Conecta todos los botones `[data-sound]` dentro de `root`. Devuelve la función que los desconecta. */
export function bindSound(root: HTMLElement) {
  const sync = () =>
    root.querySelectorAll<HTMLElement>('[data-sound]').forEach((b) => {
      b.setAttribute('aria-pressed', String(sfx.enabled));
      b.classList.toggle('is-off', !sfx.enabled);
      b.setAttribute('aria-label', sfx.enabled ? 'Sonido activado. Tocar para silenciar' : 'Sonido silenciado. Tocar para activar');
    });
  const click = (e: Event) => {
    if ((e.target as Element).closest('[data-sound]')) sfx.setEnabled(!sfx.enabled);
  };
  root.addEventListener('click', click);
  const off = sfx.onChange(sync);
  sync();
  return () => {
    root.removeEventListener('click', click);
    off();
  };
}
