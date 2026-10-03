# Voz Propia

Lectura de labios personal, sin internet, para quien perdió la voz (traqueostomía, laringectomía, terapia intensiva).
Proyecto para SOLACYT / Infomatrix XXI.

## Cómo correrla

```bash
cd voz-propia
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # versión de producción en dist/ (incluye service worker para modo avión)
npm run preview   # sirve dist/ en http://localhost:4173
```

`npm run assets` (se ejecuta solo en dev y build) copia el runtime de MediaPipe y descarga el modelo de rostro a `public/`.

## Cómo funciona

1. **Cámara → MediaPipe Face Landmarker** (WASM, GPU si hay): 478 puntos de la cara, de los que se usan 40 de los labios y 25 *blendshapes* de la boca.
2. **Rasgos invariantes** (`core/vision/lip-features.ts`): los labios se centran, se rotan según la línea de los ojos y se escalan por la distancia entre ojos. Así no importa dónde esté la cara ni qué tan cerca.
3. **Secuencia** (`core/learn/sequence.ts`): se recortan los cuadros quietos, se remuestrea a 32 cuadros y se agrega la velocidad de cada rasgo.
4. **Few-shot con DTW** (`core/learn/classifier.ts`): cada frase se aprende con 1 a 5 ejemplos. La confianza depende de cuánto más lejos queda la segunda opción que la primera; si duda, la interfaz muestra 3 opciones flotantes.
5. **Aprende con el uso**: cuando la persona elige la opción correcta, esa toma se guarda como ejemplo nuevo (máximo 8 por frase, se descartan los más viejos).
6. **Voz** (`core/voice/speaker.ts`): voz del sistema en español (incluida Voz Personal de Apple si el sistema la expone) o un audio grabado por frase.

Codificador neuronal opcional: si existe `public/models/lip-encoder.onnx` (entrada `[1, 32, 105]`, salida `[1, 32, E]`), la app lo carga con ONNX Runtime Web (WebGPU, con respaldo a WASM) y lo usa en lugar de la geometría directa. Pensado para un codificador contrastivo entrenado al estilo LipLearner.

## Estructura

```
src/
  app/        estado global y enrutador
  core/       lógica sin interfaz: visión, aprendizaje, voz, almacenamiento (IndexedDB)
  data/       frases de hospital iniciales
  ui/         componentes, vistas y estilos
  sw.template.js   service worker (la lista de precarga se genera en cada build)
```

## Privacidad

No se graba ni se envía video. Solo se guardan números con la forma de los labios, en el propio teléfono.
Voz Propia es una ayuda para comunicarse, no un dispositivo médico.
