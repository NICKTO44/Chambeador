-- ================================================
-- MIGRACIÓN: Sistema de Pagos con Yape
-- ================================================

USE el_chambeador;

-- 1. MODIFICAR tabla trabajos: agregar nuevos estados
ALTER TABLE trabajos 
MODIFY COLUMN estado ENUM('pendiente_pago', 'pendiente_verificacion', 'activo', 'inactivo') 
DEFAULT 'pendiente_pago';

-- 2. CREAR tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trabajo_id INT NOT NULL,
  empleador_id INT NOT NULL,
  monto DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  metodo_pago ENUM('yape', 'plin', 'transferencia') DEFAULT 'yape',
  codigo_operacion VARCHAR(50),
  estado ENUM('pendiente', 'verificado', 'rechazado') DEFAULT 'pendiente',
  fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_verificacion TIMESTAMP NULL,
  notas TEXT,
  FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE,
  FOREIGN KEY (empleador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_trabajo (trabajo_id),
  INDEX idx_empleador (empleador_id),
  INDEX idx_estado (estado),
  INDEX idx_fecha_pago (fecha_pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CONFIGURACIÓN: Tabla para almacenar precio de publicación
CREATE TABLE IF NOT EXISTS configuracion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor VARCHAR(255) NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar precio de publicación (S/ 10.00)
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('precio_publicacion', '10.00', 'Precio en soles para publicar un trabajo'),
('telefono_yape', '927391918', 'Número de teléfono para Yape'),
('nombre_yape', 'El Chambeador', 'Nombre del titular de Yape')
ON DUPLICATE KEY UPDATE valor=valor;

-- ================================================
-- CONSULTAS ÚTILES PARA ADMINISTRACIÓN
-- ================================================

-- Ver todos los pagos pendientes de verificación
-- SELECT p.*, t.titulo, u.nombre as empleador
-- FROM pagos p
-- JOIN trabajos t ON p.trabajo_id = t.id
-- JOIN usuarios u ON p.empleador_id = u.id
-- WHERE p.estado = 'pendiente'
-- ORDER BY p.fecha_pago DESC;

-- Ver estadísticas de pagos
-- SELECT 
--   estado,
--   COUNT(*) as cantidad,
--   SUM(monto) as total
-- FROM pagos
-- GROUP BY estado;
-- migration_busquedas.sql
-- Tabla para registrar búsquedas y generar analíticas

CREATE TABLE IF NOT EXISTS busquedas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  termino VARCHAR(255) NOT NULL,
  resultados_encontrados INT DEFAULT 0,
  usuario_id INT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_termino (termino),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para diccionario de correcciones ortográficas
CREATE TABLE IF NOT EXISTS diccionario_correcciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  termino_incorrecto VARCHAR(100) NOT NULL,
  termino_correcto VARCHAR(100) NOT NULL,
  veces_usado INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_termino (termino_incorrecto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar correcciones comunes para trabajos en Perú
INSERT INTO diccionario_correcciones (termino_incorrecto, termino_correcto) VALUES
('plomro', 'plomero'),
('albanil', 'albañil'),
('electrisista', 'electricista'),
('gasfitero', 'gasfitería'),
('cosinero', 'cocinero'),
('mesero', 'mozo'),
('chofer', 'chofer'),
('contrucion', 'construcción'),
('limpiesa', 'limpieza'),
('jardinero', 'jardinería'),
('carpintro', 'carpintero'),
('pintor', 'pintura'),
('mecanico', 'mecánico'),
('soldador', 'soldadura'),
('programador', 'programación'),
('diseñador', 'diseño'),
('guardia', 'seguridad'),
('conserje', 'conserjería'),
('niñera', 'niñera'),
('cuidador', 'cuidado')
ON DUPLICATE KEY UPDATE veces_usado = veces_usado + 1;

-- ================================================
-- MIGRACIÓN: Sistema de Auto-Desactivación (7 días)
-- ================================================

USE el_chambeador;

-- 1. Agregar columna fecha_expiracion a trabajos
ALTER TABLE trabajos 
ADD COLUMN fecha_expiracion DATETIME DEFAULT NULL AFTER created_at;

-- 2. Actualizar trabajos activos existentes: expiración = 7 días desde creación
UPDATE trabajos 
SET fecha_expiracion = DATE_ADD(created_at, INTERVAL 7 DAY)
WHERE estado = 'activo';

-- 3. Tabla para historial de renovaciones
CREATE TABLE IF NOT EXISTS renovaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trabajo_id INT NOT NULL,
  empleador_id INT NOT NULL,
  monto DECIMAL(10,2) DEFAULT 10.00,
  metodo_pago ENUM('yape', 'plin', 'transferencia') DEFAULT 'yape',
  codigo_operacion VARCHAR(50),
  estado ENUM('pendiente', 'verificado', 'rechazado') DEFAULT 'pendiente',
  fecha_renovacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_verificacion TIMESTAMP NULL,
  dias_extendidos INT DEFAULT 7,
  fecha_nueva_expiracion DATETIME NOT NULL,
  notas TEXT,
  INDEX idx_trabajo (trabajo_id),
  INDEX idx_estado (estado),
  FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE,
  FOREIGN KEY (empleador_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Configuración de precio de renovación
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('precio_renovacion', '10.00', 'Precio en soles para renovar un trabajo por 7 días más')
ON DUPLICATE KEY UPDATE valor='10.00';

-- ================================================
-- CONSULTAS ÚTILES
-- ================================================

-- Ver trabajos próximos a expirar (menos de 2 días)
-- SELECT id, titulo, empleador_id, created_at, fecha_expiracion,
--        DATEDIFF(fecha_expiracion, NOW()) as dias_restantes
-- FROM trabajos
-- WHERE estado = 'activo' 
--   AND fecha_expiracion IS NOT NULL
--   AND DATEDIFF(fecha_expiracion, NOW()) BETWEEN 0 AND 2
-- ORDER BY fecha_expiracion ASC;

-- Ver trabajos expirados
-- SELECT id, titulo, empleador_id, fecha_expiracion
-- FROM trabajos
-- WHERE estado = 'activo' 
--   AND fecha_expiracion < NOW()
-- ORDER BY fecha_expiracion DESC;


UPDATE trabajos 
SET fecha_expiracion = DATE_ADD(created_at, INTERVAL 7 DAY)
WHERE estado = 'activo' AND fecha_expiracion IS NULL;


USE el_chambeador;

-- Agregar campos para documento
ALTER TABLE usuarios 
ADD COLUMN tipo_documento ENUM('DNI', 'RUC') DEFAULT NULL AFTER telefono,
ADD COLUMN numero_documento VARCHAR(20) DEFAULT NULL AFTER tipo_documento,
ADD INDEX idx_documento (numero_documento);

UPDATE configuracion 
SET valor = 'Cristhian Quispe Challco' 
WHERE clave = 'nombre_yape';

-- Agregar columna telefono_contacto a la tabla trabajos
ALTER TABLE trabajos 
ADD COLUMN telefono_contacto VARCHAR(20) DEFAULT NULL
AFTER contacto;

-- Verificar que se agregó correctamente
DESCRIBE trabajos;