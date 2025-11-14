import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PerfilPublico.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function PerfilPublico() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPerfilPublico();
  }, [id]);

  const cargarPerfilPublico = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/perfil/publico/${id}`);
      
      if (!response.ok) {
        throw new Error('No se pudo cargar el perfil');
      }

      const data = await response.json();
      setPerfil(data);
    } catch (err) {
      console.error('Error al cargar perfil público:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    const opciones = { year: 'numeric', month: 'long' };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
  };

  const parsearJSON = (texto) => {
    if (!texto) return [];
    try {
      return JSON.parse(texto);
    } catch {
      return [];
    }
  };

  const obtenerIniciales = (nombre) => {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const abrirExperiencia = (expId) => {
    navigate('/experiencias');
  };

  if (loading) {
    return (
      <div className="perfil-publico-loading">
        <div className="spinner-grande"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-publico-error">
        <div className="error-icono">⚠️</div>
        <h2>Error al cargar perfil</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="btn-volver-error">
          Volver
        </button>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="perfil-publico-error">
        <div className="error-icono">🔍</div>
        <h2>Perfil no encontrado</h2>
        <p>El usuario que buscas no existe</p>
        <button onClick={() => navigate(-1)} className="btn-volver-error">
          Volver
        </button>
      </div>
    );
  }

  const { usuario, estadisticas, experiencias } = perfil;
  const experienciaLaboral = parsearJSON(usuario.experiencia);
  const educacion = parsearJSON(usuario.educacion);
  const habilidades = parsearJSON(usuario.habilidades);

  return (
    <div className="perfil-publico-page">
      {/* Botón volver */}
      <button onClick={() => navigate(-1)} className="btn-volver-perfil">
        ← Volver
      </button>

      {/* Layout principal: Sidebar + Contenido */}
      <div className="perfil-layout">
        
        {/* SIDEBAR IZQUIERDO */}
        <aside className="perfil-sidebar">
          
          {/* Card de perfil principal */}
          <div className="sidebar-card perfil-card">
            {/* Banner dorado */}
            <div className="card-banner"></div>
            
            {/* Foto de perfil */}
            <div className="foto-perfil-sidebar">
              {usuario.foto_perfil ? (
                <img 
                  src={`${API_URL}${usuario.foto_perfil}`} 
                  alt={usuario.nombre}
                />
              ) : (
                <div className="foto-placeholder-sidebar">
                  {obtenerIniciales(usuario.nombre)}
                </div>
              )}
            </div>

            {/* Info básica */}
            <div className="perfil-info">
              <h1 className="nombre-usuario">{usuario.nombre}</h1>
              
              {/* Badge de rol */}
              <div className={`badge-rol ${usuario.rol}`}>
                {usuario.rol === 'trabajador' ? '💼' : '🏢'} 
                {usuario.rol === 'trabajador' ? 'Trabajador' : 'Empleador'}
              </div>

              {/* Biografía compacta */}
              {usuario.biografia && (
                <p className="biografia-corta">{usuario.biografia}</p>
              )}

              {/* Detalles del perfil - Compactos */}
              <div className="detalles-perfil">
                {usuario.ubicacion_perfil && (
                  <div className="detalle-item">
                    📍 {usuario.ubicacion_perfil}
                  </div>
                )}
                
                <div className="detalle-item">
                  📅 {new Date(usuario.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                </div>

                {usuario.sitio_web && (
                  <div className="detalle-item">
                    🌐 <a 
                      href={usuario.sitio_web} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="detalle-link"
                    >
                      Sitio web
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card de estadísticas */}
          <div className="sidebar-card stats-card">
            <h3 className="card-titulo">📊 Estadísticas</h3>
            <div className="stats-lista">
              <div className="stat-item">
                <span className="stat-icono">🗣️</span>
                <div className="stat-info">
                  <div className="stat-numero">{estadisticas.total_experiencias}</div>
                  <div className="stat-label">Experiencias</div>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icono">❤️</span>
                <div className="stat-info">
                  <div className="stat-numero">{estadisticas.total_likes}</div>
                  <div className="stat-label">Likes recibidos</div>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icono">💬</span>
                <div className="stat-info">
                  <div className="stat-numero">{estadisticas.total_comentarios}</div>
                  <div className="stat-label">Comentarios</div>
                </div>
              </div>
            </div>
          </div>

          {/* Habilidades en sidebar (si es trabajador) */}
          {usuario.rol === 'trabajador' && habilidades.length > 0 && (
            <div className="sidebar-card habilidades-card">
              <h3 className="card-titulo">💡 Habilidades</h3>
              <div className="habilidades-sidebar">
                {habilidades.map((habilidad, index) => (
                  <span key={index} className="habilidad-tag-small">
                    {habilidad}
                  </span>
                ))}
              </div>
            </div>
          )}

        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="perfil-contenido-main">
          
          {/* TRABAJADOR: Experiencia, Educación */}
          {usuario.rol === 'trabajador' && (
            <>
              {/* Experiencia Laboral */}
              {experienciaLaboral.length > 0 && (
                <div className="contenido-card">
                  <h2 className="seccion-titulo-main">
                    <span className="seccion-icono">💼</span>
                    Experiencia Laboral
                  </h2>
                  <div className="timeline">
                    {experienciaLaboral.map((exp, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-punto"></div>
                        <div className="timeline-contenido">
                          <h3 className="timeline-cargo">{exp.cargo}</h3>
                          <div className="timeline-empresa">{exp.empresa}</div>
                          <div className="timeline-periodo">{exp.periodo}</div>
                          {exp.descripcion && (
                            <p className="timeline-descripcion">{exp.descripcion}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Educación */}
              {educacion.length > 0 && (
                <div className="contenido-card">
                  <h2 className="seccion-titulo-main">
                    <span className="seccion-icono">🎓</span>
                    Educación
                  </h2>
                  <div className="timeline">
                    {educacion.map((edu, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-punto"></div>
                        <div className="timeline-contenido">
                          <h3 className="timeline-cargo">{edu.titulo}</h3>
                          <div className="timeline-empresa">{edu.institucion}</div>
                          <div className="timeline-periodo">{edu.periodo}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* EMPLEADOR: Información de empresa */}
          {usuario.rol === 'empleador' && usuario.nombre_empresa && (
            <div className="contenido-card">
              <h2 className="seccion-titulo-main">
                <span className="seccion-icono">🏢</span>
                Información de la Empresa
              </h2>
              <div className="empresa-info">
                <div className="empresa-grid">
                  <div className="empresa-item">
                    <span className="empresa-label">Empresa</span>
                    <span className="empresa-valor">{usuario.nombre_empresa}</span>
                  </div>
                  
                  {usuario.sector_empresa && (
                    <div className="empresa-item">
                      <span className="empresa-label">Sector</span>
                      <span className="empresa-valor">{usuario.sector_empresa}</span>
                    </div>
                  )}
                  
                  {usuario.tamanio_empresa && (
                    <div className="empresa-item">
                      <span className="empresa-label">Tamaño</span>
                      <span className="empresa-valor">{usuario.tamanio_empresa}</span>
                    </div>
                  )}
                </div>

                {usuario.descripcion_empresa && (
                  <div className="empresa-descripcion">
                    <p>{usuario.descripcion_empresa}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Experiencias publicadas */}
          {experiencias && experiencias.length > 0 && (
            <div className="contenido-card">
              <h2 className="seccion-titulo-main">
                <span className="seccion-icono">🗣️</span>
                Experiencias publicadas ({experiencias.length})
              </h2>
              <div className="experiencias-grid">
                {experiencias.map((exp) => (
                  <div 
                    key={exp.id} 
                    className="exp-card"
                    onClick={() => abrirExperiencia(exp.id)}
                  >
                    <div className="exp-header">
                      <span className={`exp-badge badge-${exp.tipo}`}>
                        {exp.tipo === 'negativa' && '😔'}
                        {exp.tipo === 'positiva' && '😊'}
                        {exp.tipo === 'neutral' && '😐'}
                      </span>
                      <span className="exp-fecha">
                        {new Date(exp.created_at).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
                    <h3 className="exp-titulo">{exp.titulo}</h3>
                    <p className="exp-empresa">🏢 {exp.empresa}</p>
                    <div className="exp-footer">
                      <span className="exp-stat">❤️ {exp.likes_count}</span>
                      <span className="exp-stat">💬 {exp.comentarios_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje si no hay contenido */}
          {usuario.rol === 'trabajador' && 
           experienciaLaboral.length === 0 && 
           educacion.length === 0 && 
           experiencias.length === 0 && (
            <div className="contenido-vacio">
              <div className="vacio-icono">📝</div>
              <h3>Perfil en construcción</h3>
              <p>Este usuario aún no ha completado su perfil profesional</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default PerfilPublico;