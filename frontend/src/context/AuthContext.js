import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const TIEMPO_EXPIRACION_SESION = 24 * 60 * 60 * 1000; // 24 horas

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Verificar expiración de sesión
  const verificarExpiracionSesion = () => {
    const tiempoSesion = localStorage.getItem('session_timestamp');
    if (!tiempoSesion) return false;
    
    const tiempoActual = Date.now();
    const tiempoTranscurrido = tiempoActual - parseInt(tiempoSesion);
    return tiempoTranscurrido > TIEMPO_EXPIRACION_SESION;
  };

  // Actualizar timestamp de sesión
  const actualizarTiempoSesion = () => {
    if (token) {
      localStorage.setItem('session_timestamp', Date.now().toString());
    }
  };

  // Limpiar sesión
  const limpiarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('session_timestamp');
    setToken(null);
    setUsuario(null);
  };

  // Login
  const login = (tokenNuevo, usuarioNuevo) => {
    setToken(tokenNuevo);
    setUsuario(usuarioNuevo);
    localStorage.setItem('token', tokenNuevo);
    localStorage.setItem('usuario', JSON.stringify(usuarioNuevo));
    localStorage.setItem('session_timestamp', Date.now().toString());
  };

  // Logout
  const logout = () => {
    limpiarSesion();
  };

  // Cargar sesión al montar
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');

    if (tokenGuardado && usuarioGuardado) {
      if (verificarExpiracionSesion()) {
        limpiarSesion();
      } else {
        setToken(tokenGuardado);
        setUsuario(JSON.parse(usuarioGuardado));
        actualizarTiempoSesion();
      }
    }
    setCargando(false);
  }, []);

  // Actualizar timestamp periódicamente (cada 5 minutos)
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        actualizarTiempoSesion();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Verificar expiración periódicamente (cada minuto)
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        if (verificarExpiracionSesion()) {
          logout();
          alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
        }
      }, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const value = {
    usuario,
    token,
    login,
    logout,
    cargando,
    estaAutenticado: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};