const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpetas si no existen
const crearCarpetas = () => {
  const carpetas = [
    'uploads',
    'uploads/fotos',
    'uploads/cvs',
    'uploads/experiencias'
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

// Configuración para experiencias (fotos y videos)
const storageExperiencias = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'experiencias'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.mimetype.startsWith('video/') ? 'video' : 'imagen';
    cb(null, `${prefix}-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// Filtro para imágenes y videos
const filtroImagenesYVideos = (req, file, cb) => {
  const tiposImagenes = /jpeg|jpg|png|gif|webp/;
  const tiposVideos = /mp4|mov|avi|wmv|flv|mkv/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const esImagen = tiposImagenes.test(extname.slice(1)) && file.mimetype.startsWith('image/');
  const esVideo = tiposVideos.test(extname.slice(1)) && file.mimetype.startsWith('video/');

  if (esImagen || esVideo) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp) o videos (mp4, mov, avi, wmv, flv, mkv)'));
  }
};

// Multer para fotos de perfil (máximo 5MB)
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

// ✨ ACTUALIZADO: Multer para experiencias (máximo 100MB para videos, 30MB para imágenes)
const uploadExperiencia = multer({
  storage: storageExperiencias,
  fileFilter: filtroImagenesYVideos,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (máximo permitido)
  fileFilter: (req, file, cb) => {
    const tiposImagenes = /jpeg|jpg|png|gif|webp/;
    const tiposVideos = /mp4|mov|avi|wmv|flv|mkv/;
    
    const extname = path.extname(file.originalname).toLowerCase();
    const esImagen = tiposImagenes.test(extname.slice(1)) && file.mimetype.startsWith('image/');
    const esVideo = tiposVideos.test(extname.slice(1)) && file.mimetype.startsWith('video/');

    // Validar límites específicos por tipo
    if (esImagen) {
      const limiteImagen = 30 * 1024 * 1024; // 30MB para imágenes
      if (file.size && file.size > limiteImagen) {
        return cb(new Error('Las imágenes no pueden superar los 30MB'));
      }
      return cb(null, true);
    } else if (esVideo) {
      const limiteVideo = 100 * 1024 * 1024; // 100MB para videos
      if (file.size && file.size > limiteVideo) {
        return cb(new Error('Los videos no pueden superar los 100MB'));
      }
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp) o videos (mp4, mov, avi, wmv, flv, mkv)'));
    }
  }
});

module.exports = {
  uploadFoto,
  uploadCV,
  uploadExperiencia
};