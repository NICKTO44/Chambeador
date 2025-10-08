import React, { useState, useEffect } from 'react';
import ModalPagoYape from './ModalPagoYape';
import './MisPublicaciones.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function MisPublicaciones({ token }) {
  const [trabajos, setTrabajos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [trabajoEditando, setTrabajoEditando] = useState(null);
  const [trabajoRenovando, setTrabajoRenovando] = useState(null);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);

  useEffect(() => {
    cargarMisTrabajos();
  }, []);

  const cargarMisTrabajos = async () => {
    setCargando(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/jobs/mis-publicaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar publicaciones');
      }

      setTrabajos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/jobs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar trabajo');
      }

      setTrabajos(trabajos.filter(t => t.id !== id));
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleEditar = (trabajo) => {
    setTrabajoEditando({
      ...trabajo,
      pago_estimado: trabajo.pago_estimado || ''
    });
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/jobs/${trabajoEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(trabajoEditando)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar trabajo');
      }

      setTrabajos(trabajos.map(t =>
        t.id === trabajoEditando.id ? trabajoEditando : t
      ));
      setTrabajoEditando(null);
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  const handleCambioEdicion = (e) => {
    setTrabajoEditando({
      ...trabajoEditando,
      [e.target.name]: e.target.value
    });
  };

  const handleRenovar = (trabajo) => {
    setTrabajoRenovando(trabajo);
    setMostrarModalPago(true);
  };

  const handlePagoRenovacion = async (codigoOperacion) => {
    try {
      const response = await fetch(`${API_URL}/api/jobs/${trabajoRenovando.id}/renovar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ codigo_operacion: codigoOperacion })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al solicitar renovación');
      }

      alert('Renovación solicitada. El administrador verificará tu pago pronto.');
      setMostrarModalPago(false);
      setTrabajoRenovando(null);
      cargarMisTrabajos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calcularDiasRestantes = (fechaExpiracion) => {
    if (!fechaExpiracion) return null;
    const ahora = new Date();
    const expira = new Date(fechaExpiracion);
    const diferencia = expira - ahora;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  };

  const obtenerClaseExpiracion = (nivelExpiracion) => {
    switch (nivelExpiracion) {
      case 'expirado': return 'expirado';
      case 'critico': return 'critico';
      case 'advertencia': return 'advertencia';
      default: return 'normal';
    }
  };

  const obtenerMensajeExpiracion = (trabajo) => {
    const dias = calcularDiasRestantes(trabajo.fecha_expiracion);
    
    if (!trabajo.fecha_expiracion) {
      return null;
    }

    if (dias < 0) {
      return { texto: 'Trabajo expirado', icono: '⏰' };
    }
    if (dias === 0) {
      return { texto: 'Expira hoy', icono: '⚠️' };
    }
    if (dias === 1) {
      return { texto: 'Expira mañana', icono: '⚠️' };
    }
    if (dias <= 3) {
      return { texto: `Expira en ${dias} días`, icono: '⏱️' };
    }
    return { texto: `Expira en ${dias} días`, icono: '📅' };
  };

  if (cargando) {
    return (
      <div className="cargando">
        <div className="spinner"></div>
        <p>Cargando tus publicaciones...</p>
      </div>
    );
  }

  return (
    <div className="mis-publicaciones-container">
      <h2>Mis Publicaciones</h2>

      {error && <div className="error-message">{error}</div>}

      {trabajos.length === 0 ? (
        <div className="sin-resultados">
          <p>Aún no has publicado ningún trabajo</p>
          <p>¡Empieza a publicar oportunidades laborales!</p>
        </div>
      ) : (
        <div className="publicaciones-lista">
          {trabajos.map((trabajo) => {
            const mensajeExpiracion = obtenerMensajeExpiracion(trabajo);
            const diasRestantes = calcularDiasRestantes(trabajo.fecha_expiracion);

            return (
              <div key={trabajo.id} className={`publicacion-item ${obtenerClaseExpiracion(trabajo.nivel_expiracion)}`}>
                {/* Alerta de expiración */}
                {mensajeExpiracion && diasRestantes <= 3 && (
                  <div className={`alerta-expiracion ${trabajo.nivel_expiracion}`}>
                    <span className="icono-alerta">{mensajeExpiracion.icono}</span>
                    <span className="texto-alerta">{mensajeExpiracion.texto}</span>
                    {diasRestantes >= 0 && (
                      <button 
                        className="btn-renovar-inline"
                        onClick={() => handleRenovar(trabajo)}
                      >
                        Renovar por S/ 10
                      </button>
                    )}
                  </div>
                )}

                <div className="publicacion-header">
                  <div>
                    <h3>{trabajo.titulo}</h3>
                    <span className="categoria-badge">{trabajo.categoria}</span>
                    <span className={`estado-badge ${trabajo.estado}`}>
                      {trabajo.estado === 'activo' ? '✓ Activo' : 
                       trabajo.estado === 'pendiente_pago' ? '⏳ Pendiente pago' :
                       trabajo.estado === 'pendiente_verificacion' ? '🔄 Verificando pago' :
                       '✕ Inactivo'}
                    </span>
                    {mensajeExpiracion && diasRestantes > 3 && (
                      <span className="info-expiracion">
                        {mensajeExpiracion.icono} {mensajeExpiracion.texto}
                      </span>
                    )}
                  </div>
                  <div className="publicacion-acciones">
                    <button
                      className="btn-editar"
                      onClick={() => handleEditar(trabajo)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={() => handleEliminar(trabajo.id)}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>

                <p className="publicacion-descripcion">{trabajo.descripcion}</p>

                <div className="publicacion-info">
                  {trabajo.ubicacion && (
                    <span>📍 {trabajo.ubicacion}</span>
                  )}
                  <span>
                    💰 {trabajo.pago_estimado
                      ? `S/ ${parseFloat(trabajo.pago_estimado).toFixed(2)}`
                      : 'A convenir'}
                  </span>
                  <span>📅 {formatearFecha(trabajo.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de edición */}
      {trabajoEditando && (
        <div className="modal-overlay" onClick={() => setTrabajoEditando(null)}>
          <div className="modal-content modal-editar" onClick={(e) => e.stopPropagation()}>
            <button className="btn-cerrar" onClick={() => setTrabajoEditando(null)}>
              ✕
            </button>

            <h3>Editar Publicación</h3>

            <form onSubmit={handleGuardarEdicion} className="form-editar">
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  name="titulo"
                  value={trabajoEditando.titulo}
                  onChange={handleCambioEdicion}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={trabajoEditando.descripcion}
                  onChange={handleCambioEdicion}
                  required
                  rows="5"
                />
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select
                  name="categoria"
                  value={trabajoEditando.categoria}
                  onChange={handleCambioEdicion}
                  required
                >
                  <option value="Construcción">Construcción</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Tecnología">Tecnología</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Gastronomía">Gastronomía</option>
                  <option value="Educación">Educación</option>
                  <option value="Salud">Salud</option>
                  <option value="Comercio">Comercio</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pago (S/)</label>
                  <input
                    type="number"
                    name="pago_estimado"
                    value={trabajoEditando.pago_estimado}
                    onChange={handleCambioEdicion}
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Ubicación</label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={trabajoEditando.ubicacion || ''}
                    onChange={handleCambioEdicion}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contacto adicional</label>
                <input
                  type="text"
                  name="contacto"
                  value={trabajoEditando.contacto || ''}
                  onChange={handleCambioEdicion}
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado"
                  value={trabajoEditando.estado}
                  onChange={handleCambioEdicion}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setTrabajoEditando(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de pago para renovación */}
      {mostrarModalPago && trabajoRenovando && (
        <ModalPagoYape
          monto={10.00}
          onPagoConfirmado={handlePagoRenovacion}
          onCancelar={() => {
            setMostrarModalPago(false);
            setTrabajoRenovando(null);
          }}
          textoBoton="Confirmar Renovación"
          titulo={`Renovar: ${trabajoRenovando.titulo}`}
          descripcion="Paga S/ 10.00 para extender tu publicación por 7 días más"
        />
      )}
    </div>
  );
}

export default MisPublicaciones;