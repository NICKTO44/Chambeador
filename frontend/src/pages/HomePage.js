import React from 'react';
import { Helmet } from 'react-helmet';
import ListaTrabajos from '../components/ListaTrabajos';

function HomePage() {
  return (
    <>
      <Helmet>
        <title>El Chambeador - Trabajos y Empleos en Cusco, Perú | Bolsa de Trabajo Gratis 2025</title>
        <meta name="description" content="Encuentra trabajo en Cusco. Miles de ofertas de empleo en Cusco y Perú en construcción, gastronomía, tecnología, limpieza, transporte y más. Bolsa de trabajo gratis actualizada diariamente." />
        <meta name="keywords" content="trabajos cusco, empleos cusco, bolsa de trabajo cusco, ofertas empleo cusco peru, trabajo cusco, el chambeador, oportunidades laborales cusco, portal empleo cusco" />
        <meta property="og:title" content="El Chambeador - Trabajos en Cusco, Perú" />
        <meta property="og:description" content="Miles de ofertas de trabajo en Cusco. Encuentra tu próxima chamba en construcción, gastronomía, tecnología y más." />
        <link rel="canonical" href="https://elchambeador.info/trabajos" />
      </Helmet>
      <ListaTrabajos />
    </>
  );
}

export default HomePage;