const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambiar_en_produccion';

// Middleware para verificar token JWT con validación de expiración
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Verificar si el error es por expiración
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
      }
      // Otros errores de token (inválido, malformado, etc)
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar rol empleador
const isEmpleador = (req, res, next) => {
  if (req.user.rol !== 'empleador') {
    return res.status(403).json({ error: 'Solo los empleadores tienen acceso a esta función' });
  }
  next();
};

// Middleware para verificar rol trabajador
const isTrabajador = (req, res, next) => {
  if (req.user.rol !== 'trabajador') {
    return res.status(403).json({ error: 'Solo los trabajadores tienen acceso a esta función' });
  }
  next();
};

// Middleware para verificar rol administrador
const isAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

// ✨ NUEVO: Middleware para empleadores Y administradores
const isEmpleadorOrAdmin = (req, res, next) => {
  if (req.user.rol !== 'empleador' && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo empleadores y administradores pueden publicar trabajos' });
  }
  next();
};

// Exportar TODO al final (UNA SOLA VEZ)
module.exports = {
  authenticateToken,
  isEmpleador,
  isTrabajador,
  isAdmin,
  isEmpleadorOrAdmin, // ✨ NUEVO
  JWT_SECRET
};