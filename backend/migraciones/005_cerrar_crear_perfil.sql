-- ============================================================================
-- 005 · CERRAR crear_perfil() DEL TODO
-- ----------------------------------------------------------------------------
-- Después de la 004, crear_perfil() SEGUÍA siendo ejecutable por anon. El
-- permiso no le venía de anon directamente, sino de PUBLIC — que es otro
-- camino distinto, y por eso el REVOKE anterior no la tocó.
--
-- Es una función de disparador (devuelve TRIGGER) y PostgREST no puede
-- llamarla, así que el riesgo real era ninguno. Pero si no la usa nadie a
-- mano, que no la pueda usar nadie a mano.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION crear_perfil() FROM PUBLIC;
