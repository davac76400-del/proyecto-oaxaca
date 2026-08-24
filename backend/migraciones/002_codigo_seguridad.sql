-- ============================================================================
-- 002 · CÓDIGO DE SEGURIDAD
-- ----------------------------------------------------------------------------
-- Una segunda forma de entrar, para cuando el correo no llega: un código de
-- 8 números que la persona elige dentro de la app.
--
-- DÓNDE SE GUARDA EL CÓDIGO: en ningún lado de aquí.
--
-- Se guarda como la CONTRASEÑA del usuario en auth.users, que Supabase cifra
-- con bcrypt y nunca devuelve. Se pensó en guardarlo en esta tabla y se
-- descartó por tres motivos, todos de peso:
--
--   1. Habría que cifrarlo a mano, y hacer eso bien es difícil de verdad.
--   2. Para comprobarlo al entrar habría que poder leerlo antes de tener
--      sesión — o sea, abrir un agujero en las políticas de seguridad.
--   3. Supabase ya trae limitación de intentos en su login. Escribiéndolo a
--      mano habría que rehacer eso también, y peor.
--
-- Aquí solo se guarda SI la persona tiene código o no, para que la app sepa
-- qué enseñarle. Nunca el código.
-- ============================================================================

ALTER TABLE perfiles
    ADD COLUMN IF NOT EXISTS tiene_codigo   BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS codigo_puesto  TIMESTAMPTZ;


-- ---------------------------------------------------------------------------
-- Dejar constancia de que ya puso su código
-- ---------------------------------------------------------------------------
-- La app llama a esto DESPUÉS de que Supabase acepte la contraseña nueva.
-- Si el orden se invirtiera, un fallo dejaría el perfil diciendo que hay
-- código cuando no lo hay, y la persona vería una salida que no funciona.
CREATE OR REPLACE FUNCTION marcar_codigo(puesto BOOLEAN) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    quien UUID := auth.uid();
BEGIN
    IF quien IS NULL THEN
        RETURN json_build_object('ok', false, 'motivo', 'sin_sesion');
    END IF;

    INSERT INTO perfiles (id, tiene_codigo, codigo_puesto)
    VALUES (quien, puesto, CASE WHEN puesto THEN now() ELSE NULL END)
    ON CONFLICT (id) DO UPDATE
        SET tiene_codigo  = EXCLUDED.tiene_codigo,
            codigo_puesto = EXCLUDED.codigo_puesto,
            actualizado   = now();

    RETURN json_build_object('ok', true, 'tiene_codigo', puesto);
END $$;

REVOKE ALL ON FUNCTION marcar_codigo(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION marcar_codigo(BOOLEAN) TO authenticated;


-- ---------------------------------------------------------------------------
-- Nota sobre lo que NO se puede hacer desde aquí
-- ---------------------------------------------------------------------------
-- No hay forma de preguntar «¿cuál es el código de fulano?», ni desde esta
-- base ni desde la app. Eso es a propósito: si se pudiera leer, dejaría de
-- servir para lo que sirve. Si alguien lo olvida, entra con el código del
-- correo y pone uno nuevo.
