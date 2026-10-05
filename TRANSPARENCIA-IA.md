# Voz Propia · Transparencia, IA y reglas de SOLACYT

Fecha: 5 de octubre de 2026 · Concurso: Infomatrix Iberoamérica (SOLACYT), categoría Desarrollo de Software.

## 1. Lo que pude y no pude verificar

| Tema | Estado |
|---|---|
| Proyecto original e inédito | Confirmado en la [convocatoria XIX](https://www.ugto.mx/convocatorias/send/6-otras/512-xix-concurso-iberoamericano-de-proyectos-estudiantiles-en-ciencia-tecnologia-y-emprendimiento) (la más reciente que pude leer en resultados de búsqueda). |
| Imágenes, música y video de apoyo | Se permiten con créditos del autor y bibliografía usada. Confirmado en la misma convocatoria. |
| Derechos | SOLACYT puede usar, distribuir y publicar los proyectos; los creadores conservan sus derechos de autor. |
| Equipo y edad | Máximo 3 estudiantes y un asesor mayor de 18 años; de 5 a 25 años cumplidos al cierre de inscripciones (de la investigación anterior; marcada para verificar). |
| **Reglas sobre uso de IA** | **No lo pude verificar.** La página oficial ([infomatrix.lat/convocatoria](https://infomatrix.lat/convocatoria/)) está bloqueada desde mi entorno y ninguna búsqueda mostró un texto que prohíba o regule la IA. Ver sección 4. |

Por eso **no quité ninguna herramienta**: no hay una prohibición confirmada. Hice la app transparente para cumplir cualquier versión razonable de la regla (declarar, dar créditos, ser original).

## 2. Auditoría de lo que usa la app

| Componente | Para qué | ¿Es IA? | Licencia | Dónde se usa |
|---|---|---|---|---|
| MediaPipe Face Landmarker (Google) | Puntos de la cara y la boca | Sí, modelo preentrenado | Apache 2.0 (librería); revisar tarjeta del modelo | Siempre, es la base de la lectura de labios |
| ONNX Runtime Web | Ejecutar un modelo opcional | Solo ejecuta modelos | MIT | Hoy no hay modelo instalado |
| Transformers.js + Whisper base (OpenAI) | Escribir el texto de un video para nombrar una frase | Sí, modelo preentrenado | Apache 2.0 y MIT | **Solo modo programador** |
| Claude Code (Anthropic) | Asistente para escribir y revisar código | Sí | Servicio | Solo durante el desarrollo |
| Three.js, Lucide, Supabase (cliente) | 3D, íconos, cuentas | No | MIT, ISC, MIT | Siempre |
| Raleway, Atkinson Hyperlegible Next, JetBrains Mono, Anton, Sacramento | Letras | No | SIL OFL 1.1 | Siempre |
| Código propio | Normalización por hablante, comparación DTW, decodificador de frases, modelo de frases en español, entrenamiento continuo, cuentas, diseño | No es IA generativa | Del equipo | Siempre |

En la app **no hay** chatbot, ni generación de textos o imágenes con IA, ni llamadas a APIs de IA mientras se usa.
Llamadas externas al usar la app: Supabase (cuentas y ejemplos compartidos) y Google DNS (solo el dominio del correo, por ejemplo `gmail.com`). El modelo de la cara se descarga al compilar, no al usarla.

## 3. Lo que cambié

1. **Nueva sección dentro de la app: «Herramientas y créditos»** (enlace en el pie del inicio). Dice qué hizo el equipo, qué se usó de otros con su licencia, cómo se usó la IA y qué datos se guardan.
2. Esta auditoría por escrito, lista para anexar al reporte.
3. El entrenamiento nuevo no usa ningún servicio de IA externo: mide con los ejemplos que sube el programador y comparaciones propias.

## 4. Lo que tienes que confirmar tú (10 minutos en infomatrix.lat/convocatoria)

Abre la convocatoria vigente (ciclo XXI) y busca estas palabras con Ctrl+F: `inteligencia artificial`, `IA`, `ChatGPT`, `plagio`, `originalidad`, `herramientas`, `código`, `bibliografía`, `estudios con personas`, `médico`.

| Si dice… | Qué hacer |
|---|---|
| No menciona IA | Nada más. La sección de transparencia ya cubre la declaración. |
| Hay que declarar el uso de IA | Pega la declaración de la sección 5 en el reporte y en la bitácora. |
| Prohíbe IA para escribir código | Dímelo exactamente cómo lo dice. Se reescribe a mano lo que corresponda y se ajusta la declaración. |
| Prohíbe modelos preentrenados | Se puede reemplazar MediaPipe por un detector propio, pero la lectura de labios perdería precisión. Hay que decidirlo con el texto delante. |
| Pide permiso para estudios con personas o temas médicos | Preparar un consentimiento firmado para cada persona que aparezca en los videos de entrenamiento y mantener el aviso «no es un dispositivo médico». |

Pega aquí el párrafo exacto cuando lo tengas y adapto la app y la declaración.

## 5. Declaración lista para el reporte

> **Uso de inteligencia artificial y herramientas.** La lectura de labios, el decodificador de frases, el modelo de frases en español, el entrenamiento y las cuentas de Voz Propia fueron diseñados y programados por el equipo. Para la detección de puntos de la cara usamos el modelo preentrenado MediaPipe Face Landmarker de Google (licencia de MediaPipe, Apache 2.0). En el modo programador, usado solo para preparar ejemplos, empleamos Whisper base de OpenAI (MIT) para escribir el texto de los videos. Durante el desarrollo usamos un asistente de programación con IA (Claude Code, de Anthropic); el equipo decidió qué construir, revisó y probó el código y se hace responsable del resultado. La app no genera textos ni imágenes con IA al usarse. No se guarda video: solo posiciones de puntos de la boca. Letras: SIL OFL 1.1. Íconos: Lucide (ISC). Gráficas 3D: Three.js (MIT). Idea de investigación: aprender palabras con pocos ejemplos, inspirada en LipLearner (Su, Fang y Rekimoto, CHI 2023) [verificar la cita antes de imprimirla].

## 6. Recomendaciones para el reporte y la bitácora

- La bitácora (rubro 4 de la rúbrica) puede apoyarse en el historial de cambios del repositorio, que muestra fecha y motivo de cada avance.
- Anexa las capturas del panel «Entrenamiento» para mostrar la mejora de la precisión conforme se suben palabras.
- No presentes estudios con pacientes ni afirmes uso clínico: la app es una ayuda de comunicación.
- Si hay personas en los videos de entrenamiento, ten el permiso por escrito de cada una.
