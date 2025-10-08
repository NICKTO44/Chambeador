const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas
router.post('/registro', authController.registro);
router.post('/login', authController.login);

// Rutas protegidas
router.get('/perfil', authenticateToken, authController.getPerfil);

module.exports = router;
