import { $$ } from '../ui/dom';

export type Route = 'hablar' | 'tablero' | 'entrenar' | 'ajustes';
export type View = (el: HTMLElement) => (() => void) | void;

const ROUTES: Route[] = ['hablar', 'tablero', 'entrenar', 'ajustes'];

let current: Route | null = null;
let cleanup: (() => void) | void;

export function currentRoute(): Route {
  const r = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'hablar';
}

export function go(r: Route) {
  if (location.hash !== `#/${r}`) location.hash = `#/${r}`;
  else render();
}

let views: Record<Route, View>;
let outlet: HTMLElement;

function render() {
  const r = currentRoute();
  if (r === current) return;
  const swap = () => {
    cleanup?.();
    current = r;
    outlet.innerHTML = '';
    outlet.dataset.route = r;
    cleanup = views[r](outlet);
    outlet.focus({ preventScroll: true });
    scrollTo({ top: 0 });
    for (const a of $$<HTMLAnchorElement>('[data-route]')) {
      a.toggleAttribute('aria-current', a.dataset.route === r);
      if (a.dataset.route === r) a.setAttribute('aria-current', 'page');
    }
  };
  // Transición nativa entre vistas cuando el navegador la soporta.
  if ('startViewTransition' in document && current !== null) document.startViewTransition(swap);
  else swap();
}

export function startRouter(el: HTMLElement, v: Record<Route, View>) {
  outlet = el;
  views = v;
  addEventListener('hashchange', render);
  render();
}
