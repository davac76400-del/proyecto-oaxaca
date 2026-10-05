# Voz Propia · Convocatoria XXI de Infomatrix (SOLACYT): reglas, IA y qué te toca hacer

Fuente: «Convocatoria General XXI», actualizada el 29 de septiembre de 2026 (el PDF que me mandaste). Cuando cito una regla, va con su número.

## 1. Lo más importante: la IA SÍ está permitida

> **II. Proyecto:** «el uso de IA como apoyo al desarrollo es aceptado mientras se indique en el reporte la contribución que realizó.»
> **IV.2:** «Se podrán usar como apoyo externo; imágenes, gráficos, IA, música y videos indicando créditos de autoría.»
> **IV.3:** «Los proyectos deberán incluir créditos de quienes lo hicieron y la bibliografía utilizada.»

Conclusión: **no hay que quitar ninguna herramienta.** Lo que exige la regla es **declarar en el reporte qué hizo la IA**. La app ya lo dice (sección «Herramientas y créditos») y la declaración para el reporte está en la sección 4.

El riesgo real no es usar IA, es **no declararla o declararla a medias**: IV.17 descalifica a quien incumpla la convocatoria.

## 2. Reglas que sí te afectan

| # | Regla | Cómo estás |
|---|---|---|
| II | El proyecto debe haberse realizado **no antes de abril de 2026**. | Cumples: el historial de cambios empieza el 3 y 4 de octubre de 2026. |
| IV.1 | Creación propia e inédita. Se aceptan modificaciones de productos existentes que los hagan novedosos. | Cumples. Tu parte propia está listada en la app. |
| V | Categoría **Desarrollo de Software** (cualquier lenguaje y plataforma, web incluida). | Es la correcta. Ver nota de la sección 5 sobre «Ciencia Aplicada». |
| IX.2 | Reporte: para Software se recomienda el **Avanzado o Científico** (https://bit.ly/ReporteAvanzado, solo descargar, no pedir edición). Las credenciales van en el «Anexo A»; la carta responsiva se entrega en original el día del evento. | Pendiente de llenar. |
| X.4 y 5 | Máximo **7 minutos** para exponer y un stand. | Prepara demo en vivo. |
| IV.5 | Tú respondes por la propiedad del proyecto ante cualquier reclamo. | Por eso conviene tener las licencias a la vista (tabla de la sección 3). |
| X.20 | Si acreditas a un evento internacional de Infomatrix, ya no puedes acreditar en otro: ese ciclo del proyecto termina. | Tenlo presente al planear. |
| IV.4 | SOLACYT puede usar y publicar el proyecto; los derechos de autor siguen siendo tuyos. | Sin acción. |

La convocatoria **no menciona** estudios con personas ni temas médicos. Aun así, es buena práctica tener permiso por escrito de quien aparezca en los videos de entrenamiento y mantener el aviso «no es un dispositivo médico».

## 3. Lo que usa la app (todo cabe dentro de las reglas)

| Componente | Para qué | ¿Es IA? | Licencia |
|---|---|---|---|
| MediaPipe Face Landmarker (Google) | Puntos de la cara y la boca | Sí, modelo preentrenado | Apache 2.0 (librería); revisar la tarjeta del modelo |
| Claude Code (Anthropic) | Asistente para programar | Sí | Servicio |
| ONNX Runtime Web | Ejecutar un modelo opcional (hoy no hay ninguno) | No | MIT |
| Three.js, Lucide, Supabase (cliente) | 3D, íconos, cuentas | No | MIT, ISC, MIT |
| Raleway, Atkinson Hyperlegible Next, JetBrains Mono, Anton, Sacramento | Letras | No | SIL OFL 1.1 |

Dentro de la app no hay chatbot ni IA que genere textos o imágenes. Llamadas externas al usarla: Supabase y Google DNS (solo el dominio del correo, por ejemplo `gmail.com`). No se guarda video, solo posiciones de puntos de la boca.

## 4. Declaración lista para el reporte (honesta)

Pégala en el reporte avanzado, en el apartado de herramientas, créditos o bibliografía. Ajusta si algo no coincide con lo que tú hiciste.

> **Uso de inteligencia artificial.** Según la convocatoria XXI (apartados II y IV.2), declaramos la contribución de la IA. Herramienta: Claude Code (Anthropic), un asistente de programación con IA. **Contribución de la IA:** escribió y revisó la mayor parte del código de la aplicación (interfaz, cuentas, lectura de labios, entrenamiento y pruebas), propuso soluciones a los errores que fueron surgiendo, ayudó a redactar textos y buscó datos y fuentes para la página «Cómo funciona y cómo te ayuda». **Contribución del equipo:** decidió qué problema resolver, para quién y cómo debía verse y sentirse; dirigió el trabajo paso a paso, probó cada resultado y pidió correcciones; prepara los ejemplos con los que se entrena la aplicación y es responsable del resultado. **Otras herramientas con IA:** MediaPipe Face Landmarker (Google) detecta los puntos de la cara. El audio de los videos no se usa para nada: solo se leen los labios. La aplicación no genera textos ni imágenes con IA al usarse y no guarda video. **Créditos:** Three.js (MIT), Lucide (ISC), Supabase (MIT), letras con licencia SIL OFL 1.1. **Idea de investigación:** aprender palabras con pocos ejemplos, inspirada en LipLearner (Su, Fang y Rekimoto, CHI 2023) [verifica esta cita antes de imprimirla].

Bitácora (rubro 4 de la rúbrica): el historial de cambios del repositorio muestra fecha y motivo de cada avance. Anexa capturas del panel «Entrenamiento» para mostrar cómo mejora la precisión al subir palabras.

## 5. Lo que tienes que revisar tú (puede costarte la participación)

1. **Ser estudiante (III.1).** El requisito es ser estudiante de preescolar a universidad. Si no estás inscrito en ninguna escuela, esto es lo primero que debes resolver con contacto@solacyt.org o WhatsApp +52 3310733731.
2. **Edad (III.2).** Tienes 25 años. La edad se mide **a la fecha de cierre de inscripciones**. Si cumples 26 antes de ese cierre, solo puedes participar como estudiante activo. Revisa tu fecha de cumpleaños contra el cierre de tu sede.
3. **Sede.** Debes inscribirte en la que te corresponde por geografía (VI.5): **Oaxaca**. Hoy su registro está **cerrado**, sin fecha ni sede publicadas para este ciclo. Vigila infomatrix.lat. La **final nacional** es en **Oaxaca de Juárez (Universidad La Salle Oaxaca), 16 al 19 de junio de 2027**; la **final iberoamericana**, en **Tijuana, 19 al 22 de mayo de 2027** (para equipos acreditados). La sede virtual de abril de 2027 solo es para quienes no pueden asistir a su regional por razones económicas o de salud comprobables (hay que pedir autorización por correo).
4. **Costo en México:** $450 MXN por participante (equipo de 1 persona = $450; de 3 = $1,350). Conserva el comprobante: se sube a la plataforma junto con el reporte.
5. **Qué se sube** antes del cierre de tu sede: comprobante de pago y reporte. Sin los dos completos y legibles, quedas como «No Finalista» (IX).
6. **Categoría.** Software es la correcta. La alternativa es «Ciencia Aplicada» (incluye Medicina y Salud). No lo cambies sin pensarlo: tu producto es software, y la rúbrica de Software encaja mejor.

Pendiente que no pude comprobar: la rúbrica oficial vigente y el formato exacto del reporte avanzado (las ligas bit.ly y el sitio de SOLACYT están bloqueados desde mi entorno). Descarga el reporte y pásame el archivo para ajustar la app y la declaración a su estructura.
