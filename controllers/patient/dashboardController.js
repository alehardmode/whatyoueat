// controllers/patient/dashboardController.js
const FoodEntry = require('../../models/FoodEntry');
const { supabase } = require('../../config/supabase');
const moment = require('moment');

/**
 * Muestra el dashboard del paciente con entradas recientes
 */
exports.getDashboard = async (req, res) => {
  try {
    // Usar el modelo FoodEntry para obtener entradas recientes
    const result = await FoodEntry.getHistoryByUserId(
      req.user.id,
      null,
      1,  // Página 1
      3   // Límite de 3 entradas
    );
    
    const recentEntries = result.success ? result.entries : [];
      
    // Si hay entradas, obtener las imágenes de cada una
    if (recentEntries && recentEntries.length > 0) {
      await Promise.all(recentEntries.map(async (entry) => {
        try {
          // Obtener la imagen de la entrada
          const result = await FoodEntry.getById(entry.id);
          if (result.success && result.entry && result.entry.image_data) {
            entry.image_data = result.entry.image_data;
          } else {
            entry.image_data = '/img/empty-plate.svg';
          }
        } catch (error) {
          console.error(`Error al obtener imagen para entrada ${entry.id}:`, error);
          entry.image_data = '/img/empty-plate.svg';
        }
      }));
    }
    
    // Realizar una consulta específica para obtener estadísticas precisas
    const { count, error: countError } = await supabase
      .from('food_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);
    
    if (countError) {
      console.error('Error al obtener conteo de entradas:', countError);
    }
    
    const totalEntries = count !== null ? count : 0;
    
    // Renderizar dashboard
    res.render('patient/dashboard', {
      title: 'Dashboard del Paciente',
      user: req.user,
      recentEntries: recentEntries || [],
      stats: {
        totalEntries
      },
      // Pasar la información de confirmación de correo desde la sesión
      emailConfirmed: req.session.emailConfirmed
    });
  } catch (error) {
    console.error('Error en el dashboard:', error);
    req.flash('error_msg', 'Error al cargar el dashboard');
    
    // Intenta renderizar con valores por defecto incluso en caso de error grave
    res.render('patient/dashboard', {
      title: 'Dashboard del Paciente',
      user: req.user,
      recentEntries: [],
      stats: { totalEntries: 0 },
      // Pasar la información de confirmación de correo incluso en caso de error
      emailConfirmed: req.session.emailConfirmed
    });
  }
};