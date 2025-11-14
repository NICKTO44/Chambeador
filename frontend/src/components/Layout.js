import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BotonWhatsAppFlotante from './BotonWhatsAppFlotante';

function Layout({ children }) {
  const location = useLocation();

  // Mostrar botón flotante solo en la página de trabajos
  const mostrarBotonWhatsApp = location.pathname === '/trabajos' || location.pathname === '/';

  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      {mostrarBotonWhatsApp && <BotonWhatsAppFlotante />}
    </div>
  );
}

export default Layout;