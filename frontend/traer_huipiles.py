#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OaxIntegra IA — Traer fotos reales de huipiles oaxaqueños
==========================================================
Baja fotos de Wikimedia Commons, COMPRUEBA que sean de Oaxaca y con licencia
libre, las achica y las mete en la app.

POR QUÉ ESTE SCRIPT EXISTE
--------------------------
Claude no pudo hacerlo solo: la máquina donde corre tiene bloqueado el acceso
a Wikimedia, así que no podía ni descargar ni verificar nada. Y escribir a
ciegas una dirección de internet que no puede comprobar es justo lo que NO se
debe hacer en una página que habla de autenticidad cultural.

Tu computadora sí tiene internet, así que este script hace el trabajo por ti
y, sobre todo, VERIFICA antes de usar nada:

  1. Pregunta a Wikimedia Commons por los datos reales de cada foto
  2. Comprueba que la licencia permita usarla
  3. Comprueba que la descripción mencione Oaxaca o un pueblo oaxaqueño
  4. Si algo no cuadra, la RECHAZA y te lo dice
  5. Achica la foto y la guarda en assets/huipiles/
  6. Escribe los créditos en assets/huipiles/CREDITOS.md

USO:
    pip install pillow requests
    cd frontend
    python3 traer_huipiles.py

Después:
    python3 build.py

Si quieres usar TUS PROPIAS FOTOS (que serán más auténticas que cualquier
banco de imágenes), no necesitas este script: mira docs/09-fotos-huipiles.md
"""

import json
import os
import re
import sys
import urllib.parse
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
DESTINO = os.path.join(RAIZ, 'assets', 'huipiles')

API = 'https://commons.wikimedia.org/w/api.php'
AGENTE = 'OaxIntegraIA/1.0 (proyecto educativo Oaxaca; contacto via GitHub)'

# ---------------------------------------------------------------------------
# CANDIDATAS
# Salieron de buscar en Wikimedia Commons. NO se dan por buenas: el script
# comprueba cada una antes de usarla. Si alguna ya no existe o cambió de
# licencia, se rechaza sola y te avisa.
#
# Para agregar más: entra a https://commons.wikimedia.org/wiki/Category:Huipil
# y pega aquí el nombre exacto del archivo.
# ---------------------------------------------------------------------------
CANDIDATAS = [
    'File:Huipil oaxaqueño.jpg',
    'File:Huipil de Santa María Huazolotitlán.jpg',
    'File:Huipiles de Oaxaca.jpg',
    'File:Huipil de Yalalag.jpg',
    'File:Textiles de Oaxaca.jpg',
]

# Palabras que confirman que la pieza es de Oaxaca. Si la descripción no
# menciona ninguna, la foto se descarta: mejor ninguna que una equivocada.
SEÑAS_OAXACA = [
    'oaxaca', 'oaxaqu',
    'yalalag', 'huazolotitlán', 'huazolotitlan', 'juchitán', 'juchitan',
    'tehuantepec', 'mitla', 'teotitlán', 'teotitlan', 'coyotepec',
    'jamiltepec', 'pinotepa', 'amuzgo', 'mixe', 'zapotec', 'mixtec',
    'triqui', 'chinantec', 'istmo', 'tuxtepec',
]

# Licencias que permiten usar la foto dando crédito.
LICENCIAS_OK = ['cc-by', 'cc-by-sa', 'cc-zero', 'cc0', 'public domain', 'pd-']


def pedir(url):
    req = urllib.request.Request(url, headers={'User-Agent': AGENTE})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def datos_de(titulo):
    """Pregunta a Commons por autor, licencia, descripción y URL real."""
    params = {
        'action': 'query', 'format': 'json', 'titles': titulo,
        'prop': 'imageinfo',
        'iiprop': 'url|extmetadata|size',
        'iiurlwidth': '1200',
    }
    crudo = pedir(API + '?' + urllib.parse.urlencode(params))
    paginas = json.loads(crudo).get('query', {}).get('pages', {})
    for _, pag in paginas.items():
        if 'missing' in pag:
            return None
        info = (pag.get('imageinfo') or [{}])[0]
        meta = info.get('extmetadata', {})

        def campo(k):
            v = meta.get(k, {}).get('value', '')
            return re.sub(r'<[^>]+>', '', str(v)).strip()

        return {
            'titulo': pag.get('title', titulo),
            'descripcion': campo('ImageDescription'),
            'autor': campo('Artist') or 'Autor no indicado',
            'licencia': campo('LicenseShortName') or campo('License'),
            'licencia_url': meta.get('LicenseUrl', {}).get('value', ''),
            'pagina': info.get('descriptionurl', ''),
            'url': info.get('thumburl') or info.get('url'),
        }
    return None


def es_de_oaxaca(d):
    texto = (d['descripcion'] + ' ' + d['titulo']).lower()
    hallada = [s for s in SEÑAS_OAXACA if s in texto]
    return hallada


def licencia_libre(d):
    lic = (d['licencia'] + ' ' + d['licencia_url']).lower()
    return any(ok in lic for ok in LICENCIAS_OK)


def achicar(bytes_img, salida, lado=1000):
    try:
        from PIL import Image
    except ImportError:
        print('  ✗ Falta Pillow.  Instálalo con:  pip install pillow')
        sys.exit(1)
    import io as _io
    im = Image.open(_io.BytesIO(bytes_img))
    if im.mode not in ('RGB', 'L'):
        im = im.convert('RGB')
    an, al = im.size
    if max(an, al) > lado:
        f = lado / max(an, al)
        im = im.resize((int(an * f), int(al * f)), Image.LANCZOS)
    im.save(salida, 'WEBP', quality=80, method=6)
    return os.path.getsize(salida)


def main():
    os.makedirs(DESTINO, exist_ok=True)
    print('')
    print('  Buscando fotos de huipiles oaxaqueños en Wikimedia Commons')
    print('  ─────────────────────────────────────────────────────────')
    print('')

    aceptadas = []
    for titulo in CANDIDATAS:
        print('· ' + titulo)
        try:
            d = datos_de(titulo)
        except Exception as e:
            print('    ✗ no la pude consultar: %s' % e)
            continue

        if not d or not d.get('url'):
            print('    ✗ no existe en Commons (o cambió de nombre)')
            continue

        señas = es_de_oaxaca(d)
        if not señas:
            print('    ✗ RECHAZADA: la descripción no confirma que sea de Oaxaca')
            print('      (dice: "%s")' % d['descripcion'][:90])
            continue

        if not licencia_libre(d):
            print('    ✗ RECHAZADA: licencia no permitida (%s)' % (d['licencia'] or '¿?'))
            continue

        try:
            crudo = pedir(d['url'])
        except Exception as e:
            print('    ✗ no la pude descargar: %s' % e)
            continue

        n = len(aceptadas) + 1
        archivo = os.path.join(DESTINO, 'huipil_%02d.webp' % n)
        peso = achicar(crudo, archivo)

        print('    ✓ ACEPTADA — confirma Oaxaca por: %s' % ', '.join(señas[:3]))
        print('      autor: %s' % d['autor'][:60])
        print('      licencia: %s' % d['licencia'])
        print('      guardada: %s (%d KB)' % (os.path.basename(archivo), peso / 1024))
        d['archivo'] = os.path.basename(archivo)
        aceptadas.append(d)

        if len(aceptadas) >= 3:
            break

    print('')
    if not aceptadas:
        print('  ✗ No pasó ninguna foto los filtros.')
        print('    La app se queda con los patrones dibujados, que funcionan bien.')
        print('    Puedes poner las tuyas: mira docs/09-fotos-huipiles.md')
        return

    # créditos: obligatorio con estas licencias
    with open(os.path.join(DESTINO, 'CREDITOS.md'), 'w', encoding='utf-8') as f:
        f.write('# Créditos de las fotos\n\n')
        f.write('Las licencias de estas fotos **exigen dar crédito**. ')
        f.write('No borres este archivo ni quites los créditos de la página.\n\n')
        for d in aceptadas:
            f.write('## %s\n\n' % d['archivo'])
            f.write('- **Título:** %s\n' % d['titulo'])
            f.write('- **Autor:** %s\n' % d['autor'])
            f.write('- **Licencia:** %s\n' % d['licencia'])
            if d['licencia_url']:
                f.write('- **Texto de la licencia:** %s\n' % d['licencia_url'])
            f.write('- **Página original:** %s\n' % d['pagina'])
            if d['descripcion']:
                f.write('- **Descripción:** %s\n' % d['descripcion'][:300])
            f.write('\n')

    print('  ✓ %d foto(s) verificadas y guardadas en assets/huipiles/' % len(aceptadas))
    print('  ✓ Créditos en assets/huipiles/CREDITOS.md')
    print('')
    print('  AHORA FALTA UN PASO A MANO:')
    print('  Abre frontend/app.src.html, busca "lienzo-huipil" y cambia el src')
    print('  de cada <img> por el marcador correspondiente:')
    for i, d in enumerate(aceptadas, 1):
        print('      foto %d  →  __HUIPIL_%d__' % (i, i))
    print('')
    print('  Luego:  python3 build.py')
    print('  (build.py ya sabe cambiar esos marcadores por la foto)')
    print('')


if __name__ == '__main__':
    main()
