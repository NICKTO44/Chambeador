const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

// ========================================
// PERFIL PRIVADO (usuario autenticado)
// ========================================

// Obtener perfil completo del usuario
const getPerfil = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT 
        id, nombre, email, rol, telefono, tipo_documento, numero_documento,
        foto_perfil, biografia, ubicacion_perfil, sitio_web, perfil_completo,
        cv_archivo, experiencia, educacion, habilidades,
        nombre_empresa, ruc_empresa, descripcion_empresa, sector_empresa, tamanio_empresa,
        created_at
      FROM usuarios 
      WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(users[0]);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al obtener perfil:', error);
    }
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// ========================================
// ✨ NUEVO: PERFIL PÚBLICO
// ========================================

// Obtener perfil público de cualquier usuario (sin datos sensibles)
const getPerfilPublico = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos básicos del usuario (SIN datos privados)
    const [users] = await pool.query(
      `SELECT 
        id, nombre, rol,
        foto_perfil, biografia, ubicacion_perfil, sitio_web,
        experiencia, educacion, habilidades,
        nombre_empresa, descripcion_empresa, sector_empresa, tamanio_empresa,
        created_at
      FROM usuarios 
      WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = users[0];

    // Obtener estadísticas de experiencias
    const [statsExperiencias] = await pool.query(
      `SELECT COUNT(*) as total_experiencias
       FROM experiencias
       WHERE usuario_id = ?`,
      [id]
    );

    // Obtener total de likes recibidos en sus experiencias
    const [statsLikes] = await pool.query(
      `SELECT COUNT(*) as total_likes
       FROM likes_experiencias le
       INNER JOIN experiencias e ON le.experiencia_id = e.id
       WHERE e.usuario_id = ?`,
      [id]
    );

    // Obtener total de comentarios recibidos en sus experiencias
    const [statsComentarios] = await pool.query(
      `SELECT COUNT(*) as total_comentarios
       FROM comentarios_experiencias ce
       INNER JOIN experiencias e ON ce.experiencia_id = e.id
       WHERE e.usuario_id = ?`,
      [id]
    );

    // Obtener experiencias publicadas por este usuario (últimas 10)
    const [experiencias] = await pool.query(
      `SELECT 
        e.*,
        (SELECT COUNT(*) FROM likes_experiencias WHERE experiencia_id = e.id) as likes_count,
        (SELECT COUNT(*) FROM comentarios_experiencias WHERE experiencia_id = e.id) as comentarios_count
       FROM experiencias e
       WHERE e.usuario_id = ?
       ORDER BY e.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Construir respuesta con datos públicos + estadísticas
    res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        foto_perfil: usuario.foto_perfil,
        biografia: usuario.biografia,
        ubicacion_perfil: usuario.ubicacion_perfil,
        sitio_web: usuario.sitio_web,
        created_at: usuario.created_at,
        // Datos específicos por rol
        ...(usuario.rol === 'trabajador' && {
          experiencia: usuario.experiencia,
          educacion: usuario.educacion,
          habilidades: usuario.habilidades
        }),
        ...(usuario.rol === 'empleador' && {
          nombre_empresa: usuario.nombre_empresa,
          descripcion_empresa: usuario.descripcion_empresa,
          sector_empresa: usuario.sector_empresa,
          tamanio_empresa: usuario.tamanio_empresa
        })
      },
      estadisticas: {
        total_experiencias: statsExperiencias[0].total_experiencias,
        total_likes: statsLikes[0].total_likes,
        total_comentarios: statsComentarios[0].total_comentarios
      },
      experiencias
    });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al obtener perfil público:', error);
    }
    res.status(500).json({ error: 'Error al obtener perfil público' });
  }
};

// ========================================
// ACTUALIZAR PERFIL
// ========================================

// Actualizar perfil (datos básicos sin archivos)
const actualizarPerfil = async (req, res) => {
  try {
    const { rol } = req.user;
    const datosActualizacion = {};
    
    // Campos comunes para ambos roles
    const camposComunes = ['biografia', 'ubicacion_perfil', 'sitio_web'];
    camposComunes.forEach(campo => {
      if (req.body[campo] !== undefined) {
        datosActualizacion[campo] = req.body[campo];
      }
    });

    // Campos específicos para TRABAJADORES
    if (rol === 'trabajador') {
      const camposTrabajador = ['experiencia', 'educacion', 'habilidades'];
      camposTrabajador.forEach(campo => {
        if (req.body[campo] !== undefined) {
          datosActualizacion[campo] = req.body[campo];
        }
      });
    }

    // Campos específicos para EMPLEADORES
    if (rol === 'empleador') {
      const camposEmpleador = ['nombre_empresa', 'ruc_empresa', 'descripcion_empresa', 'sector_empresa', 'tamanio_empresa'];
      camposEmpleador.forEach(campo => {
        if (req.body[campo] !== undefined) {
          datosActualizacion[campo] = req.body[campo];
        }
      });
    }

    if (Object.keys(datosActualizacion).length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    // Construir query dinámicamente
    const campos = Object.keys(datosActualizacion);
    const valores = Object.values(datosActualizacion);
    const setClauses = campos.map(campo => `${campo} = ?`).join(', ');

    await pool.query(
      `UPDATE usuarios SET ${setClauses} WHERE id = ?`,
      [...valores, req.user.id]
    );

    // Verificar si el perfil está completo
    await verificarPerfilCompleto(req.user.id);

    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al actualizar perfil:', error);
    }
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// Subir foto de perfil
const subirFotoPerfil = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const nombreArchivo = req.file.filename;
    const urlFoto = `/uploads/fotos/${nombreArchivo}`;

    // Obtener foto anterior para eliminarla
    const [users] = await pool.query(
      'SELECT foto_perfil FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (users.length > 0 && users[0].foto_perfil) {
      const rutaAnterior = path.join(__dirname, '..', users[0].foto_perfil);
      try {
        await fs.unlink(rutaAnterior);
      } catch (err) {
        // Si no existe el archivo, continuar
      }
    }

    // Actualizar base de datos
    await pool.query(
      'UPDATE usuarios SET foto_perfil = ? WHERE id = ?',
      [urlFoto, req.user.id]
    );

    await verificarPerfilCompleto(req.user.id);

    res.json({ 
      message: 'Foto de perfil actualizada exitosamente',
      foto_perfil: urlFoto
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al subir foto:', error);
    }
    res.status(500).json({ error: 'Error al subir foto de perfil' });
  }
};

// Subir CV (solo trabajadores)
const subirCV = async (req, res) => {
  try {
    if (req.user.rol !== 'trabajador') {
      return res.status(403).json({ error: 'Solo los trabajadores pueden subir CV' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const nombreArchivo = req.file.filename;
    const urlCV = `/uploads/cvs/${nombreArchivo}`;

    // Obtener CV anterior para eliminarlo
    const [users] = await pool.query(
      'SELECT cv_archivo FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (users.length > 0 && users[0].cv_archivo) {
      const rutaAnterior = path.join(__dirname, '..', users[0].cv_archivo);
      try {
        await fs.unlink(rutaAnterior);
      } catch (err) {
        // Si no existe el archivo, continuar
      }
    }

    // Actualizar base de datos
    await pool.query(
      'UPDATE usuarios SET cv_archivo = ? WHERE id = ?',
      [urlCV, req.user.id]
    );

    await verificarPerfilCompleto(req.user.id);

    res.json({ 
      message: 'CV actualizado exitosamente',
      cv_archivo: urlCV
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al subir CV:', error);
    }
    res.status(500).json({ error: 'Error al subir CV' });
  }
};

// Función auxiliar para verificar si el perfil está completo
const verificarPerfilCompleto = async (userId) => {
  try {
    const [users] = await pool.query(
      'SELECT rol, foto_perfil, biografia, cv_archivo, nombre_empresa FROM usuarios WHERE id = ?',
      [userId]
    );

    if (users.length === 0) return;

    const user = users[0];
    let completo = false;

    if (user.rol === 'trabajador') {
      // Perfil completo si tiene: foto, biografía y CV
      completo = !!(user.foto_perfil && user.biografia && user.cv_archivo);
    } else if (user.rol === 'empleador') {
      // Perfil completo si tiene: foto, biografía y nombre empresa
      completo = !!(user.foto_perfil && user.biografia && user.nombre_empresa);
    }

    await pool.query(
      'UPDATE usuarios SET perfil_completo = ? WHERE id = ?',
      [completo, userId]
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al verificar perfil completo:', error);
    }
  }
};

module.exports = {
  getPerfil,
  getPerfilPublico, // ✨ NUEVO
  actualizarPerfil,
  subirFotoPerfil,
  subirCV
};