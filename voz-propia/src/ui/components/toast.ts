import { esc } from '../dom';
import { icon } from '../icons';
import { sfx } from '../sfx';

interface ToastOptions {
  tone?: 'info' | 'ok' | 'warn';
  action?: { label: string; run: () => void };
  ms?: number;
}

export function toast(message: string, opts: ToastOptions = {}) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = `toast toast--${opts.tone ?? 'info'}`;
  el.setAttribute('role', 'status');
  const ic = opts.tone === 'ok' ? 'check' : opts.tone === 'warn' ? 'info' : 'sparkles';
  el.innerHTML = `${icon(ic, 18)}<span>${esc(message)}</span>${
    opts.action ? `<button class="toast__action" type="button">${esc(opts.action.label)}</button>` : ''
  }`;
  const close = () => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 220);
  };
  el.querySelector('button')?.addEventListener('click', () => {
    opts.action?.run();
    close();
  });
  host.append(el);
  if (opts.tone === 'ok') sfx.ok();
  else if (opts.tone === 'warn') sfx.warn();
  setTimeout(close, opts.ms ?? (opts.action ? 9000 : 3200));
}
