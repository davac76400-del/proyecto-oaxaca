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

## Raya neón, movimientos chicos, colados, administrador y minijuego (2026-10-06)
- **Raya neón** (`camera-stage.ts`, `neonLine()`): contorno fosforescente alrededor de los labios, solo dibujo (se pinta después de medir; no afecta nada). Los puntos y la retícula técnicos ya NO se ven: solo en modo programador con el botón «Puntos» (`localStorage voz-propia:ver-puntos`), para que no copien la idea.
- **Movimientos chicos:** la cámara pide 1280×720 (antes 640×480: en pantallas grandes la cara quedaba chica y se perdían los gestos finos). `prepareFrames` usa `smooth: true` en `engine.embed` y en el decodificador (suaviza temblor; en simulación +1 a +6 puntos). Subir el piso del clasificador no ayudó (`FewShotClassifier.floor`).
- **Colados** (`classifier.ts`, `dropLookAlikes`): un ejemplo más cercano a otra palabra que a las suyas se aparta si esa otra tiene MÁS ejemplos (5 vs 3: se van los de 3) o está mejor respaldada. Nunca se quita más de la mitad de una palabra ni se deja con menos de 2. Salen en «dudosos» del panel.
- **Administrador** (`dev-panel.ts`): palabra → videos (por `source_name`) → repeticiones. Se puede borrar el video entero, repeticiones marcadas, o la palabra; luego se vuelve a publicar con `publishPhrase`.
- **Minijuego** (`mini-game.ts`): a la izquierda mientras se analiza el video; canvas, sin guardar nada, se carga solo al analizar.
- Probado con datos sintéticos y capturas con Supabase simulado; la raya neón no se probó con cámara real.

## Precisión: lo que se midió y lo que se descartó (2026-10-06)
Se armó un **simulador de boca** (96 puntos + 25 gestos, palabras = secuencias de visemas, personas con ancho/grosor/amplitud distintos, palabras parecidas a propósito). Línea base 75 % de aciertos con personas nuevas; ahora ~90 % (top 3: 98.8 %). Es simulado, no con tus videos.
- **Sí se aplicó:** (1) escala de amplitud suave en vez de completa: `AMP_POWER = 0.25` en `embed.ts` (normalizar la energía de toda la toma borraba cuánto abre la boca: 80 → 88 % al quitarlo); (2) `TARGET_LEN` 32 → 24; (3) **pesos por rasgo de Fisher** (`weights.ts`, `FewShotClassifier.fisher = 0.5`, también en el decodificador): +5 a +10 puntos con movimientos chicos o ruido; en frases pegadas el decodificador pasó de 4/42 a 33/42 palabras; (4) suavizado temporal.
- **Se probó y NO se usó:** blanqueo por covarianza intra-palabra (WCCN) → empeora con personas nuevas (75 → 62 %); penalizar duración distinta → empeora; banda DTW → sin efecto; aumento de datos (amplitud/tiempo) → +1 punto por 3× el costo; puntaje min / media de 3 → igual o peor que media de los 2 mejores.
- **Métricas** en «Probar precisión»: error por palabra, top 3 y error por letras (CER, distancia de edición).
- **LipNet** (Assael et al., 2016; repo nicknochnack/LipNet): red profunda de 8.5 M de parámetros con un solo hablante y gramática fija (GRID). No se usó su código ni sus pesos; solo se tomó la idea de medir error por palabra/letra. Se cita como antecedente en Créditos.

## Segunda ronda (2026-10-06)
- **Raya neón y puntos para todos:** `camera-stage.ts` dibuja la raya neón y, por defecto, los puntos que mide el sistema (con neón); el botón «Puntos» los apaga (`localStorage voz-propia:ver-puntos = 0`). Verificado con cámara falsa y la cara de plantilla.
- **Poda de ejemplos mal etiquetados** (`FewShotClassifier.pruneMargin = 1.4`): un ejemplo mucho más cercano a otra palabra que a las suyas se aparta (máx. 1/3 de la palabra, siempre quedan ≥ 3). Con 10 % de etiquetas mal puestas: 85.8 → 87.1 %, sin costo en los demás casos.
- **Fallo corregido:** `dropLookAlikes`/`dropDoubtful` filtraban la lista mientras usaban índices de la lista original; ahora todos marcan sobre la lista original y se filtra una sola vez.
- **Suavizado:** binomial de 5 puntos (antes 3) y velocidades con peso 1.2 en el lector de palabras (0.8 en el decodificador): con ruido muy alto 83 → 87 %.
- **Se probó y NO se usó:** re-puntaje por pares (rasgos que separan solo a los 2 primeros): +2.5 en normal, −0.4 en movimientos chicos, nada con ruido. Savitzky-Golay y gauss 7: peor.
- **Prueba con Vite:** el servidor de desarrollo carga módulos con `?t=`; una prueba que importe `/src/core/engine.ts` obtiene OTRA copia (sin frases). Importar la misma URL que aparece en `performance.getEntriesByType('resource')`.

## Cámara estable y movimientos chicos o redondos (2026-10-09)
Quejas de David: «la cámara se mueve sola y se traba» y «no lee los labios que son circulares o mínimos». Se midió con los **163 videos reales** (`real/clips.json`: 5 palabras) y con el **ruido real de cada clip** (el residuo de suavizarlo), simulando movimientos a 1, 1/2, 1/3 y 1/4 del tamaño normal. (Un estimado de ruido blanco con σ=0.0065 estaba 7× inflado: el real es ~0.0009 en distancias entre ojos.)

**Lo que fallaba**
- La puerta de `usar.ts` (`mouthActivity ≥ 0.008`, número fijo) dejaba pasar 52 % de las tomas de tamaño normal y 4 % de las de mitad de tamaño → «No vi que movieras los labios».
- El grabador medía la **apertura** de la boca (`|Δ| > 0.012`): con ruido real creía que hablabas en 83 % de las tomas de puro temblor, casi nunca se detenía solo (55 % a ruido x1, 20 % a x3) y cortaba el habla chica (16–40 %).
- Dentro del decodificador, `MIN_REL_ACTIVITY 0.5` y `MIN_STRENGTH 0.5` exigían moverse ≥ la mitad que los ejemplos del programador: quien mueve poco nunca pasaba.
- Entrenar (`classifier.fit` + `decoder.fit`) bloqueaba el hilo principal 1.3 s (5 palabras), 4.7 s (12), 15 s (24; crece con n² porque compara todos contra todos) y se disparaba tras CADA lectura (`learnFromUse`).

**Lo que se hizo**
- `core/vision/speech-detect.ts`: `takeSnr(frames, D, from, to)` = (varianza de la trayectoria suavizada − 0.273·σ̂²)/σ̂², con σ̂² medido en la propia toma (residuo del suavizado binomial de 5 puntos). Sirve con cualquier cámara y tamaño de movimiento. `SPEECH_SNR = 1`: detecta 98/96/87 % (1, 1/2, 1/4) con ≤ 1 % de falsos. `LipMotion` es la versión en vivo (ventana de 12 cuadros, histéresis 1.6/0.6): el grabador (`recorder.ts`) la usa, se detiene solo en 98/96/73 %, corta el habla en < 5 %, `QUIET_MS` 450 (varias palabras 1200 en `usar.ts`).
- `engine.hasSpeech()` es la puerta de `usar.ts` y `hablar.ts`; `readTake` también la aplica al empezar. `engine.activity()` se conserva solo para comparar repeticiones en el importador.
- `WordDecoder.gates = { minRel 0.15, minPeak 0.4, minStrength 0.15 }` (se quitó `minActivity`): con movimientos a 1/3: 40 → 50 % bien y seguro; a 1/4: 20 → 36 %; el temblor solo no escribe nada.
- `AMP_POWER` 0.7 → **0.85**: 63/57/50/36 % → 65/61/59/51 % y las palabras mal escritas con seguridad 14 → 6 % (con 1.0 vuelve a empeorar).
- **Entrenamiento en otro hilo**: `learn/fit-worker.ts` entrena clasificador y decodificador y devuelve su estado (`{ ...modelo }`); `engine.fitOnce` lo copia con `Object.assign`. `learn/fit-client.ts` crea el Worker (módulo, CSP `worker-src 'self' blob:`) y si falla devuelve `null` → se entrena aquí como antes. Se juntan cambios (`fitAgain`), y lo aprendido de tu uso (`source: 'correccion'`) entrena 6 s después (`retrainSoon`). Probado: modelos idénticos a entrenar aquí (55/55 lecturas iguales) y en el build ofuscado ninguna tarea larga (antes 778 ms).
- **Raya estable**: `ui/components/one-euro.ts` (filtro «1 euro», minCutoff 1, beta 0.02) sobre los 76 puntos que se dibujan: −85 % de temblor en reposo y menos error al moverse; reinicia al perder la cara. Raya neón con trazos apilados (sin `shadowBlur`), puntos en un solo trazo, canvas a ≤ 1.5×, histéresis del aviso «Acércate» (`FAR_MARGIN`). CSS: se quitó el `backdrop-filter` de `.u-card` (ya es 90 % opaca) y el fondo se queda quieto con la cámara encendida (`.usar:has(.stage[data-status='listo']) .u-aurora i`).

**Se probó y NO se usó**: suavizado extra según la relación señal/ruido (±3 puntos, dentro del ruido de la medición); medir también los gestos (blendshapes) en la detección (+2 a +7 puntos solo con movimientos muy chicos, mismo costo de falsos); `minPeak` 0.5 (menos palabras de más pero menos frases bien).
**Límites**: el entorno remoto no corre MediaPipe a más de ~4 cuadros/s (todo en software), así que la cámara en vivo no se pudo medir a ritmo real; el grabador de producción se probó en Chromium alimentándole tomas reales a su ritmo (`tracker.listeners`). Las frases de dos palabras pegadas siguen en ~23 % exactas con clips pegados (ya era así; no es de las puertas).
**Herramientas**: banco con clips reales en `scratchpad/mov/` (`harness.ts`, `eval-read.ts`, `eval-rec.ts`, `eval-gate.ts`); `eval-read` compara copias del código con `SRC_DIR`. Video falso con cara real y boca que se mueve: `mk-talk.py` (foto de cara + deformación de la boca + ruido de sensor) para `--use-file-for-fake-video-capture`.
