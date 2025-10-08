const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas
router.get('/sugerencias', searchController.obtenerSugerencias);
router.get('/populares', searchController.obtenerBusquedasPopulares);
router.get('/correccion', searchController.obtenerCorreccion);

// Rutas protegidas (opcional - registrar búsqueda funciona con o sin auth)
router.post('/registrar', searchController.registrarBusqueda);

module.exports = router;