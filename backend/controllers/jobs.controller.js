const { pool } = require('../config/database');

// Obtener todos los trabajos (paginado y con filtros)
// Obtener todos los trabajos (paginado, filtros y búsqueda)
const getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const categoria = req.query.categoria;
    const busqueda = req.query.busqueda; // NUEVO: parámetro de búsqueda

    let query = `
      SELECT t.*, u.nombre as empleador_nombre, u.telefono as empleador_telefono
      FROM trabajos t
      JOIN usuarios u ON t.empleador_id = u.id
      WHERE t.estado = 'activo'
    `;
    
    const params = [];
    
    // Filtro por categoría
    if (categoria) {
      query += ' AND t.categoria = ?';
      params.push(categoria);
    }

    // NUEVO: Filtro por búsqueda (título, descripción o ubicación)
    if (busqueda) {
      query += ' AND (t.titulo LIKE ? OR t.descripcion LIKE ? OR t.ubicacion LIKE ?)';
      const searchTerm = `%${busqueda}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [trabajos] = await pool.query(query, params);

    // Contar total para paginación (con los mismos filtros)
    let countQuery = 'SELECT COUNT(*) as total FROM trabajos t WHERE t.estado = ?';
    const countParams = ['activo'];
    
    if (categoria) {
      countQuery += ' AND t.categoria = ?';
      countParams.push(categoria);
    }

    if (busqueda) {
      countQuery += ' AND (t.titulo LIKE ? OR t.descripcion LIKE ? OR t.ubicacion LIKE ?)';
      const searchTerm = `%${busqueda}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      trabajos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener trabajos:', error);
    res.status(500).json({ error: 'Error al obtener trabajos' });
  }
};

// Obtener un trabajo específico por ID
const getJobById = async (req, res) => {
  try {
    const [trabajos] = await pool.query(
      `SELECT t.*, u.nombre as empleador_nombre, u.telefono as empleador_telefono, u.email as empleador_email
       FROM trabajos t
       JOIN usuarios u ON t.empleador_id = u.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (trabajos.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    res.json(trabajos[0]);
  } catch (error) {
    console.error('Error al obtener trabajo:', error);
    res.status(500).json({ error: 'Error al obtener trabajo' });
  }
};

// Obtener trabajos del empleador actual
const getMisPublicaciones = async (req, res) => {
  try {
    const [trabajos] = await pool.query(
      'SELECT * FROM trabajos WHERE empleador_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(trabajos);
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    res.status(500).json({ error: 'Error al obtener publicaciones' });
  }
};


// Crear un nuevo trabajo
// Crear un nuevo trabajo
const createJob = async (req, res) => {
  try {
    const { titulo, descripcion, categoria, pago_estimado, ubicacion, contacto, telefono_contacto } = req.body;

    // Validaciones
    if (!titulo || !descripcion || !categoria) {
      return res.status(400).json({ error: 'Título, descripción y categoría son obligatorios' });
    }

    // ✨ NUEVO: Detectar si el usuario es admin
    const esAdmin = req.user.rol === 'admin';

    // ✨ NUEVO: Validar teléfono para admin
    if (esAdmin && !telefono_contacto) {
      return res.status(400).json({ error: 'El teléfono de contacto es obligatorio para publicaciones de admin' });
    }

    let estado, fechaExpiracion, telefonoFinal;

    if (esAdmin) {
      // Admin: publicar directamente activo con expiración de 7 días
      estado = 'activo';
      fechaExpiracion = new Date();
      fechaExpiracion.setDate(fechaExpiracion.getDate() + 7);
      telefonoFinal = telefono_contacto; // ✨ Usar teléfono ingresado por admin
    } else {
      // Empleador: requiere pago
      estado = 'pendiente_pago';
      fechaExpiracion = null;
      telefonoFinal = req.user.telefono; // ✨ Usar teléfono del usuario logueado
    }

    const [result] = await pool.query(
      `INSERT INTO trabajos (empleador_id, titulo, descripcion, categoria, pago_estimado, ubicacion, contacto, telefono_contacto, estado, fecha_expiracion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, titulo, descripcion, categoria, pago_estimado || null, ubicacion || null, contacto || null, telefonoFinal, estado, fechaExpiracion]
    );

    if (esAdmin) {
      res.status(201).json({
        message: 'Trabajo publicado exitosamente (Admin)',
        id: result.insertId,
        estado: 'activo',
        fecha_expiracion: fechaExpiracion,
        esAdmin: true
      });
    } else {
      res.status(201).json({
        message: 'Trabajo creado. Procede con el pago para publicarlo.',
        id: result.insertId,
        estado: 'pendiente_pago',
        esAdmin: false
      });
    }
  } catch (error) {
    console.error('Error al crear trabajo:', error);
    res.status(500).json({ error: 'Error al crear trabajo' });
  }
};

// Actualizar un trabajo
const updateJob = async (req, res) => {
  try {
    // Verificar que el trabajo pertenece al usuario
    const [trabajos] = await pool.query(
      'SELECT empleador_id FROM trabajos WHERE id = ?',
      [req.params.id]
    );

    if (trabajos.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    if (trabajos[0].empleador_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para editar este trabajo' });
    }

    const { titulo, descripcion, categoria, pago_estimado, ubicacion, contacto, estado } = req.body;

    await pool.query(
      `UPDATE trabajos 
       SET titulo = ?, descripcion = ?, categoria = ?, pago_estimado = ?, ubicacion = ?, contacto = ?, estado = ?
       WHERE id = ?`,
      [titulo, descripcion, categoria, pago_estimado, ubicacion, contacto, estado || 'activo', req.params.id]
    );

    res.json({ message: 'Trabajo actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar trabajo:', error);
    res.status(500).json({ error: 'Error al actualizar trabajo' });
  }
};

// Eliminar un trabajo
const deleteJob = async (req, res) => {
  try {
    // Verificar que el trabajo pertenece al usuario
    const [trabajos] = await pool.query(
      'SELECT empleador_id FROM trabajos WHERE id = ?',
      [req.params.id]
    );

    if (trabajos.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    if (trabajos[0].empleador_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este trabajo' });
    }

    await pool.query('DELETE FROM trabajos WHERE id = ?', [req.params.id]);

    res.json({ message: 'Trabajo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar trabajo:', error);
    res.status(500).json({ error: 'Error al eliminar trabajo' });
  }
};
// Eliminar un trabajo (ADMIN - puede eliminar cualquier trabajo)
const deleteJobAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el trabajo existe
    const [trabajos] = await pool.query(
      'SELECT id, titulo FROM trabajos WHERE id = ?',
      [id]
    );

    if (trabajos.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    // Eliminar el trabajo
    await pool.query('DELETE FROM trabajos WHERE id = ?', [id]);

    res.json({ 
      message: 'Trabajo eliminado exitosamente',
      trabajo: trabajos[0].titulo
    });
  } catch (error) {
    console.error('Error al eliminar trabajo (admin):', error);
    res.status(500).json({ error: 'Error al eliminar trabajo' });
  }
};

// ========== NUEVAS FUNCIONES PARA SISTEMA DE EXPIRACIÓN ==========

// Obtener trabajos del empleador con información de expiración
const getMisPublicacionesConExpiracion = async (req, res) => {
  try {
    const [trabajos] = await pool.query(
      `SELECT *, 
       DATEDIFF(fecha_expiracion, NOW()) as dias_restantes,
       CASE 
         WHEN fecha_expiracion IS NULL THEN 'sin_expiracion'
         WHEN fecha_expiracion < NOW() THEN 'expirado'
         WHEN DATEDIFF(fecha_expiracion, NOW()) <= 1 THEN 'critico'
         WHEN DATEDIFF(fecha_expiracion, NOW()) <= 3 THEN 'advertencia'
         ELSE 'normal'
       END as nivel_expiracion
       FROM trabajos 
       WHERE empleador_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(trabajos);
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    res.status(500).json({ error: 'Error al obtener publicaciones' });
  }
};

// Solicitar renovación de un trabajo
const solicitarRenovacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo_operacion } = req.body;

    // Verificar que el trabajo pertenece al usuario
    const [trabajos] = await pool.query(
      'SELECT * FROM trabajos WHERE id = ? AND empleador_id = ?',
      [id, req.user.id]
    );

    if (trabajos.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    const trabajo = trabajos[0];

    // Calcular nueva fecha de expiración (7 días desde ahora o desde la expiración actual)
    const fechaBase = trabajo.fecha_expiracion && new Date(trabajo.fecha_expiracion) > new Date() 
      ? trabajo.fecha_expiracion 
      : new Date();

    const nuevaExpiracion = new Date(fechaBase);
    nuevaExpiracion.setDate(nuevaExpiracion.getDate() + 7);

    // Registrar renovación pendiente
    const [result] = await pool.query(
      `INSERT INTO renovaciones 
       (trabajo_id, empleador_id, monto, codigo_operacion, fecha_nueva_expiracion, estado)
       VALUES (?, ?, 10.00, ?, ?, 'pendiente')`,
      [id, req.user.id, codigo_operacion || null, nuevaExpiracion]
    );

    res.json({
      message: 'Solicitud de renovación registrada. Espera la verificación del pago.',
      renovacion_id: result.insertId,
      nueva_fecha_expiracion: nuevaExpiracion
    });
  } catch (error) {
    console.error('Error al solicitar renovación:', error);
    res.status(500).json({ error: 'Error al solicitar renovación' });
  }
};

// Verificar renovación (ADMIN)
const verificarRenovacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { aprobar, notas } = req.body;

    const [renovaciones] = await pool.query(
      'SELECT * FROM renovaciones WHERE id = ?',
      [id]
    );

    if (renovaciones.length === 0) {
      return res.status(404).json({ error: 'Renovación no encontrada' });
    }

    const renovacion = renovaciones[0];

    if (aprobar) {
      // Actualizar estado de renovación
      await pool.query(
        `UPDATE renovaciones 
         SET estado = 'verificado', fecha_verificacion = NOW(), notas = ?
         WHERE id = ?`,
        [notas || null, id]
      );

      // Actualizar fecha de expiración del trabajo
      await pool.query(
        `UPDATE trabajos 
         SET fecha_expiracion = ?, estado = 'activo'
         WHERE id = ?`,
        [renovacion.fecha_nueva_expiracion, renovacion.trabajo_id]
      );

      res.json({ 
        message: 'Renovación aprobada. El trabajo ha sido extendido por 7 días más.',
        nueva_expiracion: renovacion.fecha_nueva_expiracion
      });
    } else {
      // Rechazar renovación
      await pool.query(
        `UPDATE renovaciones 
         SET estado = 'rechazado', fecha_verificacion = NOW(), notas = ?
         WHERE id = ?`,
        [notas || 'Pago no verificado', id]
      );

      res.json({ message: 'Renovación rechazada' });
    }
  } catch (error) {
    console.error('Error al verificar renovación:', error);
    res.status(500).json({ error: 'Error al verificar renovación' });
  }
};

// Obtener renovaciones pendientes (ADMIN)
const getRenovacionesPendientes = async (req, res) => {
  try {
    const [renovaciones] = await pool.query(
      `SELECT r.*, t.titulo, u.nombre as empleador_nombre, u.email as empleador_email
       FROM renovaciones r
       JOIN trabajos t ON r.trabajo_id = t.id
       JOIN usuarios u ON r.empleador_id = u.id
       WHERE r.estado = 'pendiente'
       ORDER BY r.fecha_renovacion DESC`
    );

    res.json(renovaciones);
  } catch (error) {
    console.error('Error al obtener renovaciones:', error);
    res.status(500).json({ error: 'Error al obtener renovaciones' });
  }
};

// Desactivar trabajos expirados (CRON JOB)
const desactivarTrabajosExpirados = async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE trabajos 
       SET estado = 'inactivo'
       WHERE estado = 'activo' 
         AND fecha_expiracion IS NOT NULL 
         AND fecha_expiracion < NOW()`
    );

    console.log(`✅ ${result.affectedRows} trabajos expirados desactivados`);
    
    res.json({ 
      message: `${result.affectedRows} trabajos expirados han sido desactivados`,
      count: result.affectedRows
    });
  } catch (error) {
    console.error('Error al desactivar trabajos expirados:', error);
    res.status(500).json({ error: 'Error al desactivar trabajos expirados' });
  }
};
module.exports = {
   getAllJobs,
  getJobById,
  getMisPublicaciones,
  getMisPublicacionesConExpiracion, // ✨ NUEVO
  createJob,
  updateJob,
  deleteJob,
  deleteJobAdmin,
  solicitarRenovacion, // ✨ NUEVO
  verificarRenovacion, // ✨ NUEVO
  getRenovacionesPendientes, // ✨ NUEVO
  desactivarTrabajosExpirados // ✨ NUEVO
};
