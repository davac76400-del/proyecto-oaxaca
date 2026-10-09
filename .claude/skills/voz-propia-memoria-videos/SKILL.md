---
name: voz-propia-memoria-videos
description: Memoria de los videos del programador de Voz Propia (Supabase) que nunca se borra y permite recuperar lo borrado, guardia contra migraciones peligrosas y cómo diagnosticar «se borraron mis videos» (casi siempre es una sesión sin permiso o una dirección vieja). Úsala al tocar programmer_videos, shared_phrases, migraciones SQL, el panel de programador o cuando David diga que desaparecieron videos.
---

# Videos del programador: nunca se pierden

Repo `davac76400-del/voz-propia` (rama `main`, carpeta `/home/user/voz-propia`), proyecto Supabase `jgddkuelxaunustjcqfe`.

## Primero, ¿de verdad se borraron?
La base responde **lista vacía, no error**, cuando la sesión no es de programador (RLS). Dos veces pareció «se borraron todos mis videos»: era una dirección vieja de Vercel (`voz-propia-<hash>-davrore2011.vercel.app` sirve para siempre el build de ese momento, con la compuerta vieja del lado del cliente) abierta sin sesión de programador. Verificar con `select count(*) from programmer_videos` y `query_logs` (no hubo `DELETE`). La app oficial es `https://voz-propia-gilt.vercel.app`; la contraseña de programador la comprueba el servidor (`functions/programador`). El panel ahora dice «Tus videos no se ven en esta sesión» con botón para entrar.

## Cómo está protegido (migraciones 004 y 005 en `supabase/migraciones/`)
- `memoria_videos` / `memoria_palabras`: cada alta, cambio y baja de `programmer_videos` / `shared_phrases` se copia (disparadores `SECURITY DEFINER`: `memoria_alta`, `memoria_cambio`, `memoria_baja`, `memoria_palabras_cambio`). La memoria **no se puede borrar, vaciar ni cambiar** (`lip_points`, `text_inicial`… quedan como entraron); `TRUNCATE` bloqueado en videos, carpetas, palabras. Solo leen los programadores (RLS `soy_programador()`).
- Borrar = `DELETE` normal (única función de la app: `deleteClips` en `supabase.ts`, que antes comprueba la sesión); la base copia el video antes de quitarlo. Se recupera con `recuperar_videos(ids)` (mismo número, recrea la carpeta; sin ids = todo) o `recuperar_palabra(llave)`; en la app: botón **Memoria**, «Deshacer» al borrar y «Guardar respaldo» (`.json`).
- `publishPhrase` ya no despublica una palabra si sus videos existen pero no se pueden leer, y exige sesión de programador.
- `scripts/guard-migrations.mjs` corre en `npm run build` (por lo tanto en Vercel): detiene el build si una migración tiene `DELETE FROM`, `TRUNCATE`, `DROP TABLE/SCHEMA`, quitar columnas, apagar disparadores/seguridad, o si el código borra videos fuera de `deleteClips` o escribe en la memoria. Permiso a propósito: línea `-- guardia: permitir-destruccion <motivo>` en la migración.

## Limitaciones del MCP de Supabase en la nube (no rodearlas)
- `apply_migration` / `execute_sql` con `DELETE`, `DROP POLICY`… esperan una confirmación del usuario que una sesión remota no puede dar → «timed out after 60s» y **no se ejecuta nada**. Probado también con un `DELETE` dentro del cuerpo de una función. No esconder la palabra con concatenaciones. Se diseñó con sentencias que solo crean (`create or replace trigger`, políticas condicionales, funciones sin `DELETE`).
- No se puede probar un `DELETE` real por SQL: se probó la memoria con un bloque `DO` que termina en `raise exception` (todo se revierte) simulando un video «borrado» con una fila en `memoria_videos` con `borrado_en`, y con `set local role authenticated` + `request.jwt.claims` para probar los permisos.
- Los hosts de Supabase y de vercel.app están bloqueados desde el entorno (proxy 403): la verificación del despliegue es por `api.github.com/repos/<repo>/commits/<sha>/status` (Vercel «success»).
- `programmer_videos.id` es `GENERATED ALWAYS`: al reinsertar se usa `OVERRIDING SYSTEM VALUE`.

## Pruebas
`scratchpad/e2e/memoria.cjs` (Playwright, base simulada con estado: borrar → Deshacer → Memoria → respaldo → sin permiso), `smoke.cjs`, `csp.cjs`, `static.cjs` (servidor estático con los encabezados de `vercel.json`).
