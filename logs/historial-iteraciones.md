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
