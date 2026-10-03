import { go } from '../../app/router';
import { state, updateSettings } from '../../app/state';
import { bindHold, holdRing } from '../components/hold';
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
      <div class="hold-card">
        <button class="hold" type="button" data-hold aria-describedby="hold-help">${holdRing()}<span class="hold__core">${icon('lock', 22)}</span></button>
        <div>
          <p class="hold-card__title">Cambiar de modo</p>
          <p class="muted" id="hold-help">Mantén presionado 2 segundos. Es para tu familia o tu equipo.</p>
        </div>
      </div>
    </div>`;
  document.body.append(dlg);

  const close = () => {
    offHold();
    dlg.close();
    dlg.remove();
  };
  const offHold = bindHold(dlg.querySelector<HTMLElement>('[data-hold]')!, 2000, () => {
    close();
    go('inicio/elegir');
  });

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
