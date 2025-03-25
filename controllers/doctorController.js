const Profile = require('../models/Profile');
const FoodEntry = require('../models/FoodEntry');
const DoctorPatient = require('../models/DoctorPatient');
const moment = require('moment');

// Mostrar dashboard del médico
exports.getDashboard = async (req, res) => {
  try {
    const doctorId = req.session.user.id;
    
    // Obtener lista de pacientes asignados
    const result = await DoctorPatient.getPatientsByDoctor(doctorId);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    res.render('doctor/dashboard', {
      title: 'Dashboard del Médico',
      user: req.session.user,
      patients: result.patients,
      moment
    });
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
    res.render('doctor/dashboard', {
      title: 'Dashboard del Médico',
      user: req.session.user,
      patients: [],
      error: 'Error al cargar la información del dashboard'
    });
  }
};

// Filtrar pacientes por nombre
exports.searchPatients = async (req, res) => {
  try {
    const { search } = req.query;
    const doctorId = req.session.user.id;
    
    let patients = [];
    let error = null;
    
    if (search) {
      // Buscar pacientes por nombre
      const result = await Profile.searchPatientsByName(search);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      patients = result.patients;
    }
    
    // Obtener pacientes ya asignados a este médico
    const assignedResult = await DoctorPatient.getPatientsByDoctor(doctorId);
    const assignedIds = assignedResult.success 
      ? assignedResult.patients.map(p => p.id) 
      : [];
    
    // Marcar en la lista de búsqueda cuáles ya están asignados
    patients = patients.map(patient => ({
      ...patient,
      isAssigned: assignedIds.includes(patient.id)
    }));
    
    res.render('doctor/search-patients', {
      title: 'Buscar Pacientes',
      user: req.session.user,
      patients,
      searchTerm: search || '',
      moment
    });
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    res.render('doctor/search-patients', {
      title: 'Buscar Pacientes',
      user: req.session.user,
      patients: [],
      searchTerm: req.query.search || '',
      error: 'Error al buscar pacientes'
    });
  }
};

// Asignar un paciente a este médico
exports.assignPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.session.user.id;
    
    // Asignar paciente
    const result = await DoctorPatient.assign(doctorId, patientId);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    req.flash('success_msg', 'Paciente asignado correctamente');
    res.redirect('/doctor/search-patients');
  } catch (error) {
    console.error('Error al asignar paciente:', error);
    req.flash('error_msg', 'Error al asignar paciente: ' + error.message);
    res.redirect('/doctor/search-patients');
  }
};

// Eliminar la relación con un paciente
exports.removePatient = async (req, res) => {
  try {
    const { relationId } = req.params;
    const doctorId = req.session.user.id;
    
    // Eliminar relación
    const result = await DoctorPatient.remove(relationId, doctorId);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    req.flash('success_msg', 'Paciente removido correctamente');
    res.redirect('/doctor/dashboard');
  } catch (error) {
    console.error('Error al remover paciente:', error);
    req.flash('error_msg', 'Error al remover paciente: ' + error.message);
    res.redirect('/doctor/dashboard');
  }
};

// Ver historial de un paciente
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.session.user.id;
    const { date_from, date_to, page: pageParam } = req.query;
    const page = parseInt(pageParam) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Crear objeto de filtros para pasar a la vista
    const filters = {
      date_from: date_from || '',
      date_to: date_to || ''
    };
    
    // Verificar que el paciente está asignado a este médico
    const assignedResult = await DoctorPatient.getPatientsByDoctor(doctorId);
    
    if (!assignedResult.success) {
      throw new Error(assignedResult.error);
    }
    
    const isAssigned = assignedResult.patients.some(p => p.id === patientId);
    
    if (!isAssigned) {
      req.flash('error_msg', 'No tienes permiso para ver este paciente');
      return res.redirect('/doctor/dashboard');
    }
    
    // Obtener perfil del paciente
    const profileResult = await Profile.getById(patientId);
    
    if (!profileResult.success) {
      throw new Error(profileResult.error);
    }
    
    // Lógica para manejar el filtro de fecha
    let dateFilter = null;
    
    if (date_from && date_to) {
      // Si ambas fechas están presentes, usamos el rango completo
      dateFilter = { from: new Date(date_from), to: new Date(date_to) };
    } else if (date_from) {
      // Si solo hay fecha inicial, filtramos desde esa fecha hasta hoy
      dateFilter = { from: new Date(date_from), to: new Date() };
    } else if (date_to) {
      // Si solo hay fecha final, filtramos desde el inicio del tiempo hasta esa fecha
      dateFilter = { from: new Date(0), to: new Date(date_to) };
    }
    
    // Obtener entradas del paciente
    const entriesResult = await FoodEntry.getHistoryByUserId(patientId, dateFilter, page, limit);
    
    if (!entriesResult.success) {
      throw new Error(entriesResult.error);
    }
    
    res.render('doctor/patient-history', {
      title: `Historial de ${profileResult.profile.name}`,
      user: req.session.user,
      patient: profileResult.profile,
      entries: entriesResult.entries,
      filters,
      currentPage: page,
      totalPages: entriesResult.pagination.totalPages,
      moment,
      currentUrl: req.originalUrl.split('?')[0]
    });
  } catch (error) {
    console.error('Error al obtener historial del paciente:', error);
    req.flash('error_msg', 'Error al cargar el historial del paciente');
    res.redirect('/doctor/dashboard');
  }
};

// Ver detalle de una entrada de un paciente
exports.getEntryDetail = async (req, res) => {
  try {
    const { patientId, entryId } = req.params;
    const doctorId = req.session.user.id;
    
    // Verificar que el paciente está asignado a este médico
    const assignedResult = await DoctorPatient.getPatientsByDoctor(doctorId);
    
    if (!assignedResult.success) {
      throw new Error(assignedResult.error);
    }
    
    const isAssigned = assignedResult.patients.some(p => p.id === patientId);
    
    if (!isAssigned) {
      req.flash('error_msg', 'No tienes permiso para ver este paciente');
      return res.redirect('/doctor/dashboard');
    }
    
    // Obtener perfil del paciente
    const profileResult = await Profile.getById(patientId);
    
    if (!profileResult.success) {
      throw new Error(profileResult.error);
    }
    
    // Obtener entrada específica
    const entryResult = await FoodEntry.getById(entryId);
    
    if (!entryResult.success) {
      throw new Error(entryResult.error);
    }
    
    // Verificar que la entrada pertenece al paciente
    if (entryResult.entry.user_id !== patientId) {
      req.flash('error_msg', 'La entrada solicitada no pertenece a este paciente');
      return res.redirect(`/doctor/patient/${patientId}`);
    }
    
    res.render('doctor/entry-detail', {
      title: 'Detalle de Comida',
      user: req.session.user,
      patient: profileResult.profile,
      entry: entryResult.entry,
      moment
    });
  } catch (error) {
    console.error('Error al obtener detalle de entrada:', error);
    req.flash('error_msg', 'Error al cargar los detalles de la entrada');
    res.redirect('/doctor/dashboard');
  }
}; 