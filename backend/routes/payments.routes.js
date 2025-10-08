const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticateToken, isEmpleador, isAdmin } = require('../middleware/auth');

// Rutas para empleadores
router.get('/configuracion', paymentsController.getConfiguracionPago); // ✅ Pública (solo muestra precio/número Yape)
router.post('/registrar', authenticateToken, isEmpleador, paymentsController.registrarPago);
router.get('/estado/:trabajo_id', authenticateToken, isEmpleador, paymentsController.verificarEstadoPago);

// Rutas ADMIN
router.get('/pendientes', authenticateToken, isAdmin, paymentsController.getPagosPendientes);
router.post('/procesar/:pago_id', authenticateToken, isAdmin, paymentsController.procesarPago);

module.exports = router;