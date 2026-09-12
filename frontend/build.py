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
import re
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
DESTINO  = os.path.join(RAIZ, 'dist', 'index.html')

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


# ---------------------------------------------------------------------------
# CANDADO DE SEGURIDAD
# ---------------------------------------------------------------------------
# Las llaves de la IA viven en el servidor (.env), nunca en el HTML, porque el
# HTML lo puede leer cualquiera que abra la página. Este candado existe para
# que nadie —ni una IA que edite el archivo, ni un despiste— pueda volver a
# hornear una llave en el entregable: si aparece algo con forma de llave, la
# construcción se detiene.
LLAVES_PROHIBIDAS = [
    (r'sk-or-v1-[A-Za-z0-9_\-]{12,}',  'una llave de OpenRouter'),
    (r'sk-ant-[A-Za-z0-9_\-]{12,}',    'una llave de Anthropic'),
    (r'sk-[A-Za-z0-9]{32,}',           'una llave de OpenAI'),
    (r'AIza[A-Za-z0-9_\-]{30,}',       'una llave de Google/Gemini'),
    # Google también reparte llaves con este otro formato desde AI Studio.
    (r'AQ\.[A-Za-z0-9_\-]{30,}',       'una llave de Google/Gemini'),
    (r'gsk_[A-Za-z0-9]{20,}',          'una llave de Groq'),
    (r'xox[baprs]-[A-Za-z0-9\-]{10,}', 'un token de Slack'),
    (r'ghp_[A-Za-z0-9]{30,}',          'un token de GitHub'),
]


def revisar_service_role(texto, de_donde):
    """La anon key de Supabase SÍ va en el navegador: es pública por diseño.
       La service_role NO: se salta todas las políticas de seguridad y quien
       la tenga puede leer y borrar la base entera. Las dos son JWT y se
       parecen mucho, así que aquí se abre el JWT y se mira el rol de dentro.
       Este es justo el error que hay que hacer imposible."""
    malas = 0
    for m in re.finditer(r'eyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}', texto):
        cuerpo = m.group(0).split('.')[1]
        cuerpo += '=' * (-len(cuerpo) % 4)
        try:
            carga = base64.urlsafe_b64decode(cuerpo).decode('utf-8', 'replace')
        except Exception:
            continue
        if 'service_role' in carga:
            malas += 1
    if malas:
        print('')
        print('✗ ALTO. Hay ' + str(malas) + ' llave(s) service_role de Supabase en ' + de_donde + '.')
        print('')
        print('  Esa llave se salta TODAS las reglas de seguridad. Quien abra la')
        print('  página podría leer y borrar la base de datos completa.')
        print('')
        print('  En el navegador va la ANON KEY, la que dice "anon" en el panel')
        print('  de Supabase (Settings → API). Esa sí es pública y es la correcta.')
        print('')
        print('  Guía: docs/08-acceso-por-codigo.md')
        sys.exit(1)


def revisar_llaves(texto, de_donde):
    """Se detiene si encuentra algo con forma de llave de acceso."""
    hallazgos = []
    for patron, descripcion in LLAVES_PROHIBIDAS:
        for m in re.finditer(patron, texto):
            trozo = m.group(0)
            hallazgos.append((descripcion, trozo[:12] + '…'))
    if hallazgos:
        print('')
        print('✗ ALTO. Encontré ' + str(len(hallazgos)) + ' posible(s) llave(s) en ' + de_donde + ':')
        for descripcion, muestra in hallazgos:
            print('    · ' + descripcion + '  (' + muestra + ')')
        print('')
        print('  Las llaves NUNCA van en el HTML: cualquiera que abra la página')
        print('  puede leerlas. Quítala del código y ponla en el archivo .env')
        print('  (mira .env.example). El servidor es quien debe usarla.')
        print('')
        print('  Guía: docs/06-ia-directa.md')
        sys.exit(1)
    print('  Seguridad: sin llaves en el código ✓')


def resolver_endpoint(src):
    """Permite apuntar el frontend a otro backend sin editar el código:
           OAXINTEGRA_API_URL=https://mi-api.com/api/ia python3 build.py
       Si no se define, se queda con la ruta relativa /api/ia, que funciona
       igual en local, en Netlify y en Vercel."""
    url = os.environ.get('OAXINTEGRA_API_URL', '').strip()
    if not url:
        return src
    if "'" in url or '\\' in url or '\n' in url:
        print('✗ OAXINTEGRA_API_URL tiene caracteres no válidos'); sys.exit(1)
    nuevo, n = re.subn(r"(ENDPOINT:\s*)'[^']*'", lambda m: m.group(1) + "'" + url + "'", src, count=1)
    if n != 1:
        print('✗ No encontré ENDPOINT en CONFIG_IA para sustituirlo'); sys.exit(1)
    print('  Endpoint del asistente: ' + url)
    return nuevo


# Un valor de plantilla se ve así. Misma lista que en revisar.js — si cambias
# una, cambia la otra. (Están en dos lenguajes; no hay forma de compartirla.)
SEÑAS_DE_PLANTILLA = [
    r'^tu[_-]', r'\btu[_-](proyecto|clave|token|id|dominio|correo|llave)',
    r'^your[_-]', r'^pega', r'aqui$', r'^<.*>$',
    r'^(xxx+|placeholder|cambiar|reemplazar|ejemplo|example|todo)$', r'^\.{3,}$',
]
VALORES_DE_PLANTILLA = {
    'https://tu-proyecto.supabase.co', 'https://tudominio.supabase.co',
    'https://tu-dominio-ngrok.ngrok-free.app', 'https://abcdefghijk.supabase.co',
}


def es_de_plantilla(v):
    if not v:
        return False
    if v in VALORES_DE_PLANTILLA:
        return True
    return any(re.search(p, v, re.I) for p in SEÑAS_DE_PLANTILLA)


def limpiar_para_cabecera(v):
    """Un header HTTP solo admite bytes 0x20-0x7E (ASCII imprimible). Si algo
       se coló al copiar/pegar la llave (un salto de línea invisible, una
       comilla "inteligente", etc.), el navegador tira TODO fetch() que use
       ese header con "String contains non ISO-8859-1 code point" — y eso
       tumba el login y el registro completos, sin decir por qué."""
    return re.sub(r'[^\x20-\x7E]', '', v)


def resolver_supabase(src):
    """Mete la dirección y la anon key de Supabase, que se leen del entorno
       o del .env. Sin ellas la app construye igual, pero la portada avisa
       que el acceso no está configurado en vez de fallar en silencio."""
    url_cruda   = (os.environ.get('SUPABASE_URL')      or leer_del_env('SUPABASE_URL')      or '').strip().rstrip('/')
    clave_cruda = (os.environ.get('SUPABASE_ANON_KEY') or leer_del_env('SUPABASE_ANON_KEY') or '').strip()
    url   = limpiar_para_cabecera(url_cruda)
    clave = limpiar_para_cabecera(clave_cruda)
    if url != url_cruda:
        print('  ⚠ SUPABASE_URL traía caracteres raros (invisibles); los quité.')
    if clave != clave_cruda:
        print('  ⚠ SUPABASE_ANON_KEY traía caracteres raros (invisibles); los quité.')

    for valor, nombre in ((url, 'SUPABASE_URL'), (clave, 'SUPABASE_ANON_KEY')):
        if "'" in valor or '\\' in valor or '\n' in valor:
            print('✗ ' + nombre + ' tiene caracteres no válidos'); sys.exit(1)
        if es_de_plantilla(valor):
            print('')
            print('✗ ALTO. ' + nombre + ' trae texto de plantilla, no tu dato real:')
            print('      ' + valor[:60])
            print('')
            print('  Eso es el hueco donde va el dato, no el dato. Un .env de')
            print('  ejemplo se ve IGUAL que uno real; la diferencia es que dice')
            print('  cosas como «tu_clave» en lugar de la clave.')
            print('')
            print('  Para ver qué falta y de dónde sacarlo:   node revisar.js')
            sys.exit(1)

    # El Supabase de la nube es siempre https. El local (supabase start) es
    # http://localhost:54321, y ese sí vale para desarrollo.
    local = url.startswith('http://localhost') or url.startswith('http://127.0.0.1')
    if url and not url.startswith('https://') and not local:
        print('✗ SUPABASE_URL debe empezar con https:// — tal cual viene en el panel')
        print('  (la única excepción es http://localhost para desarrollo)')
        sys.exit(1)

    src = src.replace('__SUPABASE_URL__', url).replace('__SUPABASE_ANON__', clave)

    if url and clave:
        print('  Acceso por enlace: ' + url)
    else:
        print('  Acceso por enlace: SIN CONFIGURAR (falta SUPABASE_URL o SUPABASE_ANON_KEY)')
        print('    La app funciona, pero nadie podrá entrar. Mira docs/08-acceso-por-codigo.md')
    return src


def leer_del_env(nombre):
    """Busca una variable en el .env de la raíz. Sin librerías de fuera."""
    ruta = os.path.join(RAIZ, '.env')
    if not os.path.exists(ruta):
        return ''
    with open(ruta, encoding='utf-8') as f:
        for linea in f:
            linea = linea.strip()
            if not linea or linea.startswith('#') or '=' not in linea:
                continue
            k, v = linea.split('=', 1)
            if k.strip() == nombre:
                return v.strip().strip('"').strip("'")
    return ''


def incrustar_huipiles(src):
    """Si ya bajaste fotos reales con traer_huipiles.py, las mete aquí.
       Si no hay fotos, deja los patrones dibujados que trae la app.
       Los marcadores son __HUIPIL_1__, __HUIPIL_2__, __HUIPIL_3__."""
    carpeta = os.path.join(RAIZ, 'assets', 'huipiles')
    puestas = 0
    for i in (1, 2, 3):
        marcador = '__HUIPIL_%d__' % i
        if marcador not in src:
            continue
        archivo = os.path.join(carpeta, 'huipil_%02d.webp' % i)
        if not os.path.exists(archivo):
            print('  ✗ Falta %s, pero no existe assets/huipiles/huipil_%02d.webp' % (marcador, i))
            print('    Corre primero:  python3 traer_huipiles.py')
            sys.exit(1)
        with open(archivo, 'rb') as f:
            uri = 'data:image/webp;base64,' + base64.b64encode(f.read()).decode()
        src = src.replace(marcador, uri)
        puestas += 1
    if puestas:
        print('  fotos de huipil incrustadas: %d' % puestas)
        creditos = os.path.join(carpeta, 'CREDITOS.md')
        if not os.path.exists(creditos):
            print('  ✗ Faltan los créditos (assets/huipiles/CREDITOS.md).')
            print('    Estas licencias exigen dar crédito. Corre traer_huipiles.py.')
            sys.exit(1)
    return src


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
    # El chapulín se incrusta UNA sola vez (en la variable CSS --chapulin) y
    # se usa en sus 4 lugares con la clase .chapulin-img. Antes iba 4 veces en
    # base64 y por eso el archivo pesaba casi 1 MB. Ver BUG-20.
    n_usos = src.count('chapulin-img')
    print(f'  marcador Tailwind: {n_tw} (esperado 1)')
    print(f'  marcador chapulín: {n_ch} (esperado 1)')
    print(f'  apariciones del chapulín: {n_usos} (esperado 4 + 1 regla CSS)')
    if n_tw != 1:
        print('✗ El marcador /*__TAILWIND__*/ debe aparecer exactamente 1 vez')
        sys.exit(1)
    if n_ch != 1:
        print('✗ El marcador __CHAPULIN__ debe aparecer exactamente 1 vez'); sys.exit(1)
    # BUG-01: el chapulín es la identidad de la marca. Si alguien lo borra de
    # alguno de sus 4 lugares, la construcción se detiene.
    if n_usos < 5:
        print('✗ Falta el chapulín en alguno de sus 4 lugares (clase .chapulin-img).')
        print('  Es la identidad de la marca y no se sustituye. Ver BUG-01.')
        sys.exit(1)

    # Antes de nada: que no haya llaves en el fuente.
    revisar_llaves(src, 'app.src.html')
    src = resolver_endpoint(src)
    src = resolver_supabase(src)
    src = incrustar_huipiles(src)
    # La anon key se acaba de meter: hay que comprobar que sea la buena.
    revisar_service_role(src, 'el HTML ya armado')

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
