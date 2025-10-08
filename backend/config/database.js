const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'el_chambeador',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

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