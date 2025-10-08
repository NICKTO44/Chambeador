const { pool } = require('../config/database');

// Registrar búsqueda para analíticas
const registrarBusqueda = async (req, res) => {
  try {
    const { termino, resultados_encontrados } = req.body;
    const usuario_id = req.user ? req.user.id : null;

    if (!termino || termino.trim().length === 0) {
      return res.status(400).json({ error: 'El término de búsqueda es requerido' });
    }

    await pool.query(
      'INSERT INTO busquedas (termino, resultados_encontrados, usuario_id) VALUES (?, ?, ?)',
      [termino.trim().toLowerCase(), resultados_encontrados || 0, usuario_id]
    );

    res.json({ message: 'Búsqueda registrada' });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al registrar búsqueda:', error);
    }
    res.status(500).json({ error: 'Error al registrar búsqueda' });
  }
};

// Obtener sugerencias basadas en búsquedas previas
const obtenerSugerencias = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ sugerencias: [] });
    }

    const searchTerm = `${q.trim().toLowerCase()}%`;

    // Sugerencias de búsquedas populares
    const [busquedas] = await pool.query(
      `SELECT termino, COUNT(*) as frecuencia
       FROM busquedas
       WHERE termino LIKE ? AND resultados_encontrados > 0
       GROUP BY termino
       ORDER BY frecuencia DESC, termino ASC
       LIMIT 5`,
      [searchTerm]
    );

    // Sugerencias de títulos de trabajos activos
    const [trabajos] = await pool.query(
      `SELECT DISTINCT titulo
       FROM trabajos
       WHERE estado = 'activo' AND titulo LIKE ?
       ORDER BY created_at DESC
       LIMIT 3`,
      [searchTerm]
    );

    // Sugerencias de ubicaciones
    const [ubicaciones] = await pool.query(
      `SELECT DISTINCT ubicacion
       FROM trabajos
       WHERE estado = 'activo' AND ubicacion LIKE ? AND ubicacion IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 2`,
      [searchTerm]
    );

    // Combinar todas las sugerencias
    const sugerencias = [
      ...busquedas.map(b => ({ texto: b.termino, tipo: 'popular', frecuencia: b.frecuencia })),
      ...trabajos.map(t => ({ texto: t.titulo, tipo: 'trabajo' })),
      ...ubicaciones.map(u => ({ texto: u.ubicacion, tipo: 'ubicacion' }))
    ];

    // Eliminar duplicados y limitar a 8 sugerencias
    const sugerenciasUnicas = Array.from(
      new Map(sugerencias.map(s => [s.texto.toLowerCase(), s])).values()
    ).slice(0, 8);

    res.json({ sugerencias: sugerenciasUnicas });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al obtener sugerencias:', error);
    }
    res.status(500).json({ error: 'Error al obtener sugerencias' });
  }
};

// Obtener búsquedas populares del día/semana
const obtenerBusquedasPopulares = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'dia'; // 'dia' o 'semana'
    
    let fechaInicio;
    if (periodo === 'dia') {
      fechaInicio = new Date();
      fechaInicio.setHours(0, 0, 0, 0);
    } else {
      fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 7);
    }

    const [populares] = await pool.query(
      `SELECT termino, COUNT(*) as total_busquedas
       FROM busquedas
       WHERE created_at >= ? AND resultados_encontrados > 0
       GROUP BY termino
       ORDER BY total_busquedas DESC
       LIMIT 10`,
      [fechaInicio]
    );

    res.json({ populares, periodo });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al obtener búsquedas populares:', error);
    }
    res.status(500).json({ error: 'Error al obtener búsquedas populares' });
  }
};

// Obtener corrección ortográfica
const obtenerCorreccion = async (req, res) => {
  try {
    const { termino } = req.query;

    if (!termino || termino.trim().length === 0) {
      return res.json({ correccion: null });
    }

    const [correcciones] = await pool.query(
      'SELECT termino_correcto FROM diccionario_correcciones WHERE termino_incorrecto = ?',
      [termino.trim().toLowerCase()]
    );

    if (correcciones.length > 0) {
      // Incrementar contador de uso
      await pool.query(
        'UPDATE diccionario_correcciones SET veces_usado = veces_usado + 1 WHERE termino_incorrecto = ?',
        [termino.trim().toLowerCase()]
      );

      res.json({ correccion: correcciones[0].termino_correcto });
    } else {
      res.json({ correccion: null });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al obtener corrección:', error);
    }
    res.status(500).json({ error: 'Error al obtener corrección' });
  }
};

module.exports = {
  registrarBusqueda,
  obtenerSugerencias,
  obtenerBusquedasPopulares,
  obtenerCorreccion
};