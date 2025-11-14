import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TarjetaExperiencia from '../components/TarjetaExperiencia';
import PublicarExperiencia from '../components/PublicarExperiencia';
import '../components/Experiencias.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function ExperienciasPage() {
  const { usuario, token } = useAuth();
  const [experiencias, setExperiencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState(null);

  // Cargar experiencias al montar o cambiar filtro
  useEffect(() => {
    cargarExperiencias();
  }, [filtroTipo]);

  const cargarExperiencias = async () => {
    try {
      setCargando(true);
      setError(null);

      let url = `${API_URL}/api/experiencias`;
      
      if (filtroTipo !== 'todas') {
        url += `?tipo=${filtroTipo}`;
      }

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Error al cargar experiencias');
      }

      const data = await response.json();
      setExperiencias(data.experiencias || []);
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudieron cargar las experiencias');
    } finally {
      setCargando(false);
    }
  };

  const handleExperienciaPublicada = () => {
    setMostrarFormulario(false);
    cargarExperiencias();
  };

  const handleLikeToggle = (experienciaId, nuevoEstado) => {
    setExperiencias(experiencias.map(exp => {
      if (exp.id === experienciaId) {
        return {
          ...exp,
          usuario_dio_like: nuevoEstado,
          likes_count: nuevoEstado ? exp.likes_count + 1 : exp.likes_count - 1
        };
      }
      return exp;
    }));
  };

  const handleComentarioAgregado = (experienciaId) => {
    setExperiencias(experiencias.map(exp => {
      if (exp.id === experienciaId) {
        return {
          ...exp,
          comentarios_count: exp.comentarios_count + 1
        };
      }
      return exp;
    }));
  };

  const handleExperienciaEliminada = (experienciaId) => {
    setExperiencias(experiencias.filter(exp => exp.id !== experienciaId));
  };

  return (
    <div className="experiencias-page">
      {/* Header */}
      <div className="experiencias-header">
        <div className="header-content">
          <h1>🗣️ Experiencias Laborales</h1>
          <p className="header-descripcion">
            Comparte tu experiencia y ayuda a otros trabajadores a tomar mejores decisiones
          </p>
        </div>
        
        {usuario && (
          <button 
            className="btn-nueva-experiencia"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            {mostrarFormulario ? '✕ Cancelar' : '✨ Compartir Experiencia'}
          </button>
        )}
      </div>

      {/* Formulario de publicación */}
      {mostrarFormulario && (
        <PublicarExperiencia 
          onExperienciaPublicada={handleExperienciaPublicada}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      {/* Filtros */}
      <div className="experiencias-filtros">
        <button 
          className={`filtro-btn ${filtroTipo === 'todas' ? 'activo' : ''}`}
          onClick={() => setFiltroTipo('todas')}
        >
          🌐 Todas
        </button>
        <button 
          className={`filtro-btn ${filtroTipo === 'negativa' ? 'activo' : ''}`}
          onClick={() => setFiltroTipo('negativa')}
        >
          ⚠️ Negativas
        </button>
        <button 
          className={`filtro-btn ${filtroTipo === 'positiva' ? 'activo' : ''}`}
          onClick={() => setFiltroTipo('positiva')}
        >
          ✅ Positivas
        </button>
        <button 
          className={`filtro-btn ${filtroTipo === 'neutral' ? 'activo' : ''}`}
          onClick={() => setFiltroTipo('neutral')}
        >
          💡 Neutrales
        </button>
      </div>

      {/* Feed de experiencias */}
      <div className="experiencias-feed">
        {cargando ? (
          <div className="experiencias-loading">
            <div className="spinner"></div>
            <p>Cargando experiencias...</p>
          </div>
        ) : error ? (
          <div className="experiencias-error">
            <p>❌ {error}</p>
            <button onClick={cargarExperiencias} className="btn-reintentar">
              Reintentar
            </button>
          </div>
        ) : experiencias.length === 0 ? (
          <div className="experiencias-vacio">
            <p>📭 No hay experiencias publicadas todavía</p>
            {usuario && (
              <button 
                className="btn-primera-experiencia"
                onClick={() => setMostrarFormulario(true)}
              >
                ¡Sé el primero en compartir!
              </button>
            )}
          </div>
        ) : (
          experiencias.map(experiencia => (
            <TarjetaExperiencia
              key={experiencia.id}
              experiencia={experiencia}
              onLikeToggle={handleLikeToggle}
              onComentarioAgregado={handleComentarioAgregado}
              onExperienciaEliminada={handleExperienciaEliminada}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ExperienciasPage;