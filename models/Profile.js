const { supabase } = require('../config/supabase');

class Profile {
  // Obtener perfil por ID de usuario
  static async getById(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return { success: true, profile: data };
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return { success: false, error: error.message };
    }
  }

  // Actualizar perfil
  static async update(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select();

      if (error) throw error;
      
      return { success: true, profile: data[0] };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener todos los perfiles de pacientes
  static async getAllPatients() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, created_at')
        .eq('role', 'paciente');

      if (error) throw error;
      
      return { success: true, patients: data };
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
      return { success: false, error: error.message };
    }
  }

  // Buscar pacientes por nombre
  static async searchPatientsByName(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, created_at')
        .eq('role', 'paciente')
        .ilike('name', `%${searchTerm}%`);

      if (error) throw error;
      
      return { success: true, patients: data };
    } catch (error) {
      console.error('Error al buscar pacientes:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar si un usuario es médico
  static async isDoctor(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return { success: true, isDoctor: data.role === 'medico' };
    } catch (error) {
      console.error('Error al verificar rol de médico:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = Profile; 