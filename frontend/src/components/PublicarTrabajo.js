import React, { useState, useEffect } from 'react';
import ModalPagoYape from './ModalPagoYape';
import './PublicarTrabajo.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PublicarTrabajo({ token, onPublicado, userRole }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    pago_estimado: '',
    ubicacion: '',
    contacto: '',
    telefono_contacto: '' // ✨ NUEVO campo
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  
  // Nuevos estados para el flujo de pago
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [trabajoCreado, setTrabajoCreado] = useState(null);
  
  // Estado para precio dinámico
  const [precioPublicacion, setPrecioPublicacion] = useState('10.00');
  
  // ✨ NUEVO: Detectar si es admin
  const [esAdmin, setEsAdmin] = useState(false);

  const categorias = [
    'Construcción',
    'Limpieza',
    'Tecnología',
    'Transporte',
    'Gastronomía',
    'Educación',
    'Salud',
    'Comercio',
    'Alquileres',
    'Otros'
  ];

  // Cargar precio y verificar rol
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        // Cargar precio
        const response = await fetch(`${API_URL}/api/payments/configuracion`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPrecioPublicacion(data.precio_publicacion);
        }

        // ✨ NUEVO: Verificar si es admin (decodificar token o recibir como prop)
        if (userRole === 'admin') {
          setEsAdmin(true);
        } else {
          // Decodificar token para verificar rol
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.rol === 'admin') {
            setEsAdmin(true);
          }
        }
      } catch (err) {
        console.log('Error al cargar configuración:', err);
      }
    };
    
    cargarConfiguracion();
  }, [token, userRole]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setExito(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✨ NUEVO: Validar teléfono para admin
    if (esAdmin && !formData.telefono_contacto.trim()) {
      setError('El teléfono de contacto del cliente es obligatorio');
      return;
    }

    setCargando(true);
    setError('');
    setExito(false);

    try {
      const response = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear trabajo');
      }

      if (data.esAdmin) {
        // Admin: Publicado directamente
        setExito(true);
        setFormData({
          titulo: '',
          descripcion: '',
          categoria: '',
          pago_estimado: '',
          ubicacion: '',
          contacto: '',
          telefono_contacto: ''
        });

        setTimeout(() => {
          onPublicado();
        }, 2000);
      } else {
        // Empleador: Mostrar modal de pago
        setTrabajoCreado(data.id);
        setMostrarModalPago(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handlePagoConfirmado = () => {
    setMostrarModalPago(false);
    setExito(true);
    setFormData({
      titulo: '',
      descripcion: '',
      categoria: '',
      pago_estimado: '',
      ubicacion: '',
      contacto: '',
      telefono_contacto: ''
    });

    setTimeout(() => {
      onPublicado();
    }, 3000);
  };

  const handleCerrarModal = () => {
    setMostrarModalPago(false);
    setError('Pago cancelado. El trabajo quedó guardado como borrador. Puedes completar el pago desde "Mis Publicaciones".');
  };

  return (
    <div className="publicar-trabajo-container">
      <div className="publicar-card">
        <h2>Publicar Nueva Oportunidad</h2>
        <p className="subtitulo">Completa los detalles del trabajo que necesitas</p>

        {error && <div className="error-message">{error}</div>}
        {exito && (
          <div className="success-message">
            ✓ Trabajo publicado exitosamente. Redirigiendo...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="publicar-form">
          <div className="form-group">
            <label htmlFor="titulo">Título del trabajo *</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              placeholder="Ej: Se busca albañil con experiencia"
              maxLength="200"
            />
          </div>

          <div className="form-group">
            <label htmlFor="categoria">Categoría *</label>
            <select
              id="categoria"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción completa *</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              required
              placeholder="Describe las responsabilidades, requisitos y cualquier información relevante..."
              rows="6"
            />
            <small>{formData.descripcion.length} caracteres</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pago_estimado">Pago estimado (S/)</label>
              <input
                type="number"
                id="pago_estimado"
                name="pago_estimado"
                value={formData.pago_estimado}
                onChange={handleChange}
                placeholder="Ej: 1500"
                step="0.01"
                min="0"
              />
              <small>Déjalo en blanco si es "A Tratar"</small>
            </div>

            <div className="form-group">
              <label htmlFor="ubicacion">Ubicación</label>
              <input
                type="text"
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                placeholder="Ej: Lima, San Isidro"
                maxLength="200"
              />
            </div>
          </div>

          {/* ✨ NUEVO: Campo de teléfono - Solo visible para ADMIN */}
          {esAdmin && (
            <div className="form-group campo-admin">
              <label htmlFor="telefono_contacto">
                📞 Teléfono de contacto del cliente *
              </label>
              <input
                type="tel"
                id="telefono_contacto"
                name="telefono_contacto"
                value={formData.telefono_contacto}
                onChange={handleChange}
                required={esAdmin}
                placeholder="Ej: 987654321"
                maxLength="20"
                pattern="[0-9]{9,20}"
              />
              <small className="campo-admin-ayuda">
                ℹ️ Este número se usará en los botones de WhatsApp y llamadas
              </small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="contacto">Información de contacto adicional</label>
            <input
              type="text"
              id="contacto"
              name="contacto"
              value={formData.contacto}
              onChange={handleChange}
              placeholder="Ej: Llamar después de las 6pm, email, horarios"
              maxLength="100"
            />
            <small>
              {esAdmin 
                ? 'Información extra que aparecerá en la descripción'
                : 'Tu teléfono registrado se mostrará automáticamente'}
            </small>
          </div>

          {/* Aviso de pago - Solo para empleadores */}
          {!esAdmin && (
            <div className="aviso-pago">
              <div className="icono-info">ℹ️</div>
              <div className="texto-aviso">
                <strong>Costo de publicación: S/ {precioPublicacion}</strong>
                <p>Después de completar el formulario, procederás a realizar el pago mediante Yape para activar tu publicación.</p>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancelar"
              onClick={onPublicado}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-publicar" disabled={cargando}>
              {cargando ? 'Procesando...' : esAdmin ? 'Publicar Trabajo →' : 'Continuar al Pago →'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de pago */}
      {mostrarModalPago && (
        <ModalPagoYape
          trabajo_id={trabajoCreado}
          token={token}
          onPagoConfirmado={handlePagoConfirmado}
          onCerrar={handleCerrarModal}
        />
      )}
    </div>
  );
}

export default PublicarTrabajo;