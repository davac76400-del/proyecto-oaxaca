#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OaxIntegra IA — Procesamiento del chapulín alebrije
====================================================
Estos son los scripts REALES que resolvieron los dos problemas visuales más
difíciles del proyecto. Documentados para poder repetirlos o ajustarlos.

INSTALAR:  pip install pillow numpy
USO:       python3 procesar_chapulin.py

PROBLEMA 1 — El recuadro negro
    La imagen original trae el fondo oscuro pintado dentro del archivo.
    Sobre el fondo café claro se veía como una foto pegada con un rectángulo.
    Los intentos con CSS (mix-blend-mode, halos, medallones) fallaron todos.
    SOLUCIÓN: recortar el fondo de verdad → paso_1_transparencia()

PROBLEMA 2 — El fosforescente
    El autor pidió muchas veces quitar el efecto fosforescente. Se quitaron los
    drop-shadow de color del CSS y SEGUÍA viéndose fosforescente.
    CAUSA: los trazos cian neón están PINTADOS EN LA IMAGEN, no eran CSS.
    SOLUCIÓN: detectarlos por saturación y desaturarlos → paso_2_suavizar()
"""

import os

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(os.path.dirname(AQUI), 'assets')

ORIGINAL     = os.path.join(ASSETS, 'chapulin_01_original.webp')
TRANSPARENTE = os.path.join(ASSETS, 'chapulin_02_transparente.webp')
REALZADO     = os.path.join(ASSETS, 'chapulin_03_realzado.webp')
SUAVE        = os.path.join(ASSETS, 'chapulin_04_suave_ACTUAL.webp')


# ---------------------------------------------------------------------------
# PASO 1 — Transparencia real
# ---------------------------------------------------------------------------
def paso_1_transparencia(entrada=ORIGINAL, salida=TRANSPARENTE):
    """
    Convierte el fondo oscuro en transparencia usando una rampa por luminancia.

    Por qué una RAMPA y no un umbral duro: un corte seco (todo lo <30 fuera)
    deja bordes dentados y se come los trazos neón tenues. La rampa suaviza
    la transición y conserva el detalle fino del alebrije.
    """
    img = Image.open(entrada).convert('RGBA')
    a = np.array(img).astype(np.int16)
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]

    # Luminancia percibida (el ojo humano ve más el verde)
    lum = 0.299 * r + 0.587 * g + 0.114 * b

    # Rampa: 0% de opacidad por debajo de 18, 100% por encima de 60
    lo, hi = 18.0, 60.0
    na = np.clip((lum - lo) / (hi - lo), 0, 1)

    # Curva 0.7: sube más rápido al principio → conserva trazos tenues
    na = np.power(na, 0.7)
    nuevo_alfa = (na * 255).astype(np.uint8)

    # Respetar transparencia que ya existiera
    if al.max() > 0 and al.min() < 255:
        nuevo_alfa = np.minimum(nuevo_alfa, al.astype(np.uint8))

    out = np.dstack([a[:, :, 0], a[:, :, 1], a[:, :, 2], nuevo_alfa]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(salida, 'WEBP', quality=90, method=6)

    print(f'  paso 1 → {os.path.basename(salida)}')
    print(f'    píxeles vueltos transparentes: {int((nuevo_alfa < 10).sum()):,}'
          f' de {nuevo_alfa.size:,}')


# ---------------------------------------------------------------------------
# PASO 2 (opcional) — Realce
# ---------------------------------------------------------------------------
def paso_2_realzar(entrada=TRANSPARENTE, salida=REALZADO):
    """Nitidez y color más ricos: look de ilustración profesional."""
    img = Image.open(entrada).convert('RGBA')
    r, g, b, a = img.split()
    rgb = Image.merge('RGB', (r, g, b))

    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2.2, percent=115, threshold=2))
    rgb = ImageEnhance.Color(rgb).enhance(1.12)      # saturación
    rgb = ImageEnhance.Contrast(rgb).enhance(1.06)   # contraste
    rgb = ImageEnhance.Brightness(rgb).enhance(1.02) # brillo

    r2, g2, b2 = rgb.split()
    Image.merge('RGBA', (r2, g2, b2, a)).save(salida, 'WEBP', quality=90, method=6)
    print(f'  paso 2 → {os.path.basename(salida)}')


# ---------------------------------------------------------------------------
# PASO 3 — Quitar el fosforescente  ← EL IMPORTANTE
# ---------------------------------------------------------------------------
def paso_3_suavizar(entrada=TRANSPARENTE, salida=SUAVE):
    """
    Atenúa los trazos cian/verde neón que están PINTADOS en la imagen.

    Cómo los detecta:
      · saturación alta (> 0.45)  → color puro, no un tono natural
      · brillo alto (max > 150)   → fosforescente, no sombra
      · rojo bajo respecto a verde (r < g*0.9) → familia cian/verde
      · verde o azul altos        → confirma que es del rango neón

    Qué les hace: los mezcla al 45% con su propio gris, bajando la saturación
    sin cambiarles el tono ni aplanar el dibujo.
    """
    img = Image.open(entrada).convert('RGBA')
    arr = np.array(img).astype(np.float32)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = (mx - mn) / (mx + 1e-3)

    es_neon = (sat > 0.45) & (mx > 150) & (r < g * 0.9) & ((g > 150) | (b > 150))

    gris = 0.299 * r + 0.587 * g + 0.114 * b
    for c, canal in enumerate([r, g, b]):
        arr[:, :, c] = np.where(es_neon, canal * 0.55 + gris * 0.45, canal)

    rgb = Image.fromarray(np.clip(arr[:, :, :3], 0, 255).astype(np.uint8), 'RGB')
    rgb = rgb.filter(ImageFilter.SMOOTH)             # acabado más "ilustrado"
    rgb = ImageEnhance.Color(rgb).enhance(0.92)      # tono armónico
    rgb = ImageEnhance.Contrast(rgb).enhance(1.02)

    r2, g2, b2 = rgb.split()
    out = Image.merge('RGBA', (r2, g2, b2, Image.fromarray(a.astype(np.uint8))))
    out.save(salida, 'WEBP', quality=90, method=6)

    print(f'  paso 3 → {os.path.basename(salida)}')
    print(f'    píxeles neón atenuados: {int(es_neon.sum()):,}')


# ---------------------------------------------------------------------------
# Utilidad: previsualizar sobre el fondo real de la app
# ---------------------------------------------------------------------------
def previsualizar(archivo=SUAVE, salida=None, fondo=(228, 213, 190)):
    """Compone la imagen sobre el café claro de la app para revisarla."""
    chap = Image.open(archivo).convert('RGBA')
    bg = Image.new('RGBA', chap.size, fondo + (255,))
    comp = Image.alpha_composite(bg, chap)
    salida = salida or os.path.join(AQUI, 'preview_chapulin.png')
    comp.convert('RGB').save(salida)
    print(f'  vista previa → {salida}')


if __name__ == '__main__':
    print('Procesando el chapulín…')
    paso_1_transparencia()
    paso_2_realzar()
    paso_3_suavizar()
    previsualizar()
    print('\nListo. La app usa chapulin_04_suave_ACTUAL.webp')
    print('Si quieres el fosforescente de vuelta, cambia build.py para que')
    print('use chapulin_02_transparente.webp en lugar del suave.')
