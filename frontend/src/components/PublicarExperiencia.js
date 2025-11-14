import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Experiencias.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function PublicarExperiencia({ onExperienciaPublicada, onCancelar }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    titulo: '',
    nombre_empresa: '',
    descripcion: '',
    tipo_experiencia: 'negativa'
  });
  const [archivo, setArchivo] = useState(null);
  const [previsualizacion, setPrevisualizacion] = useState(null);
  const [tipoArchivo, setTipoArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✨ ACTUALIZADO: Validar tamaño según tipo de archivo
    const esImagen = file.type.startsWith('image/');
    const esVideo = file.type.startsWith('video/');
    
    const limiteMB = esImagen ? 30 : 100;
    const limiteBytes = limiteMB * 1024 * 1024;

    if (file.size > limiteBytes) {
      setError(`El archivo no puede superar los ${limiteMB}MB`);
      return;
    }

    setArchivo(file);
    setError(null);

    // Determinar tipo de archivo
    if (esImagen) {
      setTipoArchivo('imagen');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrevisualizacion(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (esVideo) {
      setTipoArchivo('video');
      setPrevisualizacion(URL.createObjectURL(file));
    }
  };

  const eliminarArchivo = () => {
    setArchivo(null);
    setPrevisualizacion(null);
    setTipoArchivo(null);
    document.getElementById('archivo-input').value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.nombre_empresa || !formData.descripcion) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('nombre_empresa', formData.nombre_empresa);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('tipo_experiencia', formData.tipo_experiencia);
      
      if (archivo) {
        formDataToSend.append('media', archivo);
      }

      const response = await fetch(`${API_URL}/api/experiencias`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al publicar experiencia');
      }

      // Limpiar formulario
      setFormData({
        titulo: '',
        nombre_empresa: '',
        descripcion: '',
        tipo_experiencia: 'negativa'
      });
      setArchivo(null);
      setPrevisualizacion(null);
      setTipoArchivo(null);

      onExperienciaPublicada();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="publicar-experiencia-container">
      <div className="publicar-experiencia-card">
        <div className="publicar-header">
          <h3>✨ Compartir una experiencia laboral</h3>
          <button className="btn-cerrar" onClick={onCancelar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="publicar-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* Tipo de experiencia */}
          <div className="form-group">
            <label>Tipo de experiencia *</label>
            <div className="tipo-experiencia-selector">
              <label className={`tipo-option ${formData.tipo_experiencia === 'negativa' ? 'selected negativa' : ''}`}>
                <input
                  type="radio"
                  name="tipo_experiencia"
                  value="negativa"
                  checked={formData.tipo_experiencia === 'negativa'}
                  onChange={handleChange}
                />
                <span className="tipo-icon">⚠️</span>
                <span className="tipo-text">Negativa</span>
              </label>

              <label className={`tipo-option ${formData.tipo_experiencia === 'positiva' ? 'selected positiva' : ''}`}>
                <input
                  type="radio"
                  name="tipo_experiencia"
                  value="positiva"
                  checked={formData.tipo_experiencia === 'positiva'}
                  onChange={handleChange}
                />
                <span className="tipo-icon">✅</span>
                <span className="tipo-text">Positiva</span>
              </label>

              <label className={`tipo-option ${formData.tipo_experiencia === 'neutral' ? 'selected neutral' : ''}`}>
                <input
                  type="radio"
                  name="tipo_experiencia"
                  value="neutral"
                  checked={formData.tipo_experiencia === 'neutral'}
                  onChange={handleChange}
                />
                <span className="tipo-icon">💡</span>
                <span className="tipo-text">Neutral</span>
              </label>
            </div>
          </div>

          {/* Título */}
          <div className="form-group">
            <label htmlFor="titulo">Título de la experiencia *</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ej: Excelente ambiente laboral / Pago atrasado constantemente"
              maxLength="200"
              required
            />
            <small>{formData.titulo.length}/200 caracteres</small>
          </div>

          {/* Nombre de empresa */}
          <div className="form-group">
            <label htmlFor="nombre_empresa">Nombre de la empresa o lugar *</label>
            <input
              type="text"
              id="nombre_empresa"
              name="nombre_empresa"
              value={formData.nombre_empresa}
              onChange={handleChange}
              placeholder="Ej: Restaurant El Buen Sabor, Constructora ABC"
              maxLength="200"
              required
            />
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label htmlFor="descripcion">Cuéntanos tu experiencia *</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe tu experiencia en detalle. Sé honesto y específico para ayudar a otros trabajadores..."
              rows="6"
              required
            />
            <small>{formData.descripcion.length} caracteres</small>
          </div>

          {/* Subir archivo */}
          <div className="form-group">
            <label>Foto o video (opcional)</label>
            <div className="archivo-upload-area">
              {!previsualizacion ? (
                <label htmlFor="archivo-input" className="archivo-label">
                  <div className="archivo-placeholder">
                    <span className="archivo-icon">📸</span>
                    <span className="archivo-text">Clic para subir foto o video</span>
                    <small>✨ Imágenes: hasta 30MB | Videos: hasta 100MB</small>
                    <small>Formatos: JPG, PNG, GIF, MP4, MOV, AVI</small>
                  </div>
                  <input
                    type="file"
                    id="archivo-input"
                    accept="image/*,video/*"
                    onChange={handleArchivoChange}
                    style={{ display: 'none' }}
                  />
                </label>
              ) : (
                <div className="archivo-preview">
                  {tipoArchivo === 'imagen' ? (
                    <img src={previsualizacion} alt="Vista previa" />
                  ) : (
                    <video src={previsualizacion} controls />
                  )}
                  <button 
                    type="button" 
                    className="btn-eliminar-archivo"
                    onClick={eliminarArchivo}
                  >
                    ✕ Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancelar"
              onClick={onCancelar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-publicar"
              disabled={enviando}
            >
              {enviando ? 'Publicando...' : '🚀 Publicar Experiencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PublicarExperiencia;