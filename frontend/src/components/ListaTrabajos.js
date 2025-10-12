import React, { useState, useEffect } from 'react';
import TarjetaTrabajo from './TarjetaTrabajo';
import BannerContacto from './BannerContacto';
import BuscadorInteligente from './BuscadorInteligente';
import SEO from './SEO';
import './ListaTrabajos.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ListaTrabajos({ onCambiarVista }) {
  const [trabajos, setTrabajos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaTemporal, setBusquedaTemporal] = useState('');

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

  // Debounce para búsqueda en tiempo real (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busquedaTemporal !== busqueda) {
        setBusqueda(busquedaTemporal);
        setPaginaActual(1);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [busquedaTemporal, busqueda]);

  // Cargar trabajos cuando cambian los filtros
  useEffect(() => {
    cargarTrabajos();
  }, [paginaActual, categoriaFiltro, busqueda]);

  const cargarTrabajos = async () => {
    setCargando(true);
    setError('');

    try {
      let url = `${API_URL}/api/jobs?page=${paginaActual}&limit=9`;
      
      if (categoriaFiltro) {
        url += `&categoria=${encodeURIComponent(categoriaFiltro)}`;
      }

      if (busqueda) {
        url += `&busqueda=${encodeURIComponent(busqueda)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar trabajos');
      }

      setTrabajos(data.trabajos);
      setTotalPaginas(data.pagination.totalPages);
      setTotalResultados(data.pagination.total);

      // Registrar búsqueda si hay término de búsqueda
      if (busqueda && busqueda.length >= 2) {
        registrarBusqueda(busqueda, data.trabajos.length);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const registrarBusqueda = async (termino, resultados) => {
    try {
      await fetch(`${API_URL}/api/search/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          termino, 
          resultados_encontrados: resultados 
        })
      });
    } catch (error) {
      console.error('Error al registrar búsqueda:', error);
    }
  };

  const handleBuscar = (terminoBusqueda) => {
    setBusquedaTemporal(terminoBusqueda);
  };

  const handleFiltroCategoria = (categoria) => {
    setCategoriaFiltro(categoria === categoriaFiltro ? '' : categoria);
    setPaginaActual(1);
  };

  const handleLimpiarFiltros = () => {
    setCategoriaFiltro('');
    setBusqueda('');
    setBusquedaTemporal('');
    setPaginaActual(1);
  };

  const handlePaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const hayFiltrosActivos = categoriaFiltro || busqueda;

  // Función para resaltar términos de búsqueda en el texto
  const resaltarTexto = (texto, termino) => {
    if (!termino || !texto) return texto;
    
    const regex = new RegExp(`(${termino})`, 'gi');
    const partes = texto.split(regex);
    
    return partes.map((parte, index) => 
      regex.test(parte) ? (
        <mark key={index} className="texto-resaltado">{parte}</mark>
      ) : (
        parte
      )
    );
  };

 // SEO dinámico según filtros - VERSIÓN OPTIMIZADA
const getSEOTitle = () => {
  if (categoriaFiltro) {
    return `Ofertas de Trabajo de ${categoriaFiltro} en Perú - El Chambeador`;
  }
  if (busqueda) {
    return `Ofertas de "${busqueda}" - Bolsa de Trabajo El Chambeador`;
  }
  return "Ofertas de Trabajo y Empleo en Perú - El Chambeador | Bolsa de Trabajo Gratis";
};

const getSEODescription = () => {
  if (categoriaFiltro) {
    return `${totalResultados} ofertas de trabajo de ${categoriaFiltro} disponibles en Perú. Encuentra empleo en ${categoriaFiltro} actualizado diariamente. Bolsa de trabajo gratis en El Chambeador.`;
  }
  if (busqueda) {
    return `${totalResultados} ofertas de trabajo encontradas para "${busqueda}". Encuentra tu próximo empleo en El Chambeador - Portal de trabajo y bolsa de empleo en Perú.`;
  }
  return "Miles de ofertas de trabajo y empleo en Perú. Bolsa de trabajo gratis con oportunidades en construcción, gastronomía, tecnología, limpieza, transporte, salud, educación, comercio y más. Actualizado diariamente. ¡Encuentra tu próxima chamba!";
};
  return (
    <div className="lista-trabajos-container">
      {/* SEO Component */}
    <SEO 
  title={getSEOTitle()}
  description={getSEODescription()}
  keywords={`ofertas de trabajo, ofertas de empleo, bolsa de trabajo, buscar trabajo, empleo ${categoriaFiltro || 'peru'}, trabajo ${categoriaFiltro || 'peru'}, chambeador, portal de empleo, oportunidades laborales, vacantes`}
/>

      <BannerContacto />

      {/* HERO SECTION CON LOGO PROFESIONAL */}
      <div className="hero-section">
        {/* Logo profesional grande */}
        <div className="hero-logo-container">
          <img 
             src={`${process.env.PUBLIC_URL}/logo-chambeador.png`}

            alt="El Chambeador - Portal de Oportunidades Laborales en Perú" 
            className="hero-logo"
          />
        </div>
        
        {/* Contenido del hero */}
        <div className="hero-content">
          <h1>Encuentra tu próxima oportunidad</h1>
          <p>Conectamos trabajadores con empleadores en todo el país</p>
        </div>
      </div>

      {/* Buscador Inteligente */}
      <div className="buscador-section">
        <BuscadorInteligente 
          onBuscar={handleBuscar}
          busquedaActual={busquedaTemporal}
        />
      </div>

      {/* Filtros de categoría */}
      <div className="filtros-section">
        <h3>Filtrar por categoría:</h3>
        <div className="filtros-categorias">
          {categorias.map((cat) => (
            <button
              key={cat}
              className={`filtro-btn ${categoriaFiltro === cat ? 'activo' : ''}`}
              onClick={() => handleFiltroCategoria(cat)}
              aria-label={`Filtrar por ${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>
        {hayFiltrosActivos && (
          <button className="limpiar-filtro" onClick={handleLimpiarFiltros}>
            ✕ Limpiar todos los filtros
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {cargando ? (
        <div className="cargando">
          <div className="spinner"></div>
          <p>Buscando trabajos...</p>
        </div>
      ) : trabajos.length === 0 ? (
        <div className="sin-resultados">
          <div className="sin-resultados-icono">🔍</div>
          <h3>No se encontraron trabajos</h3>
          {hayFiltrosActivos ? (
            <>
              <p>No hay resultados para tu búsqueda o filtros</p>
              <button className="btn-limpiar-resultados" onClick={handleLimpiarFiltros}>
                Limpiar filtros y ver todos
              </button>
            </>
          ) : (
            <p>No hay trabajos disponibles en este momento</p>
          )}
        </div>
      ) : (
        <>
          {/* Indicador de resultados mejorado */}
          {hayFiltrosActivos && (
            <div className="indicador-resultados">
              <strong>{totalResultados}</strong> resultado{totalResultados !== 1 ? 's' : ''} encontrado{totalResultados !== 1 ? 's' : ''}
              {busqueda && (
                <>
                  {' '}para "<strong>{busqueda}</strong>"
                </>
              )}
              {categoriaFiltro && (
                <>
                  {' '}en <strong>{categoriaFiltro}</strong>
                </>
              )}
            </div>
          )}

          <div className="trabajos-grid">
            {trabajos.map((trabajo) => (
              <TarjetaTrabajo 
                key={trabajo.id} 
                trabajo={trabajo}
                terminoBusqueda={busqueda}
                resaltarTexto={resaltarTexto}
              />
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="paginacion">
              <button
                className="btn-paginacion"
                onClick={handlePaginaAnterior}
                disabled={paginaActual === 1}
                aria-label="Página anterior"
              >
                ← Anterior
              </button>
              <span className="info-pagina">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                className="btn-paginacion"
                onClick={handlePaginaSiguiente}
                disabled={paginaActual === totalPaginas}
                aria-label="Página siguiente"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ListaTrabajos;