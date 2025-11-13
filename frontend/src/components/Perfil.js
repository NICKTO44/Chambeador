import React, { useState, useEffect } from 'react';
import './Perfil.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Perfil({ token, usuario }) {
    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [editando, setEditando] = useState(false);

    // Estados para datos editables
    const [datosEdicion, setDatosEdicion] = useState({});

    // Estados para archivos
    const [previewFoto, setPreviewFoto] = useState(null);
    const [archivoFoto, setArchivoFoto] = useState(null);
    const [archivoCV, setArchivoCV] = useState(null);
    const [subiendoFoto, setSubiendoFoto] = useState(false);
    const [subiendoCV, setSubiendoCV] = useState(false);

    const sectoresEmpresa = [
        'Tecnología',
        'Construcción',
        'Retail/Comercio',
        'Gastronomía',
        'Salud',
        'Educación',
        'Transporte',
        'Finanzas',
        'Marketing',
        'Manufactura',
        'Turismo',
        'Otros'
    ];

    // Cargar perfil al montar
    useEffect(() => {
        cargarPerfil();
    }, []);

    const cargarPerfil = async () => {
        try {
            setCargando(true);
            const response = await fetch(`${API_URL}/api/perfil`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar perfil');
            }

            const data = await response.json();
            setPerfil(data);
            setDatosEdicion(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    const handleChange = (e) => {
        setDatosEdicion({
            ...datosEdicion,
            [e.target.name]: e.target.value
        });
        setError('');
        setExito('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError('');
        setExito('');

        try {
            const response = await fetch(`${API_URL}/api/perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datosEdicion)
            });

            if (!response.ok) {
                throw new Error('Error al actualizar perfil');
            }

            setExito('✓ Perfil actualizado exitosamente');
            setEditando(false);
            await cargarPerfil();
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('La imagen no debe superar los 5MB');
                return;
            }

            setArchivoFoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewFoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubirFoto = async () => {
        if (!archivoFoto) return;

        setSubiendoFoto(true);
        setError('');
        setExito('');

        const formData = new FormData();
        formData.append('foto', archivoFoto);

        try {
            const response = await fetch(`${API_URL}/api/perfil/foto`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error al subir foto');
            }

            setExito('✓ Foto actualizada exitosamente');
            setArchivoFoto(null);
            setPreviewFoto(null);
            await cargarPerfil();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubiendoFoto(false);
        }
    };

    const handleCVChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError('El CV no debe superar los 10MB');
                return;
            }

            if (file.type !== 'application/pdf') {
                setError('Solo se permiten archivos PDF');
                return;
            }

            setArchivoCV(file);
        }
    };

    const handleSubirCV = async () => {
        if (!archivoCV) return;

        setSubiendoCV(true);
        setError('');
        setExito('');

        const formData = new FormData();
        formData.append('cv', archivoCV);

        try {
            const response = await fetch(`${API_URL}/api/perfil/cv`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error al subir CV');
            }

            setExito('✓ CV actualizado exitosamente');
            setArchivoCV(null);
            await cargarPerfil();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubiendoCV(false);
        }
    };

    if (cargando && !perfil) {
        return (
            <div className="perfil-container">
                <div className="cargando">
                    <div className="spinner"></div>
                    <p>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="perfil-container">
            <div className="perfil-header">
                <h1>Mi Perfil</h1>
                <span className={`badge-rol badge-${perfil?.rol}`}>
                    {perfil?.rol === 'trabajador' ? '👷 Trabajador' : '💼 Empleador'}
                </span>
            </div>

            {error && <div className="error-message">{error}</div>}
            {exito && <div className="success-message">{exito}</div>}

            {/* Indicador de perfil completo */}
            {perfil && (
                <div className={`perfil-completitud ${perfil.perfil_completo ? 'completo' : 'incompleto'}`}>
                    <div className="icono-completitud">
                        {perfil.perfil_completo ? '✓' : '⚠'}
                    </div>
                    <div className="texto-completitud">
                        <strong>
                            {perfil.perfil_completo
                                ? '¡Perfil completo!'
                                : 'Perfil incompleto'}
                        </strong>
                        <p>
                            {perfil.perfil_completo
                                ? 'Tu perfil está completo y visible para todos'
                                : perfil.rol === 'trabajador'
                                    ? 'Completa: foto de perfil, biografía y CV'
                                    : 'Completa: foto de perfil, biografía y datos de empresa'}
                        </p>
                    </div>
                </div>
            )}

            <div className="perfil-content">
                {/* SECCIÓN: FOTO DE PERFIL */}
                <div className="perfil-section">
                    <h2>📸 Foto de Perfil</h2>
                    <div className="foto-perfil-container">
                        <div className="foto-preview">
                            {previewFoto ? (
                                <img src={previewFoto} alt="Preview" />
                            ) : perfil?.foto_perfil ? (
                                <img src={`${API_URL}${perfil.foto_perfil}`} alt="Perfil" />
                            ) : (
                                <div className="foto-placeholder">
                                    {perfil?.nombre?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="foto-acciones">
                            <input
                                type="file"
                                id="foto-input"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleFotoChange}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="foto-input" className="btn-secondary">
                                Seleccionar Foto
                            </label>
                            {archivoFoto && (
                                <button
                                    onClick={handleSubirFoto}
                                    disabled={subiendoFoto}
                                    className="btn-primary"
                                >
                                    {subiendoFoto ? 'Subiendo...' : 'Subir Foto'}
                                </button>
                            )}
                            <small>Formatos: JPG, PNG, GIF, WEBP (Máx. 5MB)</small>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN: INFORMACIÓN BÁSICA */}
                <div className="perfil-section">
                    <div className="section-header">
                        <h2>👤 Información Básica</h2>
                        {!editando ? (
                            <button onClick={() => setEditando(true)} className="btn-editar">
                                ✏️ Editar
                            </button>
                        ) : (
                            <button onClick={() => setEditando(false)} className="btn-cancelar-mini">
                                ✕ Cancelar
                            </button>
                        )}
                    </div>

                    {!editando ? (
                        // MODO VISTA
                        <div className="perfil-vista">
                            <div className="dato-perfil">
                                <strong>Nombre:</strong>
                                <span>{perfil?.nombre}</span>
                            </div>
                            <div className="dato-perfil">
                                <strong>Email:</strong>
                                <span>{perfil?.email}</span>
                            </div>
                            <div className="dato-perfil">
                                <strong>Teléfono:</strong>
                                <span>{perfil?.telefono || 'No especificado'}</span>
                            </div>
                            <div className="dato-perfil">
                                <strong>Ubicación:</strong>
                                <span>{perfil?.ubicacion_perfil || 'No especificado'}</span>
                            </div>
                            <div className="dato-perfil">
                                <strong>Sitio web:</strong>
                                <span>
                                    {perfil?.sitio_web ? (
                                        <a href={perfil.sitio_web} target="_blank" rel="noopener noreferrer">
                                            {perfil.sitio_web}
                                        </a>
                                    ) : (
                                        'No especificado'
                                    )}
                                </span>
                            </div>
                            <div className="dato-perfil dato-completo">
                                <strong>Biografía:</strong>
                                <p>{perfil?.biografia || 'No especificado'}</p>
                            </div>
                        </div>
                    ) : (
                        // MODO EDICIÓN
                        <form onSubmit={handleSubmit} className="perfil-form">
                            <div className="form-group">
                                <label>Ubicación</label>
                                <input
                                    type="text"
                                    name="ubicacion_perfil"
                                    value={datosEdicion.ubicacion_perfil || ''}
                                    onChange={handleChange}
                                    placeholder="Ej: Lima, Perú"
                                />
                            </div>

                            <div className="form-group">
                                <label>Sitio web / LinkedIn</label>
                                <input
                                    type="url"
                                    name="sitio_web"
                                    value={datosEdicion.sitio_web || ''}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Biografía *</label>
                                <textarea
                                    name="biografia"
                                    value={datosEdicion.biografia || ''}
                                    onChange={handleChange}
                                    placeholder="Cuéntanos sobre ti..."
                                    rows="4"
                                    required
                                />
                                <small>{datosEdicion.biografia?.length || 0} caracteres</small>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => setEditando(false)} className="btn-cancelar">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={cargando} className="btn-primary">
                                    {cargando ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* SECCIÓN ESPECÍFICA PARA TRABAJADORES */}
                {perfil?.rol === 'trabajador' && (
                    <>
                        {/* CV */}
                        <div className="perfil-section">
                            <h2>📄 Currículum Vitae</h2>
                            <div className="cv-container">
                                {perfil?.cv_archivo ? (
                                    <div className="cv-actual">
                                        <div className="cv-info">
                                            <span className="icono-pdf">📄</span>
                                            <div>
                                                <strong>CV cargado</strong>
                                                <small>Última actualización: {new Date(perfil.updated_at).toLocaleDateString()}</small>
                                            </div>
                                        </div>

                                        <a
                                            href={`${API_URL}${perfil.cv_archivo}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-descargar"
                                        >
                                            Ver CV
                                        </a>

                                    </div>
                                ) : (
                                    <p className="sin-cv">No has cargado tu CV aún</p>
                                )}

                                <div className="cv-acciones">
                                    <input
                                        type="file"
                                        id="cv-input"
                                        accept="application/pdf"
                                        onChange={handleCVChange}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="cv-input" className="btn-secondary">
                                        {perfil?.cv_archivo ? 'Cambiar CV' : 'Seleccionar CV'}
                                    </label>
                                    {archivoCV && (
                                        <>
                                            <span className="archivo-seleccionado">
                                                ✓ {archivoCV.name}
                                            </span>
                                            <button
                                                onClick={handleSubirCV}
                                                disabled={subiendoCV}
                                                className="btn-primary"
                                            >
                                                {subiendoCV ? 'Subiendo...' : 'Subir CV'}
                                            </button>
                                        </>
                                    )}
                                    <small>Solo PDF (Máx. 10MB)</small>
                                </div>
                            </div>
                        </div>

                        {/* EXPERIENCIA, EDUCACIÓN, HABILIDADES */}
                        <div className="perfil-section">
                            <h2>💼 Información Profesional</h2>

                            {!editando ? (
                                <div className="perfil-vista">
                                    <div className="dato-perfil dato-completo">
                                        <strong>Experiencia:</strong>
                                        <p>{perfil?.experiencia || 'No especificado'}</p>
                                    </div>
                                    <div className="dato-perfil dato-completo">
                                        <strong>Educación:</strong>
                                        <p>{perfil?.educacion || 'No especificado'}</p>
                                    </div>
                                    <div className="dato-perfil dato-completo">
                                        <strong>Habilidades:</strong>
                                        <p>{perfil?.habilidades || 'No especificado'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="perfil-form">
                                    <div className="form-group">
                                        <label>Experiencia laboral</label>
                                        <textarea
                                            name="experiencia"
                                            value={datosEdicion.experiencia || ''}
                                            onChange={handleChange}
                                            placeholder="Describe tu experiencia laboral..."
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Educación</label>
                                        <textarea
                                            name="educacion"
                                            value={datosEdicion.educacion || ''}
                                            onChange={handleChange}
                                            placeholder="Describe tu formación académica..."
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Habilidades</label>
                                        <textarea
                                            name="habilidades"
                                            value={datosEdicion.habilidades || ''}
                                            onChange={handleChange}
                                            placeholder="Lista tus habilidades principales..."
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* SECCIÓN ESPECÍFICA PARA EMPLEADORES */}
                {perfil?.rol === 'empleador' && (
                    <div className="perfil-section">
                        <h2>🏢 Información de Empresa</h2>

                        {!editando ? (
                            <div className="perfil-vista">
                                <div className="dato-perfil">
                                    <strong>Nombre de empresa:</strong>
                                    <span>{perfil?.nombre_empresa || 'No especificado'}</span>
                                </div>
                                <div className="dato-perfil">
                                    <strong>RUC:</strong>
                                    <span>{perfil?.ruc_empresa || 'No especificado'}</span>
                                </div>
                                <div className="dato-perfil">
                                    <strong>Sector:</strong>
                                    <span>{perfil?.sector_empresa || 'No especificado'}</span>
                                </div>
                                <div className="dato-perfil">
                                    <strong>Tamaño:</strong>
                                    <span>
                                        {perfil?.tamanio_empresa
                                            ? `${perfil.tamanio_empresa} empleados`
                                            : 'No especificado'}
                                    </span>
                                </div>
                                <div className="dato-perfil dato-completo">
                                    <strong>Descripción:</strong>
                                    <p>{perfil?.descripcion_empresa || 'No especificado'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="perfil-form">
                                <div className="form-group">
                                    <label>Nombre de empresa *</label>
                                    <input
                                        type="text"
                                        name="nombre_empresa"
                                        value={datosEdicion.nombre_empresa || ''}
                                        onChange={handleChange}
                                        placeholder="Nombre de tu empresa"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>RUC</label>
                                        <input
                                            type="text"
                                            name="ruc_empresa"
                                            value={datosEdicion.ruc_empresa || ''}
                                            onChange={handleChange}
                                            placeholder="12345678901"
                                            maxLength="11"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Sector</label>
                                        <select
                                            name="sector_empresa"
                                            value={datosEdicion.sector_empresa || ''}
                                            onChange={handleChange}
                                        >
                                            <option value="">Selecciona un sector</option>
                                            {sectoresEmpresa.map((sector) => (
                                                <option key={sector} value={sector}>
                                                    {sector}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Tamaño de empresa</label>
                                    <select
                                        name="tamanio_empresa"
                                        value={datosEdicion.tamanio_empresa || ''}
                                        onChange={handleChange}
                                    >
                                        <option value="">Selecciona tamaño</option>
                                        <option value="1-10">1-10 empleados</option>
                                        <option value="11-50">11-50 empleados</option>
                                        <option value="51-200">51-200 empleados</option>
                                        <option value="201-500">201-500 empleados</option>
                                        <option value="500+">Más de 500 empleados</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Descripción de la empresa</label>
                                    <textarea
                                        name="descripcion_empresa"
                                        value={datosEdicion.descripcion_empresa || ''}
                                        onChange={handleChange}
                                        placeholder="Describe tu empresa..."
                                        rows="4"
                                    />
                                    <small>{datosEdicion.descripcion_empresa?.length || 0} caracteres</small>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Perfil;