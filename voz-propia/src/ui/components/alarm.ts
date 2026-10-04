import { stopSpeaking } from '../../core/voice/speaker';
import { reducedMotion, vibrate } from '../dom';
import { icon } from '../icons';

/**
 * «Necesito ayuda»: suena una alarma y la pantalla parpadea hasta que alguien la toca.
 * Se apaga sola después de un minuto. Devuelve cómo cerrarla.
 */
export function startAlarm() {
  stopSpeaking();
  const box = document.createElement('div');
  box.className = 'alarm';
  box.setAttribute('role', 'alertdialog');
  box.setAttribute('aria-label', 'Necesito ayuda. Toca la pantalla para apagar la alarma.');
  box.innerHTML = `<div class="alarm__in">${icon('bell', 72, 2.4)}<b>Necesito ayuda</b></div><p class="alarm__hint">Toca la pantalla para apagar</p>`;
  if (!reducedMotion()) box.classList.add('is-flash');
  document.body.append(box);
  document.documentElement.classList.add('alarm-on');

  let audio: AudioContext | null = null;
  let timer = 0;
  const beep = () => {
    if (!audio) return;
    const t = audio.currentTime;
    for (const [dt, f] of [[0, 880], [0.22, 1175], [0.44, 880]] as const) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + dt);
      g.gain.exponentialRampToValueAtTime(0.25, t + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.2);
      o.connect(g).connect(audio.destination);
      o.start(t + dt);
      o.stop(t + dt + 0.21);
    }
    vibrate([200, 80, 200]);
  };
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio = new Ctx();
    beep();
    timer = window.setInterval(beep, 1100);
  } catch {
    // Sin audio, queda la pantalla que parpadea.
  }

  const close = () => {
    clearInterval(timer);
    clearTimeout(auto);
    void audio?.close().catch(() => {});
    audio = null;
    box.remove();
    document.documentElement.classList.remove('alarm-on');
    removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
  const auto = window.setTimeout(close, 60_000);
  box.addEventListener('click', close);
  addEventListener('keydown', onKey);
  return close;
}
