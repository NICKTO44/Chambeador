import React from 'react';
import { Helmet } from 'react-helmet';

function SEO({ 
  title = "El Chambeador - Trabajos y Empleos en Cusco, Perú | Bolsa de Trabajo Gratis",
  description = "Encuentra trabajo en Cusco con El Chambeador. Miles de ofertas de empleo en Cusco y Perú. Bolsa de trabajo gratis en todas las categorías laborales.",
  keywords = "trabajos cusco, empleos cusco, bolsa trabajo cusco, el chambeador, trabajo cusco peru, oportunidades laborales cusco, portal empleo cusco",
  image = "https://elchambeador.info/logo-chambeador.png",
  url = "https://elchambeador.info"
}) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      
      {/* Twitter */}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}

export default SEO;