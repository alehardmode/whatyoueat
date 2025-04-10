const { supabase } = require("../config/supabase");
const dayjs = require("dayjs");
const { v4: uuidv4 } = require("uuid");
const { getDatabaseErrorMessage } = require("../utils/errorHandler");

class FoodEntry {
  // Crear nueva entrada de comida con imagen almacenada en base64
  static async create(userId, entryData) {
    try {
      // Validar datos obligatorios
      if (!userId || !entryData.imageData) {
        console.error("Error: Datos incompletos para crear entrada", {
          userId: !!userId,
          imageData: !!entryData.imageData,
        });

        return {
          success: false,
          error: "Faltan datos obligatorios para crear la entrada",
        };
      }

      // Verificar acceso a la tabla food_entries
      const { error: tableError } = await supabase
        .from("food_entries")
        .select("id")
        .limit(1);

      if (tableError) {
        console.error("Error al acceder a tabla food_entries:", tableError);
        return {
          success: false,
          error: getDatabaseErrorMessage(tableError.code, tableError.message),
        };
      }

      // Datos a insertar
      const entryDataToInsert = {
        id: uuidv4(),
        user_id: userId,
        name: entryData.name || "Comida sin nombre",
        description: entryData.description || "",
        meal_date: entryData.date || new Date().toISOString(),
        meal_type: entryData.mealType || "other",
        image_data: entryData.imageData, // Imagen en base64
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Intentar inserción con reintentos limitados
      const maxAttempts = 3;
      let lastError = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const { data, error } = await supabase
            .from("food_entries")
            .insert([entryDataToInsert])
            .select();

          if (error) {
            console.error(`Error Supabase (intento ${attempt}):`, error);
            lastError = error;

            // Para ciertos errores, no tiene sentido reintentar
            if (
              ["23502", "23503", "23505", "42501", "42P01"].includes(error.code)
            ) {
              return {
                success: false,
                error: getDatabaseErrorMessage(error.code, error.message),
              };
            }

            // Esperar antes del siguiente intento con backoff exponencial
            if (attempt < maxAttempts) {
              await new Promise((resolve) =>
                setTimeout(resolve, 500 * attempt)
              );
              continue;
            }
          }

          // Éxito en la inserción
          if (!data || data.length === 0) {
            console.warn("Inserción exitosa pero sin datos retornados");
            return {
              success: true,
              entry: { ...entryDataToInsert, id: entryDataToInsert.id },
            };
          }

          return { success: true, entry: data[0] };
        } catch (insertError) {
          console.error(`Error general (intento ${attempt}):`, insertError);
          lastError = insertError;

          // Esperar antes del siguiente intento
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          }
        }
      }

      // Si llegamos aquí, todos los intentos fallaron
      return {
        success: false,
        error: getDatabaseErrorMessage(lastError?.code, lastError?.message),
      };
    } catch (error) {
      console.error("Error al crear entrada de comida:", error);
      return {
        success: false,
        error: getDatabaseErrorMessage(error.code, error.message),
      };
    }
  }

  // Obtener historial de comida para un usuario específico
  static async getHistoryByUserId(
    userId,
    dateFilter = null,
    page = 1,
    limit = 10
  ) {
    try {
      // Construir la consulta base
      let query = supabase
        .from("food_entries")
        .select(
          "id, user_id, name, description, meal_date, meal_type, created_at, updated_at, image_data",
          { count: "exact" }
        ) // Asegurarse de contar exactamente
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Si se proporciona un filtro de fecha, aplicarlo
      if (dateFilter) {
        if (dateFilter.from) {
          const startDate = dayjs(dateFilter.from)
            .startOf("day")
            .toISOString();
          query = query.gte("created_at", startDate);
        }

        if (dateFilter.to) {
          const endDate = dayjs(dateFilter.to).endOf("day").toISOString();
          query = query.lte("created_at", endDate);
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
        console.warn(
          "Advertencia: No se pudo obtener el conteo exacto de entradas, realizando consulta adicional"
        );

        // Si no tenemos conteo, hacer una consulta adicional para contar
        const countQuery = supabase
          .from("food_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);

        // Aplicar los mismos filtros de fecha
        if (dateFilter) {
          if (dateFilter.from) {
            const startDate = dayjs(dateFilter.from)
              .startOf("day")
              .toISOString();
            countQuery.gte("created_at", startDate);
          }

          if (dateFilter.to) {
            const endDate = dayjs(dateFilter.to).endOf("day").toISOString();
            countQuery.lte("created_at", endDate);
          }
        }

        const { count: exactCount, error: countError } = await countQuery;

        if (countError) {
          console.error("Error al obtener conteo exacto:", countError);
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
            totalPages,
          },
        };

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
          totalPages,
        },
      };

      return result;
    } catch (error) {
      console.error("Error al obtener historial de comida:", error);
      return { success: false, error: error.message };
    }
  }

  // Obtener entrada por ID, incluyendo la imagen
  static async getById(id, includeImage = true) {
    try {
      // Construir consulta base
      let query = supabase.from("food_entries").select("*").eq("id", id);

      // Ejecutar consulta
      const { data: entry, error } = await query.single();

      if (error) {
        if (error.code === "PGRST116") {
          // No se encontró la entrada
          return { success: false, error: "Entrada no encontrada" };
        }
        console.error("Error al obtener entrada por ID:", error);
        return { success: false, error: error.message };
      }

      if (!entry) {
        return { success: false, error: "Entrada no encontrada" };
      }

      return { success: true, entry };
    } catch (error) {
      console.error("Error al obtener entrada por ID:", error);
      return { success: false, error: error.message };
    }
  }

  // Eliminar entrada
  static async delete(userId, id) {
    try {
      // Verificar que la entrada exista y pertenezca al usuario
      const { data: entry, error: getError } = await supabase
        .from("food_entries")
        .select("*")
        .eq("id", id)
        .single();

      if (getError) {
        console.error("Error al verificar entrada para eliminación:", getError);
        return {
          success: false,
          error: "No se pudo verificar la entrada para eliminación",
        };
      }

      if (!entry) {
        return { success: false, error: "La entrada no existe" };
      }

      if (entry.user_id !== userId) {
        return {
          success: false,
          error: "No tienes permiso para eliminar esta entrada",
        };
      }

      // Proceder con la eliminación
      const { error: deleteError } = await supabase
        .from("food_entries")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error al eliminar entrada:", deleteError);
        return {
          success: false,
          error: getDatabaseErrorMessage(deleteError.code, deleteError.message),
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error general al eliminar entrada:", error);
      return { success: false, error: error.message };
    }
  }

  // Actualizar una entrada de comida existente
  static async update(id, userId, updates) {
    try {
      if (!updates || Object.keys(updates).length === 0) {
        return {
          success: false,
          error: "Faltan campos obligatorios",
        };
      }

      // Verificar que la entrada exista y pertenezca al usuario
      const { data: entry, error: getError } = await supabase
        .from("food_entries")
        .select("*")
        .eq("id", id)
        .single();

      if (getError) {
        console.error(
          "Error al verificar entrada para actualización:",
          getError
        );
        return {
          success: false,
          error: "No se pudo verificar la entrada para actualización",
        };
      }

      if (!entry) {
        return { success: false, error: "La entrada no existe" };
      }

      if (entry.user_id !== userId) {
        return {
          success: false,
          error: "No tienes permiso para actualizar esta entrada",
        };
      }

      // Preparar datos para la actualización
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }; // Proceder con la actualización
      try {
        // Intentar hacer update con select
        const { data: updatedEntry, error: updateError } = await supabase
          .from("food_entries")
          .update(updateData)
          .eq("id", id)
          .select();

        if (updateError) throw updateError;

        return {
          success: true,
          entry:
            updatedEntry && updatedEntry.length > 0
              ? updatedEntry[0]
              : { ...entry, ...updateData },
        };
      } catch (updateError) {
        // Reintento sin select() en caso de error
        try {
          const { error } = await supabase
            .from("food_entries")
            .update(updateData)
            .eq("id", id);

          if (error) throw error;

          return { success: true, entry: { ...entry, ...updateData } };
        } catch (error) {
          // Re-lanzar el error
          throw error;
        }
      }
    } catch (error) {
      console.error("Error general al actualizar entrada:", error);
      return { success: false, error: error.message };
    }
  }

  // Método auxiliar para obtener las entradas por usuario (alias para getHistoryByUserId)
  static async getByUser(userId, dateFilter = null, page = 1, limit = 10) {
    return this.getHistoryByUserId(userId, dateFilter, page, limit);
  }
}

module.exports = FoodEntry;
