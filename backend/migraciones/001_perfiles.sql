-- ============================================================================
-- 001 · PERFILES
-- ----------------------------------------------------------------------------
-- Supabase ya guarda el correo y la fecha de alta en auth.users. Aquí va lo
-- que es de esta app: el usuario que la persona elige, y el giro del negocio.
--
-- El usuario NO es la identidad: la identidad es el correo. El usuario es el
-- nombre con el que la app la saluda y con el que se reconoce. Por eso, si se
-- le olvida, no pierde nada: entra con su correo y ahí lo ve.
-- ============================================================================

CREATE TABLE IF NOT EXISTS perfiles (
    -- El mismo id que en auth.users. Si se borra la cuenta, se borra esto.
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- El usuario que eligió. Único entre todos, sin importar mayúsculas.
    usuario      VARCHAR(20),

    -- Giro del negocio. Puede quedar vacío: se pregunta ya adentro y se
    -- puede decir «ahora no».
    giro         VARCHAR(40),
    giro_texto   VARCHAR(120),

    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado  TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Mismas reglas que valida el navegador: 4 a 20, sin espacios, y al menos
    -- una mayúscula. Se comprueba aquí también porque el navegador se puede
    -- saltar; la base es la única que no miente.
    CONSTRAINT usuario_formato CHECK (
        usuario IS NULL OR (usuario ~ '^[A-Za-z0-9._-]{4,20}$' AND usuario ~ '[A-Z]')
    )
);

-- Único sin distinguir mayúsculas: «MariaTelar» y «mariatelar» son el mismo.
CREATE UNIQUE INDEX IF NOT EXISTS perfiles_usuario_unico
    ON perfiles (lower(usuario)) WHERE usuario IS NOT NULL;

CREATE INDEX IF NOT EXISTS perfiles_giro ON perfiles (giro);


-- ---------------------------------------------------------------------------
-- SEGURIDAD: cada quien ve y toca SOLO lo suyo
-- ---------------------------------------------------------------------------
-- Esto es lo que de verdad protege los datos. La anon key del navegador es
-- pública a propósito; sin estas políticas, cualquiera leería la tabla entera.
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ve su propio perfil"    ON perfiles;
DROP POLICY IF EXISTS "crea su propio perfil"  ON perfiles;
DROP POLICY IF EXISTS "edita su propio perfil" ON perfiles;

CREATE POLICY "ve su propio perfil"    ON perfiles
    FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "crea su propio perfil"  ON perfiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "edita su propio perfil" ON perfiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Nadie puede borrar perfiles desde el navegador: no hay política de DELETE.
-- Para borrar la cuenta se borra el usuario en auth.users y esto cae solo.


-- ---------------------------------------------------------------------------
-- Al darse de alta, el perfil se crea solo (vacío)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION crear_perfil() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO perfiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_crear_perfil ON auth.users;
CREATE TRIGGER trg_crear_perfil
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION crear_perfil();


-- ---------------------------------------------------------------------------
-- ¿Está libre este usuario?
-- ---------------------------------------------------------------------------
-- Hace falta poder preguntarlo ANTES de guardar, para avisar mientras escribe.
-- Pero la tabla no se puede leer (RLS). Esta función mira por dentro y
-- devuelve solo sí o no: nunca dice de quién es, ni cuántos hay, ni nada más.
CREATE OR REPLACE FUNCTION usuario_libre(nombre TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF nombre IS NULL OR nombre !~ '^[A-Za-z0-9._-]{4,20}$' OR nombre !~ '[A-Z]' THEN
        RETURN FALSE;
    END IF;
    RETURN NOT EXISTS (
        SELECT 1 FROM perfiles WHERE lower(usuario) = lower(nombre)
    );
END $$;

REVOKE ALL ON FUNCTION usuario_libre(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION usuario_libre(TEXT) TO authenticated;


-- ---------------------------------------------------------------------------
-- Guardar el usuario, comprobando que siga libre
-- ---------------------------------------------------------------------------
-- Entre que se comprueba y se guarda, otro podría tomarlo. Aquí se hace
-- todo de una sola vez, y el índice único es la última palabra.
CREATE OR REPLACE FUNCTION fijar_usuario(nombre TEXT) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    quien UUID := auth.uid();
BEGIN
    IF quien IS NULL THEN
        RETURN json_build_object('ok', false, 'motivo', 'sin_sesion');
    END IF;
    IF nombre IS NULL OR nombre !~ '^[A-Za-z0-9._-]{4,20}$' OR nombre !~ '[A-Z]' THEN
        RETURN json_build_object('ok', false, 'motivo', 'formato');
    END IF;

    INSERT INTO perfiles (id, usuario) VALUES (quien, nombre)
    ON CONFLICT (id) DO UPDATE SET usuario = EXCLUDED.usuario, actualizado = now();

    RETURN json_build_object('ok', true, 'usuario', nombre);
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('ok', false, 'motivo', 'ocupado');
END $$;

REVOKE ALL ON FUNCTION fijar_usuario(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fijar_usuario(TEXT) TO authenticated;


-- ---------------------------------------------------------------------------
-- Guardar el giro
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fijar_giro(clave TEXT, texto TEXT) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    quien UUID := auth.uid();
BEGIN
    IF quien IS NULL THEN
        RETURN json_build_object('ok', false, 'motivo', 'sin_sesion');
    END IF;
    INSERT INTO perfiles (id, giro, giro_texto) VALUES (quien, clave, texto)
    ON CONFLICT (id) DO UPDATE
        SET giro = EXCLUDED.giro, giro_texto = EXCLUDED.giro_texto, actualizado = now();
    RETURN json_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION fijar_giro(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fijar_giro(TEXT, TEXT) TO authenticated;
