const { supabase } = require('../config/supabase');

class UserAuth {
  // Registrar un nuevo usuario usando el servicio de autenticación de Supabase
  static async register(name, email, password, role) {
    try {
      // Validar role para asegurarse de que sea uno de los valores permitidos
      if (role !== 'paciente' && role !== 'medico') {
        throw new Error('El rol debe ser "paciente" o "medico"');
      }

      // Registrar usuario a través del servicio de autenticación de Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role
          },
          emailRedirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
        }
      });

      if (authError) throw authError;
      
      if (!authData || !authData.user) {
        throw new Error('No se pudo crear el usuario. Respuesta de autenticación incompleta.');
      }
      
      // Creación exitosa
      return { 
        success: true, 
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name || authData.user.email,
          role: role
        } 
      };
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      return { success: false, error: error.message };
    }
  }

  // Iniciar sesión
  static async login(email, password) {
    try {
      // Iniciar sesión a través del servicio de autenticación de Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;
      
      if (!authData || !authData.user) {
        throw new Error('No se pudo iniciar sesión. Respuesta de autenticación incompleta.');
      }
      
      // Obtener los metadatos del usuario
      const name = authData.user.user_metadata?.name || authData.user.email;
      const role = authData.user.user_metadata?.role || 'paciente';
      
      // Inicio de sesión exitoso
      return { 
        success: true, 
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          role: role
        } 
      };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { success: false, error: error.message };
    }
  }

  // Cerrar sesión
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return { success: false, error: error.message };
    }
  }

  // Recuperación de contraseña
  static async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/update-password`,
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error al solicitar recuperación de contraseña:', error);
      return { success: false, error: error.message };
    }
  }

  // Actualizar contraseña con token
  static async updatePassword(token, newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      return { success: false, error: error.message };
    }
  }

  // Actualizar datos del usuario
  static async updateUserData(userId, userData) {
    try {
      const { error } = await supabase.auth.updateUser({
        data: userData
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = UserAuth; 