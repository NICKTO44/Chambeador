import React from 'react';
import { Helmet } from 'react-helmet';
import MisPublicaciones from '../components/MisPublicaciones';
import { useAuth } from '../context/AuthContext';

function MisPublicacionesPage() {
  const { token } = useAuth();

  return (
    <>
      <Helmet>
        <title>Mis Publicaciones - El Chambeador</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <MisPublicaciones token={token} />
    </>
  );
}

export default MisPublicacionesPage;