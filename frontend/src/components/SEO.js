import React from 'react';
import { Helmet } from 'react-helmet';

function SEO({ 
  title = "El Chambeador - Portal de Oportunidades Laborales en Perú",
  description = "Encuentra trabajo en Perú con El Chambeador. Conectamos trabajadores con empleadores en todas las categorías.",
  keywords = "trabajo peru, empleo peru, chambeador, oportunidades laborales",
  image = "https://elchambeador.info/images/logo-chambeador.png",
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