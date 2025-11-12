import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Registro from './components/Registro';
import ListaTrabajos from './components/ListaTrabajos';
import PublicarTrabajo from './components/PublicarTrabajo';
import MisPublicaciones from './components/MisPublicaciones';
import DashboardAdmin from './components/DashboardAdmin';
import BannerContacto from './components/BannerContacto';
import BotonWhatsAppFlotante from './components/BotonWhatsAppFlotante';
import './App.css';

// Configuración de tiempo de expiración de sesión (24 horass)
const TIEMPO_EXPIRACION_SESION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

function App() {
  const [vistaActual, setVistaActual] = useState('lista');
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);

  // Función para verificar si la sesión ha expirado
  const verificarExpiracionSesion = () => {
    const tiempoSesion = localStorage.getItem('session_timestamp');
    
    if (!tiempoSesion) {
      return false; // No hay sesión guardada
    }

    const tiempoActual = Date.now();
    const tiempoTranscurrido = tiempoActual - parseInt(tiempoSesion);

    // Si pasaron más de 24 horas, la sesión expiró
    if (tiempoTranscurrido > TIEMPO_EXPIRACION_SESION) {
      return true; // Sesión expirada
    }

    return false; // Sesión válida
  };

  // Función para actualizar el timestamp de la sesión
  const actualizarTiempoSesion = () => {
    if (token) {
      localStorage.setItem('session_timestamp', Date.now().toString());
    }
  };

  // Cargar usuario y token del localStorage al iniciar (con validación)
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');

    if (tokenGuardado && usuarioGuardado) {
      // Verificar si la sesión expiró
      if (verificarExpiracionSesion()) {
        // Sesión expirada - limpiar todo
        limpiarSesion();
      } else {
        // Sesión válida - restaurar
        setToken(tokenGuardado);
        setUsuario(JSON.parse(usuarioGuardado));
        // Actualizar timestamp
        actualizarTiempoSesion();
      }
    }
  }, []);

  // Actualizar timestamp cada vez que el usuario interactúa (cada 5 minutos)
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        actualizarTiempoSesion();
      }, 5 * 60 * 1000); // Cada 5 minutos

      return () => clearInterval(interval);
    }
  }, [token]);

  // Verificar expiración periódicamente (cada minuto)
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        if (verificarExpiracionSesion()) {
          handleLogout();
          alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
        }
      }, 60 * 1000); // Cada minuto

      return () => clearInterval(interval);
    }
  }, [token]);

  const limpiarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('session_timestamp');
    setToken(null);
    setUsuario(null);
  };

  const handleLogin = (tokenNuevo, usuarioNuevo) => {
    setToken(tokenNuevo);
    setUsuario(usuarioNuevo);
    
    // Guardar en localStorage con timestamp
    localStorage.setItem('token', tokenNuevo);
    localStorage.setItem('usuario', JSON.stringify(usuarioNuevo));
    localStorage.setItem('session_timestamp', Date.now().toString());
    
    // Redirigir según rol
    if (usuarioNuevo.rol === 'admin') {
      setVistaActual('admin');
    } else {
      setVistaActual('lista');
    }
  };

  const handleLogout = () => {
    limpiarSesion();
    setVistaActual('lista');
  };

  const handleRegistro = (tokenNuevo, usuarioNuevo) => {
    setToken(tokenNuevo);
    setUsuario(usuarioNuevo);
    
    // Guardar en localStorage con timestamp
    localStorage.setItem('token', tokenNuevo);
    localStorage.setItem('usuario', JSON.stringify(usuarioNuevo));
    localStorage.setItem('session_timestamp', Date.now().toString());
    
    setVistaActual('lista');
  };

  const renderVista = () => {
    switch (vistaActual) {
      case 'login':
        return <Login onLogin={handleLogin} onCambiarVista={setVistaActual} />;
      case 'registro':
        return <Registro onRegistro={handleRegistro} onCambiarVista={setVistaActual} />;
      case 'publicar':
        return <PublicarTrabajo token={token} onPublicado={() => setVistaActual('lista')} />;
      case 'mis-publicaciones':
        return <MisPublicaciones token={token} />;
      case 'admin':
        return usuario?.rol === 'admin' ? (
          <DashboardAdmin token={token} />
        ) : (
          <div className="acceso-denegado">
            <h2>⛔ Acceso Denegado</h2>
            <p>No tienes permisos para acceder al panel de administración.</p>
            <button onClick={() => setVistaActual('lista')} className="btn-volver">
              Volver al inicio
            </button>
          </div>
        );
      case 'lista':
      default:
        return <ListaTrabajos onCambiarVista={setVistaActual} />;
    }
  };

  return (
    <div className="App">
      <Navbar
        usuario={usuario}
        onCambiarVista={setVistaActual}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {renderVista()}
      </main>
      <BotonWhatsAppFlotante />
    </div>
  );
}

export default App;
