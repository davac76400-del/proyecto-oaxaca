# Sistema de diseño — OaxIntegra IA

## Filosofía: "Futurismo Raíz"

Fusión de artesanía oaxaqueña con estética de interfaz de IA moderna.
Grecas de Mitla dibujadas en CSS/SVG, resplandores sutiles, micro-animaciones.
La regla: **la cultura no es decoración pegada encima, es parte de la estructura**.

---

## ARQUITECTURA DE COLOR (crítico para no romper nada)

El sistema usa **variables CSS en formato de canales RGB** (no hexadecimal).
Esto es deliberado y **no debe cambiarse sin entender por qué**:

```css
--texto: 36 28 19;     /* ✅ canales, permite rgb(var(--texto) / 0.5) */
--texto: #241C13;      /* ❌ rompe las utilidades de opacidad de Tailwind */
```

**Razón:** `tailwind.config.js` usa `rgb(var(--x) / <alpha-value>)`, lo que
permite que clases como `text-texto`, `bg-barro/70`, `border-borde/60`
**sigan el tema activo**. Si pones hexadecimales fijos en el config, Tailwind
"hornea" el color al compilar y el modo día/noche deja de funcionar.
Este fue el **BUG-09**, uno de los más difíciles del proyecto.

En el CSS embebido, todo uso directo va envuelto:
```css
background: rgb(var(--obsidiana));
color: rgb(var(--texto));
border-color: rgb(var(--borde));
/* con opacidad: */
background: color-mix(in srgb, rgb(var(--barro)) 65%, transparent);
```

---

## PALETA MODO DÍA (tema por defecto)

Estética: papel artesanal, tierra de Oaxaca, cálido y legible.

| Variable | Canales RGB | Hex equivalente | Uso |
|---|---|---|---|
| `--obsidiana` | `228 213 190` | `#E4D5BE` | Fondo general (café claro definido) |
| `--barro` | `255 253 248` | `#FFFDF8` | Tarjetas (blanco papel) |
| `--barroalto` | `247 240 226` | `#F7F0E2` | Superficies elevadas |
| `--borde` | `201 180 143` | `#C9B48F` | Bordes arena |
| `--cian` | `11 124 132` | `#0B7C84` | Turquesa oscuro — acento principal |
| `--verde` | `63 110 30` | `#3F6E1E` | Verde bosque |
| `--rosa` | `176 21 96` | `#B01560` | Magenta profundo |
| `--naranja` | `168 72 28` | `#A8481C` | Terracota |
| `--ambar` | `154 107 8` | `#9A6B08` | Oro oaxaqueño |
| `--violeta` | `109 44 176` | `#6D2CB0` | Acento secundario |
| `--texto` | `36 28 19` | `#241C13` | **Tinta café casi negra** |
| `--tenue` | `74 63 50` | `#4A3F32` | **Café oscuro** (textos secundarios) |
| `--glow` | `0` | — | Interruptor de resplandor (apagado en día) |

### REGLA DE ORO DE LEGIBILIDAD
**Ningún texto blanco, gris ni de tono claro sobre el fondo claro.**
Esto se pidió repetidamente y fue el BUG-10. Reglas concretas:
- Prohibido `text-white`, `text-gray-*`, `text-slate-*`
- Prohibidas las opacidades sobre texto: `text-tenue/70` lava el color y lo
  vuelve ilegible. Todas fueron eliminadas.
- `--tenue` debe permanecer oscuro (`74 63 50`). No aclararlo.
- **Excepción legítima:** texto crema sobre botón sólido de color
  (ej. `#FFFDF8` sobre el turquesa `--cian`). Ahí el contraste es correcto.

---

## PALETA MODO NOCHE

Estética: azul medianoche ultraprofundo, tipo interfaz de IA de vanguardia.

| Variable | Canales RGB | Hex | Uso |
|---|---|---|---|
| `--obsidiana` | `5 7 15` | `#05070F` | Fondo casi negro con matiz azul |
| `--barro` | `12 19 34` | `#0C1322` | Tarjetas azul profundo |
| `--barroalto` | `19 29 51` | `#131D33` | Superficies elevadas |
| `--borde` | `38 52 79` | `#26344F` | Borde sutil |
| `--cian` | `34 245 255` | `#22F5FF` | Cian neón brillante |
| `--verde` | `157 255 61` | `#9DFF3D` | Verde neón |
| `--rosa` | `255 61 149` | `#FF3D95` | Rosa mexicano |
| `--naranja` | `255 138 61` | `#FF8A3D` | Naranja |
| `--ambar` | `255 194 61` | `#FFC23D` | Oro |
| `--violeta` | `192 123 255` | `#C07BFF` | Violeta |
| `--texto` | `244 248 255` | `#F4F8FF` | Blanco bien iluminado |
| `--tenue` | `174 190 214` | `#AEBED6` | Gris azulado claro |
| `--glow` | `1` | — | Resplandor activado |

---

## TIPOGRAFÍA

```css
--display: 'Playfair Display', Georgia, serif;   /* títulos, elegante */
--sans: 'Plus Jakarta Sans', system-ui, sans-serif;  /* cuerpo */
```
- `body` con `font-weight: 300` (ligero, respirado)
- Clase `.tipo-display` para títulos grandes
- Clase `.rotulo`: `.7rem`, `letter-spacing: .22em`, MAYÚSCULAS — para
  etiquetas pequeñas tipo "PASO 1 DE 2 · PERSONALIZA TU ASISTENTE"

---

## GRECAS (patrones zapotecas de Mitla)

Tres máscaras SVG incrustadas como data-URI, reutilizables con `mask-image`:

```css
--greca-mask:  /* escalera diagonal 60x60, para fondos de medallón */
--greca-fondo: /* escalera 64x64 más fina, para fondos de sección */
--greca-banda: /* banda horizontal 48x14, para bordes y separadores */
```

Uso típico (el color lo pone `background-color`, la greca lo recorta):
```css
.elemento::after{
  content:''; position:absolute; inset:0;
  background-color: color-mix(in srgb, rgb(var(--ambar)) 55%, transparent);
  -webkit-mask-image: var(--greca-banda); mask-image: var(--greca-banda);
  mask-repeat: repeat-x; mask-size: auto 12px;
  opacity: .5;
}
```

---

## LA TARJETA DEL CHAPULÍN (`.tarjeta-marca`)

Tratamiento de alta gama para el logo en la portada:

```css
.tarjeta-marca{
  position:relative; max-width:360px; margin:0 auto 1.75rem;
  padding:2rem 1.75rem; border-radius:26px; isolation:isolate; overflow:hidden;
  background:
    radial-gradient(120% 90% at 50% 0%,
      color-mix(in srgb, rgb(var(--ambar)) 14%, transparent) 0%, transparent 55%),
    linear-gradient(160deg,
      color-mix(in srgb, rgb(var(--barro)) 96%, transparent) 0%,
      color-mix(in srgb, rgb(var(--barroalto)) 92%, transparent) 100%);
  border:1px solid color-mix(in srgb, rgb(var(--borde)) 70%, transparent);
  box-shadow:0 24px 60px -26px rgba(60,45,25,.45),
             inset 0 1px 0 rgba(255,255,255,.5);
}
/* resplandor cálido tenue detrás del chapulín — SIN cian ni rosa neón */
.tarjeta-marca__resplandor{
  position:absolute; z-index:-1; inset:14% 20% 24%;
  background:radial-gradient(circle at 50% 45%,
    color-mix(in srgb, rgb(var(--ambar)) 16%, transparent) 0%, transparent 68%);
  filter:blur(30px); opacity:.55;
}
/* greca dorada como firma cultural en el borde inferior */
.tarjeta-marca::after{ /* usa --greca-banda, ver sección GRECAS */ }
```

**Sombra del chapulín — 100% neutra, sin glow de color:**
```css
.chapulin{ filter: drop-shadow(0 12px 20px rgba(40,30,15,.22)); }
[data-tema="noche"] .chapulin{ filter: drop-shadow(0 14px 26px rgba(0,0,0,.5)); }
```

---

## COMPONENTES CLAVE

| Clase | Qué es |
|---|---|
| `.btn-neon` | Botón sólido turquesa, texto crema, el principal |
| `.btn-linea` | Botón de contorno |
| `.btn-suave` | Botón terciario, sin fondo |
| `.campo` | Input de formulario |
| `.casilla` | Casilla individual del código de 6 dígitos |
| `.pestana-auth` | Pestañas Regístrate / Iniciar sesión |
| `.tarjeta-auth` | Tarjeta contenedora del formulario de acceso |
| `.zona-chat-marco` | Marco de la ventana de chat |
| `.lateral-chat` | Barra lateral de conversaciones |
| `.barra-chat` | Barra superior/inferior del chat |
| `.panel-suave` | Paneles de contenido |
| `.menu-movil` | Menú desplegable móvil |
| `.grabado` | Fondo con greca sutil + degradado |
| `.revela` | Animación de aparición al hacer scroll |
| `.ico-tema` | Botón sol/luna del cambio de tema |

**IMPORTANTE:** las clases `.lateral-chat`, `.barra-chat`, `.panel-suave`,
`.zona-chat-marco`, `.menu-movil`, `.marco-video` existen **porque las
utilidades de Tailwind con opacidad (`bg-obsidiana/50`) horneaban colores
fijos y no seguían el tema**. Fue el BUG-08. No las reemplaces por utilidades.

---

## ANIMACIONES

```css
@keyframes gira      /* girador de carga */
@keyframes respira   /* fondo que late suavemente */
```
- Transición de tema: `.4s ease` en `background-color` y `color`
- `.revela`: `opacity 0→1` + `translateY(22px)→0` en `.8s ease`
- El chapulín conserva su animación de vuelo/lucecita — **elemento protegido,
  el autor pidió repetidamente que nunca se elimine ni se sustituya**
