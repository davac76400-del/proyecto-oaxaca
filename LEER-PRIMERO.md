# OaxIntegra IA — Exportación total del proyecto

**Autor:** David Alfredo Romero Rendón (Oaxaca, México)
**Fecha de exportación:** 22 de agosto de 2026
**Estado:** funcional. La IA quedó conectada el 23 ago 2026 con un backend
propio (Llama 3.2 → Gemini Flash → motor local) y las llaves fuera del
navegador. Solo falta que el autor pegue sus dos llaves gratuitas en `.env`:
ver `docs/06-ia-directa.md`.

---

## Qué es esto

El paquete completo de **OaxIntegra IA**: una aplicación web de una sola página
que ayuda a emprendedores oaxaqueños tradicionales (artesanos, mezcaleros,
cocineros, comerciantes) a usar Inteligencia Artificial sin tecnicismos.

Todo lo que hay aquí es **real y funcional**, no es plantilla ni ejemplo.

---

## Cómo está organizado

```
OaxIntegra-Export/
├── LEER-PRIMERO.md                  ← este archivo
├── PROMPT-PARA-CLAUDE-CODE.md       ← pégale esto a Claude Code para arrancar
│
├── dist/
│   └── OaxIntegra-IA-app.html       ← LA APP LISTA. Ábrela en el navegador.
│
├── frontend/                        ← código fuente editable
│   ├── app.src.html                 ← FUENTE MAESTRO (se edita aquí)
│   ├── tailwind.config.js
│   ├── entrada.css
│   ├── package.json
│   ├── build.py                     ← script que ensambla dist/
│   └── procesar_chapulin.py         ← script que preparó la imagen
│
├── assets/                          ← las 4 versiones del chapulín
│   ├── chapulin_01_original.webp
│   ├── chapulin_02_transparente.webp
│   ├── chapulin_03_realzado.webp
│   └── chapulin_04_suave_ACTUAL.webp   ← la que usa la app hoy
│
├── docs/                            ← arquitectura, diseño, flujos
│   ├── 01-vision-y-alcance.md
│   ├── 02-design-system.md
│   ├── 03-assets-chapulin.md
│   ├── 04-auth-flow.md
│   ├── 05-arquitectura-tecnica.md
│   ├── 06-ia-directa.md              ← CÓMO ENCENDER LA IA
│   └── 07-herramientas-nativas.md    ← guía, voz, simulador, PDF
│
├── .env.example                     ← plantilla de llaves (cópiala a .env)
├── netlify.toml                     ← configuración de Netlify
├── api/ia.js                        ← el asistente, para Vercel
├── netlify/functions/ia.js          ← el asistente, para Netlify
│
├── backend/                         ← IA, webhooks, base de datos
│   ├── ia-core.js                   ← EL CEREBRO. Aquí viven las llaves.
│   ├── servidor.js                  ← servidor local (app + asistente)
│   ├── n8n-webhooks.md              ← URLs reales y configuración
│   ├── ai_service_directo.js        ← RETIRADO (exponía la llave)
│   ├── ai_service_directo.py        ← alternativa opcional en Python
│   ├── schema.sql                   ← esquema para migrar de localStorage
│   └── n8n-flujo-ejemplo.json       ← flujo n8n importable
│
├── logs/                            ← historia, errores, pendientes
│   ├── bug-tracker.md               ← TODOS los errores y cómo se resolvieron
│   ├── historial-iteraciones.md     ← las 12+ vueltas del proyecto
│   └── pendientes.md                ← lo que falta
│
├── capturas/                        ← cómo se ve hoy
│
└── relacionado/
    ├── HoStudyQuestor.html          ← proyecto hermano (educativo)
    └── hostudyquestor-contexto.md
```

---

## Arranque rápido

**Solo verla funcionando:**
Abre `dist/OaxIntegra-IA-app.html` con doble clic. No necesita servidor,
internet ni instalación. Es un archivo único autocontenido.

**Para modificarla:**
```bash
cd frontend
npm install
python3 build.py        # regenera dist/OaxIntegra-IA-app.html
```

**Para probarla con la IA de verdad:**
```bash
node backend/servidor.js    # y abre http://localhost:3000
```
Nunca edites `dist/`. Edita `frontend/app.src.html` y reconstruye.

---

## La IA: qué falta para encenderla

Ya está conectada, sin n8n: **Llama 3.2 (gratis) → Gemini Flash (gratis) →
motor local**. Las llaves viven en el servidor, nunca en el HTML.

Falta un paso de 5 minutos que solo tú puedes hacer:

```bash
cp .env.example .env        # y pega tus dos llaves gratuitas adentro
cd frontend && python3 build.py && cd ..
node backend/servidor.js    # abre http://localhost:3000
```

Paso a paso en **`docs/06-ia-directa.md`**.

Mientras tanto la app funciona igual, respondiendo con el motor local que trae
adentro, y la insignia del chat dice "Modo local".
