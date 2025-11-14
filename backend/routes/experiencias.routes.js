const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth'); // ✅ CORREGIDO: sin .middleware
const { uploadExperiencia } = require('../config/multer');
const {
  getExperiencias,
  getExperienciaById,
  crearExperiencia,
  toggleLike,
  getComentarios,
  agregarComentario,
  eliminarExperiencia
} = require('../controllers/experiencias.controller');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Obtener todas las experiencias (feed)
// Soporta query params: ?tipo=negativa&limit=20&offset=0
router.get('/', (req, res, next) => {
  // Si hay token, lo decodifica; si no, continúa sin usuario
  if (req.headers.authorization) {
    authenticateToken(req, res, next);
  } else {
    next();
  }
}, getExperiencias);

// Obtener una experiencia específica
router.get('/:id', (req, res, next) => {
  if (req.headers.authorization) {
    authenticateToken(req, res, next);
  } else {
    next();
  }
}, getExperienciaById);

// Obtener comentarios de una experiencia
router.get('/:id/comentarios', getComentarios);

// ========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ========================================

// Crear nueva experiencia (con imagen o video opcional)
router.post('/', authenticateToken, uploadExperiencia.single('media'), crearExperiencia);

// Dar/quitar like a una experiencia
router.post('/:id/like', authenticateToken, toggleLike);

// Agregar comentario a una experiencia
router.post('/:id/comentarios', authenticateToken, agregarComentario);

// Eliminar experiencia (solo el autor)
router.delete('/:id', authenticateToken, eliminarExperiencia);

module.exports = router;