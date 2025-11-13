import React from 'react';
import { Helmet } from 'react-helmet';
import ListaTrabajos from '../components/ListaTrabajos';

function HomePage() {
  return (
    <>
      <Helmet>
        <title>El Chambeador - Encuentra tu próxima oportunidad laboral en Perú</title>
        <meta name="description" content="Portal de empleos en Perú. Conectamos trabajadores con empleadores en construcción, tecnología, gastronomía y más." />
        <meta property="og:title" content="El Chambeador - Oportunidades laborales en Perú" />
        <meta property="og:description" content="Encuentra trabajos en tu ciudad. Miles de oportunidades disponibles." />
        <link rel="canonical" href="https://elchambeador.info/trabajos" />
      </Helmet>
      <ListaTrabajos />
    </>
  );
}

export default HomePage;