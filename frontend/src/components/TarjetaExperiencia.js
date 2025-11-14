import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Experiencias.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function TarjetaExperiencia({ experiencia, onLikeToggle, onComentarioAgregado, onExperienciaEliminada }) {
  const { usuario, token } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);

  // Cargar comentarios cuando se muestran
  useEffect(() => {
    if (mostrarComentarios && comentarios.length === 0) {
      cargarComentarios();
    }
  }, [mostrarComentarios]);

  const cargarComentarios = async () => {
    setCargandoComentarios(true);
    try {
      const response = await fetch(`${API_URL}/api/experiencias/${experiencia.id}/comentarios`);
      if (response.ok) {
        const data = await response.json();
        setComentarios(data);
      }
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
    } finally {
      setCargandoComentarios(false);
    }
  };

  const handleLike = async () => {
    if (!usuario) {
      alert('Debes iniciar sesión para dar like');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/experiencias/${experiencia.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        onLikeToggle(experiencia.id, data.liked);
      }
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  const handleComentarioSubmit = async (e) => {
    e.preventDefault();
    
    if (!usuario) {
      alert('Debes iniciar sesión para comentar');
      return;
    }

    if (!nuevoComentario.trim()) return;

    setEnviandoComentario(true);
    try {
      const response = await fetch(`${API_URL}/api/experiencias/${experiencia.id}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comentario: nuevoComentario })
      });

      if (response.ok) {
        const data = await response.json();
        setComentarios([data.comentario, ...comentarios]);
        setNuevoComentario('');
        onComentarioAgregado(experiencia.id);
      }
    } catch (error) {
      console.error('Error al comentar:', error);
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm('¿Estás seguro de eliminar esta experiencia?')) return;

    try {
      const response = await fetch(`${API_URL}/api/experiencias/${experiencia.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onExperienciaEliminada(experiencia.id);
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-PE', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getTipoBadge = (tipo) => {
    const tipos = {
      negativa: { emoji: '⚠️', texto: 'Experiencia Negativa', clase: 'badge-negativa' },
      positiva: { emoji: '✅', texto: 'Experiencia Positiva', clase: 'badge-positiva' },
      neutral: { emoji: '💡', texto: 'Experiencia Neutral', clase: 'badge-neutral' }
    };
    return tipos[tipo] || tipos.neutral;
  };

  const badge = getTipoBadge(experiencia.tipo_experiencia);

  return (
    <div className="tarjeta-experiencia">
      {/* Header con autor */}
      <div className="experiencia-header">
        <div className="autor-info">
          <div className="autor-avatar">
            {experiencia.foto_usuario ? (
              <img src={`${API_URL}${experiencia.foto_usuario}`} alt={experiencia.nombre_usuario} />
            ) : (
              <div className="avatar-placeholder">
                {experiencia.nombre_usuario.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="autor-datos">
            <div className="autor-nombre">{experiencia.nombre_usuario}</div>
            <div className="experiencia-fecha">{formatearFecha(experiencia.created_at)}</div>
          </div>
        </div>

        {/* Badge de tipo */}
        <div className={`tipo-badge ${badge.clase}`}>
          <span>{badge.emoji}</span>
          <span>{badge.texto}</span>
        </div>

        {/* Botón eliminar (solo si es el autor) */}
        {usuario && usuario.id === experiencia.usuario_id && (
          <button className="btn-eliminar-exp" onClick={handleEliminar} title="Eliminar">
            🗑️
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className="experiencia-contenido">
        <h3 className="experiencia-titulo">{experiencia.titulo}</h3>
        <div className="experiencia-empresa">📍 {experiencia.nombre_empresa}</div>
        <p className="experiencia-descripcion">{experiencia.descripcion}</p>

        {/* Media (imagen o video) */}
        {experiencia.media_url && (
          <div className="experiencia-media">
            {experiencia.media_type === 'imagen' ? (
              <img src={`${API_URL}${experiencia.media_url}`} alt="Experiencia" />
            ) : (
              <video src={`${API_URL}${experiencia.media_url}`} controls />
            )}
          </div>
        )}
      </div>

      {/* Acciones (likes, comentarios) */}
      <div className="experiencia-acciones">
        <button 
          className={`accion-btn ${experiencia.usuario_dio_like ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!usuario}
        >
          <span className="accion-icon">{experiencia.usuario_dio_like ? '❤️' : '🤍'}</span>
          <span className="accion-text">{experiencia.likes_count || 0}</span>
        </button>

        <button 
          className="accion-btn"
          onClick={() => setMostrarComentarios(!mostrarComentarios)}
        >
          <span className="accion-icon">💬</span>
          <span className="accion-text">{experiencia.comentarios_count || 0}</span>
        </button>

        <button className="accion-btn" disabled>
          <span className="accion-icon">📤</span>
          <span className="accion-text">Compartir</span>
        </button>
      </div>

      {/* Sección de comentarios */}
      {mostrarComentarios && (
        <div className="experiencia-comentarios">
          {/* Formulario para nuevo comentario */}
          {usuario && (
            <form onSubmit={handleComentarioSubmit} className="comentario-form">
              <div className="comentario-avatar">
                {usuario.foto_perfil ? (
                  <img src={`${API_URL}${usuario.foto_perfil}`} alt={usuario.nombre} />
                ) : (
                  <div className="avatar-placeholder-small">
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Escribe un comentario..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                disabled={enviandoComentario}
              />
              <button 
                type="submit" 
                disabled={!nuevoComentario.trim() || enviandoComentario}
                className="btn-enviar-comentario"
              >
                ➤
              </button>
            </form>
          )}

          {/* Lista de comentarios */}
          <div className="comentarios-lista">
            {cargandoComentarios ? (
              <div className="comentarios-loading">Cargando comentarios...</div>
            ) : comentarios.length === 0 ? (
              <div className="comentarios-vacio">No hay comentarios todavía</div>
            ) : (
              comentarios.map(comentario => (
                <div key={comentario.id} className="comentario-item">
                  <div className="comentario-avatar">
                    {comentario.foto_usuario ? (
                      <img src={`${API_URL}${comentario.foto_usuario}`} alt={comentario.nombre_usuario} />
                    ) : (
                      <div className="avatar-placeholder-small">
                        {comentario.nombre_usuario.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="comentario-contenido">
                    <div className="comentario-autor">{comentario.nombre_usuario}</div>
                    <div className="comentario-texto">{comentario.comentario}</div>
                    <div className="comentario-fecha">{formatearFecha(comentario.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TarjetaExperiencia;