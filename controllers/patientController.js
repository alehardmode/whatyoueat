const FoodEntry = require('../models/FoodEntry');
const supabase = require('../config/supabase');
const path = require('path');
const moment = require('moment');

// Middleware para verificar si el usuario es paciente
exports.isPatient = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'paciente') {
    return next();
  }
  req.flash('error_msg', 'Debes ser un paciente para acceder a esta página');
  res.redirect('/auth/login');
};

// Mostrar dashboard del paciente
exports.getDashboard = (req, res) => {
  res.render('patient/dashboard', {
    title: 'Dashboard del Paciente',
    user: req.session.user
  });
};

// Mostrar formulario para subir foto
exports.getUploadForm = (req, res) => {
  res.render('patient/upload', {
    title: 'Subir Foto de Comida',
    user: req.session.user
  });
};

// Procesar subida de foto
exports.postUpload = async (req, res) => {
  try {
    const { comments, ingredients } = req.body;
    const userId = req.session.user.id;
    
    if (!req.file) {
      req.flash('error_msg', 'Por favor selecciona una imagen');
      return res.redirect('/patient/upload');
    }
    
    // Subir imagen a Supabase Storage
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${userId}_${Date.now()}${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('food-photos')
      .upload(`uploads/${fileName}`, req.file.buffer, {
        contentType: req.file.mimetype
      });
      
    if (error) {
      throw error;
    }
    
    // Obtener URL pública de la imagen
    const { publicURL, error: urlError } = supabase.storage
      .from('food-photos')
      .getPublicUrl(`uploads/${fileName}`);
      
    if (urlError) {
      throw urlError;
    }
    
    // Crear entrada en la base de datos
    const result = await FoodEntry.create(
      userId,
      publicURL,
      comments,
      ingredients
    );
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    req.flash('success_msg', 'Foto subida correctamente');
    res.redirect('/patient/history');
  } catch (error) {
    console.error('Error al subir foto:', error);
    req.flash('error_msg', 'Error al subir la foto');
    res.redirect('/patient/upload');
  }
};

// Mostrar historial de comidas
exports.getHistory = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    
    const result = await FoodEntry.getHistoryByUserId(userId, date);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    res.render('patient/history', {
      title: 'Historial de Comidas',
      user: req.session.user,
      entries: result.entries,
      date: moment(date).format('YYYY-MM-DD'),
      moment
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    req.flash('error_msg', 'Error al cargar el historial');
    res.redirect('/patient/dashboard');
  }
};

// Ver detalle de una entrada
exports.getEntryDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    // Obtener entrada
    const result = await FoodEntry.getById(id);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Verificar que la entrada pertenezca al usuario
    if (result.entry.user_id !== userId) {
      req.flash('error_msg', 'No tienes permiso para ver esta entrada');
      return res.redirect('/patient/history');
    }
    
    res.render('patient/entry-detail', {
      title: 'Detalle de Comida',
      user: req.session.user,
      entry: result.entry,
      moment
    });
  } catch (error) {
    console.error('Error al obtener detalle:', error);
    req.flash('error_msg', 'Error al cargar el detalle');
    res.redirect('/patient/history');
  }
};

// Eliminar entrada
exports.deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    // Eliminar entrada
    const result = await FoodEntry.delete(id, userId);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    req.flash('success_msg', 'Entrada eliminada correctamente');
    res.redirect('/patient/history');
  } catch (error) {
    console.error('Error al eliminar entrada:', error);
    req.flash('error_msg', 'Error al eliminar la entrada');
    res.redirect('/patient/history');
  }
}; 