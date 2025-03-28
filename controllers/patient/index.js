// controllers/patient/index.js
/**
 * Controlador principal para pacientes
 * Agrupa todos los subcontroladores en un solo punto de entrada
 */

// Importar los subcontroladores
const dashboardController = require('./dashboardController');
const uploadController = require('./uploadController');
const foodHistoryController = require('./foodHistoryController');
const entryDetailController = require('./entryDetailController');

// Exportar todas las funciones de los subcontroladores unificadas
module.exports = {
  // Dashboard
  getDashboard: dashboardController.getDashboard,
  
  // Subida de fotos
  getUploadForm: uploadController.getUploadForm,
  postUpload: uploadController.postUpload,
  
  // Historial de comidas
  getFoodHistory: foodHistoryController.getFoodHistory,
  
  // Operaciones de detalle/edición/eliminación
  getEntryDetail: entryDetailController.getEntryDetail,
  getEntryImage: entryDetailController.getEntryImage,
  getEditForm: entryDetailController.getEditForm,
  updateEntry: entryDetailController.updateEntry,
  deleteEntry: entryDetailController.deleteEntry
};