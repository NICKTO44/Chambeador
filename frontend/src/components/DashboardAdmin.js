import React, { useState, useEffect } from 'react';
import PublicarTrabajo from './PublicarTrabajo'; // ✨ NUEVO
import './DashboardAdmin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DashboardAdmin({ token }) {
  const [vistaActual, setVistaActual] = useState('pagos');
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [todosTrabajos, setTodosTrabajos] = useState([]);
  const [trabajosFiltrados, setTrabajosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(null);
  const [notasModal, setNotasModal] = useState({ show: false, pagoId: null, accion: '' });
  const [notas, setNotas] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState({ show: false, trabajoId: null, titulo: '' });
  
  // Estados para filtros
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroAntiguedad, setFiltroAntiguedad] = useState('');
  const [busqueda, setBusqueda] = useState('');

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

  const estados = [
    { valor: 'activo', texto: 'Activo' },
    { valor: 'pendiente_pago', texto: 'Pendiente Pago' },
    { valor: 'pendiente_verificacion', texto: 'Pendiente Verificación' },
    { valor: 'inactivo', texto: 'Inactivo' }
  ];

  useEffect(() => {
    if (vistaActual === 'pagos') {
      cargarPagosPendientes();
    } else if (vistaActual === 'trabajos') {
      cargarTodosTrabajos();
    }
    // No hacemos nada para 'publicar', solo mostramos el componente
  }, [vistaActual]);

  useEffect(() => {
    aplicarFiltros();
  }, [todosTrabajos, filtroCategoria, filtroEstado, filtroAntiguedad, busqueda]);

  const calcularDiasDesdePublicacion = (fechaCreacion) => {
    const fechaTrabajo = new Date(fechaCreacion);
    const fechaActual = new Date();
    const diferenciaMilisegundos = fechaActual - fechaTrabajo;
    const diferenciaDias = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    return diferenciaDias;
  };

  const esTrabajoAntiguo = (fechaCreacion) => {
    return calcularDiasDesdePublicacion(fechaCreacion) >= 7;
  };

  const getAntiguedadInfo = (fechaCreacion) => {
    const dias = calcularDiasDesdePublicacion(fechaCreacion);
    
    if (dias >= 30) {
      return { clase: 'antiguedad-critica', texto: `⚠️ ${dias} días (Muy antiguo)`, dias };
    } else if (dias >= 14) {
      return { clase: 'antiguedad-alta', texto: `⚡ ${dias} días (Antiguo)`, dias };
    } else if (dias >= 7) {
      return { clase: 'antiguedad-media', texto: `⏰ ${dias} días (+1 semana)`, dias };
    } else {
      return { clase: 'antiguedad-reciente', texto: `📅 ${dias} día${dias !== 1 ? 's' : ''}`, dias };
    }
  };

  const aplicarFiltros = () => {
    let trabajosFiltrados = [...todosTrabajos];

    // Filtro por categoría
    if (filtroCategoria) {
      trabajosFiltrados = trabajosFiltrados.filter(
        trabajo => trabajo.categoria === filtroCategoria
      );
    }

    // Filtro por estado
    if (filtroEstado) {
      trabajosFiltrados = trabajosFiltrados.filter(
        trabajo => trabajo.estado === filtroEstado
      );
    }

    // Filtro por antigüedad
    if (filtroAntiguedad) {
      trabajosFiltrados = trabajosFiltrados.filter(trabajo => {
        const dias = calcularDiasDesdePublicacion(trabajo.created_at);
        
        switch(filtroAntiguedad) {
          case 'mas_1_semana':
            return dias >= 7;
          case 'mas_2_semanas':
            return dias >= 14;
          case 'mas_1_mes':
            return dias >= 30;
          case 'recientes':
            return dias < 7;
          default:
            return true;
        }
      });
    }

    // Búsqueda por título o empleador
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      trabajosFiltrados = trabajosFiltrados.filter(
        trabajo =>
          trabajo.titulo.toLowerCase().includes(busquedaLower) ||
          trabajo.empleador_nombre.toLowerCase().includes(busquedaLower)
      );
    }

    setTrabajosFiltrados(trabajosFiltrados);
  };

  const limpiarFiltros = () => {
    setFiltroCategoria('');
    setFiltroEstado('');
    setFiltroAntiguedad('');
    setBusqueda('');
  };

  const cargarPagosPendientes = async () => {
    setCargando(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/payments/pendientes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar pagos pendientes');
      }

      const data = await response.json();
      setPagosPendientes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cargarTodosTrabajos = async () => {
    setCargando(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/jobs?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar trabajos');
      }

      const data = await response.json();
      setTodosTrabajos(data.trabajos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalNotas = (pagoId, accion) => {
    setNotasModal({ show: true, pagoId, accion });
    setNotas('');
  };

  const cerrarModalNotas = () => {
    setNotasModal({ show: false, pagoId: null, accion: '' });
    setNotas('');
  };

  const procesarPago = async () => {
    const { pagoId, accion } = notasModal;
    setProcesando(pagoId);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/payments/procesar/${pagoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accion, notas: notas || null })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al procesar pago');
      }

      await cargarPagosPendientes();
      cerrarModalNotas();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  const abrirConfirmarEliminar = (trabajoId, titulo) => {
    setConfirmarEliminar({ show: true, trabajoId, titulo });
  };

  const cerrarConfirmarEliminar = () => {
    setConfirmarEliminar({ show: false, trabajoId: null, titulo: '' });
  };

  const eliminarTrabajo = async () => {
    const { trabajoId } = confirmarEliminar;
    setProcesando(trabajoId);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/jobs/admin/${trabajoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar trabajo');
      }

      await cargarTodosTrabajos();
      cerrarConfirmarEliminar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'activo': { class: 'badge-activo', text: '✓ Activo' },
      'pendiente_pago': { class: 'badge-pendiente-pago', text: '⏳ Pendiente Pago' },
      'pendiente_verificacion': { class: 'badge-pendiente-verificacion', text: '🔍 Pendiente Verificación' },
      'inactivo': { class: 'badge-inactivo', text: '● Inactivo' }
    };
    return badges[estado] || { class: '', text: estado };
  };

  // Contar trabajos antiguos (más de 1 semana)
  const trabajosAntiguos = todosTrabajos.filter(t => 
    t.estado === 'activo' && esTrabajoAntiguo(t.created_at)
  ).length;

  if (cargando && vistaActual !== 'publicar') {
    return (
      <div className="dashboard-admin">
        <h2>⚙️ Panel de Administración</h2>
        <div className="cargando">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-admin">
      <div className="admin-header">
        <h2>⚙️ Panel de Administración</h2>
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${vistaActual === 'pagos' ? 'active' : ''}`}
            onClick={() => setVistaActual('pagos')}
          >
            💳 Pagos Pendientes
            {pagosPendientes.length > 0 && (
              <span className="tab-badge">{pagosPendientes.length}</span>
            )}
          </button>
          <button 
            className={`tab-btn ${vistaActual === 'trabajos' ? 'active' : ''}`}
            onClick={() => setVistaActual('trabajos')}
          >
            📋 Todos los Trabajos
            <span className="tab-badge-info">{todosTrabajos.length}</span>
            {trabajosAntiguos > 0 && (
              <span className="tab-badge-warning">{trabajosAntiguos} antiguos</span>
            )}
          </button>
          {/* ✨ NUEVO TAB */}
          <button 
            className={`tab-btn ${vistaActual === 'publicar' ? 'active' : ''}`}
            onClick={() => setVistaActual('publicar')}
          >
            ✏️ Publicar Trabajo
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* VISTA: PAGOS PENDIENTES */}
      {vistaActual === 'pagos' && (
        <>
          {pagosPendientes.length === 0 ? (
            <div className="sin-pagos">
              <div className="icono-vacio">📭</div>
              <h3>No hay pagos pendientes</h3>
              <p>Todos los pagos han sido procesados</p>
            </div>
          ) : (
            <div className="tabla-pagos">
              <div className="contador-pagos">
                <strong>{pagosPendientes.length}</strong> pago{pagosPendientes.length !== 1 ? 's' : ''} pendiente{pagosPendientes.length !== 1 ? 's' : ''} de verificación
              </div>

              {pagosPendientes.map((pago) => (
                <div key={pago.id} className="pago-card">
                  <div className="pago-header-card">
                    <span className="pago-id">ID #{pago.id}</span>
                    <span className="pago-fecha">{formatearFecha(pago.fecha_pago)}</span>
                  </div>

                  <div className="pago-info">
                    <div className="info-trabajo">
                      <h3>📋 {pago.titulo}</h3>
                      <p className="empleador-info">
                        👤 <strong>{pago.empleador_nombre}</strong>
                        <br />
                        📧 {pago.empleador_email}
                      </p>
                    </div>

                    <div className="info-pago">
                      <div className="pago-detalle">
                        <span className="label">Código de operación:</span>
                        <span className="valor codigo">{pago.codigo_operacion}</span>
                      </div>
                      <div className="pago-detalle">
                        <span className="label">Monto:</span>
                        <span className="valor monto">S/ {parseFloat(pago.monto).toFixed(2)}</span>
                      </div>
                      <div className="pago-detalle">
                        <span className="label">Método:</span>
                        <span className="valor metodo">{pago.metodo_pago.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pago-acciones">
                    <button
                      className="btn-rechazar"
                      onClick={() => abrirModalNotas(pago.id, 'rechazar')}
                      disabled={procesando === pago.id}
                    >
                      ❌ Rechazar
                    </button>
                    <button
                      className="btn-verificar"
                      onClick={() => abrirModalNotas(pago.id, 'verificar')}
                      disabled={procesando === pago.id}
                    >
                      ✅ Verificar y Activar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* VISTA: TODOS LOS TRABAJOS */}
      {vistaActual === 'trabajos' && (
        <>
          {/* ALERTA DE TRABAJOS ANTIGUOS */}
          {trabajosAntiguos > 0 && (
            <div className="alerta-trabajos-antiguos">
              <div className="alerta-icono">⚠️</div>
              <div className="alerta-contenido">
                <strong>¡Atención!</strong> Tienes <strong>{trabajosAntiguos}</strong> trabajo{trabajosAntiguos !== 1 ? 's' : ''} activo{trabajosAntiguos !== 1 ? 's' : ''} con más de 1 semana de antigüedad.
                <button 
                  className="btn-ver-antiguos"
                  onClick={() => setFiltroAntiguedad('mas_1_semana')}
                >
                  Ver trabajos antiguos →
                </button>
              </div>
            </div>
          )}

          {/* FILTROS */}
          <div className="filtros-container">
            <div className="filtros-header">
              <h3>🔍 Filtros</h3>
              {(filtroCategoria || filtroEstado || filtroAntiguedad || busqueda) && (
                <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
                  ✕ Limpiar filtros
                </button>
              )}
            </div>

            <div className="filtros-grid">
              <div className="filtro-item">
                <label>🔎 Buscar:</label>
                <input
                  type="text"
                  placeholder="Buscar por título o empleador..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="input-busqueda"
                />
              </div>

              <div className="filtro-item">
                <label>📂 Categoría:</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="select-filtro"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-item">
                <label>📊 Estado:</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="select-filtro"
                >
                  <option value="">Todos los estados</option>
                  {estados.map((est) => (
                    <option key={est.valor} value={est.valor}>{est.texto}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-item">
                <label>⏰ Antigüedad:</label>
                <select
                  value={filtroAntiguedad}
                  onChange={(e) => setFiltroAntiguedad(e.target.value)}
                  className="select-filtro"
                >
                  <option value="">Todas las fechas</option>
                  <option value="recientes">📅 Menos de 1 semana</option>
                  <option value="mas_1_semana">⚠️ Más de 1 semana</option>
                  <option value="mas_2_semanas">⚡ Más de 2 semanas</option>
                  <option value="mas_1_mes">🔥 Más de 1 mes</option>
                </select>
              </div>
            </div>
          </div>

          {/* RESULTADOS */}
          {trabajosFiltrados.length === 0 ? (
            <div className="sin-pagos">
              <div className="icono-vacio">📭</div>
              <h3>No se encontraron trabajos</h3>
              <p>
                {todosTrabajos.length === 0 
                  ? 'No hay trabajos publicados' 
                  : 'Intenta con otros filtros'}
              </p>
            </div>
          ) : (
            <div className="tabla-trabajos">
              <div className="contador-trabajos">
                Mostrando <strong>{trabajosFiltrados.length}</strong> de <strong>{todosTrabajos.length}</strong> trabajos
              </div>

              {trabajosFiltrados.map((trabajo) => {
                const antiguedadInfo = getAntiguedadInfo(trabajo.created_at);
                const esAntiguo = esTrabajoAntiguo(trabajo.created_at);
                
                return (
                  <div 
                    key={trabajo.id} 
                    className={`trabajo-card-admin ${esAntiguo ? 'trabajo-antiguo' : ''}`}
                  >
                    <div className="trabajo-header">
                      <div className="trabajo-info-header">
                        <h3>{trabajo.titulo}</h3>
                        <div className="badges-grupo">
                          <span className={`estado-badge ${getEstadoBadge(trabajo.estado).class}`}>
                            {getEstadoBadge(trabajo.estado).text}
                          </span>
                          <span className={`antiguedad-badge ${antiguedadInfo.clase}`}>
                            {antiguedadInfo.texto}
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn-eliminar-trabajo"
                        onClick={() => abrirConfirmarEliminar(trabajo.id, trabajo.titulo)}
                        disabled={procesando === trabajo.id}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>

                    <div className="trabajo-detalles">
                      <div className="detalle-item">
                        <span className="detalle-label">📂 Categoría:</span>
                        <span>{trabajo.categoria}</span>
                      </div>
                      <div className="detalle-item">
                        <span className="detalle-label">👤 Empleador:</span>
                        <span>{trabajo.empleador_nombre}</span>
                      </div>
                      <div className="detalle-item">
                        <span className="detalle-label">📅 Publicado:</span>
                        <span>{formatearFecha(trabajo.created_at)}</span>
                      </div>
                      {trabajo.pago_estimado && (
                        <div className="detalle-item">
                          <span className="detalle-label">💰 Pago:</span>
                          <span>S/ {parseFloat(trabajo.pago_estimado).toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="trabajo-descripcion">
                      <p>{trabajo.descripcion.substring(0, 150)}...</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ✨ VISTA: PUBLICAR TRABAJO (NUEVO) */}
      {vistaActual === 'publicar' && (
        <div className="vista-publicar-admin">
          <div className="info-admin-publicar">
            <div className="icono-info-admin">ℹ️</div>
            <div>
              <strong>Privilegio de Administrador</strong>
              <p>Como admin, tus publicaciones se activan inmediatamente sin necesidad de pago. Duración: 7 días.</p>
            </div>
          </div>
          <PublicarTrabajo 
            token={token} 
            onPublicado={() => {
              setVistaActual('trabajos');
              cargarTodosTrabajos();
            }}
          />
        </div>
      )}

      {/* Modal de confirmación de pago */}
      {notasModal.show && (
        <div className="modal-overlay-admin">
          <div className="modal-notas">
            <h3>
              {notasModal.accion === 'verificar' ? '✅ Verificar Pago' : '❌ Rechazar Pago'}
            </h3>
            <p>
              {notasModal.accion === 'verificar'
                ? 'El trabajo será publicado y visible para todos.'
                : 'El trabajo volverá a estado "Pendiente de Pago".'}
            </p>

            <div className="form-group-modal">
              <label>Notas (opcional):</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Agrega un comentario o razón..."
                rows="3"
              />
            </div>

            <div className="modal-botones">
              <button className="btn-cancelar-modal" onClick={cerrarModalNotas}>
                Cancelar
              </button>
              <button
                className={notasModal.accion === 'verificar' ? 'btn-confirmar-modal' : 'btn-rechazar-modal'}
                onClick={procesarPago}
                disabled={procesando}
              >
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminar trabajo */}
      {confirmarEliminar.show && (
        <div className="modal-overlay-admin">
          <div className="modal-notas">
            <h3>🗑️ Eliminar Trabajo</h3>
            <p>¿Estás seguro de eliminar este trabajo?</p>
            <div className="trabajo-a-eliminar">
              <strong>{confirmarEliminar.titulo}</strong>
            </div>
            <p className="advertencia-eliminar">
              ⚠️ Esta acción no se puede deshacer. El trabajo y todos sus datos relacionados serán eliminados permanentemente.
            </p>

            <div className="modal-botones">
              <button className="btn-cancelar-modal" onClick={cerrarConfirmarEliminar}>
                Cancelar
              </button>
              <button
                className="btn-eliminar-modal"
                onClick={eliminarTrabajo}
                disabled={procesando}
              >
                {procesando ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardAdmin;