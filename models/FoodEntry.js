const { supabase } = require('../config/supabase');
const moment = require('moment');

class FoodEntry {
  // Crear nueva entrada de comida
  static async create(userId, imageUrl, comments, ingredients) {
    try {
      console.log('Modelo FoodEntry: Creando nueva entrada', { 
        userId, 
        tieneUrl: !!imageUrl,
        tieneComentarios: !!comments,
        tieneIngredientes: !!ingredients
      });
      
      if (!userId || !imageUrl || !comments || !ingredients) {
        console.error('Error: Datos incompletos para crear entrada', { 
          userId: !!userId, 
          imageUrl: !!imageUrl, 
          comments: !!comments, 
          ingredients: !!ingredients 
        });
        return { success: false, error: 'Todos los campos son obligatorios' };
      }
      
      // Agregar validación para URL de imagen
      if (!imageUrl.startsWith('http')) {
        console.error('Error: URL de imagen inválida', imageUrl.substring(0, 30) + '...');
        return { success: false, error: 'URL de imagen inválida' };
      }
      
      // Verificar si la tabla food_entries existe y es accesible
      try {
        console.log('Verificando si la tabla food_entries es accesible...');
        const { error: tableError } = await supabase
          .from('food_entries')
          .select('id')
          .limit(1);
          
        if (tableError) {
          console.error('Error al acceder a tabla food_entries:', tableError);
          
          // Si la tabla no existe, podemos intentar crearla
          if (tableError.message?.includes('does not exist') || tableError.code === '42P01') {
            console.log('La tabla food_entries no existe, intentando crearla...');
            
            try {
              // Intentar crear la tabla
              const { error: createError } = await supabase.rpc('create_food_entries_table');
              
              if (createError) {
                console.error('Error al intentar crear la tabla:', createError);
                return { 
                  success: false, 
                  error: 'La tabla food_entries no existe y no se pudo crear automáticamente. Contacta al administrador.' 
                };
              }
              
              console.log('Tabla food_entries creada correctamente');
            } catch (rpcError) {
              console.error('Error al llamar a RPC para crear tabla:', rpcError);
              return { 
                success: false, 
                error: 'Error al intentar crear la tabla food_entries. Es necesario crearla manualmente.' 
              };
            }
          } else {
            return { 
              success: false, 
              error: `Error de acceso a la tabla food_entries: ${tableError.message}` 
            };
          }
        }
      } catch (structError) {
        console.error('Error al verificar estructura de tabla:', structError);
      }
      
      // Preparar objeto de entrada
      const entryData = { 
        user_id: userId, 
        image_url: imageUrl, 
        comments,
        ingredients,
        created_at: new Date()
      };
      
      console.log('Datos a insertar:', entryData);
      
      // Intentar la inserción con múltiples reintentos
      let attemptCount = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (attemptCount < maxAttempts) {
        attemptCount++;
        console.log(`Intentando insertar en base de datos (intento ${attemptCount}/${maxAttempts})...`);
        
        try {
          const { data, error } = await supabase
            .from('food_entries')
            .insert([entryData])
            .select();
    
          if (error) {
            console.error(`Error Supabase al insertar (intento ${attemptCount}):`, error);
            lastError = error;
            
            // Análisis detallado del error
            if (error.code === '23502') {
              // Error de restricción not-null
              const columnMatch = error.message.match(/column "(.*?)"/);
              const columnName = columnMatch ? columnMatch[1] : 'desconocida';
              return { 
                success: false, 
                error: `El campo ${columnName} no puede estar vacío` 
              };
            } else if (error.code === '23503') {
              // Error de restricción de clave foránea
              return { 
                success: false, 
                error: 'El usuario no existe en la base de datos' 
              };
            } else if (error.code === '23505') {
              // Error de unicidad
              return { 
                success: false, 
                error: 'Ya existe una entrada idéntica' 
              };
            } else if (error.code === '42501') {
              // Error de permisos
              return { 
                success: false, 
                error: 'No tienes permisos para insertar datos' 
              };
            } else if (error.code === '42P01') {
              // Tabla no existe - no deberíamos llegar aquí porque ya verificamos
              return {
                success: false,
                error: 'La tabla food_entries no existe. Contacta al administrador.'
              };
            }
            
            // Esperar un poco antes del siguiente intento (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 500 * attemptCount));
            continue; // Intentar de nuevo
          }
          
          // Éxito! Salir del bucle
          if (!data || data.length === 0) {
            console.warn('No se devolvieron datos después de la inserción exitosa');
            return { 
              success: true, 
              entry: { ...entryData, id: 'unknown' } 
            };
          }
          
          console.log('Entrada creada con éxito:', { id: data[0].id });
          return { success: true, entry: data[0] };
        } catch (insertError) {
          console.error(`Error al intentar insertar (intento ${attemptCount}):`, insertError);
          lastError = insertError;
          // Esperar un poco antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 500 * attemptCount));
        }
      }
      
      // Si llegamos aquí, todos los intentos fallaron
      console.error('Todos los intentos de inserción fallaron');
      
      // Mensajes de error específicos según el tipo de error
      let errorMessage = 'Error al crear entrada de comida después de múltiples intentos';
      if (lastError?.message?.includes('foreign key')) {
        errorMessage = 'Usuario no válido';
      } else if (lastError?.message?.includes('not-null')) {
        errorMessage = 'Faltan campos obligatorios';
      } else if (lastError?.message?.includes('auth')) {
        errorMessage = 'Error de autenticación con la base de datos';
      } else if (lastError?.message?.includes('duplicate')) {
        errorMessage = 'Entrada duplicada';
      } else if (lastError?.message?.includes('permission')) {
        errorMessage = 'No tienes permisos suficientes';
      }
      
      return { success: false, error: errorMessage };
    } catch (error) {
      console.error('Error al crear entrada de comida:', error);
      
      // Mensajes de error específicos según el tipo de error
      let errorMessage = 'Error al crear entrada de comida';
      if (error.message?.includes('foreign key')) {
        errorMessage = 'Usuario no válido';
      } else if (error.message?.includes('not-null')) {
        errorMessage = 'Faltan campos obligatorios';
      } else if (error.message?.includes('auth')) {
        errorMessage = 'Error de autenticación con la base de datos';
      } else if (error.message?.includes('duplicate')) {
        errorMessage = 'Entrada duplicada';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'No tienes permisos suficientes';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Obtener historial de comida para un usuario específico
  static async getHistoryByUserId(userId, dateFilter = null, page = 1, limit = 10) {
    try {
      let query = supabase
        .from('food_entries')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Si se proporciona un filtro de fecha, aplicarlo
      if (dateFilter) {
        if (dateFilter.from) {
          const startDate = moment(dateFilter.from).startOf('day').toISOString();
          query = query.gte('created_at', startDate);
        }
        
        if (dateFilter.to) {
          const endDate = moment(dateFilter.to).endOf('day').toISOString();
          query = query.lte('created_at', endDate);
        }
      }
      
      // Aplicar paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      query = query.range(from, to);
      
      const { data, error, count } = await query;

      if (error) throw error;
      
      const totalPages = Math.ceil(count / limit);
      
      return { 
        success: true, 
        entries: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error al obtener historial de comida:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener entrada por ID
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return { success: true, entry: data };
    } catch (error) {
      console.error('Error al obtener entrada de comida:', error);
      return { success: false, error: error.message };
    }
  }

  // Eliminar entrada
  static async delete(id, userId) {
    try {
      // Verificar que la entrada pertenezca al usuario
      const { data: entry, error: findError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (findError || !entry) {
        return { success: false, error: 'Entrada no encontrada o no autorizada' };
      }

      // Eliminar entrada
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar entrada de comida:', error);
      return { success: false, error: error.message };
    }
  }

  // Actualizar entrada
  static async update(id, userId, updates) {
    try {
      // Verificar que la entrada pertenezca al usuario
      const { data: entry, error: findError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (findError || !entry) {
        return { success: false, error: 'Entrada no encontrada o no autorizada' };
      }

      // Actualizar entrada
      const { data, error } = await supabase
        .from('food_entries')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      return { success: true, entry: data[0] };
    } catch (error) {
      console.error('Error al actualizar entrada de comida:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener estadísticas de entradas para un usuario
  static async getStats(userId) {
    try {
      // Obtener el conteo total de entradas
      const { count, error: countError } = await supabase
        .from('food_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (countError) throw countError;
      
      // Si no hay entradas, devolver estadísticas vacías
      if (count === 0) {
        return { 
          success: true, 
          stats: {
            totalEntries: 0,
            firstEntry: null,
            lastEntry: null,
            daysWithEntries: 0
          }
        };
      }
      
      // Obtener la primera entrada (más antigua)
      const { data: oldestData, error: oldestError } = await supabase
        .from('food_entries')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
        
      if (oldestError && oldestError.code !== 'PGRST116') throw oldestError;
      
      // Obtener la última entrada (más reciente)
      const { data: newestData, error: newestError } = await supabase
        .from('food_entries')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (newestError && newestError.code !== 'PGRST116') throw newestError;
      
      // Obtener días únicos con entradas
      const { data: daysData, error: daysError } = await supabase
        .from('food_entries')
        .select('created_at')
        .eq('user_id', userId);
        
      if (daysError) throw daysError;
      
      // Contar días únicos (extraer solo la fecha, no la hora)
      const uniqueDays = new Set();
      daysData.forEach(entry => {
        const dateStr = moment(entry.created_at).format('YYYY-MM-DD');
        uniqueDays.add(dateStr);
      });
      
      return { 
        success: true, 
        stats: {
          totalEntries: count,
          firstEntry: oldestData ? oldestData.created_at : null,
          lastEntry: newestData ? newestData.created_at : null,
          daysWithEntries: uniqueDays.size
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = FoodEntry; 