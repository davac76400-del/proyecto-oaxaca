---
name: ui-verificacion-animada
description: Diseño y código de las pantallas de cuenta de Voz Propia - casillas de código con pegado, animación tipo cartas que se juntan y giran y terminan en check verde, pasos 1/2 y 2/2, lista de requisitos en vivo, estados de error y accesibilidad. Úsala al diseñar o corregir pantallas de verificación, registro, login o PIN, o al copiar la animación de un video de referencia.
---

# UI de verificación y cuentas (Voz Propia)

Estética de la app: tarjeta de cristal oscura, verde `#3df2a0`, azul `#4d7cff`, fuente Raleway. Todo en `src/ui/landing/landing.ts` (HTML + lógica) y `landing.css`.

## Cómo leer un video de referencia
El usuario manda un `.mov`. Extraer fotogramas y mirarlos en una tira:
```bash
ffmpeg -y -i video.mov -vf "fps=2,scale=360:-1,tile=6x2" -frames:v 1 tira.png
```
El de referencia hacía: números llenan casillas → casillas se abren como abanico de cartas → se juntan en una → tarjeta con borde girando («Comprobando») → check verde («Verificado») → siguiente pantalla. Se adaptó a nuestros textos y colores, no se copió literal.

## Componentes
- `codeRow(n, nombre, {secret, auto, otp})`: n casillas `input` con `--n` para el grid. `secret` usa `type=password` (PIN) con botón «Mostrar números». `auto` envía el formulario al completar. Solo la primera casilla lleva `autocomplete="one-time-code"`.
- `seal()`: tarjeta 84px con aro giratorio (`.l-seal__ring`) y check SVG que se dibuja (`stroke-dashoffset`).
- `steps(1|2)`: dos barras + «1/2». `showToggle()`: mostrar/ocultar PIN.
- `runSeal(form, trabajo, {working, done, doneP})`: orquesta la animación y espera al servidor.

## Secuencia (tiempos que se sintieron bien)
1. `.is-fan` 380 ms: cada casilla `translate(--x,--y) rotate(--r)`; `--r = (i-mid)*11deg`, `--x = (i-mid)*-pull` (14px con 8 casillas, 24px con 4), `--y = |i-mid|*5px`.
2. `.is-stack` 340 ms: todas viajan al centro con `--cx` **medido en píxeles** con `getBoundingClientRect` (el cálculo con % se descuadra por el gap).
3. `.is-gone` (display none) y se muestra el sello con estado `busy`; título «Comprobando…».
4. Mínimo 700 ms de giro aunque el servidor responda rápido (si no, parpadea).
5. Estado `ok` 900 ms: borde verde, resplandor, check dibujado, `vibrate`.
6. Si falla: `restore()` devuelve casillas, textos y botones, limpia, sacude el formulario (`is-shake`) y muestra el error.
Mientras `.is-sealing` se ocultan botones, enlaces y errores para que no se pueda tocar nada.
`prefers-reduced-motion`: sin abanico ni giro; se mantienen los cambios de estado.

## Casillas de número: comportamiento
- Escribir avanza a la siguiente; Backspace en vacía retrocede; flechas izquierda/derecha.
- **Pegar o autocompletar el código completo en la primera casilla reparte los dígitos.** Por eso cada casilla tiene `maxlength = n`, no 1.
- Letras se ignoran (`replace(/\D/g,'')`).
- Autoenvío solo en código del correo y PIN de login; en crear/editar PIN hay botón (evita enviar con un error de dedo).

## Lista de requisitos en vivo
`<ul class="l-rules">` con un círculo que se rellena de verde al cumplirse cada regla, en 2 columnas (1 en <420px). Estado de disponibilidad con `debounce` 350 ms y contador de petición (`seq`) para descartar respuestas viejas. Botón «Continuar» deshabilitado hasta que todo cumpla y esté libre; el `finally` del submit NO debe reactivarlo a ciegas (usa `userOk`).

## Errores de diseño que cometimos
- 8 casillas con CSS `repeat(6, …)` fijo: no cabía el código. Usar `repeat(var(--n), …)` y `max-width: calc(var(--n)*70px)`.
- Botón principal dentro de un `div` suelto salió angosto (el `display:flex` del botón no estira fuera de un grid). Envolver en `display:grid`.
- Plantilla de correo pegada de una versión simple: se veía fea. Ver `correo-smtp-gratis`.
- Texto de error genérico: reemplazar por la causa real y la acción («Este correo no funciona. Corrígelo.»).

## Mensajes (tono)
Frases cortas, en español, sin tecnicismos: «Correo verificado», «Cuenta creada», «Ese usuario ya existe. Elige otro.», «No encontramos ese usuario. Revísalo o crea una cuenta.»

## Accesibilidad mínima
Objetivos táctiles ≥ 44 px; `aria-live="polite"` en errores y estado; `role="img"` + `aria-label="Paso 1 de 2"` en los pasos; contraste ≥ 4.5:1 (texto secundario `#aab6d6` sobre fondo oscuro); revisar en 390×800.
