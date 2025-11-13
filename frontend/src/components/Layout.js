import React from 'react';
import Navbar from './Navbar';
import BotonWhatsAppFlotante from './BotonWhatsAppFlotante';

function Layout({ children }) {
  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <BotonWhatsAppFlotante />
    </div>
  );
}

export default Layout;