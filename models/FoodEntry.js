const { supabase } = require('../config/supabase');
const moment = require('moment');

class FoodEntry {
  // Crear nueva entrada de comida
  static async create(userId, imageUrl, comments, ingredients) {
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .insert([
          { 
            user_id: userId, 
            image_url: imageUrl, 
            comments,
            ingredients,
            created_at: new Date()
          }
        ])
        .select();

      if (error) throw error;
      
      return { success: true, entry: data[0] };
    } catch (error) {
      console.error('Error al crear entrada de comida:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener historial de comida para un usuario específico
  static async getHistoryByUserId(userId, date = null) {
    try {
      let query = supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Si se proporciona una fecha, filtrar por esa fecha
      if (date) {
        const startOfDay = moment(date).startOf('day').toISOString();
        const endOfDay = moment(date).endOf('day').toISOString();
        
        query = query
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      return { success: true, entries: data };
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
}

module.exports = FoodEntry; 