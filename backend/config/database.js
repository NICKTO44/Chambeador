const mysql = require('mysql2/promise');
require('dotenv').config();

// ✅ Soporte para DATABASE_URL (Railway) o variables individuales (local)
let pool;

if (process.env.DATABASE_URL) {
  // Railway: usar URL completa
  pool = mysql.createPool(process.env.DATABASE_URL);
  console.log('🔗 Usando DATABASE_URL para conexión');
} else {
  // Local: usar variables individuales
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'el_chambeador',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  
  pool = mysql.createPool(dbConfig);
  console.log('🔗 Usando variables individuales para conexión');
}

// Verificar conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida');
    connection.release();
  } catch (err) {
    // En desarrollo muestra el error, en producción solo mensaje genérico
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Error al conectar con la base de datos');
    } else {
      console.error('❌ Error al conectar con la base de datos:', err.message);
    }
    process.exit(1);
  }
};

module.exports = { pool, testConnection };