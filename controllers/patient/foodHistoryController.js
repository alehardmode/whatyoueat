// controllers/patient/foodHistoryController.js
const FoodEntry = require('../../models/FoodEntry');
const moment = require('moment');

/**
 * Muestra el historial de comidas con paginación y carga optimizada 
 */
exports.getFoodHistory = async (req, res) => {
  try {
    console.log('Obteniendo historial de comidas para usuario:', req.user.id);
    
    // Parámetros de paginación optimizados
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Reducido a 6 para mejorar rendimiento inicial
    
    // Filtros de fecha opcionales
    const dateFrom = req.query.date_from;
    const dateTo = req.query.date_to;
    
    // Usar el modelo FoodEntry para obtener el historial
    const result = await FoodEntry.getHistoryByUserId(
      req.user.id,
      { from: dateFrom, to: dateTo },
      page,
      limit
    );
    
    if (!result.success) {
      console.error('Error al obtener historial de comidas:', result.error);
      req.flash('error_msg', 'Error al cargar tu historial de comidas');
      return res.redirect('/patient/dashboard');
    }
    
    // Al usar FoodEntry.getHistoryByUserId, ya tenemos los datos con paginación
    const foodEntries = result.entries || [];
    const pagination = result.pagination || {
      page,
      limit,
      total: 0,
      totalPages: 0
    };
    
    // Para optimizar, NO cargamos todas las imágenes completas de inmediato
    // Solo asignamos URLs o placeholders para carga diferida en el cliente
    if (foodEntries.length > 0) {
      foodEntries.forEach(entry => {
        // Si la entrada ya tiene URL, usarla; si no, crear una URL temporal
        // La imagen se cargará bajo demanda cuando el usuario la vea
        if (!entry.image_url) {
          entry.image_url = `/patient/entry/${entry.id}/image?t=${new Date().getTime()}`;
        }
      });
    }
    
    // Renderizar página de historial
    res.render('patient/history', {
      title: 'Historial de Comidas',
      foodEntries: foodEntries,
      user: req.user,
      pagination: {
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        totalEntries: pagination.total,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit
      },
      moment, // Para formateo de fechas
      filters: {
        date_from: dateFrom || '',
        date_to: dateTo || ''
      }
    });
  } catch (error) {
    console.error('Error inesperado en getFoodHistory:', error);
    req.flash('error_msg', 'Error interno al procesar tu historial de comidas');
    res.redirect('/patient/dashboard');
  }
};