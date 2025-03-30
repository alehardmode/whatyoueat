// middleware/patient/entryOwnershipMiddleware.js
const { supabase } = require('../../config/supabase');
const FoodEntry = require('../../models/FoodEntry');

/**
 * Middleware que verifica que el usuario actual sea propietario de una entrada de comida
 * Agrega req.foodEntry si se encuentra la entrada
 */
module.exports = async (req, res, next) => {
  try {
    const entryId = req.params.id;
    const userId = req.session.user.id;
    
    if (!entryId) {
      req.flash('error_msg', 'ID de entrada no proporcionado');
      return res.redirect('/patient/history');
    }
    
    // Obtener la entrada asegurando que pertenece al usuario utilizando el modelo
    const result = await FoodEntry.getById(entryId);
    
    if (!result.success || !result.entry) {
      console.log(`Entrada ${entryId} no encontrada o error: ${result.error}`);
      req.flash('error_msg', 'Entrada no encontrada o no tienes permiso para acceder');
      return res.redirect('/patient/history');
    }
    
    // Verificar que la entrada pertenece al usuario actual o es un médico con permiso
    if (result.entry.user_id !== userId) {
      // Verificar si el usuario es médico y tiene permiso para ver esta entrada
      const { data: isDoctor, error: doctorError } = await supabase
        .from('doctor_patients')
        .select('*')
        .eq('doctor_id', userId)
        .eq('patient_id', result.entry.user_id)
        .single();
      
      if (doctorError || !isDoctor) {
        console.log(`Usuario ${userId} no tiene permiso para acceder a entrada ${entryId}`);
        req.flash('error_msg', 'No tienes permiso para acceder a esta entrada');
        return res.redirect('/patient/history');
      }
    }
    
    // Añadir entrada a req para evitar consultas duplicadas en rutas posteriores
    req.foodEntry = result.entry;
    next();
  } catch (error) {
    console.error('Error en middleware de verificación de propiedad:', error);
    req.flash('error_msg', 'Error al verificar permisos de acceso');
    return res.redirect('/patient/history');
  }
};