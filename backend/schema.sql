-- ============================================================================
-- OaxIntegra IA — Esquema de base de datos
-- ----------------------------------------------------------------------------
-- ESTADO: PROPUESTO. La identidad ya NO lo es: eso lo resuelve Supabase.
--
-- Quién es cada quien lo lleva Supabase en su tabla auth.users, que ya
-- existe en tu proyecto y guarda el correo. Aquí NO se guardan contraseñas,
-- ni códigos, ni teléfonos: no hace falta ninguno de los tres.
--
-- Lo de abajo es para cuando quieras que las conversaciones dejen de vivir
-- solo en el navegador y sigan a la persona de un teléfono a otro.
--
-- Dialecto: PostgreSQL. Pensado para Supabase (pégalo en SQL Editor).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- USUARIOS
-- Refleja exactamente los campos del registro actual de la app.
-- ---------------------------------------------------------------------------
-- Supabase ya guarda el correo y la fecha de alta en auth.users.
-- Aquí solo va lo que es de esta app y que allá no cabe.
CREATE TABLE perfiles (
    -- El mismo id que en auth.users: uno a uno. Si se borra la cuenta,
    -- se borra el perfil con ella.
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Giro del negocio. Puede estar vacío: se pregunta ya adentro, y quien
    -- no quiera contestar entra igual.
    giro        VARCHAR(40),
    giro_texto  VARCHAR(120),

    tema        VARCHAR(10) DEFAULT 'dia' CHECK (tema IN ('dia','noche')),

    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_perfiles_giro ON perfiles(giro);

-- Cada quien ve y toca SOLO lo suyo. Esto es lo que de verdad protege los
-- datos, no esconder la anon key (que es pública a propósito).
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cada quien ve su perfil"     ON perfiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "cada quien crea el suyo"     ON perfiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "cada quien edita el suyo"    ON perfiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Al darse de alta, se le crea el perfil solo.
CREATE OR REPLACE FUNCTION crear_perfil() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO perfiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_crear_perfil
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION crear_perfil();


-- ---------------------------------------------------------------------------
-- CONVERSACIONES  (las "pláticas" del chat)
-- ---------------------------------------------------------------------------
CREATE TABLE conversaciones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    titulo          VARCHAR(120) NOT NULL DEFAULT 'Nueva plática',
    creada_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizada_en  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    archivada       BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_conv_usuario ON conversaciones(usuario_id, actualizada_en DESC);


-- ---------------------------------------------------------------------------
-- MENSAJES
-- ---------------------------------------------------------------------------
CREATE TABLE mensajes (
    id              BIGSERIAL PRIMARY KEY,
    conversacion_id UUID NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,

    rol             VARCHAR(10) NOT NULL CHECK (rol IN ('usuario','asistente')),
    contenido       TEXT        NOT NULL,

    -- 'llama' | 'gemini' | 'local'  → para medir cuántas veces cae el respaldo
    origen          VARCHAR(20) DEFAULT 'local',

    -- Si el mensaje trae tarjeta de publicación, se guarda su estructura
    tarjeta         JSONB,

    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_msg_conv ON mensajes(conversacion_id, creado_en);


-- ---------------------------------------------------------------------------
-- PUBLICACIONES GUARDADAS  ("Mis publicaciones")
-- ---------------------------------------------------------------------------
CREATE TABLE publicaciones_guardadas (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id   UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    cuerpo       TEXT NOT NULL,
    etiquetas    TEXT[],
    guardada_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pub_usuario ON publicaciones_guardadas(usuario_id, guardada_en DESC);


-- ---------------------------------------------------------------------------
-- BITÁCORA DE USO DE IA  (para conocer costos y detectar fallos)
-- ---------------------------------------------------------------------------
CREATE TABLE uso_ia (
    id           BIGSERIAL PRIMARY KEY,
    usuario_id   UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    proveedor    VARCHAR(30),
    modelo       VARCHAR(60),
    exito        BOOLEAN NOT NULL,
    ms_respuesta INTEGER,
    error        TEXT,
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_uso_fecha ON uso_ia(creado_en DESC);


-- ---------------------------------------------------------------------------
-- Mantener actualizada la fecha de la conversación
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tocar_conversacion() RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversaciones
       SET actualizada_en = now()
     WHERE id = NEW.conversacion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tocar_conversacion
    AFTER INSERT ON mensajes
    FOR EACH ROW EXECUTE FUNCTION tocar_conversacion();


-- ---------------------------------------------------------------------------
-- Catálogo de giros (los que hoy están fijos en el <select> del registro)
-- ---------------------------------------------------------------------------
CREATE TABLE giros (
    clave   VARCHAR(40) PRIMARY KEY,
    nombre  VARCHAR(120) NOT NULL,
    orden   SMALLINT DEFAULT 0
);

INSERT INTO giros (clave, nombre, orden) VALUES
    ('mezcal',    'Mezcal, palenque y bebidas',        1),
    ('textil',    'Textil y telar de pedal',           2),
    ('barro',     'Barro, cerámica y alfarería',       3),
    ('alebrije',  'Alebrijes y talla en madera',       4),
    ('comida',    'Comida y cocina tradicional',       5),
    ('cafe',      'Café y productos del campo',        6),
    ('turismo',   'Turismo y experiencias',            7),
    ('comercio',  'Comercio y abarrotes',              8),
    ('otro',      'Otro emprendimiento',               99);


-- ============================================================================
-- MIGRACIÓN DESDE localStorage
-- ----------------------------------------------------------------------------
-- Script sugerido (ejecutar en la consola del navegador del usuario para
-- exportar sus datos antes de migrar):
--
--   copy(JSON.stringify({
--     cuentas: JSON.parse(localStorage.getItem('oaxintegra.cuentas') || '{}'),
--     sesion:  JSON.parse(localStorage.getItem('oaxintegra.sesion')  || 'null'),
--     tema:    localStorage.getItem('oaxintegra.tema')
--   }, null, 2))
--
-- Eso copia al portapapeles un JSON con todas las cuentas locales, que luego
-- se puede insertar en esta base (recordando hashear los códigos).
-- ============================================================================
