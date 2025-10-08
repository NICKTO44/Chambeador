-- ================================================
-- BASE DE DATOS: EL CHAMBEADOR
-- ================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS el_chambeador
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE el_chambeador;

-- ================================================
-- TABLA: usuarios
-- ================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('empleador', 'trabajador') NOT NULL,
  telefono VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: trabajos
-- ================================================
CREATE TABLE IF NOT EXISTS trabajos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleador_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  pago_estimado DECIMAL(10, 2),
  ubicacion VARCHAR(200),
  contacto VARCHAR(100),
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empleador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_empleador (empleador_id),
  INDEX idx_categoria (categoria),
  INDEX idx_estado (estado),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLAS PREPARADAS PARA FUTURAS FUNCIONALIDADES
-- ================================================

-- Tabla de notificaciones (para implementación futura)
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT,
  leido BOOLEAN DEFAULT FALSE,
  trabajo_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_leido (leido),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de mensajes/chat (para implementación futura)
CREATE TABLE IF NOT EXISTS mensajes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emisor_id INT NOT NULL,
  receptor_id INT NOT NULL,
  trabajo_id INT,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emisor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (receptor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE SET NULL,
  INDEX idx_emisor (emisor_id),
  INDEX idx_receptor (receptor_id),
  INDEX idx_trabajo (trabajo_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- DATOS DE PRUEBA (opcional)
-- ================================================

-- Insertar usuarios de prueba
-- Contraseña para todos: "password123" (ya hasheada con bcrypt)
INSERT INTO usuarios (nombre, email, password, rol, telefono) VALUES
('Juan Empleador', 'empleador@test.com', '$2a$10$X9.YQN5h4rGvVKN4KvN4AO6Z5z0L4qx4QxGZ0F2Z4Z0L4qx4QxGZ0', 'empleador', '+51 999 111 222'),
('María Trabajadora', 'trabajador@test.com', '$2a$10$X9.YQN5h4rGvVKN4KvN4AO6Z5z0L4qx4QxGZ0F2Z4Z0L4qx4QxGZ0', 'trabajador', '+51 999 333 444');

-- Insertar trabajos de prueba
INSERT INTO trabajos (empleador_id, titulo, descripcion, categoria, pago_estimado, ubicacion, contacto) VALUES
(1, 'Se busca albañil con experiencia', 'Necesitamos albañil para construcción de vivienda unifamiliar. Duración aproximada: 2 meses. Experiencia mínima de 3 años.', 'Construcción', 2500.00, 'Lima, San Isidro', 'Llamar de 8am a 6pm'),
(1, 'Ayudante de limpieza para oficina', 'Limpieza de oficinas corporativas, 4 horas diarias de lunes a viernes. Horario: 6pm-10pm', 'Limpieza', 1200.00, 'Lima, Miraflores', 'WhatsApp disponible'),
(1, 'Desarrollador Web Junior', 'Startup tecnológica busca desarrollador web con conocimientos en React y Node.js. Trabajo remoto flexible.', 'Tecnología', 3500.00, 'Remoto', 'Enviar CV al email'),
(1, 'Chofer con licencia A2', 'Empresa de transporte busca chofer responsable para ruta Lima-Callao. Horario: 6am-2pm', 'Transporte', 1800.00, 'Lima, Callao', 'Presentarse con documentos'),
(1, 'Cocinero para restaurante', 'Restaurante de comida criolla busca cocinero con experiencia. Turnos rotativos.', 'Gastronomía', 2000.00, 'Lima, Surco', 'Entrevistas: lunes a viernes');

-- ================================================
-- CONSULTAS ÚTILES
-- ================================================

-- Ver todos los usuarios
-- SELECT id, nombre, email, rol FROM usuarios;

-- Ver todos los trabajos activos
-- SELECT t.*, u.nombre as empleador_nombre 
-- FROM trabajos t 
-- JOIN usuarios u ON t.empleador_id = u.id 
-- WHERE t.estado = 'activo';

-- Ver trabajos por categoría
-- SELECT * FROM trabajos WHERE categoria = 'Construcción' AND estado = 'activo';

-- Contar trabajos por categoría
-- SELECT categoria, COUNT(*) as total 
-- FROM trabajos 
-- WHERE estado = 'activo' 
-- GROUP BY categoria;