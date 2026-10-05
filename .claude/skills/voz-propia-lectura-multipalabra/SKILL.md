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

## Cómo probar
- `npx tsc --noEmit -p .` y `npx vite build`.
- Pruebas con videos de cámara falsa (`.y4m`: «sin cara» y «imagen fija») para verificar los mensajes de rechazo.
- Para otra persona/cámara, comparar tasa de error antes/después de `speaker`.
