import React, { useState, useEffect, useRef } from 'react';
import './BuscadorInteligente.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function BuscadorInteligente({ onBuscar, busquedaActual }) {
  const [busquedaTemp, setBusquedaTemp] = useState(busquedaActual || '');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [populares, setPopulares] = useState([]);
  const [mostrarPopulares, setMostrarPopulares] = useState(false);
  const [correccion, setCorreccion] = useState(null);
  const wrapperRef = useRef(null);

  // Cargar historial de localStorage
  useEffect(() => {
    const historialGuardado = localStorage.getItem('historial_busquedas');
    if (historialGuardado) {
      setHistorial(JSON.parse(historialGuardado));
    }
  }, []);

  // Cargar búsquedas populares
  useEffect(() => {
    cargarPopulares();
  }, []);

  // Sincronizar busquedaTemp con busquedaActual desde el padre
  useEffect(() => {
    setBusquedaTemp(busquedaActual || '');
  }, [busquedaActual]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
        setMostrarPopulares(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener sugerencias mientras escribe
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busquedaTemp.trim().length >= 2) {
        obtenerSugerencias(busquedaTemp);
        verificarCorreccion(busquedaTemp);
      } else {
        setSugerencias([]);
        setCorreccion(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busquedaTemp]);

  const cargarPopulares = async () => {
    try {
      const response = await fetch(`${API_URL}/api/search/populares?periodo=dia`);
      const data = await response.json();
      setPopulares(data.populares || []);
    } catch (error) {
      console.error('Error al cargar búsquedas populares:', error);
    }
  };

  const obtenerSugerencias = async (termino) => {
    try {
      const response = await fetch(
        `${API_URL}/api/search/sugerencias?q=${encodeURIComponent(termino)}`
      );
      const data = await response.json();
      setSugerencias(data.sugerencias || []);
      setMostrarSugerencias(data.sugerencias.length > 0);
    } catch (error) {
      console.error('Error al obtener sugerencias:', error);
    }
  };

  const verificarCorreccion = async (termino) => {
    try {
      const response = await fetch(
        `${API_URL}/api/search/correccion?termino=${encodeURIComponent(termino)}`
      );
      const data = await response.json();
      setCorreccion(data.correccion);
    } catch (error) {
      console.error('Error al verificar corrección:', error);
    }
  };

  const agregarAlHistorial = (termino) => {
    if (!termino.trim() || termino.trim().length < 2) return;

    let nuevoHistorial = [termino, ...historial.filter(h => h !== termino)].slice(0, 5);
    setHistorial(nuevoHistorial);
    localStorage.setItem('historial_busquedas', JSON.stringify(nuevoHistorial));
  };

  // ✨ MODIFICADO: Manejo del cambio en el input
  const handleChange = (e) => {
    const valor = e.target.value;
    setBusquedaTemp(valor);
    // ✨ NUEVO: Llama a onBuscar en cada cambio para búsqueda en tiempo real
    onBuscar(valor);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const terminoFinal = busquedaTemp.trim();
      if (terminoFinal) {
        agregarAlHistorial(terminoFinal);
      }
      setMostrarSugerencias(false);
      setMostrarPopulares(false);
    }
  };

  const handleSeleccionarSugerencia = (texto) => {
    setBusquedaTemp(texto);
    onBuscar(texto);
    agregarAlHistorial(texto);
    setMostrarSugerencias(false);
    setMostrarPopulares(false);
  };

  const handleLimpiar = () => {
    setBusquedaTemp('');
    onBuscar('');
    setSugerencias([]);
    setCorreccion(null);
    setMostrarSugerencias(false);
    setMostrarPopulares(false);
  };

  const handleFocus = () => {
    if (busquedaTemp.trim().length === 0 && populares.length > 0) {
      setMostrarPopulares(true);
    } else if (busquedaTemp.trim().length >= 2 && sugerencias.length > 0) {
      setMostrarSugerencias(true);
    }
  };

  const limpiarHistorial = () => {
    setHistorial([]);
    localStorage.removeItem('historial_busquedas');
  };

  return (
    <div className="buscador-inteligente" ref={wrapperRef}>
      <div className="buscador-container">
        <svg className="icono-buscar" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          type="text"
          className="input-buscador"
          placeholder="Buscar trabajos, ubicaciones..."
          value={busquedaTemp}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
        />
        {busquedaTemp && (
          <button 
            className="btn-limpiar-busqueda"
            onClick={handleLimpiar}
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {/* Corrección ortográfica */}
      {correccion && (
        <div className="sugerencia-correccion">
          ¿Quisiste decir: <strong onClick={() => handleSeleccionarSugerencia(correccion)}>{correccion}</strong>?
        </div>
      )}

      {/* Dropdown de sugerencias */}
      {mostrarSugerencias && sugerencias.length > 0 && (
        <div className="dropdown-sugerencias">
          <div className="sugerencias-header">Sugerencias</div>
          {sugerencias.map((sug, index) => (
            <div
              key={index}
              className="sugerencia-item"
              onClick={() => handleSeleccionarSugerencia(sug.texto)}
            >
              <span className={`icono-tipo icono-${sug.tipo}`}>
                {sug.tipo === 'popular' && '🔥'}
                {sug.tipo === 'trabajo' && '💼'}
                {sug.tipo === 'ubicacion' && '📍'}
              </span>
              <span className="sugerencia-texto">{sug.texto}</span>
              {sug.frecuencia && (
                <span className="sugerencia-badge">{sug.frecuencia}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Búsquedas populares */}
      {mostrarPopulares && populares.length > 0 && (
        <div className="dropdown-sugerencias">
          <div className="sugerencias-header">🔥 Búsquedas populares hoy</div>
          {populares.map((pop, index) => (
            <div
              key={index}
              className="sugerencia-item"
              onClick={() => handleSeleccionarSugerencia(pop.termino)}
            >
              <span className="numero-ranking">#{index + 1}</span>
              <span className="sugerencia-texto">{pop.termino}</span>
              <span className="sugerencia-badge">{pop.total_busquedas}</span>
            </div>
          ))}
        </div>
      )}

      {/* Historial de búsquedas */}
      {busquedaTemp.length === 0 && historial.length > 0 && !mostrarPopulares && (
        <div className="historial-busquedas">
          <div className="historial-header">
            <span>🕐 Búsquedas recientes</span>
            <button onClick={limpiarHistorial} className="btn-limpiar-historial">
              Limpiar
            </button>
          </div>
          {historial.map((item, index) => (
            <div
              key={index}
              className="historial-item"
              onClick={() => handleSeleccionarSugerencia(item)}
            >
              <span className="historial-texto">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BuscadorInteligente;