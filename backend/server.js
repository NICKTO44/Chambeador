const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar configuración y rutas
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const jobsRoutes = require('./routes/jobs.routes');
const paymentsRoutes = require('./routes/payments.routes');
const searchRoutes = require('./routes/search.routes');
const perfilRoutes = require('./routes/perfil.routes'); // ✨ NUEVO

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================

// ✅ CORS seguro - solo dominios permitidos
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://tudominio.com'
    : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// ✨ NUEVO: Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== RUTAS ====================

// Ruta de bienvenida - sin exponer información sensible
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de trabajos
app.use('/api/jobs', jobsRoutes);

// Rutas de pagos
app.use('/api/payments', paymentsRoutes);

// Rutas de búsqueda inteligente
app.use('/api/search', searchRoutes);

// ✨ NUEVO: Rutas de perfil
app.use('/api/perfil', perfilRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ==================== INICIAR SERVIDOR ====================
const startServer = async () => {
  // Verificar conexión a la base de datos
  await testConnection();
  
  // Iniciar servidor
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
};

startServer();