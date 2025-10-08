import React, { useState, useEffect } from 'react';
import './ModalPagoYape.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ModalPagoYape({ trabajo_id, token, onPagoConfirmado, onCerrar }) {
  const [configuracion, setConfiguracion] = useState(null);
  const [codigoOperacion, setCodigoOperacion] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [paso, setPaso] = useState(1); // 1: QR, 2: Código

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payments/configuracion`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar configuración');

      const data = await response.json();
      setConfiguracion(data);
    } catch (err) {
      setError('Error al cargar información de pago');
    }
  };

  const handleConfirmarPago = async () => {
    if (codigoOperacion.trim().length < 4) {
      setError('El código de operación debe tener al menos 4 caracteres');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/payments/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trabajo_id,
          codigo_operacion: codigoOperacion
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al confirmar pago');
      }

      onPagoConfirmado();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  if (!configuracion) {
    return (
      <div className="modal-overlay">
        <div className="modal-pago">
          <p>Cargando información de pago...</p>
        </div>
      </div>
    );
  }

  // ✨ CAMBIADO: Usar tu QR real de Yape
  const urlYape = `${process.env.PUBLIC_URL}/assets/qr-yape.jpeg`;

  return (
    <div className="modal-overlay">
      <div className="modal-pago">
        <button className="btn-cerrar-modal" onClick={onCerrar}>✕</button>

        <div className="modal-header">
          <h2>💳 Realiza el pago</h2>
          <p className="modal-subtitulo">
            Para publicar tu trabajo, realiza el pago de <strong>S/ {configuracion.precio_publicacion}</strong>
          </p>
        </div>

        {paso === 1 && (
          <div className="paso-qr">
            <div className="qr-container">
              <img src={urlYape} alt="QR Yape" className="qr-code" />
              <div className="info-yape">
                <p><strong>Número:</strong> {configuracion.telefono_yape}</p>
                <p><strong>Nombre:</strong> {configuracion.nombre_yape}</p>
                <p><strong>Monto:</strong> S/ {configuracion.precio_publicacion}</p>
              </div>
            </div>

            <div className="instrucciones">
              <h3>📱 Instrucciones:</h3>
              <ol>
                <li>Abre tu app de <strong>Yape</strong></li>
                <li>Escanea el código QR o ingresa el número manualmente</li>
                <li>Realiza el pago de <strong>S/ {configuracion.precio_publicacion}</strong></li>
                <li>Guarda el <strong>código de operación</strong></li>
              </ol>
            </div>

            <button 
              className="btn-continuar"
              onClick={() => setPaso(2)}
            >
              Ya realicé el pago →
            </button>
          </div>
        )}

        {paso === 2 && (
          <div className="paso-codigo">
            <div className="volver-container">
              <button className="btn-volver" onClick={() => setPaso(1)}>
                ← Volver al QR
              </button>
            </div>

            <h3>Ingresa el código de operación</h3>
            <p className="ayuda-codigo">
              Lo encuentras en tu app de Yape después de realizar el pago
            </p>

            <input
              type="text"
              className="input-codigo"
              placeholder="Ej: 123456789"
              value={codigoOperacion}
              onChange={(e) => {
                setCodigoOperacion(e.target.value);
                setError('');
              }}
              maxLength="20"
            />

            {error && <div className="error-message-modal">{error}</div>}

            <div className="botones-finales">
              <button 
                className="btn-confirmar-pago"
                onClick={handleConfirmarPago}
                disabled={cargando || codigoOperacion.trim().length < 4}
              >
                {cargando ? 'Verificando...' : 'Confirmar Pago'}
              </button>
            </div>

            <p className="nota-verificacion">
              ℹ️ Tu publicación será verificada y activada en breve
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalPagoYape;