import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Experiencias.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function TarjetaExperiencia({ experiencia, onLikeToggle, onComentarioAgregado, onExperienciaEliminada }) {
  const { usuario, token } = useAuth();
  const navigate = useNavigate();
  const [comentarios, setComentarios] = useState([]);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [mostrarCompartir, setMostrarCompartir] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const compartirRef = useRef(null);

  // Cargar comentarios cuando se muestran
  useEffect(() => {
    if (mostrarComentarios && comentarios.length === 0) {
      cargarComentarios();
    }
  }, [mostrarComentarios]);

  // Cerrar modal de compartir al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (compartirRef.current && !compartirRef.current.contains(event.target)) {
        setMostrarCompartir(false);
        setLinkCopiado(false);
      }
    };

    if (mostrarCompartir) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarCompartir]);

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

  const irAlPerfil = (userId) => {
    navigate(`/perfil-publico/${userId}`);
  };

  // Funciones de compartir
  const handleCompartir = () => {
    setMostrarCompartir(!mostrarCompartir);
    setLinkCopiado(false);
  };

  const getUrlExperiencia = () => {
    return `${window.location.origin}/experiencias#exp-${experiencia.id}`;
  };

  const compartirWhatsApp = () => {
    const url = getUrlExperiencia();
    const texto = `Mira esta experiencia laboral: "${experiencia.titulo}" en ${experiencia.nombre_empresa}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`, '_blank');
    setMostrarCompartir(false);
  };

  const compartirTwitter = () => {
    const url = getUrlExperiencia();
    const texto = `"${experiencia.titulo}" - Experiencia laboral en ${experiencia.nombre_empresa}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`, '_blank');
    setMostrarCompartir(false);
  };

  const compartirFacebook = () => {
    const url = getUrlExperiencia();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    setMostrarCompartir(false);
  };

  const copiarLink = async () => {
    const url = getUrlExperiencia();
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      setTimeout(() => {
        setLinkCopiado(false);
        setMostrarCompartir(false);
      }, 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopiado(true);
      setTimeout(() => {
        setLinkCopiado(false);
        setMostrarCompartir(false);
      }, 2000);
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
          <div 
            className="autor-avatar clickeable" 
            onClick={() => irAlPerfil(experiencia.usuario_id)}
            title="Ver perfil"
          >
            {experiencia.foto_usuario ? (
              <img src={`${API_URL}${experiencia.foto_usuario}`} alt={experiencia.nombre_usuario} />
            ) : (
              <div className="avatar-placeholder">
                {experiencia.nombre_usuario.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="autor-datos">
            <div 
              className="autor-nombre clickeable" 
              onClick={() => irAlPerfil(experiencia.usuario_id)}
              title="Ver perfil"
            >
              {experiencia.nombre_usuario}
            </div>
            <div className="experiencia-fecha">{formatearFecha(experiencia.created_at)}</div>
          </div>
        </div>

        <div className={`tipo-badge ${badge.clase}`}>
          <span>{badge.emoji}</span>
          <span>{badge.texto}</span>
        </div>

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

      {/* Acciones (likes, comentarios, compartir) */}
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

        <div className="compartir-container" ref={compartirRef}>
          <button className="accion-btn" onClick={handleCompartir}>
            <span className="accion-icon">📤</span>
            <span className="accion-text">Compartir</span>
          </button>

          {/* Mini modal de compartir */}
          {mostrarCompartir && (
            <div className="compartir-modal">
              <div className="compartir-header">Compartir</div>
              <div className="compartir-opciones">
                <button onClick={compartirWhatsApp} className="compartir-opcion whatsapp" title="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>
                <button onClick={compartirTwitter} className="compartir-opcion twitter" title="X (Twitter)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button onClick={compartirFacebook} className="compartir-opcion facebook" title="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button onClick={copiarLink} className="compartir-opcion copiar" title="Copiar enlace">
                  {linkCopiado ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  )}
                </button>
              </div>
              {linkCopiado && <div className="link-copiado-msg">✓ Copiado</div>}
            </div>
          )}
        </div>
      </div>

      {/* Sección de comentarios */}
      {mostrarComentarios && (
        <div className="experiencia-comentarios">
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

          <div className="comentarios-lista">
            {cargandoComentarios ? (
              <div className="comentarios-loading">Cargando comentarios...</div>
            ) : comentarios.length === 0 ? (
              <div className="comentarios-vacio">No hay comentarios todavía</div>
            ) : (
              comentarios.map(comentario => (
                <div key={comentario.id} className="comentario-item">
                  <div 
                    className="comentario-avatar clickeable" 
                    onClick={() => irAlPerfil(comentario.usuario_id)}
                    title="Ver perfil"
                  >
                    {comentario.foto_usuario ? (
                      <img src={`${API_URL}${comentario.foto_usuario}`} alt={comentario.nombre_usuario} />
                    ) : (
                      <div className="avatar-placeholder-small">
                        {comentario.nombre_usuario.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="comentario-contenido">
                    <div 
                      className="comentario-autor clickeable" 
                      onClick={() => irAlPerfil(comentario.usuario_id)}
                      title="Ver perfil"
                    >
                      {comentario.nombre_usuario}
                    </div>
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