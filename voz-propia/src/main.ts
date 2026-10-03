import '@fontsource-variable/raleway/wght.css';
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/components.css';
import './ui/styles/views.css';
import './ui/styles/guia.css';

import { go, hashRoute, startRouter, type Route, type View } from './app/router';
import { loadSettings, state, updateSettings } from './app/state';
import { engine } from './core/engine';
import { db } from './core/storage/db';
import type { Role } from './core/types';
import { tracker } from './core/vision/face-tracker';
import { brandMark } from './ui/brand';
import { enableTilt } from './ui/components/tilt';
import { bindWaterBack, waterBackHTML } from './ui/components/water-back';
import { toast } from './ui/components/toast';
import { icon } from './ui/icons';
import { ajustesView } from './ui/views/ajustes';
import { entrenarView } from './ui/views/entrenar';
import { guiaView } from './ui/views/guia';
import { hablarView } from './ui/views/hablar';
import { panelView } from './ui/views/panel';
import { tableroView } from './ui/views/tablero';

type Kind = Role | 'inicio';

interface Mode {
  home: Route;
  views: Partial<Record<Route, View>>;
  nav: [Route, string, string][];
}

const MODES: Record<Role, Mode> = {
  usuario: {
    home: 'guia',
    views: { guia: guiaView },
    nav: [],
  },
  programador: {
    home: 'panel',
    views: { panel: panelView, entrenar: entrenarView, hablar: hablarView, tablero: tableroView, ajustes: ajustesView },
    nav: [
      ['panel', 'dashboard', 'Panel'],
      ['entrenar', 'sparkles', 'Entrenar'],
      ['hablar', 'scan-face', 'Probar'],
      ['tablero', 'layout-grid', 'Tablero'],
      ['ajustes', 'settings', 'Ajustes'],
    ],
  },
};

const THEME_COLOR: Record<Kind, string> = { inicio: '#ECEFFF', usuario: '#05080A', programador: '#04060F' };

const app = document.getElementById('app')!;
let mounted: { kind: Kind; unmount: () => void } | null = null;
let routing = 0;

/* ---------- Instalación como app ---------- */

let installPrompt: (Event & { prompt: () => Promise<void> }) | null = null;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e as typeof installPrompt;
  document.querySelectorAll<HTMLElement>('[data-install]').forEach((b) => (b.hidden = false));
});

/* ---------- Shell de la app (usuario o programador) ---------- */

function shell(role: Role) {
  const m = MODES[role];
  const links = m.nav
    .map(([r, ic, label]) => `<a class="nav__item" href="#/${r}" data-route="${r}">${icon(ic, 22)}<span>${label}</span></a>`)
    .join('');
  const pro = role === 'programador';
  app.innerHTML = `
    <div class="ambient" aria-hidden="true">${
      pro ? '<i class="stars"></i><i class="stars stars--far"></i><i class="horizon"></i>' : '<i class="s1"></i><i class="s2"></i><i class="s3"></i>'
    }</div>
    <header class="topbar">
      <a class="brand" href="#/${m.home}" aria-label="Voz Propia, inicio de la sección">${brandMark()}<span class="brand__word">Voz Propia</span>${
        pro ? `<span class="mode-badge">${icon('code', 13, 2.4)}Programador</span>` : ''
      }</a>
      ${pro ? `<nav class="topnav" aria-label="Secciones">${links}</nav>` : ''}
      <div class="topbar__right">
        <span class="chip chip--net" data-net hidden>${icon('wifi-off', 14)} Sin internet · todo funciona</span>
        <button class="btn btn--soft btn--sm" type="button" data-install ${installPrompt ? '' : 'hidden'}>${icon('download', 16)}<span>Instalar</span></button>
        ${
          pro
            ? `<a class="btn btn--ghost btn--sm" href="#/inicio" title="Volver al inicio">${icon('house', 16)}<span class="hide-sm">Inicio</span></a>`
            : waterBackHTML()
        }
      </div>
    </header>
    <main id="view" class="main" tabindex="-1"></main>
    ${m.nav.length ? `<nav class="dock dock--${m.nav.length}" aria-label="Secciones">${links}</nav>` : ''}`;
}

function mountApp(role: Role) {
  shell(role);
  const ac = new AbortController();
  const net = app.querySelector<HTMLElement>('[data-net]')!;
  const updateNet = () => (net.hidden = navigator.onLine);
  addEventListener('online', updateNet, { signal: ac.signal });
  addEventListener('offline', updateNet, { signal: ac.signal });
  updateNet();

  app.addEventListener(
    'click',
    async (e) => {
      const t = e.target as Element;
      if (t.closest('[data-install]')) {
        app.querySelectorAll<HTMLElement>('[data-install]').forEach((b) => (b.hidden = true));
        await installPrompt?.prompt();
        installPrompt = null;
      }
    },
    { signal: ac.signal },
  );

  const unbindBack = role === 'usuario' ? bindWaterBack(app.querySelector<HTMLElement>('[data-water-back]')!, () => go('inicio/elegir')) : () => {};

  const stopRouter = startRouter(app.querySelector<HTMLElement>('#view')!, MODES[role].views, MODES[role].home);

  // Precarga del lector de labios en segundo plano: la cámara abre al instante después.
  const idle = window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 1500));
  idle(() => void tracker.preload().catch(() => {}));

  return () => {
    ac.abort();
    unbindBack();
    stopRouter();
    tracker.stop();
    app.innerHTML = '';
  };
}

/* ---------- Qué se muestra: el inicio o la app en su modo ---------- */

async function chooseRole(role: Role) {
  await updateSettings({ role });
  history.replaceState(null, '', `#/${MODES[role].home}`);
  await route();
}

async function route() {
  let h = hashRoute();
  // Entrada discreta para quien prepara la app: no aparece en el menú de elección.
  if (h === 'programador') {
    await updateSettings({ role: 'programador' });
    history.replaceState(null, '', '#/panel');
    h = 'panel';
  }
  const kind: Kind = h.startsWith('inicio') || !state.settings.role ? 'inicio' : state.settings.role;
  if (mounted?.kind === kind) return;
  const token = ++routing;
  mounted?.unmount();
  mounted = null;
  document.documentElement.dataset.mode = kind;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[kind]);
  scrollTo({ top: 0 });
  if (kind === 'inicio') {
    const { mountLanding } = await import('./ui/landing/landing');
    if (token !== routing) return;
    mounted = { kind, unmount: mountLanding(app, { jumpToRoles: h === 'inicio/elegir', onChoose: (r) => void chooseRole(r) }) };
  } else {
    mounted = { kind, unmount: mountApp(kind) };
  }
}

function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || window.top !== window.self) return;
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
  enableTilt(document.body);
  await loadSettings();
  await engine.load();
  addEventListener('hashchange', () => void route());
  await route();
  document.documentElement.classList.add('is-ready');
  if (!(await db.persistent())) {
    toast('Este navegador no deja guardar datos aquí. Tus frases se borrarán al cerrar la página.', { tone: 'warn', ms: 8000 });
  }
  registerServiceWorker();
}

void boot();
