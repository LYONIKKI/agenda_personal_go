-- 1. Tabla de usuarios para el login de la Agenda (con hash o texto según tu estándar)
CREATE TABLE IF NOT EXISTS agenda_usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    estado SMALLINT DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertar tu usuario inicial
INSERT INTO agenda_usuarios (usuario, password, nombre)
VALUES ('anhgelo', 'Allmight10', 'Ing. Anhgelo Smith Vega Poma')
ON CONFLICT (usuario) DO NOTHING;

-- 3. Tabla principal del Asistente y Agenda (tipo Jira / Kanban)
CREATE TABLE IF NOT EXISTS agenda_tareas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    modulo VARCHAR(100) DEFAULT 'General',     -- ej: 'Laboratorio', 'Emergencia', 'Infraestructura'
    tecnologia VARCHAR(50) DEFAULT 'General',  -- ej: 'Rust', 'Go', 'PHP', 'PostgreSQL'
    estado VARCHAR(30) DEFAULT 'pendiente',    -- 'pendiente', 'en_progreso', 'completado', 'aplazado'
    prioridad VARCHAR(20) DEFAULT 'media',     -- 'baja', 'media', 'alta', 'urgente'
    fecha_programada DATE DEFAULT CURRENT_DATE,
    origen VARCHAR(20) DEFAULT 'web',          -- 'web' o 'telegram'
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Agregar fecha límite a las tareas del Kanban
ALTER TABLE agenda_tareas 
ADD COLUMN IF NOT EXISTS fecha_limite DATE;

-- 2. Bitácora de avances diarios para cada tarea del Kanban
CREATE TABLE IF NOT EXISTS agenda_tarea_avances (
    id SERIAL PRIMARY KEY,
    tarea_id INT REFERENCES agenda_tareas(id) ON DELETE CASCADE,
    nota TEXT NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla para la Agenda Diaria / Cronograma por Horas (Time-Slots)
CREATE TABLE IF NOT EXISTS agenda_cronograma (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    actividad VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Personal', -- 'Desarrollo', 'Personal', 'Guardia', 'Reunión'
    completado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Convertir fecha_programada y fecha_limite a TIMESTAMP para guardar hora y minuto
ALTER TABLE agenda_tareas 
    ALTER COLUMN fecha_programada TYPE TIMESTAMP USING fecha_programada::timestamp,
    ALTER COLUMN fecha_limite TYPE TIMESTAMP USING fecha_limite::timestamp;

-- 2. Ampliar la tabla existente agenda_tarea_avances para registrar tramos horarios y minutos
ALTER TABLE agenda_tarea_avances
    ADD COLUMN IF NOT EXISTS hora_inicio TIME DEFAULT '08:00',
    ADD COLUMN IF NOT EXISTS hora_fin TIME DEFAULT '09:00',
    ADD COLUMN IF NOT EXISTS minutos_invertidos INT DEFAULT 60;