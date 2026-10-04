import { engine } from '../../core/engine';
import { processVideoFile } from '../../core/vision/video-processor';
import { transcribeVideoAudio } from '../../core/vision/transcriber';
import { segmentClips } from '../../core/vision/segmenter';
import type { VideoClip } from '../../core/vision/segmenter';
import { icon } from '../icons';
import { toast } from './toast';

export async function openVideoImporter(phraseId?: string) {
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet';
  dlg.innerHTML = `
    <div class="sheet__inner">
      <header class="sheet__head">
        <div><p class="kicker">[ Cargar video ]</p><h2>Importar ejemplos</h2></div>
        <button class="icon-btn" type="button" data-close aria-label="Cerrar">${icon('x', 20)}</button>
      </header>

      <div class="importer__container">
        <input type="file" id="video-input" accept="video/*" style="display:none">
        <button class="btn btn--primary" id="upload-btn" type="button">
          ${icon('upload', 18)}<span>Seleccionar video (40-60 seg)</span>
        </button>

        <div id="progress" style="display:none; margin-top: 20px;">
          <p id="status">Cargando...</p>
          <progress id="progress-bar" value="0" max="100" style="width:100%; height:8px;"></progress>
        </div>

        <div id="clips-list" style="display:none; margin-top: 20px; max-height: 400px; overflow-y: auto;">
          <!-- Clips aparecerán aquí -->
        </div>
      </div>
    </div>`;

  const fileInput = dlg.querySelector<HTMLInputElement>('#video-input')!;
  const uploadBtn = dlg.querySelector<HTMLButtonElement>('#upload-btn')!;
  const progressDiv = dlg.querySelector<HTMLDivElement>('#progress')!;
  const statusText = dlg.querySelector<HTMLParagraphElement>('#status')!;
  const clipsList = dlg.querySelector<HTMLDivElement>('#clips-list')!;
  const closeBtn = dlg.querySelector<HTMLButtonElement>('[data-close]')!;

  let clips: VideoClip[] = [];

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    progressDiv.style.display = 'block';
    uploadBtn.style.display = 'none';

    try {
      statusText.textContent = 'Extrayendo frames...';
      const frames = await processVideoFile(file);
      statusText.textContent = 'Transcribiendo audio...';
      const segments = await transcribeVideoAudio(file);
      statusText.textContent = 'Segmentando clips...';
      clips = segmentClips(frames, segments);

      showClipsList(clips, clipsList);
      progressDiv.style.display = 'none';
    } catch (err) {
      toast(`Error: ${(err as Error).message}`, { variant: 'error' });
      progressDiv.style.display = 'none';
      uploadBtn.style.display = 'block';
    }
  });

  closeBtn.addEventListener('click', () => dlg.close());

  document.body.appendChild(dlg);
  dlg.showModal();
}

function showClipsList(clips: VideoClip[], container: HTMLDivElement) {
  container.innerHTML = `
    <div style="margin-bottom: 10px;">
      <p><b>${clips.length} clips encontrados</b></p>
    </div>
    <ul style="list-style: none; padding: 0;">
      ${clips
        .map(
          (clip, i) => `
        <li class="pcard" style="margin-bottom: 10px;">
          <div class="pcard__body">
            <p class="pcard__text">${clip.text}</p>
            <p class="pcard__meta">${(clip.endTime - clip.startTime).toFixed(1)}s · ${clip.lipPoints.length} frames</p>
          </div>
          <button class="btn btn--sm btn--primary" type="button" data-accept="${i}">Aceptar</button>
        </li>
      `,
        )
        .join('')}
    </ul>
    <button class="btn btn--primary" id="save-all" type="button" style="width: 100%; margin-top: 15px;">
      ${icon('save', 16)}<span>Guardar todos</span>
    </button>`;

  container.style.display = 'block';

  container.querySelector('#save-all')?.addEventListener('click', () => {
    saveClips(clips);
  });

  container.querySelectorAll('[data-accept]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-accept')!);
      saveClips([clips[idx]]);
    });
  });
}

function saveClips(clipsToSave: VideoClip[]) {
  clipsToSave.forEach((clip) => {
    // TODO: Conectar con engine para guardar muestras
    console.log('Guardando clip:', clip.text);
  });
  toast(`${clipsToSave.length} clip(s) guardado(s).`);
}