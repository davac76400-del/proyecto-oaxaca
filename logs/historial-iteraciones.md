# Historial de iteraciones

Las vueltas que dio el proyecto. Útil para entender **por qué** las cosas
están como están, y para no deshacer decisiones ya tomadas.

---

**1 · Landing inicial.** Página de presentación con identidad "Futurismo Raíz":
chapulín alebrije, grecas de Mitla, paleta neón sobre obsidiana.

**2 · Bloqueo del asistente.** Registro con verificación por código de 6
dígitos. Se eliminan Facebook e Instagram (decisión: **solo WhatsApp**,
529514614505). Se añade "Contáctanos si hay un problema" en la cabecera.
Paleta ampliada con violeta y amarillo neón.

**3 · Portado de ideas externas (1).** El autor trae una versión hecha por otra
IA y pide tomar lo bueno sin perder nada. Se portan: pestañas Regístrate /
Iniciar sesión, código elegido por el usuario, teléfono opcional, video de
YouTube en el tutorial. Se conectan los webhooks reales de n8n.

**4 · Portado de ideas externas (2).** Se porta el historial de conversaciones
múltiples (nueva plática, lista por cuenta, cambiar, borrar, mensajes
persistidos) y la insignia que indica si la respuesta vino de n8n o del motor
local.

**5 · Versión "definitiva" con paleta exacta.** El autor especifica los
hexadecimales: fondo #080b12, tarjetas #131b2e, bordes #23324d, cian #00f2fe,
magenta #ff2a85, oro #ffb703. Tipografías Playfair Display + Plus Jakarta Sans.
Cuentas por usuario (no correo). Teléfono visible 951 461 4505. Timeout 8 s.

**6 · Chat abierto (revertido después).** Pide quitar todos los candados: el
chat funcional al cargar, login opcional como botón "Perfil", usuario genérico
"invitado".

**7 · Vuelta al bloqueo + fondo claro.** Cambia de opinión: quiere una portada
que **bloquee todo** hasta registrarse. Y pide cambiar el fondo oscuro a
**café claro**, manteniendo lo cultural y el chapulín con su lucecita.
Se añade el toggle día/noche.

**8 · Arreglo del registro.** El registro no dejaba pasar (el teléfono seguía
bloqueando). Se renombra "Nombre" → "Usuario" con reglas de app (sin espacios,
4–20, una mayúscula, único). Teléfono verdaderamente opcional.

**9 · Reversión del código autogenerado.** Se había implementado que el sistema
generara el código; el autor aclara que quiere **escribirlo él mismo**.
Se revierte. También se ataca el recuadro del chapulín.

**10 · Selector de lada.** Se añade el desplegable con las ladas de América y
España (22 países, default +52) y se corrige la validación del teléfono para
que acepte espacios y guiones.

**11 · Diseño de gama alta.** Se cambia el webhook del chat a
`gamon2.app.n8n.cloud`. Se profundiza la paleta noche a azul medianoche
ultraprofundo y se hace tema por defecto (revertido en la siguiente vuelta).

**12 · Legibilidad.** El autor reporta textos ilegibles. Se vuelve al tema claro
por defecto y se descubre el **BUG-09**: el config de Tailwind tenía
hexadecimales fijos del tema oscuro. Cambio arquitectónico a variables en
canales RGB.

**13 · Cero letras claras.** Se eliminan todas las opacidades de texto y se
oscurece `--tenue`. Se verifica con un detector automático de luminancia.

**14 · Chapulín sin recuadro.** Tras varios intentos con CSS, se resuelve
recortando el fondo de la imagen con PIL (transparencia real).

**15 · Quitar el fosforescente.** Se descubre que el neón estaba **pintado en la
imagen**, no en el CSS. Se atenúa procesando los píxeles.

**16 · Tarjeta de alta gama.** El chapulín se enmarca en una tarjeta elegante
con degradado cálido, sombra suave, resplandor ámbar tenue y greca dorada.

**17 · Mitigación del BUG-13 (23 ago 2026).** Se retoma el proyecto exportado
tal cual (`LEER-PRIMERO.md`, docs, backend, logs) dentro de este repositorio.
Se integra `CONFIG_IA` en `app.src.html` (adaptado de
`backend/ai_service_directo.js`): cadena de respaldo n8n → IA directa →
motor local, apagada por defecto, sin claves reales incrustadas. La insignia
del chat distingue los tres orígenes posibles. Se verificó con Playwright
(registro, chat, insignia y diagnóstico) sirviendo el archivo por
`http://localhost`, sin romper nada existente.

**18 · IA propia y barra de arriba (23 ago 2026).** El autor pide sacar a
Gemini como motor único y que la IA quede lista de fábrica, directa, sin n8n
ni conectores, y sin pedirle llaves al usuario final. Se implementa la cadena
Llama 3.2 (gratis) → Gemini Flash (gratis) → motor local, con memoria de las
últimas 6 vueltas de la plática. Se elimina `WEBHOOK_ASISTENTE` y todo el
diagnóstico de CORS de n8n; el webhook de altas y el de contacto se conservan.
También reporta que en modo noche "se ve medio con la luz en la parte de
arriba": era un crema horneado en `.encabezado` (BUG-14), del mismo tipo que
el BUG-08. Todo verificado con Playwright.

**19 · Revisión de seguridad (23 ago 2026).** El autor revisa la entrega y
señala que las llaves no pueden ir en el frontend. Tiene razón: se refactoriza
a un backend (`backend/ia-core.js`) con las llaves en `.env`, más tres
envoltorios (servidor local, Netlify, Vercel). El frontend se queda solo con
`ENDPOINT`. Se añaden tres defensas: candado de llaves en `build.py`, tachado
de secretos en los mensajes de error, y `/api/estado` que informa sin revelar.
También pide un servidor local para no tener que publicar en cada prueba:
`node backend/servidor.js` sirve la app y el asistente en el mismo origen, con
lo que caen de golpe el problema de CORS y el del `file://`.

**20 · Rediseño prístino y herramientas nativas (23 ago 2026).** El autor pide
un cambio grande: blanco puro y contraste alto, relieve 3D tipo claymorphism,
textil oaxaqueño de fondo al 4 %, tipografía Inter, y acentos vivos de alebrije
solo en detalles. Se conserva Playfair para los títulos (es la marca) y el modo
noche completo. El tutorial sale de la caja del chat y pasa a una «Guía
Interactiva» de seis tarjetas deslizables en su propia ventana. Se agregan
tres herramientas hechas solo con lo que trae el navegador: dictado por voz
(Web Speech API), simulador de ganancias con barra deslizante, y exportación de
la respuesta a PDF con membrete (`window.print()` + `@media print`). Además,
«¿Sabías qué?» rotando solo, la insignia pasa a decir «IA ACTIVA», se quitan
las cajas amarillas de alarma y el pie ya no menciona n8n. Tres bugs salieron
durante la propia verificación: BUG-17, BUG-18 y BUG-19.

**21 · Double check, rendimiento y cinco herramientas más (23 ago 2026).**
El autor pide revisar todo y corregir lo que aparezca, **deshacer el blanco
prístino** y volver al modo día original, un recorrido con scroll sobre vender
directo, y cinco funciones más. Se revierte la paleta, la tipografía (Plus
Jakarta Sans) y los componentes al diseño original, conservando solo el peso
400 del cuerpo para que no se vea delgado. Se añaden: sin conexión con Service
Worker, guardar como imagen con Canvas, glosario sin tecnicismos, calculadora
de precios y medallas.

El hallazgo grande fue de rendimiento: en un celular con la CPU frenada 6
veces, la página tardaba **13 segundos** en aparecer. Dos causas: el chapulín
incrustado 4 veces (975 KB) y, sobre todo, la hoja de tipografías de Google
que **bloquea el pintado**. Corregidas las dos, la primera pintura bajó a
**112 ms**. Ver BUG-20 a BUG-23.

**22 · Fotos a la IA, teléfono por país y WhatsApp (23 ago 2026).** Cuatro
peticiones. (1) Mandarle fotos al asistente: el navegador la achica a 1024 px
antes de subirla y el backend elige solo el modelo con visión. (2) El teléfono
deja de exigir 10 dígitos a todos: tabla de 22 países con mínimo y máximo
(BUG-24). (3) Verificación por WhatsApp con código de 6 dígitos, con cuatro
mensajeros posibles (Meta, Twilio, n8n o consola para probar) y todas las
protecciones; nunca bloquea el registro. (4) Las fotos reales de huipiles no
se pudieron poner: el proxy de la máquina bloquea Wikimedia, así que se dejó
`traer_huipiles.py`, que verifica procedencia y licencia antes de descargar.
Durante la prueba salió el BUG-25, un `var` que borraba su propia asignación.

---

## Patrones del autor (importante para Claude Code)

1. **Trae versiones alternas hechas por otras IA** y pide portar lo bueno sin
   perder nada. Esas versiones suelen romper en silencio: cambian el chapulín
   por emoji, pierden el historial, quitan validaciones, dejan el
   "Escribiendo…" infinito.

2. **Nada existente se elimina al pedir mejoras.** Es su preferencia más
   constante. Al agregar algo, conservar todo lo demás.

3. **Cambia de opinión entre iteraciones** (chat abierto ↔ bloqueado; código
   autogenerado ↔ escrito por él; fondo oscuro ↔ claro). Seguir siempre la
   instrucción más reciente.

4. **El chapulín es sagrado.** Nunca sustituirlo, nunca quitarle su animación.

5. **Habla en español y describe los problemas por cómo se ven**, no por su
   causa técnica. "Se ve fosforescente" significaba que había que procesar la
   imagen, no tocar el CSS. Conviene investigar la causa real antes de asumir.

6. **Pide el archivo listo para descargar** al final de cada entrega.
