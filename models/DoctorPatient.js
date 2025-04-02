const { supabase } = require('../config/supabase');

class DoctorPatient {
  // Asignar un paciente a un médico
  static async assign(doctorId, patientId) {
    try {
      // Verificar que el doctor es realmente un médico
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', doctorId)
        .single();
        
      if (doctorError) throw doctorError;
      
      if (doctorProfile.role !== 'medico') {
        return { 
          success: false, 
          error: 'Solo los médicos pueden tener pacientes asignados'
        };
      }
      
      // Verificar que el paciente es realmente un paciente
      const { data: patientProfile, error: patientError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', patientId)
        .single();
        
      if (patientError) throw patientError;
      
      if (patientProfile.role !== 'paciente') {
        return { 
          success: false, 
          error: 'Solo los pacientes pueden ser asignados a médicos'
        };
      }
      
      // Verificar si ya existe la relación
      const { data: existingRelation, error: checkError } = await supabase
        .from('doctor_patient_relationships')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      // Si ya existe, actualizar el estado a active si no lo está
      if (existingRelation) {
        if (existingRelation.status === 'active') {
          return { success: true, relation: existingRelation };
        }
        
        const { data, error } = await supabase
          .from('doctor_patient_relationships')
          .update({ status: 'active', updated_at: new Date() })
          .eq('id', existingRelation.id)
          .select();
          
        if (error) throw error;
        
        return { success: true, relation: data[0] };
      }
      
      // Si no existe, crear nueva relación
      const { data, error } = await supabase
        .from('doctor_patient_relationships')
        .insert([
          {
            doctor_id: doctorId,
            patient_id: patientId,
            status: 'active',
            created_at: new Date()
          }
        ])
        .select();
        
      if (error) throw error;
      
      return { success: true, relation: data[0] };
    } catch (error) {
      console.error('Error al asignar paciente:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Obtener todos los pacientes de un médico
  static async getPatientsByDoctor(doctorId) {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_relationships')
        .select(`
          id,
          status,
          patient:patient_id (
            id, 
            name,
            created_at
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Formatear datos para facilitar su uso
      const patients = data.map(relation => ({
        relationId: relation.id,
        status: relation.status,
        id: relation.patient.id,
        name: relation.patient.name,
        created_at: relation.patient.created_at
      }));
      
      return { success: true, patients };
    } catch (error) {
      console.error('Error al obtener pacientes del médico:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Obtener todos los médicos de un paciente
  static async getDoctorsByPatient(patientId) {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_relationships')
        .select(`
          id,
          status,
          doctor:doctor_id (
            id, 
            name,
            created_at
          )
        `)
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Formatear datos para facilitar su uso
      const doctors = data.map(relation => ({
        relationId: relation.id,
        status: relation.status,
        id: relation.doctor.id,
        name: relation.doctor.name,
        created_at: relation.doctor.created_at
      }));
      
      return { success: true, doctors };
    } catch (error) {
      console.error('Error al obtener médicos del paciente:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Eliminar relación médico-paciente
  static async remove(relationId, userId) {
    try {
      // Verificar que la relación exista y el usuario tenga permiso
      const { data: relation, error: checkError } = await supabase
        .from('doctor_patient_relationships')
        .select('*')
        .eq('id', relationId)
        .single();
        
      if (checkError) throw checkError;
      
      // Comprobar que el usuario que realiza la acción es el médico
      if (relation.doctor_id !== userId) {
        return { success: false, error: 'No tienes permiso para eliminar esta relación' };
      }
      
      // Actualizar el estado a 'terminated'
      const { data, error } = await supabase
        .from('doctor_patient_relationships')
        .update({ status: 'terminated', updated_at: new Date() })
        .eq('id', relationId)
        .select();
        
      if (error) throw error;
      
      return { success: true, relation: data[0] };
    } catch (error) {
      console.error('Error al eliminar relación médico-paciente:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DoctorPatient; 