const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { isPatient } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configuración de multer para subir fotos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// Middleware para verificar si es paciente en todas las rutas
router.use(isPatient);

// Dashboard del paciente
router.get('/dashboard', patientController.getDashboard);

// Rutas para subir foto
router.get('/upload', patientController.getUploadForm);
router.post('/upload', upload.single('food_photo'), patientController.postUpload);

// Rutas para historial
router.get('/history', patientController.getFoodHistory);
router.get('/entry/:id', patientController.getEntryDetail);
router.get('/entry/:id/delete', patientController.deleteEntry);

// Rutas para editar entradas
router.get('/entry/:id/edit', patientController.getEditForm);
router.post('/entry/:id/update', patientController.updateEntry);

module.exports = router; 