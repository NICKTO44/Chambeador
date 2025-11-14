const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

// ========================================
// OBTENER TODAS LAS EXPERIENCIAS (FEED)
// ========================================
const getExperiencias = async (req, res) => {
  try {
    const { tipo, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        e.*,
        u.nombre as nombre_usuario,
        u.foto_perfil as foto_usuario,
        u.rol as rol_usuario,
        (SELECT COUNT(*) FROM likes_experiencias WHERE experiencia_id = e.id) as likes_count,
        (SELECT COUNT(*) FROM comentarios_experiencias WHERE experiencia_id = e.id) as comentarios_count
    `;

    // Si el usuario está autenticado, verificar si dio like
    if (req.user) {
      query += `,
        EXISTS(
          SELECT 1 FROM likes_experiencias 
          WHERE experiencia_id = e.id AND usuario_id = ?
        ) as usuario_dio_like
      `;
    }

    query += `
      FROM experiencias e
      INNER JOIN usuarios u ON e.usuario_id = u.id
    `;

    const params = req.user ? [req.user.id] : [];

    // Filtrar por tipo si se especifica
    if (tipo && ['negativa', 'positiva', 'neutral'].includes(tipo)) {
      query += ` WHERE e.tipo_experiencia = ?`;
      params.push(tipo);
    }

    query += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [experiencias] = await pool.query(query, params);

    res.json({
      experiencias,
      total: experiencias.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al obtener experiencias:', error);
    }
    res.status(500).json({ error: 'Error al obtener experiencias' });
  }
};

// ========================================
// OBTENER UNA EXPERIENCIA POR ID
// ========================================
const getExperienciaById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT 
        e.*,
        u.nombre as nombre_usuario,
        u.foto_perfil as foto_usuario,
        u.rol as rol_usuario,
        (SELECT COUNT(*) FROM likes_experiencias WHERE experiencia_id = e.id) as likes_count,
        (SELECT COUNT(*) FROM comentarios_experiencias WHERE experiencia_id = e.id) as comentarios_count
    `;

    if (req.user) {
      query += `,
        EXISTS(
          SELECT 1 FROM likes_experiencias 
          WHERE experiencia_id = e.id AND usuario_id = ?
        ) as usuario_dio_like
      `;
    }

    query += `
      FROM experiencias e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      WHERE e.id = ?
    `;

    const params = req.user ? [req.user.id, id] : [id];
    const [experiencias] = await pool.query(query, params);

    if (experiencias.length === 0) {
      return res.status(404).json({ error: 'Experiencia no encontrada' });
    }

    res.json(experiencias[0]);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al obtener experiencia:', error);
    }
    res.status(500).json({ error: 'Error al obtener experiencia' });
  }
};

// ========================================
// CREAR NUEVA EXPERIENCIA
// ========================================
const crearExperiencia = async (req, res) => {
  try {
    const { titulo, nombre_empresa, descripcion, tipo_experiencia } = req.body;

    // Validaciones
    if (!titulo || !nombre_empresa || !descripcion) {
      return res.status(400).json({ 
        error: 'Título, nombre de empresa y descripción son obligatorios' 
      });
    }

    if (tipo_experiencia && !['negativa', 'positiva', 'neutral'].includes(tipo_experiencia)) {
      return res.status(400).json({ 
        error: 'Tipo de experiencia inválido' 
      });
    }

    let media_url = null;
    let media_type = null;

    // Si hay archivo subido
    if (req.file) {
      media_url = `/uploads/experiencias/${req.file.filename}`;
      media_type = req.file.mimetype.startsWith('video/') ? 'video' : 'imagen';
    }

    // Insertar en base de datos
    const [result] = await pool.query(
      `INSERT INTO experiencias 
        (usuario_id, titulo, nombre_empresa, descripcion, tipo_experiencia, media_url, media_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        titulo,
        nombre_empresa,
        descripcion,
        tipo_experiencia || 'negativa',
        media_url,
        media_type
      ]
    );

    res.status(201).json({
      message: 'Experiencia publicada exitosamente',
      experiencia_id: result.insertId
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al crear experiencia:', error);
    }
    res.status(500).json({ error: 'Error al publicar experiencia' });
  }
};

// ========================================
// DAR/QUITAR LIKE A UNA EXPERIENCIA
// ========================================
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la experiencia existe
    const [experiencias] = await pool.query(
      'SELECT id FROM experiencias WHERE id = ?',
      [id]
    );

    if (experiencias.length === 0) {
      return res.status(404).json({ error: 'Experiencia no encontrada' });
    }

    // Verificar si ya dio like
    const [likes] = await pool.query(
      'SELECT id FROM likes_experiencias WHERE experiencia_id = ? AND usuario_id = ?',
      [id, req.user.id]
    );

    if (likes.length > 0) {
      // Ya dio like, entonces quitarlo
      await pool.query(
        'DELETE FROM likes_experiencias WHERE experiencia_id = ? AND usuario_id = ?',
        [id, req.user.id]
      );

      return res.json({ 
        message: 'Like eliminado',
        liked: false 
      });
    } else {
      // No ha dado like, entonces agregarlo
      await pool.query(
        'INSERT INTO likes_experiencias (experiencia_id, usuario_id) VALUES (?, ?)',
        [id, req.user.id]
      );

      return res.json({ 
        message: 'Like agregado',
        liked: true 
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al dar/quitar like:', error);
    }
    res.status(500).json({ error: 'Error al procesar like' });
  }
};

// ========================================
// OBTENER COMENTARIOS DE UNA EXPERIENCIA
// ========================================
const getComentarios = async (req, res) => {
  try {
    const { id } = req.params;

    const [comentarios] = await pool.query(
      `SELECT 
        c.*,
        u.nombre as nombre_usuario,
        u.foto_perfil as foto_usuario,
        u.rol as rol_usuario
       FROM comentarios_experiencias c
       INNER JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.experiencia_id = ?
       ORDER BY c.created_at DESC`,
      [id]
    );

    res.json(comentarios);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al obtener comentarios:', error);
    }
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
};

// ========================================
// AGREGAR COMENTARIO A UNA EXPERIENCIA
// ========================================
const agregarComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;

    if (!comentario || comentario.trim() === '') {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    // Verificar si la experiencia existe
    const [experiencias] = await pool.query(
      'SELECT id FROM experiencias WHERE id = ?',
      [id]
    );

    if (experiencias.length === 0) {
      return res.status(404).json({ error: 'Experiencia no encontrada' });
    }

    // Insertar comentario
    const [result] = await pool.query(
      'INSERT INTO comentarios_experiencias (experiencia_id, usuario_id, comentario) VALUES (?, ?, ?)',
      [id, req.user.id, comentario.trim()]
    );

    // Obtener el comentario recién creado con datos del usuario
    const [comentarioCreado] = await pool.query(
      `SELECT 
        c.*,
        u.nombre as nombre_usuario,
        u.foto_perfil as foto_usuario,
        u.rol as rol_usuario
       FROM comentarios_experiencias c
       INNER JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Comentario agregado exitosamente',
      comentario: comentarioCreado[0]
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al agregar comentario:', error);
    }
    res.status(500).json({ error: 'Error al agregar comentario' });
  }
};

// ========================================
// ELIMINAR EXPERIENCIA (solo el autor)
// ========================================
const eliminarExperiencia = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la experiencia existe y pertenece al usuario
    const [experiencias] = await pool.query(
      'SELECT * FROM experiencias WHERE id = ? AND usuario_id = ?',
      [id, req.user.id]
    );

    if (experiencias.length === 0) {
      return res.status(404).json({ 
        error: 'Experiencia no encontrada o no tienes permiso para eliminarla' 
      });
    }

    const experiencia = experiencias[0];

    // Eliminar archivo multimedia si existe
    if (experiencia.media_url) {
      const rutaArchivo = path.join(__dirname, '..', experiencia.media_url);
      try {
        await fs.unlink(rutaArchivo);
      } catch (err) {
        // Si no existe el archivo, continuar
      }
    }

    // Eliminar experiencia (los likes y comentarios se eliminan por CASCADE)
    await pool.query('DELETE FROM experiencias WHERE id = ?', [id]);

    res.json({ message: 'Experiencia eliminada exitosamente' });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al eliminar experiencia:', error);
    }
    res.status(500).json({ error: 'Error al eliminar experiencia' });
  }
};

module.exports = {
  getExperiencias,
  getExperienciaById,
  crearExperiencia,
  toggleLike,
  getComentarios,
  agregarComentario,
  eliminarExperiencia
};