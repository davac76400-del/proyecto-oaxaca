-- ============================================================================
-- 009 · EL ACCESO COMPLETO, DE UNA SOLA PASADA
-- ----------------------------------------------------------------------------
-- POR QUÉ EXISTE ESTA MIGRACIÓN
--
-- Las migraciones 001 a 008 se fueron aplicando a mano, una por una, en el
-- panel de Supabase. Con ese método no hay forma de saber —desde el código—
-- cuáles llegaron de verdad a la base y cuáles se quedaron a medias. Y un
-- hueco en particular tumba TODO el inicio de sesión sin decir por qué:
--
--   · correo_por_usuario SOLO se crea en la 007. La app la llama SIEMPRE al
--     entrar (Supabase entra con correo, no con usuario: hay que traducir uno
--     al otro). Si la 007 no llegó, la función no existe, PostgREST contesta
--     404, y la pantalla dice «Ese usuario no existe» aunque sí exista.
--   · La 008 rehízo usuario_libre y fijar_usuario, pero CREATE OR REPLACE no
--     toca permisos. Si alguna de las dos se creó por primera vez en un orden
--     distinto al previsto, sus permisos quedaron en el default de Supabase,
--     no en el que este proyecto quiere.
--
-- Así que esta migración deja el acceso COMPLETO y CORRECTO sin importar
-- qué se aplicó antes: rehace las tres funciones y, sobre todo, fija los
-- permisos de forma EXPLÍCITA (GRANT y REVOKE), que es lo que ninguna
-- migración anterior podía garantizar por sí sola.
--
-- Es idempotente: se puede volver a correr cuantas veces se quiera.
--
-- REGLAS DE ACCESO QUE QUEDAN FIJADAS AQUÍ
--   Usuario     · 5 a 20 caracteres. Letras, números, «_», «-» y «.».
--                 Único sin distinguir mayúsculas (índice de la 001).
--   Contraseña  · la revisa el navegador y la guarda Supabase cifrada;
--                 esta base nunca la ve. (5+, una mayúscula, una minúscula,
--                 y solo letras, números, «_», «-» y «.»)
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1 · QUE NO PUEDA HABER DOS USUARIOS IGUALES
-- ----------------------------------------------------------------------------
-- Viene de la 001, pero se repite aquí por lo mismo de arriba: si la 001 se
-- aplicó a medias, este índice es lo único que impide que dos personas se
-- queden con el mismo usuario. Va sobre lower(usuario) para que «MariaTelar»
-- y «mariatelar» cuenten como el mismo. El WHERE deja fuera las filas sin
-- usuario todavía (cuenta a medio registrar), que pueden ser varias.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS perfiles_usuario_unico
    ON perfiles (lower(usuario)) WHERE usuario IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 2 · EL FORMATO QUE ACEPTA LA TABLA
-- ----------------------------------------------------------------------------
-- Acepta los dos formatos a propósito, igual que la 007 y la 008: un CHECK se
-- vuelve a evaluar en CUALQUIER UPDATE de la fila (por ejemplo al cambiar el
-- giro del negocio), así que si aquí solo cupiera el formato nuevo, una cuenta
-- vieja con un usuario como «Maria.Rodriguez» no podría volver a guardar nada
-- de su perfil. Qué formato se acepta AL CREAR uno nuevo lo deciden las
-- funciones de abajo, no este CHECK.
-- ---------------------------------------------------------------------------
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS usuario_formato;
ALTER TABLE perfiles ADD CONSTRAINT usuario_formato CHECK (
    usuario IS NULL
    OR usuario ~ '^[A-Za-z0-9_.-]{5,20}$'                          -- formato de hoy
    OR (usuario ~ '^[A-Za-z0-9._-]{4,20}$' AND usuario ~ '[A-Z]')   -- formato viejo (001)
) NOT VALID;


-- ---------------------------------------------------------------------------
-- 3 · ¿ESTÁ LIBRE ESTE USUARIO?  ·  se llama SIN sesión
-- ----------------------------------------------------------------------------
-- La app la usa mientras la persona escribe su usuario, en el paso 3 del
-- registro — es decir, antes de que la cuenta exista. Por eso anon la
-- necesita.
--
-- Devuelve un JSON, no un booleano (la 007 y la 008 devolvían BOOLEAN). El
-- motivo: un FALSE pelón no distingue «ya lo tiene alguien» de «ese texto no
-- cumple el formato», y la app acababa diciendo «ya lo tiene alguien» a quien
-- solo había escrito 4 letras. Con {ok, libre, motivo} la pantalla puede
-- decir la verdad. El nombre de la función no cambia, así que la app vieja
-- que esperaba un booleano sigue recibiendo algo "verdadero" cuando está
-- libre.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS usuario_libre(TEXT);
CREATE FUNCTION usuario_libre(nombre TEXT) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF nombre IS NULL OR nombre !~ '^[A-Za-z0-9_.-]{5,20}$' THEN
        RETURN json_build_object('ok', true, 'libre', false, 'motivo', 'formato');
    END IF;

    IF EXISTS (SELECT 1 FROM perfiles WHERE lower(usuario) = lower(nombre)) THEN
        RETURN json_build_object('ok', true, 'libre', false, 'motivo', 'ocupado');
    END IF;

    RETURN json_build_object('ok', true, 'libre', true);
END $$;

REVOKE ALL ON FUNCTION usuario_libre(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION usuario_libre(TEXT) TO anon, authenticated;


-- ---------------------------------------------------------------------------
-- 4 · GUARDAR EL USUARIO ELEGIDO  ·  exige sesión
-- ----------------------------------------------------------------------------
-- Solo authenticated: quien la llama ya comprobó su correo con el código, así
-- que tiene sesión. anon queda fuera (lo mismo que hizo la 004).
--
-- El «ocupado» se resuelve de dos maneras a propósito: se comprueba antes
-- (mensaje limpio) Y se atrapa la unique_violation (por si dos personas
-- mandan el mismo usuario en el mismo instante — entre la comprobación y el
-- INSERT hay unos microsegundos en los que las dos creen que está libre, y el
-- índice único es el único que puede decidir de verdad).
-- ---------------------------------------------------------------------------
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

    IF EXISTS (
        SELECT 1 FROM perfiles
         WHERE lower(usuario) = lower(nombre) AND id <> quien
    ) THEN
        RETURN json_build_object('ok', false, 'motivo', 'ocupado');
    END IF;

    INSERT INTO perfiles (id, usuario) VALUES (quien, nombre)
    ON CONFLICT (id) DO UPDATE SET usuario = EXCLUDED.usuario, actualizado = now();

    RETURN json_build_object('ok', true, 'usuario', nombre);
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('ok', false, 'motivo', 'ocupado');
    WHEN check_violation THEN
        RETURN json_build_object('ok', false, 'motivo', 'formato');
END $$;

REVOKE ALL ON FUNCTION fijar_usuario(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION fijar_usuario(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION fijar_usuario(TEXT) TO authenticated;


-- ---------------------------------------------------------------------------
-- 5 · DE USUARIO A CORREO, PARA PODER ENTRAR  ·  se llama SIN sesión
-- ----------------------------------------------------------------------------
-- ESTA ES LA QUE FALTABA. Sin ella el inicio de sesión es imposible: Supabase
-- Auth entra con correo + contraseña y no sabe qué es un «usuario», así que la
-- app tiene que preguntar primero cuál es el correo de ese usuario — y esa
-- pregunta se hace justo cuando todavía no hay sesión.
--
-- Sí, esto confirma que una cuenta existe a quien acertó el usuario. Es el
-- mismo trato que cualquier sitio donde se entra con usuario. Lo que se cuida:
--   · Acertar y no acertar tardan parecido (pg_sleep en los dos caminos), para
--     que el tiempo de respuesta no sirva de pista.
--   · Nunca se listan usuarios ni se dice cuántos se parecen.
--   · El freno de verdad contra probar contraseñas a lo tonto lo pone Supabase
--     Auth en /auth/v1/token, y eso no se toca aquí.
--
-- Acepta el formato viejo (4-20, con punto) porque es para ENTRAR y tiene que
-- encontrar también a las cuentas de antes. El formato de hoy cabe dentro.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION correo_por_usuario(nombre TEXT) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
    correo TEXT;
BEGIN
    IF nombre IS NULL OR nombre !~ '^[A-Za-z0-9._-]{4,20}$' THEN
        PERFORM pg_sleep(0.3);
        RETURN json_build_object('ok', false);
    END IF;

    SELECT u.email INTO correo
      FROM perfiles p JOIN auth.users u ON u.id = p.id
     WHERE lower(p.usuario) = lower(nombre)
     LIMIT 1;

    PERFORM pg_sleep(0.3);

    IF correo IS NULL THEN
        RETURN json_build_object('ok', false);
    END IF;

    RETURN json_build_object('ok', true, 'correo', correo);
END $$;

REVOKE ALL ON FUNCTION correo_por_usuario(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION correo_por_usuario(TEXT) TO anon, authenticated;


-- ---------------------------------------------------------------------------
-- 6 · COMPROBAR QUE QUEDÓ BIEN
-- ----------------------------------------------------------------------------
-- Al correr esta migración en el editor SQL de Supabase, esta última consulta
-- imprime una tabla con las tres funciones y quién puede llamarlas. Lo que
-- tiene que salir:
--
--   correo_por_usuario  | anon puede: true  | authenticated puede: true
--   fijar_usuario       | anon puede: false | authenticated puede: true
--   usuario_libre       | anon puede: true  | authenticated puede: true
--
-- Si alguna línea no aparece, esa función no existe y hay que revisar el error
-- de más arriba en el panel.
-- ---------------------------------------------------------------------------
SELECT p.proname                                            AS funcion,
       has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon_puede,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_puede
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('usuario_libre', 'fijar_usuario', 'correo_por_usuario')
 ORDER BY p.proname;
