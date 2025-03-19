const Profile = require('../models/Profile');
const FoodEntry = require('../models/FoodEntry');
const moment = require('moment');

// Mostrar dashboard del médico
exports.getDashboard = async (req, res) => {
  try {
    // Obtener lista de pacientes
    const result = await Profile.getAllPatients();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    res.render('doctor/dashboard', {
      title: 'Dashboard del Médico',
      user: req.session.user,
      patients: result.patients
    });
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
    req.flash('error_msg', 'Error al cargar el dashboard');
    res.redirect('/auth/login');
  }
};

// Filtrar pacientes por nombre
exports.searchPatients = async (req, res) => {
  try {
    const { name } = req.query;
    
    // Obtener todos los pacientes
    const result = await Profile.getAllPatients();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Filtrar por nombre si se proporciona un término de búsqueda
    let patients = result.patients;
    if (name) {
      patients = patients.filter(patient => 
        patient.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    
    res.render('doctor/dashboard', {
      title: 'Dashboard del Médico',
      user: req.session.user,
      patients,
      searchTerm: name
    });
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    req.flash('error_msg', 'Error al buscar pacientes');
    res.redirect('/doctor/dashboard');
  }
};

// Ver historial de un paciente
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    
    // Verificar que el paciente existe
    const userResult = await Profile.getById(patientId);
    
    if (!userResult.success) {
      throw new Error(userResult.error);
    }
    
    // Verificar que es un paciente
    if (userResult.user.role !== 'paciente') {
      req.flash('error_msg', 'El usuario seleccionado no es un paciente');
      return res.redirect('/doctor/dashboard');
    }
    
    // Obtener historial de comidas
    const result = await FoodEntry.getHistoryByUserId(patientId, date);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    res.render('doctor/patient-history', {
      title: `Historial de ${userResult.user.name}`,
      user: req.session.user,
      patient: userResult.user,
      entries: result.entries,
      date: moment(date).format('YYYY-MM-DD'),
      moment
    });
  } catch (error) {
    console.error('Error al obtener historial del paciente:', error);
    req.flash('error_msg', 'Error al cargar el historial del paciente');
    res.redirect('/doctor/dashboard');
  }
};

// Ver detalle de una entrada
exports.getEntryDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener entrada
    const result = await FoodEntry.getById(id);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Obtener información del paciente
    const userResult = await Profile.getById(result.entry.user_id);
    
    if (!userResult.success) {
      throw new Error(userResult.error);
    }
    
    res.render('doctor/entry-detail', {
      title: 'Detalle de Comida',
      user: req.session.user,
      entry: result.entry,
      patient: userResult.user,
      moment
    });
  } catch (error) {
    console.error('Error al obtener detalle:', error);
    req.flash('error_msg', 'Error al cargar el detalle');
    res.redirect('/doctor/dashboard');
  }
}; 