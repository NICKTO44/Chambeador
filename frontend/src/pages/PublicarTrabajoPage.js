import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import PublicarTrabajo from '../components/PublicarTrabajo';
import { useAuth } from '../context/AuthContext';

function PublicarTrabajoPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  return (
    <>
      <Helmet>
        <title>Publicar Trabajo - El Chambeador</title>
        <meta name="description" content="Publica tu oferta laboral y encuentra al candidato ideal." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PublicarTrabajo token={token} onPublicado={() => navigate('/trabajos')} />
    </>
  );
}

export default PublicarTrabajoPage;