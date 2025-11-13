const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfil.controller');
const { authenticateToken } = require('../middleware/auth');
const { uploadFoto, uploadCV } = require('../config/multer');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener perfil del usuario actual
router.get('/', perfilController.getPerfil);

// Actualizar datos del perfil (sin archivos)
router.put('/', perfilController.actualizarPerfil);

// Subir foto de perfil
router.post('/foto', uploadFoto.single('foto'), perfilController.subirFotoPerfil);

// Subir CV (solo trabajadores)
router.post('/cv', uploadCV.single('cv'), perfilController.subirCV);

module.exports = router;