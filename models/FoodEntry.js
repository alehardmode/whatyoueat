const { supabase } = require('../config/supabase');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { getDatabaseErrorMessage } = require('../utils/errorHandler');

// Caché para optimizar consultas frecuentes
const entryCache = {
  history: new Map(),    // Caché para historial de usuarios
  entry: new Map(),      // Caché para entradas individuales
  invalidate: (userId) => {
    // Invalida todas las entradas de caché para un usuario específico
    entryCache.history.delete(userId);
    // También podríamos invalidar las entradas individuales, pero
    // sería más complejo identificar cuáles pertenecen al usuario
  },
  getCacheKey: (userId, page, limit, filters) => {
    // Crear una clave única para la consulta de historial
    return `${userId}_${page}_${limit}_${filters?.from || ''}_${filters?.to || ''}`;
  }
};

class FoodEntry {
  // Crear nueva entrada de comida con imagen almacenada en base64
  static async create(userId, { name, description, date, mealType, imageData }) {
    try {
      // Validar datos obligatorios
      if (!userId || !imageData) {
        console.error('Error: Datos incompletos para crear entrada', { 
          userId: !!userId, 
          imageData: !!imageData 
        });
        return { success: false, error: 'Usuario e imagen son obligatorios' };
      }
      
      // Verificar acceso a la tabla food_entries
      const { error: tableError } = await supabase
        .from('food_entries')
        .select('id')
        .limit(1);
        
      if (tableError) {
        console.error('Error al acceder a tabla food_entries:', tableError);
        return { 
          success: false, 
          error: getDatabaseErrorMessage(tableError.code, tableError.message)
        };
      }
      
      // Datos a insertar
      const entryData = { 
        id: uuidv4(),
        user_id: userId,
        name: name || 'Comida sin nombre',
        description: description || '',
        meal_date: date || new Date().toISOString(),
        meal_type: mealType || 'other',
        image_data: imageData, // Imagen en base64
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Intentar inserción con reintentos limitados
      const maxAttempts = 3;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const { data, error } = await supabase
            .from('food_entries')
            .insert([entryData])
            .select();
    
          if (error) {
            console.error(`Error Supabase (intento ${attempt}):`, error);
            lastError = error;
            
            // Para ciertos errores, no tiene sentido reintentar
            if (['23502', '23503', '23505', '42501', '42P01'].includes(error.code)) {
              return { 
                success: false, 
                error: getDatabaseErrorMessage(error.code, error.message)
              };
            }
            
            // Esperar antes del siguiente intento con backoff exponencial
            if (attempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500 * attempt));
              continue;
            }
          }
          
          // Éxito en la inserción
          if (!data || data.length === 0) {
            console.warn('Inserción exitosa pero sin datos retornados');
            entryCache.invalidate(userId);
            return { 
              success: true, 
              entry: { ...entryData, id: entryData.id } 
            };
          }
          
          entryCache.invalidate(userId);
          return { success: true, entry: data[0] };
        } catch (insertError) {
          console.error(`Error general (intento ${attempt}):`, insertError);
          lastError = insertError;
          
          // Esperar antes del siguiente intento
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          }
        }
      }
      
      // Si llegamos aquí, todos los intentos fallaron
      return { 
        success: false, 
        error: getDatabaseErrorMessage(lastError?.code, lastError?.message)
      };
    } catch (error) {
      console.error('Error al crear entrada de comida:', error);
      return { 
        success: false, 
        error: getDatabaseErrorMessage(error.code, error.message)
      };
    }
  }

  // Obtener historial de comida para un usuario específico
  static async getHistoryByUserId(userId, dateFilter = null, page = 1, limit = 10) {
    try {
      // Generar clave de caché
      const cacheKey = entryCache.getCacheKey(userId, page, limit, dateFilter);
      
      // Verificar si tenemos resultados en caché (solo en producción)
      if (process.env.NODE_ENV === 'production' && entryCache.history.has(cacheKey)) {
        const cachedResult = entryCache.history.get(cacheKey);
        // Verificar si el caché aún es válido (menos de 5 minutos)
        if (Date.now() - cachedResult.timestamp < 5 * 60 * 1000) {
          return cachedResult.data;
        }
      }

      // Construir la consulta base
      let query = supabase
        .from('food_entries')
        .select('id, user_id, name, description, meal_date, meal_type, created_at, updated_at', { count: 'exact' }) // Asegurarse de contar exactamente
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
      
      // Ejecutar la consulta
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Verificar que tengamos un conteo válido
      if (count === undefined || count === null) {
        console.warn('Advertencia: No se pudo obtener el conteo exacto de entradas, realizando consulta adicional');
        
        // Si no tenemos conteo, hacer una consulta adicional para contar
        const countQuery = supabase
          .from('food_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        // Aplicar los mismos filtros de fecha
        if (dateFilter) {
          if (dateFilter.from) {
            const startDate = moment(dateFilter.from).startOf('day').toISOString();
            countQuery.gte('created_at', startDate);
          }
          
          if (dateFilter.to) {
            const endDate = moment(dateFilter.to).endOf('day').toISOString();
            countQuery.lte('created_at', endDate);
          }
        }
        
        const { count: exactCount, error: countError } = await countQuery;
        
        if (countError) {
          console.error('Error al obtener conteo exacto:', countError);
          return { success: false, error: countError.message };
        }
        
        const totalEntries = exactCount || 0;
        const totalPages = Math.ceil(totalEntries / limit);
        
        const result = { 
          success: true, 
          entries: data || [],
          pagination: {
            page,
            limit,
            total: totalEntries,
            totalPages
          }
        };
        
        // Guardar en caché para futuras consultas
        if (process.env.NODE_ENV === 'production') {
          entryCache.history.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }
        
        return result;
      }
      
      // Calcular páginas totales basado en el conteo exacto
      const totalPages = Math.ceil(count / limit);
      
      const result = { 
        success: true, 
        entries: data || [],
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };
      
      // Guardar en caché para futuras consultas
      if (process.env.NODE_ENV === 'production') {
        entryCache.history.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error al obtener historial de comida:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener entrada por ID, incluyendo la imagen
  static async getById(id, includeImage = true) {
    try {
      // Verificar caché para entradas individuales
      if (process.env.NODE_ENV === 'production' && entryCache.entry.has(id) && includeImage === entryCache.entry.get(id).includeImage) {
        const cachedEntry = entryCache.entry.get(id);
        // Verificar si el caché aún es válido (menos de 10 minutos)
        if (Date.now() - cachedEntry.timestamp < 10 * 60 * 1000) {
          return cachedEntry.data;
        }
      }

      let fields = '*';
      if (!includeImage) {
        fields = 'id, user_id, name, description, meal_date, meal_type, created_at, updated_at';
      }

      const { data, error } = await supabase
        .from('food_entries')
        .select(fields)
        .eq('id', id)
        .single();
      if (error) throw error;
      
      const result = { success: true, entry: data };
      
      // Guardar en caché
      if (process.env.NODE_ENV === 'production') {
        entryCache.entry.set(id, {
          data: result,
          timestamp: Date.now(),
          includeImage
        });
      }
      
      return result;
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
        .select('id, user_id')
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
      
      // Invalidar caché
      entryCache.invalidate(userId);
      entryCache.entry.delete(id);
      
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
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (findError || !entry) {
        return { success: false, error: 'Entrada no encontrada o no autorizada' };
      }
      
      // Añadir updated_at
      updates.updated_at = new Date().toISOString();
      
      // Actualizar entrada
      const { data, error } = await supabase
        .from('food_entries')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      
      // Invalidar caché
      entryCache.invalidate(userId);
      entryCache.entry.delete(id);
      
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