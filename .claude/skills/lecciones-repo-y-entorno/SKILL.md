---
name: lecciones-repo-y-entorno
description: Errores de proceso que cometimos trabajando con Claude Code en la nube con varios repositorios, llaves y archivos de otros proyectos, y cómo evitarlos. Úsala al empezar una tarea en un repo con carpetas duplicadas, antes de crear/sobrescribir archivos de configuración, al manejar llaves y al guiar paso a paso a David en paneles web.
---

# Lecciones de repo y entorno

## 1. Saber en qué repo estás ANTES de editar
Había dos copias de la app:
- `/home/user/voz-propia` → repo `davac76400-del/voz-propia`, rama `main`. **Es la verdadera** (tiene el código nuevo de cuentas).
- `/home/user/proyecto-oaxaca/voz-propia` → copia vieja dentro del repo `proyecto-oaxaca` (rama `claude/cool-euler-x6kh3f`).
Síntomas del error: `grep` encontraba una cosa en un lado y no en otro; `auth.ts` aparecía con contraseñas locales cuando ya existía la versión OTP.
Antes de tocar nada: `pwd`, `git remote -v`, `git branch --show-current`, `git status --short`.
Si el usuario solo puede ver `proyecto-oaxaca` en GitHub, lo que subas al otro repo **no lo verá ahí**: darle el contenido en el chat o copiarlo a su repo.

## 2. No crear archivos "por si acaso"
Se creó `.env.local` en el repo equivocado; no hacía falta porque la app ya tenía la URL y la llave publicable escritas en `src/core/supabase.ts`. Primero buscar dónde se configura (`grep -rn SUPABASE_URL`) y borrar lo que uno creó de más.

## 3. No sobrescribir archivos de otro proyecto
`proyecto-oaxaca/supabase/plantillas/` ya tenía plantillas de OaxIntegra IA (`enlace-magico.html` generado por `generar.mjs`). Se copió encima la de Voz Propia y hubo que revertir (`git revert`) y moverla a `voz-propia/supabase/plantillas/`.
Antes de copiar: `ls` del destino y `git log -- ruta`. Cada proyecto, su carpeta.

## 4. Llaves y secretos
- Una API key de Resend se pegó en el chat → revocarla y crear otra **de inmediato**; avisar antes de seguir.
- Pedir al usuario que copie solo lo público (`sb_publishable_...`, Project URL). Nunca pedir `sb_secret_...`, `service_role` ni contraseñas de aplicación.
- **No transcribir IDs desde una captura**: el Project ID real era `jgddkuelxaunustjcqfe` y se leyó mal en una captura. Tomarlo del código (`supabase.ts`) o de `list_projects`.

## 5. Guiar a David en paneles web
- Frases cortas, una acción por mensaje, con la ruta exacta («Authentication → Emails → Templates → Confirm signup»).
- Si una captura muestra la pantalla equivocada, decir exactamente a qué dar clic (hay que repetirlo sin molestarse).
- Cuando algo se debe pegar, darlo **en el chat** en un bloque de código; no remitir a un archivo del repo que quizá no pueda abrir (se probó: GitHub dio 404 porque el archivo estaba en otro repo).
- Pedir que pruebe con un correo real y que mande captura si falla.

## 6. Verificar con datos, no con suposiciones
- «No se pudo enviar» → mirar `auth_logs` con `query_logs`; la causa (dominio no verificado) estaba ahí.
- Tras cambios en base de datos: `get_advisors(security)` y cerrar `anon` donde no corresponda.
- Mensajes de error al usuario: la causa real y qué hacer, no «inténtalo en unos minutos».

## 7. Git en este entorno
- Commits con el pie de atribución indicado por el sistema; mensajes cortos que expliquen el porqué.
- Rama designada de la sesión: `claude/cool-euler-x6kh3f` en `proyecto-oaxaca`. El repo `voz-propia` trabaja sobre `main`.
- `pkill -f` y `kill $(pgrep -f ...)` matan la propia shell (el patrón coincide con su línea de comando); **se repitió dos veces**. Guardar el PID al lanzar (`cmd & echo $! > pid`) y `kill $(cat pid)`.
- Desde el entorno remoto los sitios de SOLACYT (infomatrix.lat), bit.ly e idoc.pub están bloqueados (EGRESS_BLOCKED): pedir al usuario el PDF o el texto en vez de insistir.
- Revisar `git status` después de `git add` amplio y no subir `.env`.

## 8. Preferencias del usuario
Español, frases cortas, directo. Windows + Claude Code, Supabase, Cursor, n8n, Python. No quiere gastar dinero: buscar opción gratis primero (así se llegó a Gmail SMTP). Quiere que se ejecute, revise y corrija sin tanto preguntar.
