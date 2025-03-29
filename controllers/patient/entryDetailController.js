// controllers/patient/entryDetailController.js
const FoodEntry = require('../../models/FoodEntry');
const { validateFoodEntryUpdate } = require('../../utils/validators/foodEntryValidator');
const moment = require('moment');
const sharp = require('sharp');

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
      user: req.session.user,
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
    console.log('Iniciando getEditForm para entrada ID:', req.params.id);
    const entry = req.foodEntry;

    if (!entry) {
      console.log('Entrada no encontrada en req.foodEntry');
      req.flash('error_msg', 'Entrada no encontrada');
      return res.redirect('/patient/history');
    }

    console.log('Entrada encontrada:', entry.id);
    console.log('Datos de entrada originales:', entry); // Log adicional para depurar

    // --- Preparación de datos para la plantilla ---

    // Imagen

    entry.image_url = entry.image_data
      ? entry.image_data // Ya es base64
      : '/img/empty-plate.svg'; // Default
    console.log('URL de imagen preparada:', entry.image_url.substring(0, 50) + '...'); // Log corto de la URL

    // Asegurar valores por defecto para campos de texto y tipo
    entry.name = entry.name || '';
    entry.description = entry.description || '';
    entry.meal_type = entry.meal_type || 'other';

    // Formateo seguro de fecha de creación para mostrar
    let formattedCreatedAt = 'No disponible';
    if (entry.created_at) {
      try {
        formattedCreatedAt = moment(entry.created_at).locale('es').format('LLL'); // Formato localized
        console.log('Fecha creación formateada:', formattedCreatedAt);
      } catch (e) {
        console.error('Error formateando created_at:', entry.created_at, e);
      }
    } else {
      console.log('entry.created_at no está definida.');
    }

    // Formateo seguro de fecha de comida para input datetime-local
    let formattedMealDate = '';
    const dateToFormat = entry.meal_date || entry.created_at; // Priorizar meal_date
    if (dateToFormat) {
      try {
        const mDate = moment(dateToFormat);
        if (mDate.isValid()) {
          // Formato requerido por datetime-local: YYYY-MM-DDTHH:mm
          formattedMealDate = mDate.format('YYYY-MM-DDTHH:mm');
          console.log('Fecha comida formateada para input:', formattedMealDate);
        } else {
          console.log('Fecha a formatear inválida:', dateToFormat);
        }
      } catch (e) {
        console.error('Error formateando meal_date/created_at:', dateToFormat, e);
      }
    } else {
       console.log('Ni entry.meal_date ni entry.created_at están definidas.');
    }
     // Si aún está vacío después de intentar formatear, usar la hora actual
    if (!formattedMealDate) {
        console.log('Usando fecha/hora actual como fallback para input mealDate');
        formattedMealDate = moment().format('YYYY-MM-DDTHH:mm');
    }


    const user = req.session.user;
    if (!user) {
      console.log('Usuario no encontrado en la sesión');
      req.flash('error_msg', 'Sesión inválida. Por favor, inicia sesión nuevamente.');
      return res.redirect('/auth/login');
    }

    console.log('Renderizando plantilla edit-entry con datos preparados.');

    // Renderizar formulario de edición pasando las fechas formateadas
    res.render('patient/edit-entry', {
      title: 'Editar Entrada',
      entry, // Pasamos el objeto entry completo como antes
      user: req.session.user,
      formattedCreatedAt, // Nueva variable con la fecha de creación formateada
      formattedMealDate,  // Nueva variable con la fecha para el input
      moment, // Pasar moment si es necesario en otras partes (aunque ya no para fechas)
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
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
    const userId = req.session.user.id;
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
      
      // Optimizar la imagen usando sharp
      let optimizedImageBuffer;
      try {
        // Procesar la imagen con sharp para convertirla a WebP
        optimizedImageBuffer = await sharp(file.data)
          .resize({ 
            width: 1200, 
            height: 1200, 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .webp({ 
            quality: 80,
            lossless: false,
            effort: 4 // Balance entre velocidad y compresión (0-6)
          })
          .toBuffer();
          
        console.log('Imagen optimizada: Original', Math.round(file.data.length/1024), 'KB →', 
                  Math.round(optimizedImageBuffer.length/1024), 'KB (WebP)');
      } catch (sharpError) {
        console.error('Error al optimizar imagen con sharp:', sharpError);
        // Si hay error en la optimización, usamos la imagen original con el tipo original
        optimizedImageBuffer = file.data;
        updates.image_data = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
      }
      
      if (optimizedImageBuffer) {
        // Convertir imagen optimizada a base64 solo si no se asignó en el bloque de error
        if (!updates.image_data) {
          updates.image_data = `data:image/webp;base64,${optimizedImageBuffer.toString('base64')}`;
        }
      }
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
    const userId = req.session.user.id;
    
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
        
        try {
          // Configurar encabezados Content-Type según el tipo de imagen
          res.set('Content-Type', contentType);
          
          // Enviar los datos decodificados
          return res.send(Buffer.from(base64Data, 'base64'));
        } catch (decodeError) {
          console.error('Error al decodificar datos base64:', decodeError);
        }
      }
    }
    
    // Si no se pudo procesar el formato, enviar imagen por defecto
    return res.redirect('/img/empty-plate.svg');
  } catch (error) {
    console.error('Error al servir imagen de entrada:', error);
    return res.status(500).redirect('/img/empty-plate.svg');
  }
};