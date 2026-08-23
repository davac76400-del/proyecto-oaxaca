# El Chapulín Alebrije — activo visual protegido

## Regla número uno

**El chapulín NUNCA se sustituye por un emoji, ícono genérico o figura
placeholder.** Es la identidad de marca. El autor lo ha pedido explícitamente
en casi todas las iteraciones. Si una versión del código lo reemplaza por 🦗
o por un SVG genérico, esa versión está mal.

Conserva siempre su animación de vuelo y su "lucecita".

## Descripción del diseño

Chapulín (saltamontes) tallado estilo **alebrije oaxaqueño**, en 3D:
- Saltando hacia la derecha, en diagonal a ~45°
- Cuerpo base negro mate
- Cubierto de **grecas zapotecas** y punteado fino
- Colores: verde neón, rosa mexicano, naranja, amarillo, turquesa
- Antenas largas curvas con bandas naranja/blanco
- Ojo grande con iris dorado
- Patas traseras con puntas verde limón
- Trazos turquesa fluidos que sugieren movimiento/velocidad
- Acompañado de la sigla **"IA"** en cian en el logotipo

## Las 4 versiones (evolución real)

| Archivo | Qué es | Estado |
|---|---|---|
| `chapulin_01_original.webp` | Render original, 48 KB, **fondo negro sólido incrustado** | histórico |
| `chapulin_02_transparente.webp` | Fondo recortado a transparencia real, 141 KB | intermedio |
| `chapulin_03_realzado.webp` | + nitidez y saturación, 161 KB | intermedio |
| `chapulin_04_suave_ACTUAL.webp` | + fosforescente atenuado, 137 KB | **← la que usa la app** |

## Historia técnica (por qué existen 4 versiones)

### Problema 1: el recuadro negro
La imagen original traía el fondo oscuro **pintado dentro del archivo**.
Sobre el fondo café claro se veía como una foto pegada con un rectángulo negro.

**Intentos fallidos:**
1. Poner un medallón oscuro con borde y greca → seguía siendo un recuadro
2. `mix-blend-mode: screen` sin fondo → sobre claro el chapulín se **borraba**,
   quedaba como fantasma lavado (screen elimina el negro pero también lava los
   tonos medios sobre fondos claros)
3. Halo radial oscuro difuso detrás + screen → el halo **se veía como un
   rectángulo borroso**, seguía arruinando el diseño

**Solución real:** recortar el fondo con Python/PIL, generando transparencia
verdadera por rampa de luminancia. Ver `frontend/procesar_chapulin.py`.
Con eso se pudo eliminar el halo Y el blend mode. El chapulín flota limpio.

### Problema 2: el fosforescente
El autor pidió varias veces quitar el efecto fosforescente. Se quitaron los
`drop-shadow` de color del CSS, pero **seguía viéndose fosforescente**.

**La causa (descubierta tarde):** los trazos cian neón brillantes están
**pintados dentro de la imagen misma**, no eran un efecto CSS. Por eso ninguna
edición de CSS los quitaba.

**Solución:** detectar los píxeles neón por saturación + brillo y desaturarlos
con PIL. Ver `procesar_chapulin.py`, función de atenuación. Resultado:
`chapulin_04_suave_ACTUAL.webp`.

## Cómo se incrusta en la app

Se convierte a base64 y se sustituye el marcador `__CHAPULIN__` (aparece 4
veces en `app.src.html`):
- Cabecera (medallón chico)
- Hero de la página
- Portada de acceso (dentro de `.tarjeta-marca`)
- Pie de página

```python
uri = 'data:image/webp;base64,' + base64.b64encode(open('chapulin_04_suave_ACTUAL.webp','rb').read()).decode()
final = fuente.replace('__CHAPULIN__', uri)
```

**Por qué WebP y no PNG:** el PNG transparente pesaba 518 KB; el WebP con la
misma transparencia pesa 137 KB. Como se incrusta 4 veces en base64, la
diferencia en el archivo final es enorme (2.8 MB vs 0.9 MB).

## CSS actual del chapulín

```css
.medallon-chapulin{
  position:relative; background:transparent; border:0;
  box-shadow:none; padding:0; overflow:visible;
}
.medallon-chapulin::before{ display:none; }  /* halo eliminado */

.chapulin{
  position:relative; z-index:1; display:block;
  filter: drop-shadow(0 12px 20px rgba(40,30,15,.22));  /* sombra NEUTRA */
}
[data-tema="noche"] .chapulin{
  filter: drop-shadow(0 14px 26px rgba(0,0,0,.5));
}
```

## Pendiente sugerido

El autor pidió que se viera "más animado, tipo ilustración, padrísimo".
La vía que queda por explorar: **vectorizar el chapulín a SVG** (con potrace o
redibujándolo), lo que permitiría:
- Animar partes individuales (antenas, patas, alas)
- Peso mínimo
- Nitidez perfecta a cualquier tamaño
- Control total de color por tema
