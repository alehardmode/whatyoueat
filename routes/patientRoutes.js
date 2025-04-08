const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient'); // Actualizado para usar el controlador en la carpeta patient
const { isPatient } = require('../middleware/authMiddleware');
const entryOwnershipMiddleware = require('../middleware/patient/entryOwnershipMiddleware');

// Middleware para verificar si es paciente en todas las rutas
router.use(isPatient);

// Dashboard del paciente
router.get('/dashboard', patientController.getDashboard);

// Rutas para subir foto
router.get('/upload', patientController.getUploadForm);
router.post('/upload', patientController.postUpload); // express-fileupload ya está configurado a nivel global

// Rutas para historial
router.get('/history', patientController.getFoodHistory);

// Rutas protegidas por verificación de propiedad
router.get('/entry/:id', entryOwnershipMiddleware, patientController.getEntryDetail);
router.get('/entry/:id/image', entryOwnershipMiddleware, patientController.getEntryImage);
router.get('/entry/:id/edit', entryOwnershipMiddleware, patientController.getEditForm);
router.post('/entry/:id/update', entryOwnershipMiddleware, patientController.updateEntry);

// Rutas para eliminación de entradas
router.delete('/entry/:id', entryOwnershipMiddleware, patientController.deleteEntry);
// Ruta POST para manejar el formulario directamente (por si method-override falla)
router.post('/entry/:id', entryOwnershipMiddleware, patientController.deleteEntry);

module.exports = router;