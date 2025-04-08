/**
 * Servicio para gestionar el almacenamiento de archivos en Supabase Storage
 */

const { supabase } = require("../config/supabase");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const imageProcessor = require("../utils/imageProcessor");

class StorageService {
  /**
   * Bucket para almacenar imágenes de alimentos
   */
  static FOOD_IMAGES_BUCKET = "food_images";

  /**
   * Bucket para almacenar planes nutricionales
   */
  static NUTRITION_PLANS_BUCKET = "nutrition_plans";

  /**
   * Sube una imagen de alimento a Supabase Storage
   * @param {string} userId - ID del usuario
   * @param {string} filePath - Ruta local del archivo a subir
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async uploadFoodImage(userId, filePath) {
    try {
      // Obtener el nombre del archivo
      const fileName = path.basename(filePath);

      // Determinar el tipo MIME
      const contentType = mime.lookup(filePath) || "application/octet-stream";

      // Leer el archivo como buffer
      const fileBuffer = fs.readFileSync(filePath);

      // Crear el path en Supabase Storage (userId/filename)
      const storagePath = `${userId}/${fileName}`;

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.FOOD_IMAGES_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true, // Sobrescribir si existe
        });

      if (error) {
        console.error("Error al subir imagen:", error);
        return {
          success: false,
          error: error.message || "Error al subir imagen a Supabase Storage",
        };
      }

      return {
        success: true,
        path: data.path,
        contentType,
      };
    } catch (error) {
      console.error("Error inesperado al subir imagen:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtiene la URL pública de una imagen
   * @param {string} storagePath - Ruta del archivo en el storage
   * @returns {Promise<Object>} Resultado con la URL pública
   */
  static async getFoodImageUrl(storagePath) {
    try {
      // Obtener URL pública
      const { data, error } = supabase.storage
        .from(this.FOOD_IMAGES_BUCKET)
        .getPublicUrl(storagePath);

      if (error || !data) {
        return {
          success: false,
          error: error?.message || "Error al obtener URL de imagen",
        };
      }

      return {
        success: true,
        url: data.publicUrl,
      };
    } catch (error) {
      console.error("Error inesperado al obtener URL de imagen:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Elimina una imagen de alimento
   * @param {string} storagePath - Ruta del archivo en el storage
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async deleteFoodImage(storagePath) {
    try {
      const { data, error } = await supabase.storage
        .from(this.FOOD_IMAGES_BUCKET)
        .remove([storagePath]);

      if (error) {
        console.error("Error al eliminar imagen:", error);
        return {
          success: false,
          error:
            error.message || "Error al eliminar imagen de Supabase Storage",
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error inesperado al eliminar imagen:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lista las imágenes de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} Resultado con la lista de imágenes
   */
  static async listFoodImages(userId, options = {}) {
    try {
      const { data, error } = await supabase.storage
        .from(this.FOOD_IMAGES_BUCKET)
        .list(`${userId}`, {
          limit: options.limit || 100,
          offset: options.offset || 0,
          sortBy: {
            column: options.sortBy || "name",
            order: options.order || "asc",
          },
        });

      if (error) {
        console.error("Error al listar imágenes:", error);
        return {
          success: false,
          error:
            error.message || "Error al listar imágenes en Supabase Storage",
        };
      }

      return {
        success: true,
        images: data || [],
      };
    } catch (error) {
      console.error("Error inesperado al listar imágenes:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sube un plan nutricional a Supabase Storage
   * @param {string} userId - ID del usuario
   * @param {string} filePath - Ruta local del archivo a subir
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async uploadNutritionPlan(userId, filePath) {
    try {
      // Obtener el nombre del archivo
      const fileName = path.basename(filePath);

      // Determinar el tipo MIME
      const contentType = mime.lookup(filePath) || "application/octet-stream";

      // Leer el archivo como buffer
      const fileBuffer = fs.readFileSync(filePath);

      // Crear el path en Supabase Storage (userId/filename)
      const storagePath = `${userId}/${fileName}`;

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.NUTRITION_PLANS_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true, // Sobrescribir si existe
        });

      if (error) {
        console.error("Error al subir plan nutricional:", error);
        return {
          success: false,
          error: error.message || "Error al subir plan a Supabase Storage",
        };
      }

      return {
        success: true,
        path: data.path,
        contentType,
      };
    } catch (error) {
      console.error("Error inesperado al subir plan nutricional:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Crea una URL firmada para descargar un archivo privado
   * @param {string} bucket - Nombre del bucket
   * @param {string} storagePath - Ruta del archivo en el storage
   * @param {number} expiresIn - Segundos de validez del enlace (default: 60)
   * @returns {Promise<Object>} Resultado con la URL firmada
   */
  static async createSignedUrl(bucket, storagePath, expiresIn = 60) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        console.error("Error al crear URL firmada:", error);
        return {
          success: false,
          error: error.message || "Error al crear URL firmada",
        };
      }

      return {
        success: true,
        signedUrl: data.signedUrl,
        expiresAt: data.expiresAt,
      };
    } catch (error) {
      console.error("Error inesperado al crear URL firmada:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Descarga un archivo del storage
   * @param {string} bucket - Nombre del bucket
   * @param {string} storagePath - Ruta del archivo en el storage
   * @returns {Promise<Object>} Resultado con los datos del archivo
   */
  static async downloadFile(bucket, storagePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(storagePath);

      if (error) {
        console.error("Error al descargar archivo:", error);
        return {
          success: false,
          error: error.message || "Error al descargar archivo",
        };
      }

      return {
        success: true,
        data,
        blob: data, // El resultado es un Blob
      };
    } catch (error) {
      console.error("Error inesperado al descargar archivo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sube una imagen de alimento a Supabase Storage con optimización
   * @param {string} userId - ID del usuario
   * @param {Buffer} imageBuffer - Buffer de la imagen original
   * @param {string} originalFilename - Nombre original del archivo
   * @param {Object} options - Opciones de optimización
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async uploadFoodImageOptimized(
    userId,
    imageBuffer,
    originalFilename,
    options = {}
  ) {
    try {
      // Valores por defecto si no se especifican
      const maxSizeKB = options.maxSizeKB || 500;
      const format = options.format || "webp";

      // Optimizar la imagen
      const optimizationResult = await imageProcessor.optimizeImage(
        imageBuffer,
        {
          width: options.width || 1200,
          height: options.height || 1200,
          quality: options.quality || 80,
          format,
          maxSizeKB,
        }
      );

      if (!optimizationResult.success) {
        console.error("Error al optimizar imagen:", optimizationResult.error);
        return {
          success: false,
          error: optimizationResult.error || "Error al optimizar imagen",
        };
      }

      // Generar nombre único para el archivo
      const fileName = imageProcessor.generateUniqueImageName(
        originalFilename,
        format
      );

      // Crear el path en Supabase Storage (userId/filename)
      const storagePath = `${userId}/${fileName}`;

      // Determinar el tipo MIME según el formato
      let contentType = "image/webp";
      if (format === "jpeg" || format === "jpg") {
        contentType = "image/jpeg";
      } else if (format === "png") {
        contentType = "image/png";
      }

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.FOOD_IMAGES_BUCKET)
        .upload(storagePath, optimizationResult.buffer, {
          contentType,
          upsert: true, // Sobrescribir si existe
        });

      if (error) {
        console.error("Error al subir imagen:", error);
        return {
          success: false,
          error: error.message || "Error al subir imagen a Supabase Storage",
        };
      }

      return {
        success: true,
        path: data.path,
        contentType,
        originalSize: optimizationResult.originalSize,
        optimizedSize: optimizationResult.optimizedSize,
        compressionRatio: optimizationResult.compressionRatio,
        format,
      };
    } catch (error) {
      console.error("Error inesperado al subir imagen optimizada:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sube un archivo desde ruta con optimización de imagen
   * @param {string} userId - ID del usuario
   * @param {string} filePath - Ruta local del archivo a subir
   * @param {Object} options - Opciones de optimización
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async uploadFoodImageFromPathOptimized(
    userId,
    filePath,
    options = {}
  ) {
    try {
      // Obtener el nombre del archivo
      const fileName = path.basename(filePath);

      // Leer el archivo como buffer
      const fileBuffer = fs.readFileSync(filePath);

      // Subir la imagen optimizada
      return await this.uploadFoodImageOptimized(
        userId,
        fileBuffer,
        fileName,
        options
      );
    } catch (error) {
      console.error("Error al leer o procesar archivo para subir:", error);
      return {
        success: false,
        error: error.message || "Error al leer archivo para subir",
      };
    }
  }
}

module.exports = StorageService;
