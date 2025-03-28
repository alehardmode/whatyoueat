// controllers/patient/entryDetailController.js
const { supabase } = require('../../config/supabase');
const FoodEntry = require('../../models/FoodEntry');
const { validateFoodEntryUpdate } = require('../../utils/validators/foodEntryValidator');
const moment = require('moment');

/**
 * Muestra el detalle de una entrada de comida
 */
exports.getEntryDetail = async (req, res) => {
  try {
    // Si estamos usando el middleware de propiedad, la entrada ya está en req.foodEntry
    const entry = req.foodEntry;
    
    if (!entry) {
      req.flash('error_msg', 'Entrada no encontrada');
      return res.redirect('/patient/history');
    }
    
    // Si no hay imagen_data, usamos una imagen por defecto
    if (!entry.image_data) {
      entry.image_url = '/img/empty-plate.svg'; // Default
    } else {
      // La imagen ya está en formato base64 en entry.image_data, no necesita URL firmada
      entry.image_url = entry.image_data;
    }
    
    moment.locale('es'); // Asegurar locale para moment
    
    res.render('patient/entry-detail', {
      title: 'Detalle de Comida',
      entry,
      user: req.user,
      moment
    });
  } catch (error) {
    console.error('Error en getEntryDetail:', error);
    req.flash('error_msg', 'Error al mostrar el detalle de la entrada');
    res.redirect('/patient/history');
  }
};

/**
 * Muestra el formulario para editar una entrada
 */
exports.getEditForm = async (req, res) => {
  try {
    // La entrada ya debe estar en req.foodEntry gracias al middleware
    const entry = req.foodEntry;
    
    if (!entry) {
      req.flash('error_msg', 'Entrada no encontrada');
      return res.redirect('/patient/history');
    }
    
    // Si no hay imagen_data, usamos una imagen por defecto
    if (!entry.image_data) {
      entry.image_url = '/img/empty-plate.svg'; // Default
    } else {
      // La imagen ya está en formato base64 en entry.image_data
      entry.image_url = entry.image_data;
    }
    
    // Renderizar formulario de edición
    res.render('patient/edit-entry', {
      title: 'Editar Entrada',
      entry,
      user: req.user
    });
  } catch (error) {
    console.error('Error en getEditForm:', error);
    req.flash('error_msg', 'Error al preparar el formulario de edición');
    res.redirect('/patient/history');
  }
};

/**
 * Actualiza una entrada existente
 */
exports.updateEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    const { name, description, mealType, mealDate } = req.body;
    const userId = req.user.id;
    const file = req.files?.food_photo;
    
    // Validar datos
    const validationError = validateFoodEntryUpdate({ name, description });
    if (validationError) {
      req.flash('error_msg', validationError);
      return res.redirect(`/patient/entry/${entryId}/edit`);
    }
    
    // Preparar los datos para actualizar
    const updates = {
      name: name.trim(),
      description: description.trim(),
      meal_type: mealType || 'other',
      meal_date: mealDate || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Si hay una nueva imagen, procesar y agregar a los updates
    if (file) {
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimeTypes.includes(file.mimetype)) {
        req.flash('error_msg', 'Formato de archivo no válido. Solo se permiten JPG, PNG, GIF y WebP.');
        return res.redirect(`/patient/entry/${entryId}/edit`);
      }
      
      // Convertir imagen a base64
      updates.image_data = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
    }
    
    // Actualizar la entrada usando el modelo
    const result = await FoodEntry.update(entryId, userId, updates);
    
    if (!result.success) {
      console.error(`Error al actualizar entrada ${entryId}:`, result.error);
      req.flash('error_msg', 'Error al guardar los cambios');
      return res.redirect(`/patient/entry/${entryId}/edit`);
    }
    
    req.flash('success_msg', 'Entrada actualizada correctamente');
    res.redirect(`/patient/entry/${entryId}`);
  } catch (error) {
    console.error('Error en updateEntry:', error);
    const entryId = req.params.id;
    req.flash('error_msg', 'Error al procesar la actualización');
    
    if (entryId) {
      res.redirect(`/patient/entry/${entryId}/edit`);
    } else {
      res.redirect('/patient/history');
    }
  }
};

/**
 * Elimina una entrada de comida
 */
exports.deleteEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    const userId = req.user.id;
    
    // Eliminar la entrada usando el modelo
    const result = await FoodEntry.delete(entryId, userId);
    
    if (!result.success) {
      console.error(`Error al eliminar entrada ${entryId}:`, result.error);
      req.flash('error_msg', 'Error al eliminar la entrada');
      return res.redirect('/patient/history');
    }
    
    req.flash('success_msg', 'Entrada eliminada correctamente');
    res.redirect('/patient/history');
  } catch (error) {
    console.error('Error en deleteEntry:', error);
    req.flash('error_msg', 'Error al procesar la eliminación');
    res.redirect('/patient/history');
  }
};

/**
 * Devuelve la imagen de una entrada específica
 */
exports.getEntryImage = async (req, res) => {
  try {
    // La entrada ya debe estar en req.foodEntry gracias al middleware
    const entry = req.foodEntry;
    
    if (!entry) {
      return res.status(404).send('Imagen no encontrada');
    }
    
    // Si no hay imagen, devolver imagen por defecto
    if (!entry.image_data) {
      return res.redirect('/img/empty-plate.svg');
    }
    
    // Configurar encabezados de caché para mejorar rendimiento
    // Cache durante 1 día en navegadores
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('ETag', `"${entry.id}-${entry.updated_at}"`);
    
    // Si la imagen está en formato base64, extraer el tipo y los datos
    if (entry.image_data.startsWith('data:')) {
      const matches = entry.image_data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const base64Data = matches[2];
        
        // Convertir base64 a buffer y enviar con el tipo de contenido correcto
        const buffer = Buffer.from(base64Data, 'base64');
        res.set('Content-Type', contentType);
        return res.send(buffer);
      }
    }
    
    // Si no se pudo procesar el formato, enviar imagen por defecto
    return res.redirect('/img/empty-plate.svg');
  } catch (error) {
    console.error('Error al servir imagen de entrada:', error);
    return res.status(500).redirect('/img/empty-plate.svg');
  }
};