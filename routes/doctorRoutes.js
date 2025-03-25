const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { isDoctor } = require('../middleware/authMiddleware');

// Middleware para verificar si es médico en todas las rutas
router.use(isDoctor);

// Dashboard del médico
router.get('/dashboard', doctorController.getDashboard);

// Búsqueda y asignación de pacientes
router.get('/search-patients', doctorController.searchPatients);
router.get('/assign-patient/:patientId', doctorController.assignPatient);
router.get('/remove-patient/:relationId', doctorController.removePatient);

// Ver historial de paciente
router.get('/patient/:patientId', doctorController.getPatientHistory);
router.get('/patient/:patientId/entry/:entryId', doctorController.getEntryDetail);

module.exports = router; 