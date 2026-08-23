# Prompt de arranque para Claude Code

Copia el bloque de abajo y pégalo como primer mensaje en Claude Code, con esta
carpeta abierta.

---

```
Estás tomando un proyecto en curso. Antes de escribir una sola línea, lee
estos archivos en este orden:

1. LEER-PRIMERO.md
2. docs/01-vision-y-alcance.md
3. docs/05-arquitectura-tecnica.md
4. logs/bug-tracker.md          ← el más importante: evita repetir errores
5. logs/historial-iteraciones.md ← cómo trabaja el autor
6. docs/02-design-system.md
7. docs/04-auth-flow.md

EL PROYECTO
OaxIntegra IA: aplicación web de una sola página que ayuda a emprendedores
oaxaqueños tradicionales (artesanos, mezcaleros, cocineros) a usar Inteligencia
Artificial sin tecnicismos. Autor: David Alfredo Romero Rendón, Oaxaca, México.

CÓMO SE CONSTRUYE
- Se edita frontend/app.src.html (fuente maestro)
- Se ejecuta: cd frontend && python3 build.py
- Eso genera dist/OaxIntegra-IA-app.html (archivo único autocontenido)
- NUNCA editar dist/ a mano

REGLAS QUE NO SE ROMPEN
1. El chapulín alebrije es la identidad de marca. Nunca sustituirlo por emoji
   ni figura genérica. Conservar su animación y su lucecita.
2. No eliminar funcionalidad existente al agregar mejoras. Es la preferencia
   más constante del autor.
3. Nada de texto blanco, gris ni de tono claro sobre el fondo claro.
   Excepción: texto crema sobre botón sólido de color.
4. No usar utilidades de Tailwind con opacidad para fondos
   (bg-obsidiana/50) — hornean el color y rompen el tema día/noche.
   Usar las clases propias: .lateral-chat, .barra-chat, .panel-suave, etc.
5. Las variables CSS van en canales RGB (--texto: 36 28 19), no en
   hexadecimal. El config de Tailwind usa rgb(var(--x) / <alpha-value>).
6. JavaScript en ES5 (var, function) por compatibilidad.
7. Español mexicano cálido en toda la interfaz. Cero tecnicismos: nunca
   "prompt", "token", "endpoint". Decir "escríbeme", "tu código", "tu plática".

LA TAREA PRIORITARIA
El chat siempre cae en "modo local": no logra conectar con la IA.
Está documentado en logs/bug-tracker.md → BUG-13, con todo lo ya descartado.

Antes de tocar código, propón esta prueba al autor: subir
dist/OaxIntegra-IA-app.html a Netlify Drop y probarlo desde una URL https://.
Hipótesis fuerte: abrir el archivo con doble clic da origen "null" y muchos
servidores lo rechazan aunque tengan CORS con *. Si funciona desde https://,
el problema nunca fue n8n.

Si aún falla, la recomendación es abandonar n8n para el chat y usar llamada
directa a la IA: ya está escrito en backend/ai_service_directo.js (navegador)
y backend/ai_service_directo.py (backend FastAPI). El autor además quiere
cambiar de Gemini a otro proveedor.

CÓMO TRABAJAR CON EL AUTOR
- Habla en español, claro y sin tecnicismos.
- Describe los problemas por cómo se ven, no por su causa técnica.
- Verifica visualmente antes de decir que algo quedó: renderiza y revisa.
- Al terminar, entrégale el archivo listo para descargar.
- Si algo no se puede hacer, dilo con honestidad y ofrece la alternativa.

Empieza confirmando que leíste la documentación y dime tu plan para BUG-13.
```

---

## Comandos útiles

```bash
# instalar dependencias (primera vez)
cd frontend && npm install
pip install pillow numpy          # para procesar el chapulín

# construir la app
cd frontend && python3 build.py

# reprocesar la imagen del chapulín
cd frontend && python3 procesar_chapulin.py

# levantar el backend de IA (alternativa a n8n)
cd backend
pip install fastapi uvicorn httpx
export OPENAI_API_KEY="sk-..."
uvicorn ai_service_directo:app --port 8000

# servir la app en local con https-like (evita el problema de file://)
cd dist && python3 -m http.server 3000
# luego abrir http://localhost:3000/OaxIntegra-IA-app.html
```

> El último comando es importante: **probar con `python3 -m http.server`
> en lugar de doble clic** puede resolver el BUG-13 por sí solo, porque cambia
> el origen de `null` a `http://localhost`.
