import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { extractFeatures, mouthOpenness } from './lip-features';

export interface TrackFrame {
  t: number;
  landmarks: NormalizedLandmark[] | null;
  features: Float32Array | null;
  openness: number;
  aspect: number;
}

export type TrackerStatus = 'apagado' | 'cargando' | 'listo' | 'sin-permiso' | 'error';
type Listener = (f: TrackFrame) => void;
type StatusListener = (s: TrackerStatus, detail?: string) => void;

const asset = (p: string) => new URL(p, document.baseURI).href;

/** Cámara + MediaPipe Face Landmarker. Todo corre en el dispositivo; ningún cuadro sale del teléfono. */
class FaceTracker {
  status: TrackerStatus = 'apagado';
  private landmarker: FaceLandmarker | null = null;
  private loading: Promise<FaceLandmarker> | null = null;
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private running = false;
  private lastVideoTime = -1;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  delegate: 'GPU' | 'CPU' | null = null;

  onFrame(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onStatus(fn: StatusListener) {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => this.statusListeners.delete(fn);
  }

  private setStatus(s: TrackerStatus, detail?: string) {
    this.status = s;
    for (const fn of this.statusListeners) fn(s, detail);
  }

  /** Carga el modelo una sola vez; se puede llamar de antemano para que la cámara abra al instante. */
  preload(): Promise<FaceLandmarker> {
    this.loading ??= (async () => {
      const fileset = await FilesetResolver.forVisionTasks(asset('mediapipe'));
      const make = (delegate: 'GPU' | 'CPU') =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: asset('models/face_landmarker.task'), delegate },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
          minFaceDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      try {
        this.landmarker = await make('GPU');
        this.delegate = 'GPU';
      } catch {
        this.landmarker = await make('CPU');
        this.delegate = 'CPU';
      }
      return this.landmarker;
    })();
    this.loading.catch(() => {
      this.loading = null;
    });
    return this.loading;
  }

  async start(video: HTMLVideoElement) {
    if (this.running && this.video === video) return;
    this.stop();
    this.video = video;
    this.setStatus('cargando');
    try {
      const [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
          audio: false,
        }),
        this.preload(),
      ]);
      if (this.video !== video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.stream = stream;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      this.running = true;
      this.lastVideoTime = -1;
      this.setStatus('listo');
      this.schedule();
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') this.setStatus('sin-permiso');
      else this.setStatus('error', (err as Error)?.message);
      this.stop(false);
    }
  }

  stop(resetStatus = true) {
    this.running = false;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
    this.video = null;
    if (resetStatus) this.setStatus('apagado');
  }

  private schedule() {
    const v = this.video;
    if (!this.running || !v) return;
    if ('requestVideoFrameCallback' in v) v.requestVideoFrameCallback(() => this.tick());
    else requestAnimationFrame(() => this.tick());
  }

  private tick() {
    const v = this.video;
    const lm = this.landmarker;
    if (!this.running || !v || !lm) return;
    if (v.readyState >= 2 && v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      const t = performance.now();
      const aspect = v.videoWidth / (v.videoHeight || 1);
      let frame: TrackFrame = { t, landmarks: null, features: null, openness: 0, aspect };
      try {
        const r = lm.detectForVideo(v, t);
        const face = r.faceLandmarks[0];
        if (face) {
          frame = {
            t,
            aspect,
            landmarks: face,
            features: extractFeatures(face, r.faceBlendshapes[0]?.categories, aspect),
            openness: mouthOpenness(face, aspect),
          };
        }
      } catch {
        // Un cuadro dañado no debe detener el seguimiento.
      }
      for (const fn of this.listeners) fn(frame);
    }
    this.schedule();
  }
}

export const tracker = new FaceTracker();
