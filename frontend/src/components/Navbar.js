import React, { useState } from 'react';
import './Navbar.css';

function Navbar({ usuario, onCambiarVista, onLogout }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Toggle del menú
  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  // Cerrar menú al hacer click en un link
  const handleNavClick = (vista) => {
    onCambiarVista(vista);
    setMenuAbierto(false);
  };

  // Cerrar menú al hacer logout
  const handleLogout = () => {
    onLogout();
    setMenuAbierto(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo" onClick={() => handleNavClick('lista')}>
            <span className="logo-icon">💼</span>
            <span className="logo-text">El Chambeador</span>
          </div>

          {/* Botón hamburguesa (solo visible en móvil) */}
          <button 
            className={`navbar-hamburger ${menuAbierto ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Menú"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

          {/* Menú principal */}
          <div className={`navbar-menu ${menuAbierto ? 'active' : ''}`}>
            <button className="nav-link" onClick={() => handleNavClick('lista')}>
              Ver Trabajos
            </button>

            {usuario ? (
              <>
                {/* Botones para EMPLEADOR */}
                {usuario.rol === 'empleador' && (
                  <>
                    <button className="nav-link" onClick={() => handleNavClick('publicar')}>
                      Publicar Trabajo
                    </button>
                    <button className="nav-link" onClick={() => handleNavClick('mis-publicaciones')}>
                      Mis Publicaciones
                    </button>
                  </>
                )}

                {/* Botón para ADMIN */}
                {usuario.rol === 'admin' && (
                  <button className="nav-link nav-admin" onClick={() => handleNavClick('admin')}>
                    ⚙️ Panel Admin
                  </button>
                )}

                <div className="user-info">
                  <span className="user-name">{usuario.nombre}</span>
                  <span className={`user-badge badge-${usuario.rol}`}>{usuario.rol}</span>
                </div>
                <button className="btn-logout" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <button className="nav-link" onClick={() => handleNavClick('login')}>
                  Iniciar Sesión
                </button>
                <button className="nav-link" onClick={() => handleNavClick('registro')}>
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay para cerrar menú al hacer click fuera (solo móvil) */}
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