import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const handleNavegar = (ruta) => {
    setMenuAbierto(false);
    navigate(ruta);
  };

  const handleLogout = () => {
    setMenuAbierto(false);
    logout();
    navigate('/trabajos');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo" onClick={() => handleNavegar('/trabajos')}>
            <img 
              src={`${process.env.PUBLIC_URL}/logo-chambeador.png`}
              alt="El Chambeador" 
              className="logo-imagen"
              height="40"
            />
            <span className="logo-text">El Chambeador</span>
          </div>

          <button 
            className={`navbar-hamburger ${menuAbierto ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Menú"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

          <div className={`navbar-menu ${menuAbierto ? 'active' : ''}`}>
            <button className="nav-link" onClick={() => handleNavegar('/trabajos')}>
              Ver Trabajos
            </button>

            {usuario ? (
              <>
                {usuario.rol === 'empleador' && (
                  <>
                    <button className="nav-link" onClick={() => handleNavegar('/publicar-trabajo')}>
                      Publicar Trabajo
                    </button>
                    <button className="nav-link" onClick={() => handleNavegar('/mis-publicaciones')}>
                      Mis Publicaciones
                    </button>
                  </>
                )}

                {usuario.rol === 'admin' && (
                  <button className="nav-link nav-admin" onClick={() => handleNavegar('/admin')}>
                    ⚙️ Panel Admin
                  </button>
                )}

                {/* MI PERFIL */}
                {usuario.rol !== 'admin' && (
                  <button className="nav-link nav-perfil" onClick={() => handleNavegar('/perfil')}>
                    👤 Mi Perfil
                  </button>
                )}

                {/* CERRAR SESIÓN */}
                <button className="btn-logout-navbar" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <button className="nav-link" onClick={() => handleNavegar('/login')}>
                  Iniciar Sesión
                </button>
                <button className="nav-link btn-registro-destacado" onClick={() => handleNavegar('/registro')}>
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {menuAbierto && (
        <div 
          className="navbar-overlay active" 
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}
    </>
  );
}

export default Navbar;