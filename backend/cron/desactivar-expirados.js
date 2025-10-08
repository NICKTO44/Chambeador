const { pool } = require('../config/database');

/**
 * Script CRON para desactivar trabajos expirados
 * Ejecutar diariamente a las 00:00
 */

async function desactivarTrabajosExpirados() {
  try {
    console.log('🔍 Buscando trabajos expirados...');

    const [result] = await pool.query(
      `UPDATE trabajos 
       SET estado = 'inactivo'
       WHERE estado = 'activo' 
         AND fecha_expiracion IS NOT NULL 
         AND fecha_expiracion < NOW()`
    );

    console.log(`✅ ${result.affectedRows} trabajos expirados desactivados`);

    // Opcional: Enviar notificaciones a empleadores
    if (result.affectedRows > 0) {
      const [trabajosDesactivados] = await pool.query(
        `SELECT t.id, t.titulo, u.email, u.nombre
         FROM trabajos t
         JOIN usuarios u ON t.empleador_id = u.id
         WHERE t.estado = 'inactivo' 
           AND t.fecha_expiracion IS NOT NULL
           AND t.fecha_expiracion >= DATE_SUB(NOW(), INTERVAL 1 DAY)
           AND t.fecha_expiracion < NOW()`
      );

      console.log('📧 Trabajos que necesitan notificación:', trabajosDesactivados.length);
      // Aquí podrías implementar envío de emails
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al desactivar trabajos:', error);
    process.exit(1);
  }
}

desactivarTrabajosExpirados();