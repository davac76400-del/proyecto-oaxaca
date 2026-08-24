-- ============================================================================
-- 003 · CÓDIGO DE RECUPERACIÓN
-- ----------------------------------------------------------------------------
-- CAMBIA LOS PAPELES respecto a la 002. Ahora:
--
--   CÓDIGO DE ENTRADA   ·  8 números que llegan por correo al registrarse.
--                          Se guardan como la contraseña de Supabase (bcrypt).
--                          Es con lo que se entra siempre.
--
--   CÓDIGO DE RECUPERACIÓN  ·  8 números que la persona elige DENTRO de la app.
--                          Se guardan aquí, cifrados. Solo sirven para pedir
--                          un código de entrada nuevo cuando se perdió el otro.
--
-- Por qué la recuperación no puede ser también «contraseña»: en Supabase cada
-- cuenta tiene UNA sola. Esa la ocupa el código de entrada. Así que este se
-- guarda aquí, cifrado con bcrypt del propio Postgres (pgcrypto), y se
-- comprueba dentro de una función que nadie puede leer por fuera.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE perfiles
    ADD COLUMN IF NOT EXISTS recuperacion_hash   TEXT,
    ADD COLUMN IF NOT EXISTS recuperacion_puesta TIMESTAMPTZ,
    -- Contra la fuerza bruta: si alguien prueba y prueba, se le cierra la
    -- puerta un rato. Sin esto, cien millones de combinaciones se acaban
    -- probando solas.
    ADD COLUMN IF NOT EXISTS recuperacion_fallos INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS recuperacion_espera TIMESTAMPTZ;

-- La columna de la 002 pasa a significar «tiene código de recuperación».
ALTER TABLE perfiles RENAME COLUMN tiene_codigo TO tiene_recuperacion;
ALTER TABLE perfiles RENAME COLUMN codigo_puesto TO recuperacion_fecha;

DROP FUNCTION IF EXISTS marcar_codigo(BOOLEAN);


-- ---------------------------------------------------------------------------
-- Guardar el código de recuperación
-- ---------------------------------------------------------------------------
-- Se cifra aquí dentro. Ni la app ni yo lo llegamos a ver guardado: entra en
-- claro, sale un hash de bcrypt, y lo que queda en la tabla es el hash.
CREATE OR REPLACE FUNCTION fijar_recuperacion(codigo TEXT) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    quien UUID := auth.uid();
BEGIN
    IF quien IS NULL THEN
        RETURN json_build_object('ok', false, 'motivo', 'sin_sesion');
    END IF;
    IF codigo IS NULL OR codigo !~ '^[0-9]{8}$' THEN
        RETURN json_build_object('ok', false, 'motivo', 'formato');
    END IF;

    INSERT INTO perfiles (id, recuperacion_hash, tiene_recuperacion,
                          recuperacion_fecha, recuperacion_puesta,
                          recuperacion_fallos, recuperacion_espera)
    VALUES (quien, crypt(codigo, gen_salt('bf')), TRUE, now(), now(), 0, NULL)
    ON CONFLICT (id) DO UPDATE
        SET recuperacion_hash   = EXCLUDED.recuperacion_hash,
            tiene_recuperacion  = TRUE,
            recuperacion_fecha  = now(),
            recuperacion_puesta = now(),
            recuperacion_fallos = 0,
            recuperacion_espera = NULL,
            actualizado         = now();

    RETURN json_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION fijar_recuperacion(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fijar_recuperacion(TEXT) TO authenticated;


-- ---------------------------------------------------------------------------
-- Comprobar el código de recuperación  ·  SIN sesión
-- ---------------------------------------------------------------------------
-- Aquí llega quien perdió su código de entrada, así que todavía no tiene
-- sesión. Por eso es la única función que puede llamar `anon`, y por eso
-- lleva freno de intentos.
--
-- Lo que devuelve es a propósito escueto: sí o no, y cuánto falta para poder
-- reintentar. NUNCA dice si ese correo existe — si lo dijera, serviría para
-- averiguar quién está registrado.
CREATE OR REPLACE FUNCTION usar_recuperacion(correo TEXT, codigo TEXT) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth AS $$
DECLARE
    fila     perfiles%ROWTYPE;
    quien    UUID;
    faltan   INTEGER;
BEGIN
    IF codigo IS NULL OR codigo !~ '^[0-9]{8}$' THEN
        RETURN json_build_object('ok', false, 'motivo', 'no_coincide');
    END IF;

    SELECT id INTO quien FROM auth.users
     WHERE lower(email) = lower(trim(correo)) LIMIT 1;

    -- Correo desconocido: se contesta lo mismo que con un código malo, y se
    -- tarda parecido. Así no se puede usar esto para descubrir cuentas.
    IF quien IS NULL THEN
        PERFORM pg_sleep(0.4);
        RETURN json_build_object('ok', false, 'motivo', 'no_coincide');
    END IF;

    SELECT * INTO fila FROM perfiles WHERE id = quien;

    IF fila.recuperacion_espera IS NOT NULL AND fila.recuperacion_espera > now() THEN
        faltan := CEIL(EXTRACT(EPOCH FROM (fila.recuperacion_espera - now())) / 60.0);
        RETURN json_build_object('ok', false, 'motivo', 'espera', 'minutos', faltan);
    END IF;

    IF fila.recuperacion_hash IS NULL THEN
        PERFORM pg_sleep(0.4);
        RETURN json_build_object('ok', false, 'motivo', 'no_coincide');
    END IF;

    IF fila.recuperacion_hash = crypt(codigo, fila.recuperacion_hash) THEN
        UPDATE perfiles
           SET recuperacion_fallos = 0, recuperacion_espera = NULL
         WHERE id = quien;
        RETURN json_build_object('ok', true);
    END IF;

    -- Falló. A los 5 intentos, quince minutos de espera.
    UPDATE perfiles
       SET recuperacion_fallos = fila.recuperacion_fallos + 1,
           recuperacion_espera = CASE
               WHEN fila.recuperacion_fallos + 1 >= 5 THEN now() + interval '15 minutes'
               ELSE recuperacion_espera END
     WHERE id = quien;

    RETURN json_build_object('ok', false, 'motivo', 'no_coincide',
                             'restantes', GREATEST(0, 5 - (fila.recuperacion_fallos + 1)));
END $$;

REVOKE ALL ON FUNCTION usar_recuperacion(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION usar_recuperacion(TEXT, TEXT) TO anon, authenticated;


-- ---------------------------------------------------------------------------
-- Comprobar el usuario TAMBIÉN sin sesión
-- ---------------------------------------------------------------------------
-- Al registrarse se elige el usuario ANTES de tener cuenta, así que hay que
-- poder preguntar si está libre sin sesión. La función ya existe (001) y solo
-- contesta sí o no: nunca dice de quién es ni cuántos hay.
GRANT EXECUTE ON FUNCTION usuario_libre(TEXT) TO anon;


-- ---------------------------------------------------------------------------
-- Lo que NO se puede hacer, y es a propósito
-- ---------------------------------------------------------------------------
--   · Leer el código de recuperación de nadie. Solo se guarda cifrado.
--   · Averiguar si un correo tiene cuenta. usar_recuperacion() contesta igual
--     para un correo que no existe que para un código equivocado.
--   · Probar códigos sin parar. A los 5 fallos, quince minutos de espera.
