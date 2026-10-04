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

`npm run assets` (se ejecuta solo en dev y build) prepara en `public/` los recursos que la app necesita para la cámara.

## Sonido de la entrada

La entrada tiene efectos de sonido sintetizados en el momento (no hay archivos de audio, así que funcionan sin internet): campanitas que suenan cuando aparece cada palabra, un tono que sube mientras carga la barra, un rayo con trueno cuando la pantalla se rompe, un tono que sube mientras se dibuja el círculo y un arpegio al cerrarlo. Los navegadores solo dejan sonar después de un toque, así que hay un botón de sonido (en el cargador y en la pantalla de cuenta) que avisa cuando falta ese toque y sirve para silenciar. La preferencia se recuerda.

## Cuenta

Al abrir la app, cuando la barra del cargador se llena, la pantalla se rompe en cuatro pedazos con una grieta de luz y aparece la entrada (obligatoria): **Iniciar sesión**, **Crear cuenta** (nombre, correo y contraseña) o **Entrar sin cuenta** (invitado: no se guarda nada al salir). Por ahora las cuentas viven en el dispositivo (`src/core/auth.ts`, contraseña guardada como huella PBKDF2); para usarlas en varios dispositivos hace falta un servidor (por ejemplo Supabase). Al entrar sale **Inicia a trabajar**: hay que dibujar un círculo siguiendo el aro con el dedo o el mouse (un trazo de pintura lo va rellenando; con teclado, mantener espacio). Al cerrarlo, el color inunda la pantalla y se abre el inicio. La sesión con cuenta se recuerda. Arriba, siempre visibles, están **Consejos** y **Cuenta** (ver tu cuenta, cambiar de cuenta o iniciar sesión si entraste sin cuenta; también hay un botón de cuenta arriba dentro de la app, que al terminar te regresa a donde estabas). Mientras la pantalla de cuenta está abierta, la escena 3D se pausa.

## Dos modos

La primera vez se abre el **inicio**; ahí se elige «Iniciar a usar» o se abre la tarjeta «Cómo funciona y cómo te ayuda» (no está en el menú: solo en esa tarjeta, al lado de «Iniciar a usar»).

- **Cómo funciona y cómo te ayuda** (`#/ayuda`, con escala de dolor 0 a 10 y velocidad de la voz): página larga (~23 pantallas) con **datos reales y sus fuentes** (INEGI Encuesta Intercensal 2025, cáncer de laringe 2025 y 2026, traqueostomías, ELA, terapia intensiva y dolor), «Resumen», «Qué es», datos en una mirada, a quién ayuda (6 pestañas con antes y después), **cinco pasos interactivos**, una **demo** que «lee» una palabra y la dice, las **frases que prepara el equipo** (se escuchan al tocarlas), **privacidad por capas**, antes y con Voz Propia, momentos de ejemplo, **alcances y límites**, **preguntas frecuentes**, glosario, ruta y fuentes. Tiene **índice** (botón arriba a la derecha) y barra de avance. Detrás, un campo de ~2,600 puntos (Three.js) que forma labios, cada cifra, un corazón, una onda, «HOLA», «0 VIDEOS» y un «?»; los puntos **siguen al mouse o al dedo** y salen disparados al soltar el clic.
- **Consejos de uso** (`#/consejos`): manual para usar Voz Propia, con una paleta por sección: lista «¿Todo listo?» (luz, altura, distancia, labios a la vista, batería, volumen), cómo mover los labios (así sí / así no), letras que se ven igual en los labios (P, B, V y M; F; A; O y U; E e I) y por qué la app a veces pregunta, qué pasa si la app duda, cuidado del teléfono y cómo hablar con alguien sin voz. Se abre desde la tarjeta del inicio, la ayuda y la guía.
- **Usuario:** una guía de scroll largo (unas 20 pantallas) con **una sola escena 3D ligera** (Three.js): una nube de ~500 puntos que se vuelve cara, forma de labios, galaxia de comparación, ondas de voz y globo mientras se baja. Tocar la pantalla la hace vibrar y el cursor la inclina. Al final están **«Contamos con estas palabras»**, **«Lo que más se pide en un hospital»** (frases en preparación, por tema) (solo las que ya tienen ejemplos; hoy, ninguna) e **«Iniciar a utilizar»** (aún bloqueado). Arriba a la derecha, el botón **«Regresar al inicio»** se llena de agua mientras se mantiene presionado 2 segundos y salpica al terminar.
- **Programador:** panel oscuro con Panel, Entrenar, Probar, Tablero y Ajustes. No aparece en el menú: se entra con la dirección `#/programador`. Las palabras que agrega (con ejemplos) aparecen en la guía del usuario en el mismo dispositivo.

En la guía y en la página de ayuda hay un selector de **colores** (arriba a la izquierda): seis paletas oscuras (negro y azul, océano, bosque, vino, violeta y ámbar). Cambian el fondo, las tarjetas, los puntos y esferas 3D, y se recuerdan. Las ideas clave del texto van en otro color (`*así*` en el código, `src/ui/dom.ts › rich`), sin subrayar.

Siempre se abre en el **inicio**, con un cargador: una barra de colores fosforescentes que se llena mientras arriba aparecen labios y palabras, y al llenarse la pantalla se parte en dos (mínimo ~3 s). Solo el modo programador conserva su dirección (`#/panel`, etc.). En vista previa (la app dentro de otra página, como un Artifact) **se reinicia sola al cerrarla y volverla a abrir**, para empezar siempre desde el cargador. «Regresar al inicio» (mantener 2 s) salpica con ondas verde, blanca, azul y negra.

Las palabras las prepara el equipo (modo programador › Entrenar); la persona usuaria no crea palabras. En la guía, el botón **«Pasar directamente a la aplicación»** salta al final, y desde el final **«Volver al inicio de la guía»** regresa arriba.

En la guía hay **límite de velocidad**: con rueda o teclado avanza una pantalla por gesto, y en pantallas táctiles el navegador se detiene en cada pantalla (`scroll-snap-stop`); así ningún texto se pasa de largo. El final (palabras y consejos) se recorre libre.

La guía usa scroll nativo, sin librerías de animación: solo `transform` y `opacity`, un único lienzo, resolución adaptable si el equipo va lento y pausa cuando el lienzo no se ve. Paleta: negro, azul cobalto, verde y blanco. El inicio ya no tiene selector de colores: las esferas son siempre azul cobalto. La app se actualiza sola cuando se publica una versión nueva. No hay opciones de «letra más grande» ni «más contraste»: el diseño ya mantiene tamaños y contraste legibles.

Sincronizar entre dispositivos en tiempo real necesita un servidor (por ejemplo Supabase); hoy todo se guarda en el dispositivo.

## El inicio

Una página con scroll cinematográfico (`src/ui/landing/`):

1. **Cargador** que calibra mientras la escena 3D se prepara.
2. **Campo de esferas** (Three.js, `MeshPhysicalMaterial` de vidrio y mate) con física propia: choques, piso que rebota y el cursor que las aparta. Con el scroll flotan, caen al suelo, se ordenan en forma de **labios** y despegan hacia la cámara.
3. Los colores cambian por capítulo: cobalto → lima → rosa labio → amarillo → noche con menta.
4. «Mantén presionado y escucha cómo hablan»: los labios de esferas se abren y cierran mientras la app dice una frase.
5. Cómo funciona, el bloque «Por qué importa» con un dato real, cifras del sistema y la elección de modo.

La física usa paso fijo de 1/60 s (igual en pantallas de 30, 60 o 120 Hz). La escena se carga aparte: el modo usuario no descarga Three.js.
Con «reducir movimiento» activado en el sistema no hay scroll suave ni animaciones de entrada.

## La cámara en computadora

Funciona en cualquier navegador moderno siempre que la página se abra **directamente** (https o `localhost`). Si algo falla, la pantalla de la cámara dice qué pasó:

- **Falta el permiso**: cómo activarlo en el candado de la barra de direcciones.
- **Está ocupada**: otra app (Zoom, Teams, Meet, Cámara de Windows) la tiene tomada.
- **No hay cámara**: conectar una cámara web o usar el teléfono.
- **Vista previa**: dentro de otra página (por ejemplo, una vista previa embebida) el navegador la bloquea; se ofrece abrirla en su propia pestaña.

Si hay varias cámaras aparece un botón para cambiar de una a otra, y en Ajustes se puede fijar cuál usar.

## Cómo funciona la lectura

La cámara del teléfono mira el movimiento de los labios y la app reconoce la palabra entre las que preparó el equipo. Si duda, muestra opciones. La palabra se dice en voz alta con la voz del dispositivo. Todo pasa dentro del teléfono, sin internet.

## Estructura

```
src/
  app/        estado global y enrutador por modo
  core/       lógica sin interfaz
  data/       frases de hospital iniciales
  ui/
    landing/  inicio 3D (escena Three.js, página y estilos; se carga aparte)
    views/    Guía, Ayuda, Consejos y las vistas del modo programador
    styles/   tokens de los dos temas, base, componentes y vistas
  sw.template.js   service worker (la lista de precarga se genera en cada build)
```

## Privacidad

No se graba ni se envía video. Lo que la app guarda se queda en el propio dispositivo.
Voz Propia es una ayuda para comunicarse, no un dispositivo médico.
