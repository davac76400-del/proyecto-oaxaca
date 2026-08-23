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


---

# SEGUNDA TANDA (23 de agosto de 2026)

## 6 · Sin conexión

Barra ámbar arriba del todo: **«Estás sin conexión. Tus pláticas siguen aquí»**.
Aparece y desaparece sola con los eventos `online` / `offline`.

Como el archivo es autocontenido y las pláticas viven en el mismo navegador,
al perder la señal **no hay nada que recargar**: lo suyo sigue ahí y se puede
seguir leyendo. Lo único que deja de funcionar es pedirle algo nuevo al
asistente.

El Service Worker se arma al vuelo desde un `Blob`, sin archivo aparte, para
no romper la regla de «un solo archivo». Guarda la página para que abra aunque
no haya señal, y **nunca guarda las llamadas a `/api/`**: una respuesta de la
IA guardada sería una respuesta vieja disfrazada de nueva. Solo se registra
cuando la app se sirve desde un servidor; con doble clic no se puede, y no
pasa nada.

## 7 · Guardar como imagen

Botón **«Guardar como imagen»** en cada respuesta. Dibuja el texto en un
`<canvas>` a doble resolución y lo descarga en `.png`, listo para WhatsApp.

Lleva la greca dorada arriba, el nombre de la app, para quién es, y el pie
«Hecho con OaxIntegra IA». El texto se reparte en renglones midiendo con
`measureText`, así que nunca se sale de la hoja.

## 8 · Glosario sin tecnicismos

Si en una respuesta se cuela una palabra rara —*marketing*, *ROI*, *lead*,
*engagement*, *branding*, *algoritmo*, *target*, *ecommerce*, *KPI*,
*feedback*, *prompt*, *input*, *output*— se subraya en turquesa. Al tocarla
sale un globo con la explicación **y una comparación del mercado**:

> **ROI** — Es saber si lo que gastaste te regresó ganancia. Si compras 200
> pesos de hilo y vendes el rebozo en 900, tu ROI es lo que te quedó: bueno.

Se recorre solo los nodos de texto con un `TreeWalker`, así que **nunca rompe
el HTML** que ya armó la respuesta (imágenes, enlaces, negritas). El globo se
coloca solo arriba o abajo según dónde quepa, y cierra con Escape o clic fuera.

Para agregar palabras: el objeto `GLOSARIO` en `app.src.html`.

## 9 · Calculadora de precios

Cuando la plática va de precios, debajo de la respuesta aparece sola una
calculadora con tres barras: **material**, **horas** y **cuánto quieres ganar**.

```
base  = (material + horas × 150) × 1.18
precio = base × (1 + margen/100)
```

El 150 es el valor de la hora y el 18 % son los gastos que no se ven
(transporte, luz, empaque, merma). Los dos están escritos a la vista, debajo
del resultado, y se cambian en `calculadoraPrecios()`.

Se dispara mirando **lo que contestó el asistente y lo que preguntó la
persona**: si alguien pregunta por precios, la calculadora le sirve aunque la
respuesta no repita esas palabras.

## 10 · Medallas

Tres reconocimientos que se ganan usando la app:

| Medalla | Se abre con |
|---|---|
| Explorador Digital | 3 preguntas |
| Mano Constante | 10 preguntas |
| Maestro del Oficio Digital | 25 preguntas |

Al ganarse sale un aviso abajo. Se guardan en `localStorage` **por cuenta**
(`oaxintegra.medallas.<usuario>`), y se ven siempre en el panel «Tus
reconocimientos», arriba del chat: las que faltan salen apagadas, con la
pista de cómo abrirlas.

---

## Sobre las fotos de huipiles

La sección «Lo que se gana vendiendo directo» usa `<img>` con **patrones de
textil dibujados en SVG**, no fotografías.

**Por qué:** no puedo verificar que una dirección de internet apunte de verdad
a un huipil oaxaqueño auténtico, y poner una foto equivocada en una página que
habla justo de autenticidad cultural sería peor que no poner ninguna. Además,
una foto de fuera rompería el «un solo archivo»: la página dejaría de abrir
sin internet.

**Cómo poner las tuyas** (que además serán más auténticas que cualquier foto
de banco de imágenes): en `app.src.html`, busca `lienzo-huipil` y cambia el
`src` de cada `<img>` por la ruta de tu foto. **Deja el `width`, el `height` y
el `loading="lazy"`**: son los que evitan que la página brinque y los que la
hacen cargar rápido en celulares modestos.
