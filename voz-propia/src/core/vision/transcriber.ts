export interface Segment {
  text: string;
  start: number;
  end: number;
}

export async function transcribeVideoAudio(file: File): Promise<Segment[]> {
  const audio = await extractAudioFromVideo(file);
  const text = await transcribeAudio(audio);
  return parseSegments(text);
}

async function extractAudioFromVideo(file: File): Promise<Blob> {
  const video = document.createElement('video');
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const mediaSource = audioContext.createMediaElementAudioSource(video);
  const destination = audioContext.createMediaStreamDestination();
  mediaSource.connect(destination);

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      const recorder = new MediaRecorder(destination.stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/wav' }));

      recorder.start();
      setTimeout(() => recorder.stop(), video.duration * 1000);
    };

    video.src = URL.createObjectURL(file);
  });
}

async function transcribeAudio(audio: Blob): Promise<string> {
  // Placeholder: En producción usaría transformers.js o API de OpenAI
  console.warn('Transcriber: Whisper no configurado aún. Placeholder.');
  return 'Me Me Me';
}

function parseSegments(text: string): Segment[] {
  // Placeholder simple: divide por silencio o puntuación
  return text.split(/[,;.!?]/).map((word, i) => ({
    text: word.trim(),
    start: i * 0.5,
    end: (i + 1) * 0.5,
  }));
}