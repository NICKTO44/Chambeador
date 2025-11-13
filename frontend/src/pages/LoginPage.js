import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (token, usuario) => {
    login(token, usuario);
    if (usuario.rol === 'admin') {
      navigate('/admin');
    } else {
      navigate('/trabajos');
    }
  };

  const handleCambiarVista = (vista) => {
    if (vista === 'registro') {
      navigate('/registro');
    } else {
      navigate('/trabajos');
    }
  };

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - El Chambeador</title>
        <meta name="description" content="Inicia sesión en El Chambeador para publicar trabajos o postularte a oportunidades laborales." />
        <link rel="canonical" href="https://elchambeador.info/login" />
      </Helmet>
      <Login onLogin={handleLogin} onCambiarVista={handleCambiarVista} />
    </>
  );
}

export default LoginPage;