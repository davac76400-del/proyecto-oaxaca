---
name: voz-propia-lectura-multipalabra
description: Cómo funciona la lectura de labios de Voz Propia para frases de varias palabras - decodificador por programación dinámica, normalización por hablante, modelo de lenguaje en español, aceptación automática de palabras y borrado con un toque. Úsala al tocar el reconocimiento, la pantalla "usar", el decodificador o al diagnosticar errores con otra persona o cámara.
---

# Lectura de labios multipalabra (Voz Propia)

Repositorio de la app: `davac76400-del/voz-propia` (rama `main`), carpeta local `/home/user/voz-propia`. Ojo: existe una copia vieja en `proyecto-oaxaca/voz-propia`; ver skill `lecciones-repo-y-entorno`.

## Objetivo
Leer **frases** («sí me duele»), no solo palabras sueltas, y que las palabras se acepten solas; si una está mal, se quita con un toque y se puede deshacer.

## Piezas (rutas reales)
- `src/core/learn/decoder.ts` → `WordDecoder`: segmenta la grabación en ventanas, puntúa hipótesis de palabra (`DecodedWord` con confianza y alternativas) y elige la secuencia sin traslapes de mayor puntaje con programación dinámica tipo Viterbi. `sliceSequence()` recorta una `LipSequence`.
- `src/core/language/spanish.ts` → corpus de ~150 frases de salud y necesidades; `bigramBonus(prev, palabra)` premia transiciones plausibles y desempata palabras parecidas; `composeSentence()` pone mayúsculas y signos; `spokenText()` quita `¿¡` para la voz; `wordKey()` normaliza acentos.
- `src/core/learn/embed.ts` → `prepareFrames()`, `embedFrames()`, `speakerNormalize()`, `mouthActivity()`.
- `src/ui/views/usar.ts` → pantalla de uso: cada palabra acepta sola, guarda su `seq` (LipSequence) para aprender, y al tocarla muestra «Quitaste «X»» con **Deshacer**.

## Problema medido y cómo se arregló
Con otra persona o cámara, la lectura fallaba entre 67 % y 76 %: la forma de los labios cambia según quién habla.
Solución: **normalizar por hablante** (`speakerNormalize`): restar la media y escalar por energía, por separado para puntos de referencia (landmarks) y gestos. Resultado en pruebas: 91–100 % con hablantes parecidos y 75–100 % con diferencia moderada.
`mouthActivity()` distingue movimiento real de temblor de cámara; si la actividad es menor que el mínimo (`MIN_ACTIVITY`) se responde «Perdí de vista tu boca» en vez de adivinar. Sin cara visible: «No veo tu cara».

## Reglas de diseño que se decidieron
- Sin estado «pendiente»: se eliminó la confirmación palabra por palabra; confirmar cada una era lento.
- El aprendizaje solo usa lo que la persona no borró; si borra una palabra, su muestra no se usa para entrenar.
- El corpus es por dominio (salud, necesidades). Agregar frases nuevas ahí mejora el desempate.
- La UI y los mensajes van en español, cortos.

## Importar videos: solo labios, patrones que se repiten (2026-10-05)
- **El audio NO se usa.** Los videos del programador a veces se traban y el audio sale tarde. Se quitó Whisper y `@huggingface/transformers`. El nombre sale del archivo (`voz-palabra.mp4`) o de lo que escribe David.
- **Una palabra por video.** `oneWordProblem()` (`src/core/vision/filename-phrase.ts`) avisa y bloquea si el nombre tiene dos palabras: las frases se arman solas («Me» + «Duele»).
- **Revisión de patrones** (`src/core/vision/pattern-check.ts`, usada por `analyzeGroup()` en `video-importer-modal.ts`): corta el video en repeticiones por movimiento de labios (`splitRepetitions`), mide distancias DTW entre ellas y las agrupa en patrones (radio = 2.2 × la distancia a la vecina más cercana, tomada en el cuartil bajo). Un patrón **sirve** si se repite ≥ 3 veces y al menos 2 seguidas; los de 1–2 veces o sueltos se descartan («pocas»/«raro»).
- También descarta: video trabado (≥ 20 % de cuadros idénticos al anterior), duración 2.5× mayor o 0.4× menor que la típica, y boca casi quieta (< 35 % del movimiento típico).
- Mide la **cadencia** («una vez cada 1.8 s, parejo/irregular») y avisa de pausas largas (posible trabazón).
- Avisa si lo que se ve se parece mucho (ratio ≤ 1.4) a otra palabra ya guardada y no al nombre escrito.
- Límites: con menos de 4 repeticiones no compara patrones; si todas las repeticiones son distintas entre sí no hay escala interna para notarlo (lo cubren las otras señales). Probado con datos sintéticos y con un «video» sintético de 12 repeticiones, no con tus videos reales.

## Fusionar grabaciones, quedarse con las mejores, leer más rápido (2026-10-05)
- **Fusión automática:** `publishPhrase()` (`src/core/shared-sync.ts`) junta TODAS las grabaciones guardadas de una palabra, sin importar mayúsculas ni acentos (`keyOf()` en `src/core/language/key.ts`: «Si»/«Sí»/«SI» son la misma). Cada video nuevo se suma a los anteriores y se vuelve a elegir.
- **Mejores ejemplos** (`src/core/learn/curate.ts`, `curateExamples`): agrupa por patrón, descarta los raros o de pocas veces, y de los grupos que sirven toma los **más centrales repartidos entre las grabaciones** (cada una es otro día, luz o persona). Máximo `MAX_SAMPLES_PER_PHRASE` = 12. Con ≤ 3 ejemplos se queda con todos. Al terminar, el aviso dice cuántas grabaciones, repeticiones y con cuántas se quedó.
- **Por qué repartir entre grabaciones:** el método anterior tomaba los 12 más centrales y salían casi todos de la grabación más larga (12/0/0). Ahora 4/4/4. Con datos sintéticos, la persona más difícil subió de 93 % a 99 %. Se probó que elegir «los más lejanos entre sí» (diversidad) metía ejemplos ruidosos: se quitó.
- **Lectura más rápida:** `FewShotClassifier` compara primero contra 3 representantes por palabra (el más central y los más distintos) y solo afina las 4 más cercanas con todos sus ejemplos (solo si hay > 8 palabras). 300 → 130 comparaciones DTW por lectura (2.9× más rápido) con la misma exactitud. `WordDecoder` hace lo mismo al buscar dónde empieza cada palabra (1.6× más rápido, mismas frases). Se pueden apagar con `FewShotClassifier.twoStage = false` y `WordDecoder.fast = false` para comparar.
- **Adaptación a la persona:** viene de (1) repartir los ejemplos entre grabaciones/personas y (2) los ejemplos que aprende al usarla (`learnFromUse`). Se probó darle más peso a los ejemplos propios (×0.9 y ×0.8) y **no mejoró** (con 0.8 bajó a 87 %), así que no se usa.
- Pruebas hechas con datos sintéticos, no con los videos reales de David.

## Nombre de los archivos (2026-10-05)
- `phraseFromFilename()` (`src/core/vision/filename-phrase.ts`): la palabra sale del nombre con `voz` antes o después (`voz-me`, `me-voz`) y **los contadores no cuentan**: `voz-piel2`, `voz-piel-3`, `cabeza2-voz`, `voz2-piel`, `voz-me (1)`, `voz-me - copia` → «Piel», «Cabeza», «Me». TODO EN MAYÚSCULAS se normaliza. Sin la palabra `voz` en el nombre no se adivina (evita IMG-2026-…).
- Todos los videos que son la misma palabra (`nameKey`: sin mayúsculas ni acentos) se llaman **como el primero que se subió** en ese lote, y al publicar (`publishPhrase`) la palabra toma el texto de la grabación **más antigua** guardada.

## Cómo probar
- `npx tsc --noEmit -p .` y `npx vite build`.
- Pruebas con videos de cámara falsa (`.y4m`: «sin cara» y «imagen fija») para verificar los mensajes de rechazo.
- Para otra persona/cámara, comparar tasa de error antes/después de `speaker`.
