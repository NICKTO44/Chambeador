const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpetas si no existen
const crearCarpetas = () => {
  const carpetas = [
    'uploads',
    'uploads/fotos',
    'uploads/cvs'
  ];

  carpetas.forEach(carpeta => {
    const ruta = path.join(__dirname, '..', carpeta);
    if (!fs.existsSync(ruta)) {
      fs.mkdirSync(ruta, { recursive: true });
    }
  });
};

crearCarpetas();

// Configuración para fotos de perfil
const storageFotos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'fotos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `foto-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configuración para CVs
const storageCVs = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'cvs'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cv-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Filtro para imágenes
const filtroImagenes = (req, file, cb) => {
  const tiposPermitidos = /jpeg|jpg|png|gif|webp/;
  const extname = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
  const mimetype = tiposPermitidos.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
};

// Filtro para PDFs
const filtroPDFs = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase() === '.pdf';
  const mimetype = file.mimetype === 'application/pdf';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'));
  }
};

// Multer para fotos (máximo 5MB)
const uploadFoto = multer({
  storage: storageFotos,
  fileFilter: filtroImagenes,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Multer para CVs (máximo 10MB)
const uploadCV = multer({
  storage: storageCVs,
  fileFilter: filtroPDFs,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = {
  uploadFoto,
  uploadCV
};