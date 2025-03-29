// controllers/patient/uploadController.js
const { checkSupabaseConnection } = require('../../config/supabase');
const FoodEntry = require('../../models/FoodEntry');
const { validateFoodEntry } = require('../../utils/validators/foodEntryValidator');
const sharp = require('sharp');

/**
 * Muestra el formulario para subir una nueva foto de comida
 */
exports.getUploadForm = async (req, res) => {
  try {
    // Verificar la conexión a Supabase (recursos específicos)
    const connectionCheck = await checkSupabaseConnection();
    if (!connectionCheck.success) {
      console.error('Error de conexión/permisos Supabase:', connectionCheck.error);
      return res.render('patient/upload', {
        title: 'Subir Foto de Comida',
        user: req.user,
        connection_error: connectionCheck.error
      });
    }
    
    // Renderizar formulario de carga
    res.render('patient/upload', {
      title: 'Subir Foto de Comida',
      user: req.user,
      connection_error: null
    });
  } catch (error) {
    console.error('Error al mostrar formulario de carga:', error);
    res.render('patient/upload', {
      title: 'Subir Foto de Comida',
      user: req.user,
      connection_error: 'Error inesperado al preparar el formulario.'
    });
  }
};

/**
 * Procesa la subida de una nueva foto de comida
 */
exports.postUpload = async (req, res) => {
  try {
    console.log('Iniciando proceso de carga de foto...');
    
    // Datos del formulario
    const userId = req.user.id;
    const { foodName, description, mealType, mealDate } = req.body;
    const file = req.files?.food_photo;
    
    console.log(`Datos recibidos: userId=${userId}, nombre=${foodName}, descripción=${description?.length} chars`);
    
    // Validar datos del formulario
    const validationError = validateFoodEntry({ foodName, description }, file);
    if (validationError) {
      req.flash('error_msg', validationError);
      return res.redirect('/patient/upload');
    }
    
    try {
      // Validar el tipo MIME para asegurarse que es una imagen
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimeTypes.includes(file.mimetype)) {
        req.flash('error_msg', 'Formato de archivo no válido. Solo se permiten JPG, PNG, GIF y WebP.');
        return res.redirect('/patient/upload');
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
        // Si hay error en la optimización, usamos la imagen original
        optimizedImageBuffer = file.data;
      }
      
      // Convertir imagen optimizada a base64
      const imageData = `data:image/webp;base64,${optimizedImageBuffer.toString('base64')}`;
      
      // Crear entrada en la base de datos con la imagen optimizada en base64
      const result = await FoodEntry.create(userId, {
        name: foodName || 'Comida sin nombre',
        description: description || '',
        date: mealDate || new Date().toISOString(),
        mealType: mealType || 'other',
        imageData: imageData
      });
      
      if (!result.success) {
        console.error('Error al crear entrada de comida:', result.error);
        req.flash('error_msg', 'Error al guardar la entrada de comida. Por favor, intenta nuevamente.');
        return res.redirect('/patient/upload');
      }
      
      console.log('⭐ Subida completada con éxito. ID de entrada:', result.entry.id);
      req.flash('success_msg', '¡Tu comida ha sido registrada exitosamente!');
      return res.redirect('/patient/dashboard');
      
    } catch (error) {
      console.error('Error durante el proceso de subida:', error);
      req.flash('error_msg', 'Error al procesar la imagen. Por favor, intenta nuevamente.');
      return res.redirect('/patient/upload');
    }
  } catch (outerError) {
    console.error('Error general en controlador de subida:', outerError);
    req.flash('error_msg', 'Error general al procesar la solicitud.');
    return res.redirect('/patient/upload');
  }
};