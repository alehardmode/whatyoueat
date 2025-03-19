const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { isDoctor } = require('../middleware/authMiddleware');

// Middleware para verificar si es médico en todas las rutas
router.use(isDoctor);

// Dashboard del médico
router.get('/dashboard', doctorController.getDashboard);

// Buscar pacientes
router.get('/search', doctorController.searchPatients);

// Ver historial de paciente
router.get('/patient/:patientId/history', doctorController.getPatientHistory);

// Ver detalle de entrada
router.get('/entry/:id', doctorController.getEntryDetail);

module.exports = router; 