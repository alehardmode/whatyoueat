const FoodEntry = require('../models/FoodEntry');
const { supabase, checkSupabaseConnection, generateSignedUrl } = require('../config/supabase');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// Dashboard del paciente
const getDashboard = async (req, res) => {
  try {
    // Obtener últimas 5 entradas para mostrar en el dashboard
    const { data: recentEntries, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error al obtener entradas recientes:', error);
    }
    
    // Obtener estadísticas básicas
    const { data: stats, error: statsError } = await supabase
      .from('food_entries')
      .select('count')
      .eq('user_id', req.user.id);
    
    const totalEntries = stats && stats[0] ? stats[0].count : 0;
    
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
    res.render('patient/dashboard', {
      title: 'Dashboard del Paciente',
      user: req.user,
      recentEntries: [],
      stats: { totalEntries: 0 }
    });
  }
};

// Mostrar formulario para subir foto
const getUploadForm = async (req, res) => {
  try {
    // Verificar la conexión a Supabase
    const connectionCheck = await checkSupabaseConnection();
    
    if (!connectionCheck.success) {
      console.error('Error de conexión a Supabase:', connectionCheck.error);
      // Enviar error a la vista
      return res.render('patient/upload', {
        title: 'Subir Foto de Comida',
        user: req.user,
        connection_error: connectionCheck.error,
        error_msg: null,
        success_msg: null
      });
    }
    
    // Renderizar formulario de carga
    res.render('patient/upload', {
      title: 'Subir Foto de Comida',
      user: req.user,
      connection_error: null,
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
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

// Procesar subida de foto
const postUpload = async (req, res) => {
  try {
    console.log('Iniciando proceso de carga de foto...');
    
    // Datos del formulario
    const userId = req.user.id;
    const comments = req.body.comments;
    const ingredients = req.body.ingredients;
    
    console.log(`Datos recibidos: userId=${userId}, comentarios=${comments?.length} caracteres, ingredientes=${ingredients?.length} caracteres`);
    
    // Verificar archivo
    if (!req.file) {
      console.error('No se proporcionó ningún archivo');
      req.flash('error_msg', 'Debes seleccionar una foto');
      return res.redirect('/patient/upload');
    }
    
    // Validación de tamaño y tipo de archivo
    if (req.file.size > 10 * 1024 * 1024) { // 10MB
      console.error('Archivo excede el tamaño máximo permitido');
      req.flash('error_msg', 'La foto excede el tamaño máximo permitido (10MB)');
      return res.redirect('/patient/upload');
    }
    
    if (!req.file.mimetype.startsWith('image/')) {
      console.error('Tipo de archivo no válido:', req.file.mimetype);
      req.flash('error_msg', 'El archivo debe ser una imagen (jpg, png, etc.)');
      return res.redirect('/patient/upload');
    }
    
    // Validar que hay comentarios e ingredientes
    if (!comments || comments.trim() === '') {
      req.flash('error_msg', 'Debes proporcionar comentarios sobre la comida');
      return res.redirect('/patient/upload');
    }
    
    if (!ingredients || ingredients.trim() === '') {
      req.flash('error_msg', 'Debes listar los ingredientes de la comida');
      return res.redirect('/patient/upload');
    }
    
    // Generar nombre de archivo único con timestamp y userId para evitar sobreescrituras
    const timestamp = Date.now();
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    const fileName = `${userId}_${timestamp}_${uuidv4().substring(0, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;
    
    console.log(`Intentando subir archivo '${fileName}' a Supabase Storage`);
    
    // Subir archivo a Supabase Storage con metadatos
    const { data, error } = await supabase.storage
      .from('food-photos')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
        // Incluir metadatos para las políticas RLS
        metadata: {
          userId: userId,
          uploadedAt: new Date().toISOString()
        }
      });
    
    if (error) {
      console.error('Error al subir imagen a Supabase:', error);
      req.flash('error_msg', 'Error al subir la imagen: ' + error.message);
      return res.redirect('/patient/upload');
    }
    
    console.log('Imagen subida exitosamente:', data.path);
    
    // Generar URL firmada para la imagen
    let imageUrl;
    try {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('food-photos')
        .createSignedUrl(filePath, 60 * 60 * 24); // 24 horas
      
      if (signedUrlError) {
        throw new Error('Error al generar URL firmada: ' + signedUrlError.message);
      }
      
      imageUrl = signedUrlData.signedUrl;
      console.log('URL firmada generada directamente:', imageUrl.substring(0, 100) + '...');
    } catch (urlError) {
      console.error('Error al generar URL firmada:', urlError);
      // Usar URL pública como respaldo
      const { data: publicUrlData } = supabase.storage
        .from('food-photos')
        .getPublicUrl(filePath);
      
      imageUrl = publicUrlData.publicUrl;
      console.log('Usando URL pública como respaldo:', imageUrl);
    }
    
    // Crear entrada en la base de datos con storage_path para futuras referencias
    const { data: entryData, error: entryError } = await supabase
      .from('food_entries')
      .insert([
        {
          user_id: userId,
          image_url: imageUrl,
          storage_path: filePath,
          comments: comments,
          ingredients: ingredients,
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (entryError) {
      console.error('Error al crear entrada en la base de datos:', entryError);
      req.flash('error_msg', 'La imagen se subió pero hubo un error al guardar los datos');
      return res.redirect('/patient/upload');
    }
    
    console.log('Entrada creada exitosamente con ID:', entryData[0].id);
    req.flash('success_msg', '¡Comida registrada exitosamente!');
    res.redirect('/patient/history');
  } catch (error) {
    console.error('Error inesperado al procesar la carga:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    res.redirect('/patient/upload');
  }
};

// Mostrar historial de comidas
const getFoodHistory = async (req, res) => {
  try {
    console.log('Obteniendo historial de comidas para usuario:', req.user.id);
    
    // Obtener parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9; // 9 entradas por página
    const offset = (page - 1) * limit;
    
    // Obtener total de entradas para la paginación
    const { count, error: countError } = await supabase
      .from('food_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);
    
    if (countError) {
      console.error('Error al obtener conteo de entradas:', countError);
      req.flash('error_msg', 'Error al cargar estadísticas de tu historial');
      return res.redirect('/patient/dashboard');
    }
    
    // Obtener las entradas para la página actual con ordenamiento por fecha descendente
    const { data: foodEntries, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error al obtener historial de comidas:', error);
      req.flash('error_msg', 'Error al cargar tu historial de comidas');
      return res.redirect('/patient/dashboard');
    }
    
    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);
    
    // Si no hay entradas, mostrar la página con array vacío
    if (!foodEntries || foodEntries.length === 0) {
      console.log('No se encontraron entradas para el usuario');
      return res.render('patient/history', {
        title: 'Historial de Comidas',
        foodEntries: [],
        user: req.user,
        currentPage: page,
        totalPages: totalPages,
        totalEntries: count || 0,
        filters: {}
      });
    }
    
    console.log(`Se encontraron ${foodEntries.length} entradas para la página ${page}`);
    
    // Generar URLs firmadas directamente para todas las imágenes
    const entriesWithSignedUrls = await Promise.all(
      foodEntries.map(async (entry, index) => {
        // Si hay ruta de almacenamiento, usarla directamente para URL firmada
        if (entry.storage_path) {
          try {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('food-photos')
              .createSignedUrl(entry.storage_path, 60 * 60 * 24); // 24 horas
            
            if (!signedUrlError && signedUrlData && signedUrlData.signedUrl) {
              entry.image_url = signedUrlData.signedUrl;
              console.log(`URL firmada generada para entrada #${(page-1)*limit + index+1} usando storage_path`);
            } else {
              console.error(`Error al generar URL firmada para storage_path ${entry.storage_path}:`, signedUrlError);
              // Intentar generar URL con el método antiguo
              entry.image_url = await generateSignedUrl(entry.image_url);
            }
          } catch (e) {
            console.error(`Error al procesar storage_path ${entry.storage_path}:`, e);
            // Fallback al método original
            entry.image_url = await generateSignedUrl(entry.image_url);
          }
        } else if (entry.image_url) {
          // Usar el método general si no hay storage_path
          entry.image_url = await generateSignedUrl(entry.image_url);
        }
        
        // Añadir número de entrada para mostrar en la interfaz
        entry.entryNumber = (page - 1) * limit + index + 1;
        return entry;
      })
    );
    
    console.log('URLs firmadas generadas para todas las entradas');
    
    // Renderizar la página de historial con las entradas
    res.render('patient/history', {
      title: 'Historial de Comidas',
      foodEntries: entriesWithSignedUrls,
      user: req.user,
      currentPage: page,
      totalPages: totalPages,
      totalEntries: count || 0,
      filters: {}
    });
  } catch (error) {
    console.error('Error inesperado en getFoodHistory:', error);
    req.flash('error_msg', 'Error al procesar tu historial de comidas');
    res.redirect('/patient/dashboard');
  }
};

// Mostrar detalle de una entrada de comida
const getEntryDetail = async (req, res) => {
  try {
    // Obtener el ID de entrada de la URL
    const entryId = req.params.id;
    
    if (!entryId) {
      req.flash('error_msg', 'ID de entrada no proporcionado');
      return res.redirect('/patient/history');
    }
    
    console.log(`Buscando entrada con ID: ${entryId}`);
    
    // Obtener la entrada desde la base de datos
    const { data: entry, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', req.user.id)
      .single();
    
    if (error) {
      console.error('Error al obtener entrada:', error);
      req.flash('error_msg', 'Error al obtener la entrada de comida');
      return res.redirect('/patient/history');
    }
    
    if (!entry) {
      console.log('Entrada no encontrada o no pertenece al usuario actual');
      req.flash('error_msg', 'Entrada de comida no encontrada');
      return res.redirect('/patient/history');
    }

    // Generar URL firmada para la imagen
    let signedImageUrl;
    
    // Usar storage_path si está disponible
    if (entry.storage_path) {
      console.log('Usando storage_path para generar URL firmada:', entry.storage_path);
      try {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('food-photos')
          .createSignedUrl(entry.storage_path, 60 * 60 * 24); // 24 horas
        
        if (!signedUrlError && signedUrlData && signedUrlData.signedUrl) {
          signedImageUrl = signedUrlData.signedUrl;
          console.log('URL firmada generada exitosamente usando storage_path');
        } else {
          console.error('Error al generar URL firmada con storage_path:', signedUrlError);
          // Si falla, usar el método general
          signedImageUrl = await generateSignedUrl(entry.image_url);
        }
      } catch (e) {
        console.error('Error al procesar storage_path:', e);
        signedImageUrl = await generateSignedUrl(entry.image_url);
      }
    } else if (entry.image_url) {
      // Usar el método general si no hay storage_path
      console.log('Generando URL firmada para image_url:', entry.image_url);
      signedImageUrl = await generateSignedUrl(entry.image_url);
    } else {
      // Si no hay imagen, usar imagen por defecto
      console.warn('Entrada sin URL de imagen');
      signedImageUrl = '/img/empty-plate.svg';
    }
    
    // Actualizar la URL de la imagen con la URL firmada
    entry.image_url = signedImageUrl;
    
    console.log('Renderizando detalle de entrada con URL firmada');
    
    // Incluir moment para formateo de fechas
    moment.locale('es');
    
    // Mostrar la página de detalle con la entrada
    res.render('patient/entry-detail', {
      title: 'Detalle de Comida',
      entry,
      user: req.user,
      moment
    });
  } catch (error) {
    console.error('Error inesperado en getEntryDetail:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    res.redirect('/patient/history');
  }
};

// Eliminar entrada
const deleteEntry = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    
    console.log(`Intentando eliminar entrada ${id} del usuario ${userId}`);
    
    // Primero obtener la información de la entrada para eliminar el archivo
    const { data: entry, error: getError } = await supabase
      .from('food_entries')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (getError || !entry) {
      console.error('Error al obtener información de la entrada:', getError);
      req.flash('error_msg', 'No se pudo encontrar la entrada a eliminar');
      return res.redirect('/patient/history');
    }
    
    // Eliminar el registro de la base de datos
    const { error: deleteError } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Error al eliminar entrada de la base de datos:', deleteError);
      req.flash('error_msg', 'Error al eliminar la entrada');
      return res.redirect('/patient/history');
    }
    
    // Si hay una ruta de almacenamiento, eliminar también el archivo
    if (entry.storage_path) {
      console.log('Eliminando archivo de Supabase Storage:', entry.storage_path);
      const { error: storageError } = await supabase.storage
        .from('food-photos')
        .remove([entry.storage_path]);
      
      if (storageError) {
        console.error('Error al eliminar archivo de Storage:', storageError);
        // No impedimos continuar si hay error al eliminar el archivo
      }
    }
    
    console.log('Entrada eliminada exitosamente');
    req.flash('success_msg', 'Entrada eliminada correctamente');
    res.redirect('/patient/history');
  } catch (error) {
    console.error('Error inesperado al eliminar entrada:', error);
    req.flash('error_msg', 'Error al procesar la solicitud de eliminación');
    res.redirect('/patient/history');
  }
};

// Mostrar formulario para editar entrada
const getEditForm = async (req, res) => {
  try {
    // Obtener el ID de entrada de la URL
    const entryId = req.params.id;
    
    if (!entryId) {
      req.flash('error_msg', 'ID de entrada no proporcionado');
      return res.redirect('/patient/history');
    }
    
    console.log(`Buscando entrada para editar con ID: ${entryId}`);
    
    // Obtener la entrada desde la base de datos
    const { data: entry, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', req.user.id)
      .single();
    
    if (error) {
      console.error('Error al obtener entrada para editar:', error);
      req.flash('error_msg', 'Error al obtener los datos de la entrada');
      return res.redirect('/patient/history');
    }
    
    if (!entry) {
      console.log('Entrada no encontrada o no pertenece al usuario actual');
      req.flash('error_msg', 'No se encontró la entrada a editar');
      return res.redirect('/patient/history');
    }

    // Generar URL firmada para la imagen
    let signedImageUrl;
    
    // Usar storage_path si está disponible
    if (entry.storage_path) {
      console.log('Usando storage_path para generar URL firmada:', entry.storage_path);
      try {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('food-photos')
          .createSignedUrl(entry.storage_path, 60 * 60 * 24); // 24 horas
        
        if (!signedUrlError && signedUrlData && signedUrlData.signedUrl) {
          signedImageUrl = signedUrlData.signedUrl;
        } else {
          signedImageUrl = await generateSignedUrl(entry.image_url);
        }
      } catch (e) {
        signedImageUrl = await generateSignedUrl(entry.image_url);
      }
    } else if (entry.image_url) {
      signedImageUrl = await generateSignedUrl(entry.image_url);
    } else {
      signedImageUrl = '/img/empty-plate.svg';
    }
    
    // Actualizar la URL de la imagen para mostrarla en el formulario
    entry.image_url = signedImageUrl;
    
    // Renderizar el formulario de edición
    res.render('patient/edit-entry', {
      title: 'Editar Entrada',
      entry,
      user: req.user
    });
  } catch (error) {
    console.error('Error inesperado en getEditForm:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    res.redirect('/patient/history');
  }
};

// Procesar actualización de entrada
const updateEntry = async (req, res) => {
  try {
    // Obtener el ID de entrada y los datos del formulario
    const entryId = req.params.id;
    const { comments, ingredients } = req.body;
    const userId = req.user.id;
    
    if (!entryId) {
      req.flash('error_msg', 'ID de entrada no proporcionado');
      return res.redirect('/patient/history');
    }
    
    console.log(`Actualizando entrada ${entryId} con nuevos datos`);
    
    // Validar datos
    if (!comments || comments.trim() === '') {
      req.flash('error_msg', 'Los comentarios son obligatorios');
      return res.redirect(`/patient/entry/${entryId}/edit`);
    }
    
    if (!ingredients || ingredients.trim() === '') {
      req.flash('error_msg', 'Los ingredientes son obligatorios');
      return res.redirect(`/patient/entry/${entryId}/edit`);
    }
    
    // Actualizar la entrada en la base de datos
    const { data, error } = await supabase
      .from('food_entries')
      .update({
        comments,
        ingredients,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .eq('user_id', userId)
      .select();
    
    if (error) {
      console.error('Error al actualizar entrada:', error);
      req.flash('error_msg', 'Error al actualizar la entrada');
      return res.redirect(`/patient/entry/${entryId}/edit`);
    }
    
    if (!data || data.length === 0) {
      console.error('No se encontró la entrada para actualizar');
      req.flash('error_msg', 'No se encontró la entrada para actualizar');
      return res.redirect('/patient/history');
    }
    
    console.log('Entrada actualizada exitosamente');
    req.flash('success_msg', 'Entrada actualizada correctamente');
    res.redirect(`/patient/entry/${entryId}`);
  } catch (error) {
    console.error('Error inesperado en updateEntry:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    res.redirect('/patient/history');
  }
};

// Exportar funciones del controlador
module.exports = {
  getDashboard,
  getUploadForm,
  postUpload,
  getFoodHistory,
  getEntryDetail,
  deleteEntry,
  getEditForm,
  updateEntry
}; 