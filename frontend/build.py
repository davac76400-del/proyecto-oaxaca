#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OaxIntegra IA — Script de construcción
=======================================
Ensambla el archivo único distribuible a partir del fuente maestro.

QUÉ HACE:
  1. Compila Tailwind (solo las clases realmente usadas)
  2. Convierte el chapulín a base64
  3. Sustituye los marcadores /*__TAILWIND__*/ y __CHAPULIN__
  4. Valida que el HTML esté balanceado y que el JS no tenga errores
  5. Escribe dist/OaxIntegra-IA-app.html

USO:
    cd frontend
    npm install          # solo la primera vez
    python3 build.py

REGLA DE ORO: nunca edites dist/. Edita app.src.html y reconstruye.
"""

import base64
import os
import subprocess
import sys
from html.parser import HTMLParser

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)

FUENTE   = os.path.join(AQUI, 'app.src.html')
CONFIG   = os.path.join(AQUI, 'tailwind.config.js')
ENTRADA  = os.path.join(AQUI, 'entrada.css')
SALIDA_CSS = os.path.join(AQUI, 'salida.css')
CHAPULIN = os.path.join(RAIZ, 'assets', 'chapulin_04_suave_ACTUAL.webp')
DESTINO  = os.path.join(RAIZ, 'dist', 'OaxIntegra-IA-app.html')

# Etiquetas que no necesitan cierre
VACIAS = {
    'area','base','br','col','embed','hr','img','input','link','meta','param',
    'source','track','wbr','path','rect','circle','ellipse','stop','use',
    'line','polygon','polyline','option'
}


class Balance(HTMLParser):
    """Verifica que cada etiqueta abierta tenga su cierre."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pila = []

    def handle_starttag(self, tag, attrs):
        if tag not in VACIAS:
            self.pila.append(tag)

    def handle_endtag(self, tag):
        if tag in VACIAS:
            return
        if self.pila:
            self.pila.pop()


def compilar_tailwind():
    print('→ Compilando Tailwind…')
    r = subprocess.run(
        ['npx', 'tailwindcss', '-c', CONFIG, '-i', ENTRADA,
         '-o', SALIDA_CSS, '--minify'],
        cwd=AQUI, capture_output=True, text=True
    )
    if r.returncode != 0:
        print('✗ Falló Tailwind:\n', r.stderr)
        sys.exit(1)
    print('  ok')


def validar_js(html):
    """Extrae el <script> principal y lo pasa por node --check."""
    try:
        js = html.split('<script>\n(function () {', 1)[1].rsplit('})();', 1)[0]
    except IndexError:
        print('  (no encontré el bloque de script principal, omito validación)')
        return
    ruta = os.path.join(AQUI, '_revision.js')
    with open(ruta, 'w', encoding='utf-8') as f:
        f.write('(function(){' + js + '})();')
    r = subprocess.run(['node', '--check', ruta], capture_output=True, text=True)
    os.remove(ruta)
    if r.returncode != 0:
        print('✗ Error de sintaxis en el JavaScript:\n', r.stderr)
        sys.exit(1)
    print('  JavaScript: sintaxis correcta')


def main():
    if not os.path.exists(FUENTE):
        print('✗ No encuentro', FUENTE); sys.exit(1)
    if not os.path.exists(CHAPULIN):
        print('✗ No encuentro el chapulín en', CHAPULIN); sys.exit(1)

    compilar_tailwind()

    print('→ Leyendo piezas…')
    with open(SALIDA_CSS, encoding='utf-8') as f:
        css = f.read()
    with open(CHAPULIN, 'rb') as f:
        uri = 'data:image/webp;base64,' + base64.b64encode(f.read()).decode()
    with open(FUENTE, encoding='utf-8') as f:
        src = f.read()

    # Verificar marcadores antes de sustituir
    n_tw = src.count('/*__TAILWIND__*/')
    n_ch = src.count('__CHAPULIN__')
    print(f'  marcador Tailwind: {n_tw} (esperado 1)')
    print(f'  marcador chapulín: {n_ch} (esperado 4)')
    if n_tw != 1:
        print('✗ El marcador /*__TAILWIND__*/ debe aparecer exactamente 1 vez')
        sys.exit(1)
    if n_ch < 1:
        print('✗ Falta el marcador __CHAPULIN__'); sys.exit(1)

    print('→ Ensamblando…')
    final = src.replace('/*__TAILWIND__*/', css).replace('__CHAPULIN__', uri)

    print('→ Validando…')
    b = Balance(); b.feed(final)
    if b.pila:
        print('✗ HTML desbalanceado, etiquetas sin cerrar:', b.pila[:5])
        sys.exit(1)
    print('  HTML: balanceado')
    validar_js(final)

    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
    with open(DESTINO, 'w', encoding='utf-8') as f:
        f.write(final)

    kb = round(len(final.encode()) / 1024, 1)
    print(f'\n✓ Listo: {DESTINO}  ({kb} KB)')
    print('  Ábrelo con doble clic para probarlo.')


if __name__ == '__main__':
    main()
