import '@fontsource-variable/fredoka/wght.css';
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/components.css';
import './ui/styles/views.css';

import { startRouter } from './app/router';
import { loadSettings, state } from './app/state';
import { engine } from './core/engine';
import { tracker } from './core/vision/face-tracker';
import { enableTilt } from './ui/components/tilt';
import { orb } from './ui/components/orb';
import { toast } from './ui/components/toast';
import { icon } from './ui/icons';
import { ajustesView } from './ui/views/ajustes';
import { entrenarView } from './ui/views/entrenar';
import { hablarView } from './ui/views/hablar';
import { showOnboarding } from './ui/views/onboarding';
import { tableroView } from './ui/views/tablero';

const NAV = [
  ['hablar', 'scan-face', 'Hablar'],
  ['tablero', 'layout-grid', 'Tablero'],
  ['entrenar', 'sparkles', 'Entrenar'],
  ['ajustes', 'settings', 'Ajustes'],
] as const;

function shell() {
  document.getElementById('app')!.innerHTML = `
    <div class="ambient" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
    <header class="topbar">
      <a class="brand" href="#/hablar" aria-label="Voz Propia, inicio">${orb('sm')}<span>Voz Propia</span></a>
      <div class="topbar__right">
        <span class="chip chip--net" data-net hidden>${icon('wifi-off', 14)} Sin internet · todo funciona</span>
        <button class="btn btn--soft btn--sm" type="button" data-install hidden>${icon('download', 16)}<span>Instalar</span></button>
      </div>
    </header>
    <main id="view" class="main" tabindex="-1"></main>
    <nav class="dock" aria-label="Secciones">
      ${NAV.map(([r, ic, label]) => `<a class="dock__item" href="#/${r}" data-route="${r}">${icon(ic, 22)}<span>${label}</span></a>`).join('')}
    </nav>
    <div id="toasts" class="toasts" aria-live="polite"></div>`;
}

function watchNetwork() {
  const chip = document.querySelector<HTMLElement>('[data-net]')!;
  const update = () => (chip.hidden = navigator.onLine);
  addEventListener('online', update);
  addEventListener('offline', update);
  update();
}

function watchInstall() {
  const btn = document.querySelector<HTMLButtonElement>('[data-install]')!;
  let deferred: (Event & { prompt: () => Promise<void> }) | null = null;
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as typeof deferred;
    btn.hidden = false;
  });
  btn.addEventListener('click', async () => {
    btn.hidden = true;
    await deferred?.prompt();
    deferred = null;
  });
}

function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('./sw.js')
    .then((reg) => {
      const offer = (w: ServiceWorker) =>
        toast('Hay una versión nueva de Voz Propia.', {
          action: { label: 'Actualizar', run: () => w.postMessage('activar') },
        });
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
          if (w.state === 'activated' && !navigator.serviceWorker.controller) toast('Lista para usarse sin internet.', { tone: 'ok' });
        });
      });
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        location.reload();
      });
    })
    .catch(() => {
      // Sin service worker la app sigue funcionando en línea.
    });
}

async function boot() {
  shell();
  enableTilt(document.body);
  watchNetwork();
  watchInstall();
  await loadSettings();
  await engine.load();
  startRouter(document.getElementById('view')!, {
    hablar: hablarView,
    tablero: tableroView,
    entrenar: entrenarView,
    ajustes: ajustesView,
  });
  document.documentElement.classList.add('is-ready');
  if (!state.settings.onboarded) await showOnboarding();
  // Precarga del lector de labios en segundo plano: la cámara abre al instante después.
  const idle = window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 1500));
  idle(() => void tracker.preload().catch(() => {}));
  registerServiceWorker();
}

void boot();
