-- ============================================================================
-- 007 · ENTRAR CON USUARIO Y CONTRASEÑA
-- ----------------------------------------------------------------------------
-- CAMBIA LA FORMA DE ENTRAR. Hasta la 003, el "código de 8 números" que
-- llegaba por correo SE QUEDABA FIJO como la contraseña de la cuenta, y con
-- correo + ese código se entraba siempre.
--
-- A partir de aquí:
--   · El correo y el código que llega siguen existiendo, pero solo sirven
--     para COMPROBAR que ese correo es tuyo (al registrarte, y también al
--     recuperar tu contraseña si la olvidas).
--   · Después de comprobarlo, la persona ELIGE su propio usuario y su propia
--     contraseña (letras, números y algunos signos). Con ESO entra siempre,
--     no con el código.
--   · La contraseña la sigue guardando Supabase, cifrada con bcrypt, igual
--     que antes — eso no cambió. Lo que cambia es quién la elige: antes la
--     ponía el código del correo, ahora la persona.
--
-- QUÉ NO SE TOCA: el código de recuperación de la migración 003 (los 8
-- números que algunas cuentas ya tienen guardados para pedir un código de
-- entrada nuevo). Ya no lo usa el sitio, pero la columna y su función se
-- quedan tal cual: borrarlas sería tirar datos de cuentas reales por una
-- característica que ya nadie llama. Si algún día estorban, se retiran en
-- otra migración aparte, a propósito.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1 · NUEVO FORMATO DEL USUARIO
-- ----------------------------------------------------------------------------
-- Antes: 4 a 20 caracteres, letras/números/`._-`, con al menos una MAYÚSCULA.
-- Ahora, para USUARIOS NUEVOS: 5 a 15 caracteres, letras/números/`_-` (sin
-- punto), sin exigir mayúscula. Eso lo imponen usuario_libre/fijar_usuario
-- más abajo, no este CHECK.
--
-- OJO — por qué el CHECK de la tabla acepta LOS DOS formatos, no solo el
-- nuevo: un CHECK de Postgres se vuelve a evaluar en CUALQUIER UPDATE de la
-- fila, toque o no la columna `usuario` (por ejemplo, al cambiar el giro del
-- negocio con fijar_giro). Si aquí solo se aceptara el formato nuevo, una
-- cuenta vieja con un usuario como «Maria.Rodriguez» dejaría de poder
-- guardar CUALQUIER cambio en su fila — no solo el usuario — en cuanto esta
-- migración se aplique. Aceptando los dos formatos, una fila vieja sigue
-- pasando el CHECK para siempre; lo único que cambia es qué formato se
-- ACEPTA AL CREAR uno nuevo (eso lo filtran las funciones, no la tabla).
-- ---------------------------------------------------------------------------
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS usuario_formato;
ALTER TABLE perfiles ADD CONSTRAINT usuario_formato CHECK (
    usuario IS NULL
    OR usuario ~ '^[A-Za-z0-9_-]{5,15}$'                          -- formato nuevo
    OR (usuario ~ '^[A-Za-z0-9._-]{4,20}$' AND usuario ~ '[A-Z]')  -- formato viejo (001)
) NOT VALID;
-- NOT VALID: no revisa las filas que ya existen, solo las que se inserten o
-- actualicen de aquí en adelante — pero como el CHECK ya cubre ambos
-- formatos, cualquier fila vieja legítima lo sigue cumpliendo de todas
-- formas. Se deja NOT VALID igual, por prudencia: no hay forma de revisar
-- aquí datos reales que no están a la vista.


CREATE OR REPLACE FUNCTION usuario_libre(nombre TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF nombre IS NULL OR nombre !~ '^[A-Za-z0-9_-]{5,15}$' THEN
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
    IF nombre IS NULL OR nombre !~ '^[A-Za-z0-9_-]{5,15}$' THEN
        RETURN json_build_object('ok', false, 'motivo', 'formato');
    END IF;

    INSERT INTO perfiles (id, usuario) VALUES (quien, nombre)
    ON CONFLICT (id) DO UPDATE SET usuario = EXCLUDED.usuario, actualizado = now();

    RETURN json_build_object('ok', true, 'usuario', nombre);
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('ok', false, 'motivo', 'ocupado');
END $$;
-- Los GRANT/REVOKE de estas dos funciones no cambian: siguen exactamente
-- como quedaron en 001 y 004 (usuario_libre para anon y authenticated,
-- fijar_usuario solo para authenticated). CREATE OR REPLACE no toca permisos.


-- ---------------------------------------------------------------------------
-- 2 · DE USUARIO A CORREO, PARA PODER ENTRAR
-- ----------------------------------------------------------------------------
-- Supabase entra con correo + contraseña; no sabe qué es un "usuario". Para
-- que la persona pueda escribir SU usuario en vez de su correo, la app
-- necesita preguntar antes "¿cuál es el correo de este usuario?" — y esa
-- pregunta hay que poder hacerla SIN sesión, porque justo se hace para
-- conseguirla.
--
-- Por diseño, esto SÍ entrega un dato (el correo) a quien solo dio un
-- usuario que acertó. Es el mismo trato que cualquier sitio con "entra con
-- tu usuario": Twitter, GitHub, el banco. No hay forma de resolverlo sin
-- decir "sí, esta cuenta existe, y su correo es éste" de alguna manera.
-- Lo que sí se hizo, como en usar_recuperacion (003):
--   · Usuario que no existe o con formato inválido → se tarda parecido que
--     uno que sí existe (pg_sleep en los dos caminos, éxito y fallo), para
--     que la demora no sirva de reloj.
--   · Nunca se listan usuarios ni se dice "cuántos hay parecidos".
--   · El verdadero freno contra probar contraseñas a lo tonto lo pone
--     Supabase Auth por su cuenta en /auth/v1/token: eso no cambia aquí.
--
-- OJO — el formato que se acepta AQUÍ es el viejo (4-20, admite el punto),
-- no el nuevo (5-15): esta función es para ENTRAR, y tiene que encontrar
-- también a las cuentas de antes de esta migración. El formato nuevo, más
-- angosto, siempre cabe dentro de este, así que sirve para los dos.
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

    IF correo IS NULL THEN
        PERFORM pg_sleep(0.3);
        RETURN json_build_object('ok', false);
    END IF;

    PERFORM pg_sleep(0.3);
    RETURN json_build_object('ok', true, 'correo', correo);
END $$;

REVOKE ALL ON FUNCTION correo_por_usuario(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION correo_por_usuario(TEXT) TO anon, authenticated;


-- ---------------------------------------------------------------------------
-- Lo que NO cambia
-- ---------------------------------------------------------------------------
--   · El correo sigue viviendo solo en auth.users, no se duplica aquí.
--   · La contraseña la sigue guardando y cifrando Supabase; esta base nunca
--     la ve ni la toca, elegida por el código o por la persona.
--   · El código que llega por correo (registro y "olvidé mi contraseña")
--     sigue siendo el /auth/v1/otp y /auth/v1/verify de siempre: nada nuevo
--     que configurar en el panel de Supabase.
