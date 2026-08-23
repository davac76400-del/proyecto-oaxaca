# Las fotos de huipiles

## Por qué no las puse yo

Me pediste que sacara las fotos de Google, verificara que fueran de verdad
oaxaqueñas y las pusiera. **Lo intenté y no pude**, por dos razones:

1. **La máquina donde corro tiene bloqueado el acceso a los sitios de
   imágenes.** Puedo *buscar* y ver los títulos, pero al intentar abrir la
   página de una foto para leer su autor, su licencia y su descripción, el
   servidor me responde: `commons.wikimedia.org está bloqueado`. Sin eso no
   puedo verificar nada ni descargar nada.

2. **Escribir una dirección que no puedo comprobar sería justo el error que
   quieres evitar.** Una foto mal etiquetada —un huipil de Chiapas o de
   Guatemala presentado como oaxaqueño— en la sección que habla de
   autenticidad cultural es peor que no poner ninguna foto.

Así que hice otra cosa: **te dejé el trabajo hecho para que se ejecute desde
tu computadora**, que sí tiene internet.

---

## Opción 1 · El script que verifica y descarga (5 minutos)

```bash
pip install pillow requests
cd frontend
python3 traer_huipiles.py
```

**Qué hace ese script, foto por foto:**

1. Le pregunta a Wikimedia Commons los datos reales de la imagen
2. **Comprueba que la descripción mencione Oaxaca** o un pueblo oaxaqueño
   (Yalálag, Huazolotitlán, Juchitán, Tehuantepec, Mitla, Teotitlán,
   Coyotepec, Pinotepa, Jamiltepec…) o un pueblo originario de allá
   (zapoteco, mixteco, amuzgo, mixe, triqui, chinanteco)
3. **Comprueba que la licencia permita usarla** (Creative Commons o dominio
   público)
4. Si algo no cuadra, **la rechaza y te dice por qué**
5. Achica la foto y la guarda en `assets/huipiles/`
6. Escribe los créditos —autor, licencia, página original— en
   `assets/huipiles/CREDITOS.md`

Se ve así:

```
· File:Huipil de Santa María Huazolotitlán.jpg
    ✓ ACEPTADA — confirma Oaxaca por: huazolotitlán, oaxaca
      autor: Fulano de Tal
      licencia: CC BY-SA 4.0
      guardada: huipil_01.webp (86 KB)

· File:Huipil mexicano.jpg
    ✗ RECHAZADA: la descripción no confirma que sea de Oaxaca
```

**Después de correrlo**, abre `frontend/app.src.html`, busca `lienzo-huipil`
y cambia el `src` de cada `<img>` por `__HUIPIL_1__`, `__HUIPIL_2__` y
`__HUIPIL_3__`. Luego:

```bash
python3 build.py
```

`build.py` ya sabe cambiar esos marcadores por la foto, y **se niega a
construir** si faltan los créditos: esas licencias exigen dar crédito.

---

## Opción 2 · Tus propias fotos ⭐ la que yo elegiría

Tú estás **en Oaxaca**. Una foto tuya de un huipil real, de una artesana que
conoces, con su nombre y su pueblo, vale más que cualquier cosa de un banco de
imágenes. Y no tiene ningún problema de licencia porque es tuya.

1. Guarda tus fotos como `assets/huipiles/huipil_01.webp`, `huipil_02.webp` y
   `huipil_03.webp` (o `.jpg`, y le cambias el nombre en `build.py`)
2. Escribe a mano `assets/huipiles/CREDITOS.md` con quién hizo la pieza y de
   dónde es
3. Pon los marcadores `__HUIPIL_1__` … en `app.src.html` como arriba
4. `python3 build.py`

**Consejo de encuadre:** que se vea el canesú (la parte bordada del pecho) de
frente, con luz de día y fondo liso. Es lo que hace reconocible un huipil.

---

## Mientras tanto, qué se ve

La sección **no está rota ni vacía**. Muestra patrones de textil dibujados en
SVG —bandas con rombos, greca de Mitla en escalera, hileras de punto de cruz—
con los colores del proyecto.

Son **patrones, no fotos**, y no pretenden pasar por fotografías. Pesan 2 KB
cada uno, cargan al instante y se ven bien en los dos temas. La sección
funciona completa; las fotos la mejoran cuando las pongas.

---

## Si quieres agregar más candidatas al script

Entra a **https://commons.wikimedia.org/wiki/Category:Huipil**, busca fotos
que digan Oaxaca en su descripción, y agrega el nombre exacto del archivo a la
lista `CANDIDATAS` en `frontend/traer_huipiles.py`. El script las verifica
igual que a las demás.

Otras categorías que valen la pena:

- `Category:Textiles of Oaxaca`
- `Category:Traditional clothing of Mexico`
- `Category:Zapotec culture`

---

## Una nota sobre respeto

Los diseños de los huipiles no son adorno: **identifican al pueblo que los
teje**. Un huipil de Yalálag no es igual a uno de Pinotepa, y confundirlos es
una falta de respeto para quien lo hizo.

Por eso el script guarda el pueblo en los créditos y por eso rechaza las fotos
que no dicen de dónde son. Si pones las tuyas, apunta el pueblo y el nombre de
la artesana. Es lo justo y además le da más valor a tu página.
