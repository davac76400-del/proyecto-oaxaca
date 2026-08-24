-- ============================================================================
-- 004 · CERRAR LOS PERMISOS DE anon
-- ----------------------------------------------------------------------------
-- Salió al revisar la base ya aplicada, no leyendo el código.
--
-- Supabase le da EXECUTE a `anon` y `authenticated`, POR DEFECTO, a toda
-- función nueva del esquema public. Un `REVOKE ALL ... FROM PUBLIC` no lo
-- deshace: el permiso de anon es directo, no heredado de PUBLIC. Así que las
-- migraciones 001 y 003, que hacían justo eso, se quedaron cortas.
--
-- Resultado: fijar_usuario, fijar_giro y fijar_recuperacion se podían llamar
-- SIN sesión. No era explotable —las tres comprueban auth.uid() y devuelven
-- 'sin_sesion'— pero una puerta que no debería existir se cierra igual.
--
-- Las dos que SÍ necesitan anon, y por qué:
--   usuario_libre      · al registrarse se elige el usuario ANTES de tener cuenta
--   usar_recuperacion  · la usa justo quien no puede entrar
-- ============================================================================

REVOKE EXECUTE ON FUNCTION fijar_usuario(TEXT)       FROM anon;
REVOKE EXECUTE ON FUNCTION fijar_giro(TEXT, TEXT)    FROM anon;
REVOKE EXECUTE ON FUNCTION fijar_recuperacion(TEXT)  FROM anon;

-- Esta es de disparador: no la llama nadie a mano.
REVOKE EXECUTE ON FUNCTION crear_perfil() FROM anon, authenticated;
