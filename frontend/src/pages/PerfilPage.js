import React from 'react';
import { Helmet } from 'react-helmet';
import Perfil from '../components/Perfil';
import { useAuth } from '../context/AuthContext';

function PerfilPage() {
  const { token, usuario } = useAuth();

  return (
    <>
      <Helmet>
        <title>Mi Perfil - El Chambeador</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Perfil token={token} usuario={usuario} />
    </>
  );
}

export default PerfilPage;