const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');
const { authenticateToken, isEmpleador, isAdmin, isEmpleadorOrAdmin } = require('../middleware/auth'); // ✨ Agregado isEmpleadorOrAdmin

// IMPORTANTE: Rutas específicas ANTES de rutas con parámetros

// Rutas protegidas para empleadores
router.get('/mis-publicaciones', authenticateToken, isEmpleador, jobsController.getMisPublicacionesConExpiracion);
router.put('/:id', authenticateToken, isEmpleador, jobsController.updateJob);
router.delete('/:id', authenticateToken, isEmpleador, jobsController.deleteJob);

// ✨ NUEVO: Rutas de renovación
router.post('/:id/renovar', authenticateToken, isEmpleador, jobsController.solicitarRenovacion);

// ✨ MODIFICADO: Crear trabajo (empleadores Y admins)
router.post('/', authenticateToken, isEmpleadorOrAdmin, jobsController.createJob);

// Rutas protegidas para ADMIN
router.delete('/admin/:id', authenticateToken, isAdmin, jobsController.deleteJobAdmin);
router.get('/admin/renovaciones', authenticateToken, isAdmin, jobsController.getRenovacionesPendientes);
router.post('/admin/renovaciones/:id/verificar', authenticateToken, isAdmin, jobsController.verificarRenovacion);
router.post('/admin/desactivar-expirados', authenticateToken, isAdmin, jobsController.desactivarTrabajosExpirados);

// Rutas públicas (DESPUÉS)
router.get('/', jobsController.getAllJobs);
router.get('/:id', jobsController.getJobById);

module.exports = router;