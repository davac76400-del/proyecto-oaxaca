# Las herramientas nuevas (23 de agosto de 2026)

Cinco funciones hechas **solo con lo que ya trae el navegador**: nada de
librerías, nada que instalar, nada de servicios de terceros. Todo vive dentro
del mismo archivo de siempre.

---

## 1 · Guía Interactiva

**Dónde está:** botón con degradado violeta→magenta en la cabecera. En el
celular, arriba del todo en el menú desplegable.

**Qué hace:** abre una ventana con **seis tarjetas deslizables** que explican
cómo pedirle cosas a la IA. Ya no se escribe dentro del chat.

Se puede avanzar de tres maneras:
- Botones «Antes» y «Sigue»
- Flechas ← → del teclado
- Deslizando con el dedo en el celular

La sexta tarjeta tiene un botón para mandar la guía completa al chat, para
quien la prefiera ahí. **Así no se perdió nada de lo que ya existía.**

**Qué se quitó:** el botón «Tutorial: Aprende a utilizar Inteligencia
Artificial» que estaba dentro de la caja del chat.

**Qué se conservó:** el modal con el video de YouTube sigue ahí; ahora su
botón se llama **«Ver el video tutorial»** para que no se confunda con la
guía nueva.

---

## 2 · ¿Sabías qué?

Tarjeta a la izquierda del simulador. Rota **sola cada 6 segundos** entre tres
datos, y se detiene mientras alguien la está leyendo (al pasar el cursor).
También se puede saltar con los puntitos de abajo.

Las cifras van **sin comas ni puntos**: `$150000`, tal como se pidió.

Si la persona tiene activado «reducir movimiento» en su sistema, **no rota
sola**: se queda quieta y se cambia con los puntitos.

---

## 3 · Simulador de ganancias

Una barra deslizante (`input type="range"`) de 1 a 10 horas. Al moverla
calcula, al instante:

| Cifra | Cómo se saca |
|---|---|
| Horas libres al mes | horas al día × 0.5 × 30 |
| Valor de tu tiempo | esas horas × 150 pesos |
| Días completos | esas horas ÷ 8 |

Los tres supuestos (**hora a 150 pesos**, **el asistente se lleva la mitad de
esa carga**, **jornada de 8 horas**) están escritos a la vista, debajo del
resultado, con la aclaración de que es una guía y no una promesa.

Para cambiarlos: `VALOR_HORA`, `PARTE_QUE_DELEGA` y `DIAS_MES` en la función
`simulador()` de `app.src.html`.

---

## 4 · Dictado por voz

Botón de micrófono junto a la caja de texto del chat. Usa la **Web Speech API**
que ya trae el navegador (`SpeechRecognition`), en español de México.

- Al tocarlo, el botón **late en magenta** para que se vea clarísimo que está
  escuchando.
- Lo dictado se va escribiendo en la caja, sin borrar lo que ya hubiera.
- Se toca otra vez para parar.

**Si el navegador no lo soporta, el botón no aparece.** Nadie ve una función
rota. Funciona en Chrome, Edge y Safari; en Firefox todavía no.

Los errores se explican en palabras normales, no en códigos:

| Qué pasó | Qué se le dice |
|---|---|
| No dio permiso | «Tu navegador no me dio permiso de usar el micrófono. Búscalo en el candado de la barra de direcciones.» |
| No se oyó nada | «No alcancé a oír nada. Acércate al micrófono y vuelve a intentar.» |
| Sin micrófono | «No encontré ningún micrófono conectado.» |

---

## 5 · Exportar la respuesta a PDF

Botón **«Descargar en PDF»** en cada respuesta del asistente. Usa la impresión
del propio navegador: en el diálogo que sale, la persona elige «Guardar como
PDF». Sin librerías.

**Cómo funciona por dentro** (importante si alguien lo toca):

La tarjeta **no se imprime en su sitio**. El primer intento fue posicionarla
con `position:absolute` y **salía una hoja en blanco**, porque queda dentro de
contenedores ya posicionados y `top:0` la mandaba a cualquier parte.

La solución: hay un `<div id="hoja-print">` vacío colgando directo de `<body>`.
Al exportar se **copia** ahí la tarjeta (copia, no se mueve: la original
conserva sus botones), se le pone membrete y pie, y en el papel se oculta todo
lo demás con `body > *{ display:none }`.

El papel lleva:
- **Membrete:** OaxIntegra IA · Hub de Innovación Cultural y Tecnológica ·
  Oaxaca, con el nombre de quien lo pidió y la fecha
- La respuesta, con su imagen
- **Pie:** el recordatorio de que es una propuesta y que los datos duros
  conviene confirmarlos

**Detalle que importa:** la hoja de impresión **redefine las variables de color
a la paleta clara**. Sin eso, imprimir desde el modo noche daba texto blanco
sobre papel blanco.

```css
@media print{
  #hoja-print{
    --barro:255 255 255; --texto:17 24 39; --cian:14 116 144; ...
  }
}
```

---

## Cómo se verificó

Todo se probó con un navegador de verdad (Playwright), en 360, 390, 768, 900,
1100, 1280, 1440 y 1600 píxeles, en los dos temas:

- La cabecera cabe en una sola línea en todos los anchos
- La guía se desliza, llega al final y bloquea «Sigue»
- «¿Sabías qué?» cambia solo de dato
- El simulador recalcula al mover la barra
- El PDF sale con membrete, sin botones, y legible aun imprimiendo de noche
- Cero errores de JavaScript
