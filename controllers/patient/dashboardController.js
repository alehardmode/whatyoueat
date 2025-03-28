// controllers/patient/dashboardController.js
const { supabase } = require('../../config/supabase');
const FoodEntry = require('../../models/FoodEntry');
const moment = require('moment');

/**
 * Muestra el dashboard del paciente con entradas recientes
 */
exports.getDashboard = async (req, res) => {
  try {
    // Obtener últimas 3 entradas para mostrar en el dashboard
    const { data: recentEntries, error: recentEntriesError } = await supabase
      .from('food_entries')
      .select('id, user_id, name, description, meal_date, meal_type, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (recentEntriesError) {
      console.error('Error al obtener entradas recientes:', recentEntriesError);
      // No fatal, podemos continuar con 0 entradas recientes
    }
    
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
    
    // Obtener estadísticas básicas de manera eficiente
    const { count, error: statsError } = await supabase
      .from('food_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);
      
    if (statsError) {
      console.error('Error al obtener estadísticas:', statsError);
    }
    
    const totalEntries = count || 0;
    
    // Renderizar dashboard
    res.render('patient/dashboard', {
      title: 'Dashboard del Paciente',
      user: req.user,
      recentEntries: recentEntries || [],
      stats: {
        totalEntries
      }
    });
  } catch (error) {
    console.error('Error en el dashboard:', error);
    req.flash('error_msg', 'Error al cargar el dashboard');
    
    // Intenta renderizar con valores por defecto incluso en caso de error grave
    res.render('patient/dashboard', {
      title: 'Dashboard del Paciente',
      user: req.user,
      recentEntries: [],
      stats: { totalEntries: 0 }
    });
  }
};