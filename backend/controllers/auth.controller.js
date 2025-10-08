const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

// Registro de usuario
const registro = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono, tipo_documento, numero_documento } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (!['empleador', 'trabajador'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Validación de documento para empleadores
    if (rol === 'empleador') {
      if (!tipo_documento || !numero_documento) {
        return res.status(400).json({ error: 'Los empleadores deben proporcionar DNI o RUC' });
      }

      if (!['DNI', 'RUC'].includes(tipo_documento)) {
        return res.status(400).json({ error: 'Tipo de documento inválido' });
      }

      // Validar longitud según tipo
      if (tipo_documento === 'DNI' && numero_documento.length !== 8) {
        return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' });
      }

      if (tipo_documento === 'RUC' && numero_documento.length !== 11) {
        return res.status(400).json({ error: 'El RUC debe tener 11 dígitos' });
      }

      // Verificar que el documento no esté registrado
      const [existingDoc] = await pool.query(
        'SELECT id FROM usuarios WHERE numero_documento = ? AND rol = ?',
        [numero_documento, 'empleador']
      );

      if (existingDoc.length > 0) {
        return res.status(400).json({ error: 'Este documento ya está registrado' });
      }
    }

    // Verificar si el email ya existe
    const [existingUser] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, telefono, tipo_documento, numero_documento) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        nombre, 
        email, 
        hashedPassword, 
        rol, 
        telefono || null,
        rol === 'empleador' ? tipo_documento : null,
        rol === 'empleador' ? numero_documento : null
      ]
    );

    // Generar token con expiración de 24 horas
    const token = jwt.sign(
      { id: result.insertId, email, rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: result.insertId, nombre, email, rol }
    });
  } catch (error) {
    // Solo log detallado en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error en registro:', error);
    }
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    // Buscar usuario
    const [users] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token con expiración de 24 horas
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    // Solo log detallado en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error en login:', error);
    }
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Obtener perfil del usuario actual
const getPerfil = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, nombre, email, rol, telefono, tipo_documento, numero_documento FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(users[0]);
  } catch (error) {
    // Solo log detallado en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al obtener perfil:', error);
    }
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

module.exports = {
  registro,
  login,
  getPerfil
};