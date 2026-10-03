import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { tracker, type TrackerStatus, type TrackFrame } from '../../core/vision/face-tracker';
import { LIP_INNER, LIP_OUTER } from '../../core/vision/lip-features';
import { icon } from '../icons';

export type FaceState = 'sin-camara' | 'buscando' | 'lejos' | 'listo';

export interface Stage {
  el: HTMLElement;
  start: () => Promise<void>;
  stop: () => void;
  destroy: () => void;
  get face(): FaceState;
  /** Nivel de actividad de la boca 0..1, suavizado. */
  get level(): number;
  setRecording: (on: boolean) => void;
}

const MSG: Record<FaceState, string> = {
  'sin-camara': 'Cámara apagada',
  buscando: 'Buscando tu cara',
  lejos: 'Acércate un poco',
  listo: 'Boca a la vista',
};

export function createStage(onFace?: (s: FaceState) => void): Stage {
  const el = document.createElement('div');
  el.className = 'stage';
  el.innerHTML = `
    <div class="stage__mirror">
      <video class="stage__video" playsinline muted></video>
      <canvas class="stage__canvas"></canvas>
    </div>
    <div class="stage__placeholder">
      <div class="stage__face-art" aria-hidden="true">
        <svg viewBox="0 0 120 120"><ellipse cx="60" cy="58" rx="38" ry="46" class="fa-head"/><path d="M42 82 Q60 94 78 82" class="fa-mouth"/><circle cx="46" cy="52" r="3.5" class="fa-eye"/><circle cx="74" cy="52" r="3.5" class="fa-eye"/></svg>
      </div>
      <p class="stage__ph-title">Tu cámara se queda en tu teléfono</p>
      <p class="stage__ph-sub">Ningún video se guarda ni se envía. Solo se miden tus labios.</p>
      <button class="btn btn--primary stage__start" type="button">${icon('camera', 20)}<span>Encender cámara</span></button>
    </div>
    <div class="stage__pill" data-state="sin-camara"><span class="dot"></span><span class="stage__pill-text">${MSG['sin-camara']}</span></div>
    <div class="stage__rec" aria-hidden="true"><span></span>Leyendo labios</div>
  `;
  const video = el.querySelector('video')!;
  const canvas = el.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const pill = el.querySelector<HTMLElement>('.stage__pill')!;
  const pillText = el.querySelector<HTMLElement>('.stage__pill-text')!;

  let face: FaceState = 'sin-camara';
  let level = 0;
  let box = { x: 0, y: 0, w: 0, h: 0, ok: false };
  let missSince = 0;
  let accent = '#e47a4b';
  let glow = 'rgba(255,214,186,.95)';

  const setFace = (s: FaceState) => {
    if (s === face) return;
    face = s;
    pill.dataset.state = s;
    pillText.textContent = MSG[s];
    onFace?.(s);
  };

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(el);
    accent = css.getPropertyValue('--stage-accent').trim() || accent;
    glow = css.getPropertyValue('--stage-glow').trim() || glow;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Mapea coordenadas normalizadas del video a la caja visible (object-fit: cover).
  const mapper = () => {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const s = Math.max(W / vw, H / vh);
    const ox = (W - vw * s) / 2;
    const oy = (H - vh * s) / 2;
    return (p: NormalizedLandmark) => [p.x * vw * s + ox, p.y * vh * s + oy] as const;
  };

  const path = (lm: NormalizedLandmark[], idx: number[], map: ReturnType<typeof mapper>) => {
    ctx.beginPath();
    idx.forEach((i, k) => {
      const [x, y] = map(lm[i]);
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
  };

  const draw = (f: TrackFrame) => {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    ctx.clearRect(0, 0, W, H);
    const lm = f.landmarks;
    level += ((lm ? f.openness : 0) - level) * 0.35;
    if (!lm) {
      if (!missSince) missSince = f.t;
      if (f.t - missSince > 400) setFace('buscando');
      box.ok = false;
      return;
    }
    missSince = 0;
    const map = mapper();
    const [lx, ly] = map(lm[33]);
    const [rx, ry] = map(lm[263]);
    setFace(Math.hypot(rx - lx, ry - ly) / W < 0.13 ? 'lejos' : 'listo');

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const i of LIP_OUTER) {
      const [x, y] = map(lm[i]);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    const padX = (maxX - minX) * 0.45;
    const padY = (maxY - minY) * 0.9 + 10;
    const target = { x: minX - padX, y: minY - padY, w: maxX - minX + padX * 2, h: maxY - minY + padY * 2 };
    const k = box.ok ? 0.3 : 1;
    box = {
      x: box.x + (target.x - box.x) * k,
      y: box.y + (target.y - box.y) * k,
      w: box.w + (target.w - box.w) * k,
      h: box.h + (target.h - box.h) * k,
      ok: true,
    };

    ctx.save();
    ctx.lineJoin = 'round';
    path(lm, LIP_OUTER, map);
    ctx.fillStyle = 'rgba(255, 196, 160, 0.22)';
    ctx.fill();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    path(lm, LIP_INNER, map);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = glow;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fffaf2';
    for (let i = 0; i < LIP_OUTER.length; i += 2) {
      const [x, y] = map(lm[LIP_OUTER[i]]);
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Retícula de enfoque con esquinas, sigue la boca con suavizado.
    const { x, y, w, h } = box;
    const c = Math.min(18, w * 0.18);
    ctx.strokeStyle = 'rgba(255, 250, 242, 0.95)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + c); ctx.lineTo(x, y); ctx.lineTo(x + c, y);
    ctx.moveTo(x + w - c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + c);
    ctx.moveTo(x + w, y + h - c); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - c, y + h);
    ctx.moveTo(x + c, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - c);
    ctx.stroke();
    ctx.restore();
  };

  const offFrame = tracker.onFrame(draw);
  const offStatus = tracker.onStatus((s: TrackerStatus, detail) => {
    el.dataset.status = s;
    const btn = el.querySelector<HTMLButtonElement>('.stage__start')!;
    const title = el.querySelector<HTMLElement>('.stage__ph-title')!;
    const sub = el.querySelector<HTMLElement>('.stage__ph-sub')!;
    btn.disabled = s === 'cargando';
    btn.querySelector('span')!.textContent = s === 'cargando' ? 'Preparando lector…' : 'Encender cámara';
    if (s === 'sin-permiso') {
      title.textContent = 'Necesito permiso para usar la cámara';
      sub.textContent = 'Actívalo en la configuración del navegador y vuelve a intentar. El video nunca sale de tu teléfono.';
    } else if (s === 'error') {
      title.textContent = 'No pude abrir la cámara';
      sub.textContent = detail ?? 'Revisa que ninguna otra app la esté usando.';
    }
    if (s !== 'listo') setFace('sin-camara');
    else setFace('buscando');
  });

  const start = () => tracker.start(video);
  el.querySelector('.stage__start')!.addEventListener('click', () => void start());

  return {
    el,
    start,
    stop: () => tracker.stop(),
    destroy: () => {
      offFrame();
      offStatus();
      ro.disconnect();
      tracker.stop();
    },
    get face() {
      return face;
    },
    get level() {
      return level;
    },
    setRecording: (on) => el.classList.toggle('is-recording', on),
  };
}
