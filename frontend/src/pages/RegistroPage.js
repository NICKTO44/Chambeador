import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Registro from '../components/Registro';
import { useAuth } from '../context/AuthContext';

function RegistroPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegistro = (token, usuario) => {
    login(token, usuario);
    navigate('/trabajos');
  };

  const handleCambiarVista = (vista) => {
    if (vista === 'login') {
      navigate('/login');
    } else {
      navigate('/trabajos');
    }
  };

  return (
    <>
      <Helmet>
        <title>Crear Cuenta - El Chambeador</title>
        <meta name="description" content="Regístrate gratis como empleador o trabajador en El Chambeador." />
        <link rel="canonical" href="https://elchambeador.info/registro" />
      </Helmet>
      <Registro onRegistro={handleRegistro} onCambiarVista={handleCambiarVista} />
    </>
  );
}

export default RegistroPage;