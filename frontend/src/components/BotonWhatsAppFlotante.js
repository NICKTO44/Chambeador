import React, { useState, useEffect } from 'react';
import './BotonWhatsAppFlotante.css';

function BotonWhatsAppFlotante() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const whatsappUrl = 'https://wa.me/51927391918?text=Hola,%20quiero%20publicar%20un%20anuncio%20de%20trabajo%20en%20El%20Chambeador';

  return (
     <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={'boton-whatsapp-flotante ' + (visible ? 'visible' : '')}
 >
      <span className="whatsapp-icon-flotante">💬</span>
      <span className="tooltip-whatsapp">¿Necesitas ayuda?</span>
    </a>
  );
}

export default BotonWhatsAppFlotante;