const { supabase } = require("../config/supabase");

/**
 * Clase base para modelos que interactúan con Supabase
 * Proporciona funcionalidades comunes para todos los modelos
 */
class BaseModel {
  /**
   * Nombre de la tabla en Supabase
   * @type {string}
   */
  static tableName = null;

  /**
   * Verifica la conexión a Supabase
   * @returns {Promise<Object>} Resultado de la verificación
   */
  static async checkConnection() {
    try {
      if (!this.tableName) {
        throw new Error("Nombre de tabla no definido en la clase hija");
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select("count", { count: "exact", head: true });

      return { success: !error, error: error ? error.message : null };
    } catch (error) {
      console.error(
        `Error al verificar conexión a Supabase (${this.tableName}):`,
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene un registro por su ID
   * @param {string} id - ID del registro
   * @returns {Promise<Object>} Resultado de la consulta
   */
  static async getById(id) {
    try {
      if (!id) {
        return { success: false, error: "ID no proporcionado" };
      }

      if (!this.tableName) {
        return { success: false, error: "Nombre de tabla no definido" };
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
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (!data) {
        return { success: false, error: "Registro no encontrado" };
      }

      return { success: true, data };
    } catch (error) {
      console.error(`Error al obtener registro (${this.tableName}):`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crea un nuevo registro
   * @param {Object} data - Datos del registro
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async create(data) {
    try {
      if (!data || typeof data !== "object") {
        return { success: false, error: "Datos no válidos" };
      }

      if (!this.tableName) {
        return { success: false, error: "Nombre de tabla no definido" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      // Añadir timestamps si no existen
      if (!data.created_at) {
        data.created_at = new Date().toISOString();
      }
      if (!data.updated_at) {
        data.updated_at = new Date().toISOString();
      }

      try {
        // Intentar insert con select
        const { data: result, error } = await supabase
          .from(this.tableName)
          .insert([data])
          .select();

        if (error) throw error;

        return {
          success: true,
          data: result && result.length > 0 ? result[0] : data,
        };
      } catch (insertError) {
        if (
          insertError.message &&
          insertError.message.includes("select is not a function")
        ) {
          // Manejar el caso para los mocks donde .select() no está disponible
          const { error } = await supabase.from(this.tableName).insert([data]);

          if (error) throw error;

          return { success: true, data };
        } else {
          // Re-lanzar cualquier otro error
          throw insertError;
        }
      }
    } catch (error) {
      console.error(`Error al crear registro (${this.tableName}):`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualiza un registro
   * @param {string} id - ID del registro
   * @param {Object} updates - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async update(id, updates) {
    try {
      if (!id) {
        return { success: false, error: "ID no proporcionado" };
      }

      if (!updates || typeof updates !== "object") {
        return { success: false, error: "Datos de actualización no válidos" };
      }

      if (!this.tableName) {
        return { success: false, error: "Nombre de tabla no definido" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      // Añadir marca de tiempo de actualización
      if (!updates.updated_at) {
        updates.updated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return { success: false, error: "No se pudo actualizar el registro" };
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error(`Error al actualizar registro (${this.tableName}):`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Elimina un registro (borrado lógico si existe el campo is_active)
   * @param {string} id - ID del registro
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    try {
      if (!id) {
        return { success: false, error: "ID no proporcionado" };
      }

      if (!this.tableName) {
        return { success: false, error: "Nombre de tabla no definido" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      // Primero verificar si el modelo tiene campo is_active (borrado lógico)
      const { data: checkData, error: checkError } = await supabase
        .from(this.tableName)
        .select("is_active")
        .eq("id", id)
        .maybeSingle();

      if (checkError) throw checkError;

      // Si el registro existe y tiene campo is_active, hacemos borrado lógico
      if (checkData && "is_active" in checkData) {
        const { data, error } = await supabase
          .from(this.tableName)
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select();

        if (error) throw error;

        return { success: true, data: data[0], softDelete: true };
      }

      // Si no tiene is_active o no existe, hacemos borrado físico
      const { data, error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("id", id);

      if (error) throw error;

      return { success: true, hardDelete: true };
    } catch (error) {
      console.error(`Error al eliminar registro (${this.tableName}):`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Busca registros por criterios
   * @param {Object} criteria - Criterios de búsqueda
   * @param {Object} options - Opciones adicionales (paginación, orden, etc.)
   * @returns {Promise<Object>} Resultado de la búsqueda
   */
  static async findByCriteria(criteria = {}, options = {}) {
    try {
      if (!this.tableName) {
        return { success: false, error: "Nombre de tabla no definido" };
      }

      // Verificar la conexión antes de continuar
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.success) {
        return {
          success: false,
          error: "Error de conexión a la base de datos",
        };
      }

      // Construir la consulta
      let query = supabase.from(this.tableName).select(options.select || "*");

      // Aplicar filtros
      if (criteria && typeof criteria === "object") {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              // Si el valor es un array, usamos in
              query = query.in(key, value);
            } else if (typeof value === "object" && value.operator) {
              // Si tiene un operador específico
              switch (value.operator) {
                case "like":
                  query = query.ilike(key, `%${value.value}%`);
                  break;
                case "gt":
                  query = query.gt(key, value.value);
                  break;
                case "gte":
                  query = query.gte(key, value.value);
                  break;
                case "lt":
                  query = query.lt(key, value.value);
                  break;
                case "lte":
                  query = query.lte(key, value.value);
                  break;
                case "neq":
                  query = query.neq(key, value.value);
                  break;
                default:
                  query = query.eq(key, value.value);
              }
            } else {
              // Por defecto usamos igual
              query = query.eq(key, value);
            }
          }
        });
      }

      // Aplicar orden
      if (options.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.ascending !== false,
        });
      }

      // Aplicar paginación
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      // Ejecutar la consulta
      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data,
        count,
        pagination: {
          offset: options.offset || 0,
          limit: options.limit,
          hasMore: data.length === options.limit,
        },
      };
    } catch (error) {
      console.error(`Error en búsqueda (${this.tableName}):`, error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = BaseModel;
