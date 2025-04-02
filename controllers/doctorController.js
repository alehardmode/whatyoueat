const Profile = require('../models/Profile');
const FoodEntry = require('../models/FoodEntry');
const DoctorPatient = require('../models/DoctorPatient');
const { checkSupabaseConnection } = require('../config/supabase');
const moment = require('moment');

// Mostrar dashboard del médico
exports.getDashboard = async (req, res) => {
  try {
    const doctorId = req.session.user.id;
    
    // Obtener lista de pacientes asignados - Asegurar que la consulta no use caché
    const result = await DoctorPatient.getPatientsByDoctor(doctorId);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Añadir información de timestamp para debugging
    console.log(`Dashboard cargado a las ${new Date().toISOString()} con ${result.patients.length} pacientes`);
    
    res.render('doctor/dashboard', {
      title: 'Dashboard del Médico',
      user: req.session.user,
      patients: result.patients,
      moment,
      emailConfirmed: req.session.emailConfirmed,
      // Añadir timestamp para evitar caché del navegador
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
    res.render('doctor/dashboard', {
      title: 'Dashboard del Médico',
      user: req.session.user,
      patients: [],
      error: 'Error al cargar la información del dashboard',
      emailConfirmed: req.session.emailConfirmed,
      // Añadir timestamp para evitar caché del navegador
      timestamp: Date.now()
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
    
    // Guardar la sesión antes de redireccionar para asegurar que todos los datos se persistan
    req.session.save((err) => {
      if (err) {
        console.error('Error al guardar la sesión después de asignar paciente:', err);
      }
      res.redirect('/doctor/dashboard');
    });
  } catch (error) {
    console.error('Error al asignar paciente:', error);
    req.flash('error_msg', 'Error al asignar paciente: ' + error.message);
    
    // También guardar la sesión en caso de error
    req.session.save((err) => {
      if (err) {
        console.error('Error al guardar la sesión después de un error de asignación:', err);
      }
      res.redirect('/doctor/dashboard');
    });
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
    
    // Verificar la conexión a Supabase primero
    const connectionCheck = await checkSupabaseConnection();
    if (!connectionCheck.success) {
      console.error('Error de conexión a Supabase al intentar ver historial del paciente:', connectionCheck.error);
      let errorMsg = 'Error de conexión a la base de datos';
      
      // Notificar pero continuar, ya que queremos mostrar al menos los datos de texto
      req.flash('error_msg', errorMsg);
    }
    
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
    
    // Obtener entradas del paciente, incluyendo las imágenes
    const entriesResult = await FoodEntry.getHistoryByUserId(patientId, dateFilter, page, limit);
    
    if (!entriesResult.success) {
      throw new Error(entriesResult.error);
    }
    
    // Para cada entrada, cargar la imagen completa si es necesario
    if (entriesResult.entries.length > 0) {
      await Promise.all(entriesResult.entries.map(async (entry) => {
        // Si no hay imagen_data, obtener la entrada completa con la imagen
        if (!entry.image_data) {
          try {
            const detailResult = await FoodEntry.getById(entry.id);
            if (detailResult.success && detailResult.entry && detailResult.entry.image_data) {
              entry.image_data = detailResult.entry.image_data;
            } else {
              entry.image_data = '/img/empty-plate.svg'; // Imagen por defecto
            }
          } catch (error) {
            console.error(`Error al obtener imagen para entrada ${entry.id}:`, error);
            entry.image_data = '/img/empty-plate.svg';
          }
        }
      }));
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
    
    // Verificar la conexión a Supabase primero
    const connectionCheck = await checkSupabaseConnection();
    if (!connectionCheck.success) {
      console.error('Error de conexión a Supabase al intentar ver detalle de entrada:', connectionCheck.error);
      // Notificar pero continuar, para mostrar al menos los datos de texto
      req.flash('error_msg', 'Error de conexión a la base de datos. Se mostrará la información disponible.');
    }
    
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
    
    // Obtener entrada específica con imagen incluida
    const entryResult = await FoodEntry.getById(entryId);
    
    if (!entryResult.success) {
      throw new Error(entryResult.error);
    }
    
    // Verificar que la entrada pertenece al paciente
    if (entryResult.entry.user_id !== patientId) {
      req.flash('error_msg', 'La entrada solicitada no pertenece a este paciente');
      return res.redirect(`/doctor/patient/${patientId}`);
    }
    
    // Si no hay datos de imagen, usar imagen por defecto
    const entry = entryResult.entry;
    if (!entry.image_data) {
      entry.image_url = '/img/empty-plate.svg'; // URL por defecto
    } else {
      // La imagen ya está en formato base64 en entry.image_data
      entry.image_url = entry.image_data;
    }
    
    res.render('doctor/entry-detail', {
      title: 'Detalle de Comida',
      user: req.session.user,
      patient: profileResult.profile,
      entry: entry,
      moment
    });
  } catch (error) {
    console.error('Error al obtener detalle de entrada:', error);
    req.flash('error_msg', 'Error al cargar los detalles de la entrada');
    res.redirect('/doctor/dashboard');
  }
};