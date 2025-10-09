import React, { useState } from 'react';
import './TarjetaTrabajo.css';

function TarjetaTrabajo({ trabajo, terminoBusqueda, resaltarTexto }) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffTime = Math.abs(ahora - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

const generarMensajeWhatsApp = () => {
  const mensaje = `Hola! Vi tu trabajo "${trabajo.titulo}" en El Chambeador y me interesa obtener más información.`;
  // ✨ ACTUALIZADO: Usar telefono_contacto si existe, sino usar empleador_telefono
  const telefono = trabajo.telefono_contacto || trabajo.empleador_telefono;
  return `https://wa.me/${telefono?.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
};

  const generarMensajeCompartir = () => {
    const urlTrabajo = `${window.location.origin}/trabajo/${trabajo.id}`;
    const pago = trabajo.pago_estimado
      ? `S/ ${parseFloat(trabajo.pago_estimado).toFixed(2)}`
      : 'A Tratar';

    const mensaje = `🔥 ¡Mira este trabajo en El Chambeador!\n\n📋 ${trabajo.titulo}\n💰 ${pago}\n📍 ${trabajo.ubicacion || 'No especificado'}\n\n👉 Ver aquí: ${urlTrabajo}`;
    return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  };

  const abrirModal = () => setModalAbierto(true);
  const cerrarModal = () => setModalAbierto(false);

  return (
    <>
      <div className="tarjeta-trabajo" onClick={abrirModal}>
        {/* Header de la tarjeta */}
        <div className="tarjeta-header">
          <div className="categoria-badge">
            <span className="categoria-icono">📂</span>
            {trabajo.categoria}
          </div>
          <div className="fecha-publicacion">{formatearFecha(trabajo.created_at)}</div>
        </div>

        {/* Título con resaltado */}
        <h3 className="tarjeta-titulo">
          {terminoBusqueda && resaltarTexto
            ? resaltarTexto(trabajo.titulo, terminoBusqueda)
            : trabajo.titulo}
        </h3>

        {/* Descripción */}
        <p className="tarjeta-descripcion">
          {terminoBusqueda && resaltarTexto
            ? resaltarTexto(
                trabajo.descripcion.length > 120
                  ? `${trabajo.descripcion.substring(0, 120)}...`
                  : trabajo.descripcion,
                terminoBusqueda
              )
            : trabajo.descripcion.length > 120
            ? `${trabajo.descripcion.substring(0, 120)}...`
            : trabajo.descripcion}
        </p>

        {/* Info Grid */}
        <div className="tarjeta-info-grid">
          {/* Pago */}
          {trabajo.pago_estimado ? (
            <div className="info-pago-destacado">
              <div className="pago-label">Pago estimado</div>
              <div className="pago-monto">S/ {parseFloat(trabajo.pago_estimado).toFixed(2)}</div>
            </div>
          ) : (
            <div className="info-pago-destacado">
              <div className="pago-label">Pago</div>
              <div className="pago-monto-convenir">A Tratar</div>
            </div>
          )}

          {/* Ubicación */}
          {trabajo.ubicacion && (
            <div className="info-item">
              <span className="info-icono">📍</span>
              <span className="info-texto">
                {terminoBusqueda && resaltarTexto
                  ? resaltarTexto(trabajo.ubicacion, terminoBusqueda)
                  : trabajo.ubicacion}
              </span>
            </div>
          )}

          {/* Empleador */}
          <div className="info-item">
            <span className="info-icono">👤</span>
            <span className="info-texto">{trabajo.empleador_nombre}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="tarjeta-footer">
          <button className="btn-ver-mas" onClick={abrirModal}>
            Ver detalles completos
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={cerrarModal}>✕</button>

            {/* Header */}
            <div className="modal-header-trabajo">
              <div className="modal-categoria-badge">
                <span className="categoria-icono">📂</span>
                {trabajo.categoria}
              </div>
              <h2 className="modal-titulo">
                {terminoBusqueda && resaltarTexto
                  ? resaltarTexto(trabajo.titulo, terminoBusqueda)
                  : trabajo.titulo}
              </h2>
              <p className="modal-fecha">Publicado {formatearFecha(trabajo.created_at)}</p>
            </div>

            {/* Cuerpo */}
            <div className="modal-body-trabajo">
              {/* Pago */}
              <div className="modal-pago-box">
                <div className="modal-pago-label">Pago estimado</div>
                {trabajo.pago_estimado ? (
                  <div className="modal-pago-monto">S/ {parseFloat(trabajo.pago_estimado).toFixed(2)}</div>
                ) : (
                  <div className="modal-pago-convenir">A Tratar</div>
                )}
              </div>

              {/* Descripción */}
              <div className="modal-section">
                <h3 className="modal-section-titulo">📋 Descripción del trabajo</h3>
                <p className="modal-descripcion">
                  {terminoBusqueda && resaltarTexto
                    ? resaltarTexto(trabajo.descripcion, terminoBusqueda)
                    : trabajo.descripcion}
                </p>
              </div>

              {/* Información adicional */}
              {(trabajo.ubicacion || trabajo.contacto) && (
                <div className="modal-section">
                  <h3 className="modal-section-titulo">ℹ️ Información adicional</h3>
                  {trabajo.ubicacion && (
                    <div className="modal-info-item">
                      <span className="modal-info-label">📍 Ubicación:</span>
                      <span className="modal-info-value">
                        {terminoBusqueda && resaltarTexto
                          ? resaltarTexto(trabajo.ubicacion, terminoBusqueda)
                          : trabajo.ubicacion}
                      </span>
                    </div>
                  )}
                  {trabajo.contacto && (
                    <div className="modal-info-item">
                      <span className="modal-info-label">📞 Contacto:</span>
                      <span className="modal-info-value">{trabajo.contacto}</span>
                    </div>
                  )}
                </div>
              )}

             {/* Empleador */}
<div className="modal-section modal-empleador">
  <h3 className="modal-section-titulo">👤 Publicado por</h3>
  <div className="empleador-info-box">
    <div className="empleador-nombre">{trabajo.empleador_nombre}</div>
    {/* ✨ ACTUALIZADO: Solo mostrar teléfono si NO hay telefono_contacto */}
    {!trabajo.telefono_contacto && trabajo.empleador_telefono && (
      <div className="empleador-telefono">📱 {trabajo.empleador_telefono}</div>
    )}
  </div>
</div>

              {/* Botones de contacto */}
             {(trabajo.telefono_contacto || trabajo.empleador_telefono) && (
  <div className="modal-contacto-container">
    <div className="botones-contacto-grid">
      {/* WhatsApp */}
      <a
        href={generarMensajeWhatsApp()}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-contacto btn-whatsapp"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="contacto-icono" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        </svg>
        <span className="contacto-texto">WhatsApp</span>
      </a>

      {/* Llamar */}
      <a
        href={`tel:${trabajo.telefono_contacto || trabajo.empleador_telefono}`}
        className="btn-contacto btn-llamar"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="contacto-icono" viewBox="0 0 24 24">
          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
        </svg>
        <span className="contacto-texto">Llamar</span>
      </a>
    </div>

    <p className="contacto-ayuda">
      Contacta directamente con el empleador
    </p>
  </div>
)}


              {/* Compartir */}
              <div className="compartir-container">
                <div className="compartir-divisor">
                  <span className="divisor-texto">o comparte este trabajo</span>
                </div>

                <a
                  href={generarMensajeCompartir()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-compartir-whatsapp"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="compartir-icono" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  </svg>
                  <span className="compartir-texto">Compartir por WhatsApp</span>
                  <svg className="compartir-flecha" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                  </svg>
                </a>
                <p className="compartir-ayuda">
                  Ayuda a un amigo compartiendo esta oportunidad
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TarjetaTrabajo;
