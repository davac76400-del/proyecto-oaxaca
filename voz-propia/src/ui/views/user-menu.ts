import { state, updateSettings } from '../../app/state';
import { icon } from '../icons';

/** Opciones del modo usuario: solo lo que ayuda a ver y escuchar. Cambiar de modo pide mantener presionado. */
export function openUserMenu() {
  const s = state.settings;
  const dlg = document.createElement('dialog');
  dlg.className = 'modal';
  dlg.setAttribute('aria-label', 'Opciones');
  dlg.innerHTML = `
    <div class="modal__inner">
      <header class="sheet__head">
        <div><p class="kicker">[ Opciones ]</p><h2>Ver mejor</h2></div>
        <button class="icon-btn" type="button" data-close aria-label="Cerrar">${icon('x', 20)}</button>
      </header>
      <div class="menu-list">
        <label class="switch"><input type="checkbox" data-toggle="largeText" ${s.largeText ? 'checked' : ''}><span class="switch__ui"></span><span>${icon('type', 20)} Letra más grande</span></label>
        <label class="switch"><input type="checkbox" data-toggle="highContrast" ${s.highContrast ? 'checked' : ''}><span class="switch__ui"></span><span>${icon('contrast', 20)} Más contraste</span></label>
      </div>
    </div>`;
  document.body.append(dlg);

  const close = () => {
    dlg.close();
    dlg.remove();
  };
  dlg.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.dataset.toggle) void updateSettings({ [t.dataset.toggle]: t.checked });
  });
  dlg.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === dlg || t.closest('[data-close]')) close();
  });
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dlg.showModal();
}
