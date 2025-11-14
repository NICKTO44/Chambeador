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
const perfilRoutes = require('./routes/perfil.routes');
const experienciasRoutes = require('./routes/experiencias.routes'); // ✨ NUEVO

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================

// ✅ CORS seguro - múltiples dominios permitidos
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 Request desde origin:', origin);
    
    const allowedOrigins = [
      'https://elchambeador.info',
      'https://www.elchambeador.info',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Permitir requests sin origin (mobile apps, postman)
    if (!origin) {
      console.log('✅ Request sin origin - permitido');
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin permitido:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS bloqueado para origen:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());

// ✨ Servir archivos estáticos (uploads)
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

// Rutas de perfil
app.use('/api/perfil', perfilRoutes);

// ✨ NUEVO: Rutas de experiencias laborales
app.use('/api/experiencias', experienciasRoutes);

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