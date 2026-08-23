# OaxIntegra IA — Exportación total del proyecto

**Autor:** David Alfredo Romero Rendón (Oaxaca, México)
**Fecha de exportación:** 22 de agosto de 2026
**Estado:** funcional, con 1 problema abierto (conexión n8n — ver `logs/bug-tracker.md`)

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
│   └── 05-arquitectura-tecnica.md
│
├── backend/                         ← IA, webhooks, base de datos
│   ├── n8n-webhooks.md              ← URLs reales y configuración
│   ├── ai_service_directo.js        ← alternativa SIN n8n (recomendada)
│   ├── ai_service_directo.py        ← lo mismo en Python
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
Nunca edites `dist/`. Edita `frontend/app.src.html` y reconstruye.

---

## Lo único que NO funciona hoy

La conexión con la IA real (n8n) cae en "modo local". Está documentado a fondo
en `logs/bug-tracker.md` sección BUG-12, con las tres causas posibles y la
solución recomendada: **abandonar n8n y llamar a la IA directamente**
(código listo en `backend/ai_service_directo.js`).
