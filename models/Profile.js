const BaseModel = require("./BaseModel");
const { supabase } = require("../config/supabase");

/**
 * Clase para gestión de perfiles de usuario
 * Extiende la clase base para heredar operaciones comunes
 */
class Profile extends BaseModel {
  /**
   * Nombre de la tabla en Supabase
   * @type {string}
   */
  static tableName = "profiles";

  /**
   * Crea nuevo perfil de usuario con validaciones específicas
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

      const profileData = {
        id: userId,
        name: userData.name || "Usuario sin nombre",
        role: userData.role || "paciente",
        email: userData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true, // Por defecto activo
      };

      // Usar el método de la clase base para crear el perfil
      const result = await super.create(profileData);

      if (result.success) {
        return { success: true, profile: result.data };
      } else {
        return result; // Devolver error de la clase base
      }
    } catch (error) {
      console.error("Error al crear perfil:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar perfil de usuario con validaciones específicas
   * @param {string} userId - ID del usuario
   * @param {Object} updates - Datos a actualizar
   * @returns {Promise<Object>} Perfil actualizado o error
   */
  static async update(userId, updates) {
    try {
      // Usar el método de la clase base
      const result = await super.update(userId, updates);

      if (result.success) {
        return { success: true, profile: result.data };
      } else {
        return result;
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
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
      // Usar el método de la clase base
      const result = await super.getById(userId);

      if (result.success) {
        return { success: true, profile: result.data };
      } else {
        return result;
      }
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener perfil por ID de usuario con email de auth.user
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Información del perfil completa o error
   */
  static async getProfileWithEmail(userId) {
    try {
      if (!userId) {
        return { success: false, error: "ID de usuario no proporcionado" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await super.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      // Obtenemos el perfil básico
      const { data: profileData, error: profileError } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error al obtener perfil:", profileError);
        return { success: false, error: profileError.message };
      }

      if (!profileData) {
        return { success: false, error: "Perfil no encontrado" };
      }

      // Para el correo electrónico, usamos la sesión actual o el que ya está en el perfil
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.warn("Error al obtener sesión:", sessionError);
        // Si hay error en la sesión, usamos el email almacenado en el perfil
        return {
          success: true,
          profile: {
            ...profileData,
            email: profileData.email || "Email no disponible",
          },
        };
      }

      // Si el ID de usuario coincide con el de la sesión, usamos ese email
      if (session && session.user && session.user.id === userId) {
        return {
          success: true,
          profile: {
            ...profileData,
            email:
              session.user.email || profileData.email || "Email no disponible",
          },
        };
      }

      // Si llegamos aquí, simplemente usamos el email que ya está en el perfil
      return {
        success: true,
        profile: {
          ...profileData,
          email: profileData.email || "Email no disponible",
        },
      };
    } catch (error) {
      console.error("Error al obtener perfil con email:", error);
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
      // Usar el método de la clase base
      return await super.delete(userId);
    } catch (error) {
      console.error("Error al eliminar perfil:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar perfiles por nombre
   * @param {string} name - Nombre a buscar
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Object>} Resultado de la búsqueda
   */
  static async searchByName(name, options = {}) {
    try {
      if (!name) {
        return { success: false, error: "Nombre de búsqueda no proporcionado" };
      }

      // Usar el método findByCriteria de la clase base
      const result = await super.findByCriteria(
        {
          name: { operator: "like", value: name },
        },
        {
          limit: options.limit || 20,
          offset: options.offset || 0,
          orderBy: options.orderBy || "name",
          ascending: options.ascending !== false,
        }
      );

      if (result.success) {
        return {
          success: true,
          profiles: result.data,
          pagination: result.pagination,
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error("Error al buscar perfiles por nombre:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar perfiles por rol
   * @param {string} role - Rol a buscar
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Object>} Resultado de la búsqueda
   */
  static async getByRole(role, options = {}) {
    try {
      if (!role) {
        return { success: false, error: "Rol no proporcionado" };
      }

      // Verificar que sea un rol válido
      if (role !== "paciente" && role !== "medico") {
        return { success: false, error: "Rol no válido" };
      }

      // Usar el método findByCriteria de la clase base
      const result = await super.findByCriteria(
        {
          role,
          is_active: true,
        },
        {
          limit: options.limit || 20,
          offset: options.offset || 0,
          orderBy: options.orderBy || "name",
          ascending: options.ascending !== false,
        }
      );

      if (result.success) {
        return {
          success: true,
          profiles: result.data,
          pagination: result.pagination,
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error("Error al buscar perfiles por rol:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar pacientes por nombre
   * @param {string} name - Nombre a buscar
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Object>} Resultado de la búsqueda
   */
  static async searchPatientsByName(name, options = {}) {
    try {
      if (!name) {
        return { success: false, error: "Nombre de búsqueda no proporcionado" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await super.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      // Ejecutar consulta directa para combinar criterios
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "paciente")
        .ilike("name", `%${name}%`)
        .limit(options.limit || 20)
        .range(
          options.offset || 0,
          (options.offset || 0) + (options.limit || 20) - 1
        )
        .order(options.orderBy || "name", {
          ascending: options.ascending !== false,
        });

      if (error) throw error;

      return {
        success: true,
        patients: data,
        pagination: {
          offset: options.offset || 0,
          limit: options.limit || 20,
          hasMore: data.length === (options.limit || 20),
        },
      };
    } catch (error) {
      console.error("Error al buscar pacientes por nombre:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener todos los pacientes
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Object>} Resultado de la búsqueda
   */
  static async getAllPatients(options = {}) {
    try {
      // Reutilizar el método getByRole
      return await this.getByRole("paciente", options);
    } catch (error) {
      console.error("Error al obtener todos los pacientes:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener todos los médicos
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Object>} Resultado de la búsqueda
   */
  static async getAllDoctors(options = {}) {
    try {
      // Reutilizar el método getByRole
      return await this.getByRole("medico", options);
    } catch (error) {
      console.error("Error al obtener todos los médicos:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = Profile;
