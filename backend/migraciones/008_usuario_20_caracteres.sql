-- ============================================================================
-- 008 · USUARIO: 5 A 20 CARACTERES, CON PUNTO PERMITIDO
-- ----------------------------------------------------------------------------
-- La 007 dejó el formato NUEVO en 5-15 caracteres, sin punto (solo letras,
-- números, «_» y «-»). Se amplía a 5-20 y se permite el punto, para que
-- coincida con las mismas reglas de caracteres que ya se usan en la
-- contraseña (letras, números, «.», «-» y «_»).
--
-- El formato VIEJO (001: 4-20, con punto, exige una mayúscula) ya cabía
-- dentro de este rango, así que el CHECK de la tabla queda igual de
-- permisivo que antes — solo cambia lo que usuario_libre/fijar_usuario
-- aceptan AL CREAR uno nuevo.
-- ============================================================================

ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS usuario_formato;
ALTER TABLE perfiles ADD CONSTRAINT usuario_formato CHECK (
    usuario IS NULL
    OR usuario ~ '^[A-Za-z0-9_.-]{5,20}$'                         -- formato nuevo (008)
    OR (usuario ~ '^[A-Za-z0-9._-]{4,20}$' AND usuario ~ '[A-Z]')  -- formato viejo (001)
) NOT VALID;

CREATE OR REPLACE FUNCTION usuario_libre(nombre TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF nombre IS NULL OR nombre !~ '^[A-Za-z0-9_.-]{5,20}$' THEN
        RETURN FALSE;
    END IF;
    RETURN NOT EXISTS (
        SELECT 1 FROM perfiles WHERE lower(usuario) = lower(nombre)
    );
END $$;

CREATE OR REPLACE FUNCTION fijar_usuario(nombre TEXT) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    quien UUID := auth.uid();
BEGIN
    IF quien IS NULL THEN
        RETURN json_build_object('ok', false, 'motivo', 'sin_sesion');
    END IF;
    IF nombre IS NULL OR nombre !~ '^[A-Za-z0-9_.-]{5,20}$' THEN
        RETURN json_build_object('ok', false, 'motivo', 'formato');
    END IF;

    INSERT INTO perfiles (id, usuario) VALUES (quien, nombre)
    ON CONFLICT (id) DO UPDATE SET usuario = EXCLUDED.usuario, actualizado = now();

    RETURN json_build_object('ok', true, 'usuario', nombre);
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('ok', false, 'motivo', 'ocupado');
END $$;
-- correo_por_usuario (007) no cambia: su formato «4-20 con punto» ya cubre
-- este rango nuevo, así que sigue encontrando cuentas de cualquier formato.
