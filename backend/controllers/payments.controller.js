const { pool } = require('../config/database');

// Obtener configuración de pago (precio, número Yape)
const getConfiguracionPago = async (req, res) => {
  try {
    const [config] = await pool.query(
      `SELECT clave, valor FROM configuracion 
       WHERE clave IN ('precio_publicacion', 'telefono_yape', 'nombre_yape')`
    );

    const configuracion = {};
    config.forEach(item => {
      configuracion[item.clave] = item.valor;
    });

    res.json(configuracion);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración de pago' });
  }
};

// Registrar pago y cambiar estado del trabajo
const registrarPago = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { trabajo_id, codigo_operacion } = req.body;

    // Validar que el código de operación no esté vacío
    if (!codigo_operacion || codigo_operacion.trim().length < 4) {
      return res.status(400).json({ 
        error: 'El código de operación debe tener al menos 4 caracteres' 
      });
    }

    // Verificar que el trabajo existe y pertenece al usuario
    const [trabajos] = await connection.query(
      'SELECT id, empleador_id, estado FROM trabajos WHERE id = ?',
      [trabajo_id]
    );

    if (trabajos.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    if (trabajos[0].empleador_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: 'No tienes permiso para este trabajo' });
    }

    if (trabajos[0].estado !== 'pendiente_pago') {
      await connection.rollback();
      return res.status(400).json({ error: 'Este trabajo ya fue procesado' });
    }

    // Obtener precio de publicación
    const [precioConfig] = await connection.query(
      "SELECT valor FROM configuracion WHERE clave = 'precio_publicacion'"
    );
    const monto = parseFloat(precioConfig[0]?.valor || '10.00');

    // Registrar el pago
    await connection.query(
      `INSERT INTO pagos (trabajo_id, empleador_id, monto, metodo_pago, codigo_operacion, estado)
       VALUES (?, ?, ?, 'yape', ?, 'pendiente')`,
      [trabajo_id, req.user.id, monto, codigo_operacion.trim()]
    );

    // Cambiar estado del trabajo a "pendiente_verificacion"
    await connection.query(
      "UPDATE trabajos SET estado = 'pendiente_verificacion' WHERE id = ?",
      [trabajo_id]
    );

    await connection.commit();

    res.json({ 
      message: 'Pago registrado exitosamente. Tu publicación será verificada pronto.',
      estado: 'pendiente_verificacion'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar pago:', error);
    res.status(500).json({ error: 'Error al registrar pago' });
  } finally {
    connection.release();
  }
};

// Verificar estado de pago (para el empleador)
const verificarEstadoPago = async (req, res) => {
  try {
    const { trabajo_id } = req.params;

    const [pagos] = await pool.query(
      `SELECT p.*, t.estado as estado_trabajo
       FROM pagos p
       JOIN trabajos t ON p.trabajo_id = t.id
       WHERE p.trabajo_id = ? AND p.empleador_id = ?
       ORDER BY p.fecha_pago DESC
       LIMIT 1`,
      [trabajo_id, req.user.id]
    );

    if (pagos.length === 0) {
      return res.status(404).json({ error: 'No se encontró información de pago' });
    }

    res.json(pagos[0]);
  } catch (error) {
    console.error('Error al verificar estado de pago:', error);
    res.status(500).json({ error: 'Error al verificar estado de pago' });
  }
};

// ===== FUNCIONES ADMIN (para futuro panel de administración) =====

// Listar pagos pendientes de verificación
const getPagosPendientes = async (req, res) => {
  try {
    const [pagos] = await pool.query(
      `SELECT p.*, t.titulo, u.nombre as empleador_nombre, u.email as empleador_email
       FROM pagos p
       JOIN trabajos t ON p.trabajo_id = t.id
       JOIN usuarios u ON p.empleador_id = u.id
       WHERE p.estado = 'pendiente'
       ORDER BY p.fecha_pago DESC`
    );

    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos pendientes:', error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
};

// Verificar/Rechazar pago (ADMIN)
const procesarPago = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { pago_id } = req.params;
    const { accion, notas } = req.body; // accion: 'verificar' o 'rechazar'

    if (!['verificar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ error: 'Acción inválida' });
    }

    // Obtener información del pago
    const [pagos] = await connection.query(
      'SELECT trabajo_id FROM pagos WHERE id = ?',
      [pago_id]
    );

    if (pagos.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const trabajo_id = pagos[0].trabajo_id;

    if (accion === 'verificar') {
      // Marcar pago como verificado
      await connection.query(
        `UPDATE pagos 
         SET estado = 'verificado', fecha_verificacion = NOW(), notas = ?
         WHERE id = ?`,
        [notas || null, pago_id]
      );

      // Activar el trabajo
      await connection.query(
        "UPDATE trabajos SET estado = 'activo' WHERE id = ?",
        [trabajo_id]
      );
    } else {
      // Marcar pago como rechazado
      await connection.query(
        `UPDATE pagos 
         SET estado = 'rechazado', fecha_verificacion = NOW(), notas = ?
         WHERE id = ?`,
        [notas || 'Pago no verificado', pago_id]
      );

      // Devolver trabajo a pendiente_pago
      await connection.query(
        "UPDATE trabajos SET estado = 'pendiente_pago' WHERE id = ?",
        [trabajo_id]
      );
    }

    await connection.commit();

    res.json({ 
      message: `Pago ${accion === 'verificar' ? 'verificado' : 'rechazado'} exitosamente` 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al procesar pago:', error);
    res.status(500).json({ error: 'Error al procesar pago' });
  } finally {
    connection.release();
  }
};

module.exports = {
  getConfiguracionPago,
  registrarPago,
  verificarEstadoPago,
  getPagosPendientes,
  procesarPago
};