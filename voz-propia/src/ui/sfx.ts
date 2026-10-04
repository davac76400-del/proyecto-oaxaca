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
      master.gain.value = 1.25;
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

  /* ---- Instrumentos: cada parte de la app suena distinto ---- */

  const jit = (f: number, amt = 0.025) => f * (1 + (Math.random() * 2 - 1) * amt);
  /** Kalimba: «tink» suave y limpio. */
  const kalimba = (c: BaseAudioContext, f: number, t: number, v = 0.3, pan = 0) => {
    const g = out(c, pan, 0.6);
    env(g.gain, t, 0.003, v, 0.9);
    osc(c, 'sine', f, t, 0.9).connect(g);
    const h = withGain(c, 0.25, g);
    osc(c, 'sine', f * 5.4, t, 0.12).connect(h);
    burst(c, t, 0.03, 'bandpass', f * 3, v * 0.2, pan, undefined, 4);
  };
  /** Marimba: madera cálida. */
  const marimba = (c: BaseAudioContext, f: number, t: number, v = 0.3, pan = 0) => {
    const g = out(c, pan, 0.5);
    env(g.gain, t, 0.004, v, 0.55);
    osc(c, 'sine', f, t, 0.55).connect(g);
    const h = withGain(c, 0.35, g);
    const o = osc(c, 'sine', f * 4, t, 0.1);
    o.connect(h);
    const h2 = withGain(c, 0.12, g);
    osc(c, 'triangle', f * 2, t, 0.3).connect(h2);
  };
  /** Cuerda pulsada: sierra que se cierra rápido. */
  const pluck = (c: BaseAudioContext, f: number, t: number, v = 0.3, pan = 0) => {
    const g = out(c, pan, 0.45);
    env(g.gain, t, 0.002, v, 0.45);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4200, t);
    lp.frequency.exponentialRampToValueAtTime(260, t + 0.3);
    lp.connect(g);
    osc(c, 'sawtooth', f, t, 0.5).connect(lp);
    osc(c, 'square', f * 1.003, t, 0.5).connect(withGain(c, 0.4, lp));
  };
  /** Colchón de acorde: ataque lento, suena como aire. */
  const pad = (c: BaseAudioContext, freqs: number[], t: number, dur = 1.8, v = 0.07, pan = 0) => {
    const g = out(c, pan, 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.4);
    lp.connect(g);
    for (const f of freqs) {
      osc(c, 'sawtooth', f, t, dur).connect(withGain(c, 0.5, lp));
      osc(c, 'triangle', f * 1.006, t, dur).connect(withGain(c, 0.7, lp));
    }
  };
  /** Clic de madera. */
  const wood = (c: BaseAudioContext, t: number, v = 0.4, f = 1700, pan = 0) => {
    burst(c, t, 0.05, 'bandpass', f, v, pan, undefined, 9);
    const g = out(c, pan, 0.2);
    env(g.gain, t, 0.002, v * 0.5, 0.06);
    osc(c, 'triangle', f * 0.6, t, 0.06, f * 0.4).connect(g);
  };
  /** Burbuja. */
  const bloop = (c: BaseAudioContext, t: number, v = 0.35, f = 380, pan = 0) => {
    const g = out(c, pan, 0.4);
    env(g.gain, t, 0.006, v, 0.12);
    osc(c, 'sine', f, t, 0.1, f * 2.3).connect(g);
  };
  /** Golpe sordo. */
  const thud = (c: BaseAudioContext, t: number, v = 0.5, f = 150) => {
    const g = out(c, 0, 0.15);
    env(g.gain, t, 0.004, v, 0.22);
    osc(c, 'sine', f, t, 0.2, f * 0.4).connect(g);
  };
  /** Chasquido de cristal que se rompe. */
  const clink = (c: BaseAudioContext, t: number, v = 0.12, pan = 0) => {
    const f = 2200 + Math.random() * 5200;
    const g = out(c, pan, 0.6);
    env(g.gain, t, 0.001, v, 0.05 + Math.random() * 0.12);
    osc(c, 'sine', f, t, 0.2).connect(g);
    osc(c, 'sine', f * 1.51, t, 0.2).connect(withGain(c, 0.5, g));
  };
  const CHORDS = [
    [0, 4, 7, 11],
    [-3, 0, 4, 9],
    [-5, -1, 2, 7],
    [2, 5, 9, 12],
    [0, 7, 12, 16],
  ];

  /* ---- Sonidos sueltos ---- */

  const word = (i: number, x: number) => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    const f = hz(PENT[i % 5] + 12 * Math.floor(i / 5));
    const pan = (x / 50 - 1) * 0.8;
    const k = i % 3;
    if (k === 0) kalimba(c, f, t, 0.5, pan);
    else if (k === 1) marimba(c, f, t, 0.5, pan);
    else bell(c, f, t, 0.42, pan, 0.85);
  };
  const mouth = (i: number, x: number) => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    const pan = (x / 50 - 1) * 0.8;
    bloop(c, t, 0.7, 260 + (i % 4) * 60, pan);
    pluck(c, hz(PENT[(i + 2) % 5] + 12, 523.25), t + 0.07, 0.12, pan);
  };
  const full = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.02;
    [0, 4, 7, 12, 16].forEach((s, k) => bell(c, hz(s), t + k * 0.045, 0.2, (k - 2) * 0.3, 1.5));
    burst(c, t, 0.7, 'highpass', 6000, 0.05);
  };
  /** Se carga el rayo: chisporroteo que se hace más denso, zumbido que sube y un temblor grave. */
  const crack = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.02;
    for (let k = 0; k < 46; k++) {
      const at = t + 0.62 * Math.sqrt(Math.random());
      burst(c, at, 0.012 + Math.random() * 0.03, 'highpass', 2500 + Math.random() * 6000, 0.1 + Math.random() * 0.3, Math.random() * 1.6 - 0.8, undefined, 0.7);
    }
    const z = out(c, 0, 0.3);
    env(z.gain, t, 0.35, 0.18, 0.3);
    const whine = osc(c, 'sawtooth', 260, t, 0.65, 3600);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 2;
    whine.connect(bp);
    bp.connect(z);
    const trem = osc(c, 'square', 55, t, 0.65);
    const tg = c.createGain();
    tg.gain.value = 0.6;
    trem.connect(tg);
    tg.connect(z.gain);
    burst(c, t, 0.7, 'lowpass', 90, 0.5, 0, 160, 0.8);
  };
  /** El rayo cae: estallido, trueno que rueda, golpe de bajo y cristales que se rompen. */
  const split = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    // Estallido
    burst(c, t, 0.14, 'highpass', 1400, 1.0, 0, undefined, 0.6);
    burst(c, t, 0.4, 'bandpass', 2600, 0.5, 0, 500, 2.5);
    thud(c, t, 0.9, 120);
    const sub = out(c, 0, 0.15);
    env(sub.gain, t, 0.008, 1.0, 1.7);
    osc(c, 'sine', 92, t, 1.7, 26).connect(sub);
    // Trueno que rueda
    for (let k = 0; k < 6; k++) {
      const at = t + 0.05 + k * 0.32 + Math.random() * 0.2;
      burst(c, at, 0.9 + Math.random() * 0.9, 'lowpass', 420 - k * 35, 0.75 - k * 0.09, Math.random() * 1.2 - 0.6, 80, 0.9);
    }
    // Cristales
    for (let k = 0; k < 26; k++) clink(c, t + 0.02 + Math.random() * 0.8, 0.07 + Math.random() * 0.1, Math.random() * 1.8 - 0.9);
    // Pedazos que salen volando
    burst(c, t + 0.05, 1.0, 'bandpass', 450, 0.45, -0.9, 3400, 1.2);
    burst(c, t + 0.1, 1.0, 'bandpass', 450, 0.45, 0.9, 3400, 1.2);
    for (let k = 0; k < 10; k++) {
      const at = t + 0.25 + Math.random() * 0.9;
      bell(c, hz(PENT[k % 5] + 24 + (k % 2) * 12), at, 0.06, Math.random() * 1.6 - 0.8, 0.5);
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
    wood(c, c.currentTime + 0.005, 0.8, jit(1500, 0.06));
  };
  let lastTap = 0;
  /** Toque en la interfaz: cada tipo de elemento suena distinto y con una variación leve. */
  const tap = (kind: 'primary' | 'nav' | 'tab' | 'toggle' | 'card' | 'plain' = 'plain') => {
    const c = live();
    if (!c) return;
    const now = performance.now();
    if (now - lastTap < 40) return;
    lastTap = now;
    const t = c.currentTime + 0.005;
    if (kind === 'primary') {
      pluck(c, jit(hz(PENT[Math.floor(Math.random() * 5)], 330), 0.01), t, 0.4);
      thud(c, t, 0.5, 180);
    } else if (kind === 'nav') marimba(c, jit(hz(PENT[Math.floor(Math.random() * 5)] + 12, 523.25), 0.01), t, 0.7);
    else if (kind === 'tab') {
      wood(c, t, 0.8, jit(2100, 0.05));
      kalimba(c, jit(hz(PENT[Math.floor(Math.random() * 5)] + 12, 659.25), 0.01), t + 0.02, 0.3);
    } else if (kind === 'toggle') {
      wood(c, t, 0.7, 1200);
      wood(c, t + 0.05, 0.6, 1900);
    } else if (kind === 'card') {
      bloop(c, t, 0.6, jit(420, 0.08));
      kalimba(c, jit(hz(7, 523.25), 0.01), t + 0.03, 0.3);
    } else bloop(c, t, 0.6, jit(520, 0.1));
  };
  /** Algo salió mal: dos golpes graves. */
  const err = () => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    thud(c, t, 0.6, 130);
    thud(c, t + 0.11, 0.6, 105);
    const g = out(c, 0, 0.2);
    env(g.gain, t, 0.01, 0.14, 0.3);
    osc(c, 'square', 196, t, 0.3, 150).connect(withGain(c, 0.6, g));
  };
  /** Etapa nueva del inicio al bajar: acorde suave distinto en cada una, con brisa. */
  const stage = (n: number) => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    const ch = CHORDS[n % CHORDS.length].map((st) => hz(st - 12, 523.25));
    pad(c, ch, t, 2.2, 0.08, 0);
    burst(c, t, 0.5, 'bandpass', 400, 0.12, 0, 1800, 0.9);
    if (n % 2) kalimba(c, hz(CHORDS[n % CHORDS.length][3], 523.25), t + 0.25, 0.22, 0.2);
    else marimba(c, hz(CHORDS[n % CHORDS.length][2] + 12, 523.25), t + 0.25, 0.22, -0.2);
  };
  /** Brisa continua mientras se hace scroll: más fuerte si se baja rápido. */
  let flowNodes: { g: GainNode; f: BiquadFilterNode } | null = null;
  let flowOff = 0;
  const flow = (speed: number) => {
    const c = live();
    if (!c) return;
    if (!flowNodes) {
      const s = c.createBufferSource();
      s.buffer = noise(c);
      s.loop = true;
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 0.8;
      const g = out(c, 0, 0.3);
      g.gain.value = 0.0001;
      s.connect(f);
      f.connect(g);
      s.start();
      flowNodes = { g: g as GainNode, f };
    }
    const n = c.currentTime;
    const v = Math.min(1, speed / 3);
    flowNodes.g.gain.setTargetAtTime(0.0001 + v * 0.1, n, 0.08);
    flowNodes.f.frequency.setTargetAtTime(350 + v * 1700, n, 0.1);
    clearTimeout(flowOff);
    flowOff = window.setTimeout(() => flowNodes?.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.12), 140);
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

  /** Cambio de página: brisa; hacia atrás suena al revés. */
  const swipe = (back = false) => {
    const c = live();
    if (!c) return;
    const t = c.currentTime + 0.01;
    if (back) burst(c, t, 0.34, 'bandpass', 2600, 0.4, 0.2, 450, 1.1);
    else burst(c, t, 0.34, 'bandpass', 450, 0.4, -0.2, 2600, 1.1);
    marimba(c, hz(back ? 0 : 7, 659.25), t + 0.12, 0.2, back ? -0.3 : 0.3);
  };
  let lastChapter = 0;
  /** Capítulo nuevo de la guía: cada capítulo tiene su instrumento y su acorde. */
  const chapter = (i: number) => {
    const c = live();
    if (!c) return;
    const now = performance.now();
    if (now - lastChapter < 420) return;
    lastChapter = now;
    const t = c.currentTime + 0.01;
    const ch = CHORDS[i % CHORDS.length];
    const top = hz(ch[(i + 1) % 4] + 12, 523.25);
    const kind = i % 4;
    pad(c, ch.map((st) => hz(st - 12, 523.25)), t, 1.8, 0.06);
    if (kind === 0) kalimba(c, top, t, 0.4, 0.1);
    else if (kind === 1) marimba(c, top, t, 0.42, -0.1);
    else if (kind === 2) bell(c, top, t, 0.3, 0, 1.1);
    else pluck(c, top / 2, t, 0.2, 0);
    kalimba(c, hz(ch[0] + 24, 523.25), t + 0.14, 0.14, 0.3);
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
    tap,
    err,
    stage,
    flow,
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
