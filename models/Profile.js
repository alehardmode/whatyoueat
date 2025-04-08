const { supabase } = require("../config/supabase");

/**
 * Clase unificada para gestión de perfiles de usuario
 * Combina todas las funcionalidades de Profile y ProfileManager
 */
class Profile {
  /**
   * Verificar si la conexión a Supabase está disponible
   * @returns {Promise<Object>} Estado de la conexión
   */
  static async checkConnection() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("count", { count: "exact", head: true });
      return { success: !error, error: error ? error.message : null };
    } catch (error) {
      console.error("Error al verificar conexión a Supabase:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener perfil por ID de usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Información del perfil o error
   */
  static async getById(userId) {
    try {
      if (!userId) {
        return { success: false, error: "ID de usuario no proporcionado" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (!data) {
        return { success: false, error: "Perfil no encontrado" };
      }

      return { success: true, profile: data };
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear nuevo perfil de usuario
   * @param {string} userId - ID del usuario
   * @param {Object} userData - Datos del usuario para el perfil
   * @returns {Promise<Object>} Perfil creado o error
   */
  static async create(userId, userData) {
    try {
      if (!userId) {
        return { success: false, error: "ID de usuario no proporcionado" };
      }

      if (!userData || typeof userData !== "object") {
        return { success: false, error: "Datos de usuario no válidos" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      const profileData = {
        id: userId,
        name: userData.name || "Usuario sin nombre",
        role: userData.role || "paciente",
        email: userData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true, // Por defecto activo
      };

      try {
        // Intentar insert con select
        const { data, error } = await supabase
          .from("profiles")
          .insert([profileData])
          .select();

        if (error) throw error;

        return {
          success: true,
          profile: data && data.length > 0 ? data[0] : profileData,
        };
      } catch (insertError) {
        if (
          insertError.message &&
          insertError.message.includes("select is not a function")
        ) {
          // Manejar el caso para los mocks donde .select() no está disponible
          const { error } = await supabase
            .from("profiles")
            .insert([profileData]);

          if (error) throw error;

          return { success: true, profile: profileData };
        } else {
          // Re-lanzar cualquier otro error
          throw insertError;
        }
      }
    } catch (error) {
      console.error("Error al crear perfil:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar perfil de usuario
   * @param {string} userId - ID del usuario
   * @param {Object} updates - Datos a actualizar
   * @returns {Promise<Object>} Perfil actualizado o error
   */
  static async update(userId, updates) {
    try {
      if (!userId) {
        return { success: false, error: "ID de usuario no proporcionado" };
      }

      if (!updates || typeof updates !== "object") {
        return { success: false, error: "Datos de actualización no válidos" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      // Añadir marca de tiempo de actualización si no está presente
      if (!updates.updated_at) {
        updates.updated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return { success: false, error: "No se pudo actualizar el perfil" };
      }

      return { success: true, profile: data[0] };
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar perfil (borrado lógico)
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async deleteProfile(userId) {
    try {
      if (!userId) {
        return { success: false, error: "ID de usuario no proporcionado" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      // Primero verificar que el perfil existe
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error(
          "Error al obtener perfil para eliminación:",
          profileError
        );
        return {
          success: false,
          error:
            profileError.message || "Error al obtener perfil para eliminación",
        };
      }

      if (!profile) {
        return {
          success: false,
          error: "Perfil no encontrado para eliminación",
        };
      }

      // Realizar la eliminación lógica (marcar como inactivo)
      const updateData = {
        is_active: false,
        updated_at: new Date().toISOString(),
      };

      // Para producción y para pruebas, separamos la lógica
      try {
        const { data, error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", userId)
          .select();

        if (error) {
          console.error("Error al eliminar perfil:", error);
          return {
            success: false,
            error: error.message || "Error al eliminar perfil",
          };
        }

        return {
          success: true,
          profile:
            data && data.length > 0 ? data[0] : { ...profile, ...updateData },
        };
      } catch (updateError) {
        // Si estamos en un entorno de prueba donde .select() no está disponible
        if (
          updateError.message &&
          updateError.message.includes("not a function")
        ) {
          const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", userId);

          if (error) {
            console.error("Error al eliminar perfil:", error);
            return {
              success: false,
              error: error.message || "Error al eliminar perfil",
            };
          }

          return {
            success: true,
            profile: { ...profile, ...updateData },
          };
        } else {
          // Relanzar cualquier otro error
          throw updateError;
        }
      }
    } catch (error) {
      console.error("Error inesperado al eliminar perfil:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reactivar un perfil previamente eliminado
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async reactivateProfile(userId) {
    try {
      if (!userId) {
        return { success: false, error: "ID de usuario no proporcionado" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      // Primero verificar que el perfil existe
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error(
          "Error al obtener perfil para reactivación:",
          profileError
        );
        return {
          success: false,
          error:
            profileError.message || "Error al obtener perfil para reactivación",
        };
      }

      if (!profile) {
        return {
          success: false,
          error: "Perfil no encontrado para reactivación",
        };
      }

      // Realizar la reactivación
      const updateData = {
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      // Para producción y para pruebas, separamos la lógica
      try {
        const { data, error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", userId)
          .select();

        if (error) {
          console.error("Error al reactivar perfil:", error);
          return {
            success: false,
            error: error.message || "Error al reactivar perfil",
          };
        }

        return {
          success: true,
          profile:
            data && data.length > 0 ? data[0] : { ...profile, ...updateData },
        };
      } catch (updateError) {
        // Si estamos en un entorno de prueba donde .select() no está disponible
        if (
          updateError.message &&
          updateError.message.includes("not a function")
        ) {
          const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", userId);

          if (error) {
            console.error("Error al reactivar perfil:", error);
            return {
              success: false,
              error: error.message || "Error al reactivar perfil",
            };
          }

          return {
            success: true,
            profile: { ...profile, ...updateData },
          };
        } else {
          // Relanzar cualquier otro error
          throw updateError;
        }
      }
    } catch (error) {
      console.error("Error inesperado al reactivar perfil:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener todos los perfiles de pacientes activos
   * @returns {Promise<Object>} Lista de pacientes o error
   */
  static async getAllPatients() {
    try {
      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, created_at, email")
        .eq("role", "paciente")
        .eq("is_active", true); // Solo perfiles activos

      if (error) throw error;

      return { success: true, patients: data };
    } catch (error) {
      console.error("Error al obtener pacientes:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar pacientes por nombre
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Object>} Lista de pacientes que coinciden o error
   */
  static async searchPatientsByName(searchTerm) {
    try {
      if (!searchTerm || typeof searchTerm !== "string") {
        return { success: false, error: "Término de búsqueda no válido" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, created_at, email")
        .eq("role", "paciente")
        .eq("is_active", true) // Solo perfiles activos
        .ilike("name", `%${searchTerm}%`);

      if (error) throw error;

      return { success: true, patients: data };
    } catch (error) {
      console.error("Error al buscar pacientes:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar si un usuario es médico y está activo
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Si es médico y está activo
   */
  static async isDoctor(userId) {
    try {
      if (!userId) {
        return { success: false, error: "ID de usuario no proporcionado" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (!data) {
        return { success: false, error: "Perfil no encontrado" };
      }

      // Verificar si el perfil está activo
      if (data.is_active === false) {
        return { success: false, error: "Perfil inactivo", isActive: false };
      }

      return { success: true, isDoctor: data.role === "medico" };
    } catch (error) {
      console.error("Error al verificar rol de médico:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas de usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Estadísticas del usuario o error
   */
  static async getUserStats(userId) {
    try {
      if (!userId) {
        return { success: false, error: "ID de usuario no proporcionado" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      // Obtener el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      if (!profile) {
        return { success: false, error: "Perfil no encontrado" };
      }

      // Estadísticas según rol
      let stats = {};

      if (profile.role === "paciente") {
        // Para pacientes: comidas, días activos, racha
        // 1. Obtener comidas registradas
        const { count: totalMeals, error: mealsError } = await supabase
          .from("food_entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (mealsError) throw mealsError;

        // 2. Obtener días activos (días distintos con entradas)
        const { data: activeDaysData, error: daysError } = await supabase
          .from("food_entries")
          .select("DISTINCT TO_CHAR(created_at, 'YYYY-MM-DD') as active_day")
          .eq("user_id", userId);

        if (daysError) throw daysError;

        const daysActive = activeDaysData?.length || 0;

        // 3. Calcular racha actual (días consecutivos)
        let streakDays = 0;

        if (daysActive > 0) {
          // Esta es una implementación simple de racha
          // Para una implementación más sofisticada, se podría
          // crear una función dedicada a calcular rachas consecutivas
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          // Verificar si hay entrada en el día de hoy
          const { count: todayCount, error: todayError } = await supabase
            .from("food_entries")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", today.toISOString().split("T")[0])
            .lt(
              "created_at",
              new Date(today.getTime() + 86400000).toISOString().split("T")[0]
            );

          if (todayError) throw todayError;

          // Verificar si hay entrada en el día de ayer
          const { count: yesterdayCount, error: yesterdayError } =
            await supabase
              .from("food_entries")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .gte("created_at", yesterday.toISOString().split("T")[0])
              .lt("created_at", today.toISOString().split("T")[0]);

          if (yesterdayError) throw yesterdayError;

          // Asignar racha básica
          if (todayCount > 0) streakDays = 1;
          if (todayCount > 0 && yesterdayCount > 0) streakDays = 2;
          // Para una implementación completa, necesitaríamos verificar días anteriores
        }

        stats = {
          totalMeals: totalMeals || 0,
          daysActive: daysActive,
          streakDays: streakDays,
        };
      } else if (profile.role === "medico") {
        // Para médicos: pacientes totales y activos

        // 1. Obtener total de pacientes asignados
        const { count: totalPatients, error: patientsError } = await supabase
          .from("doctor_patient_relationships")
          .select("*", { count: "exact", head: true })
          .eq("doctor_id", userId);

        if (patientsError) throw patientsError;

        // 2. Obtener pacientes activos en la última semana
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: activePatientsList, error: activeError } = await supabase
          .from("doctor_patient_relationships")
          .select(
            `
            patient_id,
            profiles!patient_id(updated_at)
          `
          )
          .eq("doctor_id", userId);

        if (activeError) throw activeError;

        // Contar cuántos pacientes han estado activos en la última semana
        const activePatients = activePatientsList
          ? activePatientsList.filter((relation) => {
              // Verificar si el paciente ha estado activo en la última semana
              const updatedAt = relation.profiles?.updated_at;
              if (!updatedAt) return false;

              const lastActive = new Date(updatedAt);
              return lastActive >= oneWeekAgo;
            }).length
          : 0;

        stats = {
          totalPatients: totalPatients || 0,
          activePatients: activePatients,
        };
      }

      return {
        success: true,
        stats: stats,
      };
    } catch (error) {
      console.error("Error al obtener estadísticas de usuario:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = Profile;
