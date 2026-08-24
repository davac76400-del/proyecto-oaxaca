# Las pruebas

Comprueban que se puede entrar con el enlace del correo, de punta a punta, en
un navegador de verdad. **Sin tocar tu Supabase**: `supabase-falso.js` levanta
uno de mentiras que responde a las mismas cuatro llamadas.

## Correrlas

```bash
# Playwright, solo la primera vez
npm install -D playwright && npx playwright install chromium
```

Hay **dos escenarios**, y los dos deben pasar.

### A · Supabase sin configurar (lo que le pasa a quien acaba de empezar)

```bash
node pruebas/supabase-falso.js "una-llave-cualquiera"     # sin variables: 6 dígitos, plantilla de enlace

SUPABASE_URL=http://localhost:54321 SUPABASE_ANON_KEY="una-llave-cualquiera" \
  python3 frontend/build.py
npm start                                                  # otra terminal

node pruebas/sin-configurar.mjs
```

Comprueba que la app funciona **aunque nunca se toque el panel de Supabase**:
el correo trae un enlace, la persona le da clic, y la app le inventa su código.

### B · Supabase ya configurado (8 dígitos y plantilla con el código)

```bash
LARGO_FALSO=8 PLANTILLA_FALSA=codigo node pruebas/supabase-falso.js "una-llave-cualquiera"

SUPABASE_URL=http://localhost:54321 SUPABASE_ANON_KEY="una-llave-cualquiera" \
  python3 frontend/build.py
npm start

ANON_KEY="una-llave-cualquiera" node pruebas/acceso.mjs
```

Al terminar, **vuelve a construir sin esas variables** para que `dist/` no se
quede apuntando al servidor de mentiras:

```bash
python3 frontend/build.py
```

## Qué comprueban (32 cosas)

| Paso | Qué mira |
|---|---|
| 1 | Que la portada tenga **un solo campo**, y que no queden restos del registro viejo |
| 2 | Que un correo mal escrito avise, y no avance |
| 3 | Que pedir el enlace lleve a «revisa tu correo» |
| 4 | Que el «demasiados envíos» se explique en español |
| 5 | Que al volver del enlace entre solo, y que **el token se borre de la barra** |
| 6 | Que el giro se pregunte **ya adentro**, y que se guarde |
| 7 | Que la sesión aguante una recarga |
| 8 | Que un token falso **no** deje entrar, y que limpie lo que había |
| 8b | Que el enlace sirva también con la app ya abierta (BUG-28) |
| 9 | Que se pueda cerrar sesión, también desde el celular (BUG-27) |
| 10 | Que no haya ningún error de JavaScript |

El paso 4 provoca un 429 y el 8 un 401 **a propósito**; por eso el paso 10 los
descarta. También descarta los fallos de `fonts.googleapis.com`, que en algunas
redes está bloqueado y no es cosa de la app.

## Si algo falla

La prueba dice en qué paso y qué esperaba. Casi siempre es una de dos:

- **El servidor de mentiras se quedó con datos de la corrida anterior.**
  No debería: la prueba llama a `/__reset` al empezar. Si sospechas, reinícialo.
- **Estás corriendo `dist/` construido sin las variables de Supabase.**
  Entonces la portada sale con el botón apagado y falla desde el paso 3.
