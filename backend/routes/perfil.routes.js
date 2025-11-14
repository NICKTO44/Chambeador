const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfil.controller');
const { authenticateToken } = require('../middleware/auth');
const { uploadFoto, uploadCV } = require('../config/multer');

// ========================================
// RUTA PÚBLICA - Perfil público
// ========================================
// Esta ruta NO requiere autenticación (cualquiera puede ver perfiles)
router.get('/publico/:id', perfilController.getPerfilPublico);

// ========================================
// RUTAS PRIVADAS - Requieren autenticación
// ========================================
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