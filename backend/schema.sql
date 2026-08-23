-- ============================================================================
-- OaxIntegra IA — Esquema de base de datos
-- ----------------------------------------------------------------------------
-- ESTADO: PROPUESTO, no implementado.
-- Hoy la app guarda todo en localStorage del navegador. Este esquema es el
-- camino para migrar a un backend real cuando se necesite:
--   · que las cuentas funcionen desde cualquier dispositivo
--   · que no se pierdan al borrar los datos del navegador
--   · poder recuperar el código por WhatsApp/SMS
--
-- Dialecto: PostgreSQL (funciona en Supabase, Neon, Railway).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- USUARIOS
-- Refleja exactamente los campos del registro actual de la app.
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- El usuario tal como lo escribió (para mostrarlo con sus mayúsculas)
    usuario         VARCHAR(20)  NOT NULL,
    -- Versión en minúsculas: es la que garantiza unicidad (como en la app)
    usuario_lower   VARCHAR(20)  NOT NULL UNIQUE,

    -- NUNCA guardar el código en texto plano. Hash con bcrypt.
    -- En la app actual está en claro porque vive solo en el navegador del
    -- propio usuario; en servidor eso sería inaceptable.
    codigo_hash     TEXT         NOT NULL,

    -- Teléfono OPCIONAL, guardado con lada: '+52 5512345678'
    telefono        VARCHAR(20),
    lada            VARCHAR(6)   DEFAULT '+52',

    -- Giro del negocio
    giro            VARCHAR(40)  NOT NULL,
    giro_texto      VARCHAR(120) NOT NULL,

    tema            VARCHAR(10)  DEFAULT 'dia'
                    CHECK (tema IN ('dia','noche')),

    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    ultimo_acceso   TIMESTAMPTZ,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT usuario_formato
        CHECK (usuario ~ '^[A-Za-z0-9._-]{4,20}$' AND usuario ~ '[A-Z]'),
    CONSTRAINT telefono_formato
        CHECK (telefono IS NULL OR telefono ~ '^\+[0-9]{1,4} [0-9]{9,11}$')
);

CREATE INDEX idx_usuarios_lower ON usuarios(usuario_lower);
CREATE INDEX idx_usuarios_giro  ON usuarios(giro);


-- ---------------------------------------------------------------------------
-- CONVERSACIONES  (las "pláticas" del chat)
-- ---------------------------------------------------------------------------
CREATE TABLE conversaciones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
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

    -- 'n8n' | 'ia_directa' | 'local'  → para medir cuántas veces cae el respaldo
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
    usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cuerpo       TEXT NOT NULL,
    etiquetas    TEXT[],
    guardada_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pub_usuario ON publicaciones_guardadas(usuario_id, guardada_en DESC);


-- ---------------------------------------------------------------------------
-- CÓDIGOS DE RECUPERACIÓN  (para el envío por WhatsApp/SMS pendiente)
-- ---------------------------------------------------------------------------
CREATE TABLE codigos_recuperacion (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo_hash  TEXT NOT NULL,
    expira_en    TIMESTAMPTZ NOT NULL,
    usado        BOOLEAN NOT NULL DEFAULT FALSE,
    canal        VARCHAR(20) DEFAULT 'whatsapp',
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recup_usuario ON codigos_recuperacion(usuario_id)
    WHERE usado = FALSE;


-- ---------------------------------------------------------------------------
-- BITÁCORA DE USO DE IA  (para conocer costos y detectar fallos)
-- ---------------------------------------------------------------------------
CREATE TABLE uso_ia (
    id           BIGSERIAL PRIMARY KEY,
    usuario_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
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
