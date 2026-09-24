---
name: supabase-permisos-seguros
description: Endurece una base de Supabase - RLS en cada tabla, funciones RPC con SECURITY DEFINER bien cerradas, quitar el EXECUTE que Supabase da por defecto a anon, y migraciones idempotentes numeradas. Úsala al crear tablas/funciones en Supabase o al auditar la seguridad de un proyecto existente.
---

# Permisos seguros en Supabase

Lecciones de las migraciones 001-009 de OaxIntegra IA. Varias salieron **revisando la base ya aplicada**, no leyendo el código.

## Trampa principal: anon puede ejecutar todo
Supabase da `EXECUTE` a `anon` y `authenticated` **por defecto** en toda función nueva de `public`. `REVOKE ALL ... FROM PUBLIC` **no lo quita** (el permiso es directo).

```sql
REVOKE EXECUTE ON FUNCTION mi_funcion(TEXT) FROM anon;
-- funciones de trigger: nadie las llama a mano
REVOKE EXECUTE ON FUNCTION crear_perfil() FROM anon, authenticated;
```

Dejar a `anon` solo lo que se usa sin sesión (ej. `usuario_libre` al registrarse, `usar_recuperacion`) y documentar por qué.

## RLS
```sql
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cada quien lo suyo" ON perfiles
  FOR ALL USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
```
- `(select auth.uid())` en vez de `auth.uid()`: se evalúa una vez por consulta, no por fila (mucho más rápido).
- Toda tabla en `public` con RLS encendido, aunque "nadie la use".

## Funciones RPC
```sql
CREATE OR REPLACE FUNCTION fijar_usuario(p TEXT) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN 'sin_sesion'; END IF;
  -- validar p: largo, caracteres permitidos
  ...
END $$;
```
- `SET search_path` siempre con `SECURITY DEFINER`.
- Validar entradas dentro de la función; no confiar en el frontend.
- Regresar códigos claros (`'sin_sesion'`, `'ocupado'`, `'ok'`) para que la UI dé mensajes honestos.

## Migraciones
- Archivos numerados `001_...sql`, `002_...sql`. Nunca editar una ya aplicada: crear la siguiente.
- **Idempotentes**: `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS` antes de `CREATE POLICY`, `ADD COLUMN IF NOT EXISTS`.
- Encabezado en cada archivo: qué arregla y por qué.

## Auditoría rápida
1. Supabase MCP / dashboard → **Advisors** (security y performance).
2. SQL:
```sql
-- tablas sin RLS
select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;
-- funciones que anon puede ejecutar
select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
```
3. Navegador: solo anon key (ver skill `build-html-seguro`).
