import React, { useState } from 'react';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Registro({ onRegistro, onCambiarVista }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmarPassword: '',
    rol: 'trabajador',
    telefono: '',
    tipo_documento: 'DNI',
    numero_documento: ''
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    // Validación de contraseñas
    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      setCargando(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setCargando(false);
      return;
    }

    // Validación de documento para empleadores
    if (formData.rol === 'empleador') {
      if (!formData.numero_documento) {
        setError('Los empleadores deben ingresar DNI o RUC');
        setCargando(false);
        return;
      }

      if (formData.tipo_documento === 'DNI' && formData.numero_documento.length !== 8) {
        setError('El DNI debe tener 8 dígitos');
        setCargando(false);
        return;
      }

      if (formData.tipo_documento === 'RUC' && formData.numero_documento.length !== 11) {
        setError('El RUC debe tener 11 dígitos');
        setCargando(false);
        return;
      }

      // Validar que solo contenga números
      if (!/^\d+$/.test(formData.numero_documento)) {
        setError('El documento debe contener solo números');
        setCargando(false);
        return;
      }
    }

    try {
      const { confirmarPassword, ...datosEnvio } = formData;

      // Si es trabajador, no enviar datos de documento
      if (formData.rol === 'trabajador') {
        delete datosEnvio.tipo_documento;
        delete datosEnvio.numero_documento;
      }

      const response = await fetch(`${API_URL}/api/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosEnvio)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }

      onRegistro(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Crear Cuenta</h2>
        <p className="auth-subtitle">Únete a El Chambeador</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Juan Pérez"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="tu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              required
              placeholder="+51 999 999 999"
            />
          </div>

          <div className="form-group">
            <label htmlFor="rol">Tipo de Usuario</label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
            >
              <option value="trabajador">Trabajador - Busco empleo</option>
              <option value="empleador">Empleador - Ofrezco empleo</option>
            </select>
          </div>

          {/* Campos de documento solo para empleadores */}
          {formData.rol === 'empleador' && (
            <>
              <div className="form-group">
                <label htmlFor="tipo_documento">Tipo de Documento</label>
                <select
                  id="tipo_documento"
                  name="tipo_documento"
                  value={formData.tipo_documento}
                  onChange={handleChange}
                  required
                >
                  <option value="DNI">DNI (8 dígitos)</option>
                  <option value="RUC">RUC (11 dígitos)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="numero_documento">
                  Número de {formData.tipo_documento}
                </label>
                <input
                  type="text"
                  id="numero_documento"
                  name="numero_documento"
                  value={formData.numero_documento}
                  onChange={handleChange}
                  required
                  placeholder={formData.tipo_documento === 'DNI' ? '12345678' : '12345678901'}
                  maxLength={formData.tipo_documento === 'DNI' ? 8 : 11}
                />
                <small className="form-help">
                  {formData.tipo_documento === 'DNI' 
                    ? 'Ingresa tu DNI de 8 dígitos' 
                    : 'Ingresa tu RUC de 11 dígitos'}
                </small>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmarPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmarPassword"
              name="confirmarPassword"
              value={formData.confirmarPassword}
              onChange={handleChange}
              required
              placeholder="Repite tu contraseña"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿Ya tienes cuenta?{' '}
            <button className="link-button" onClick={() => onCambiarVista('login')}>
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Registro;