/**
 * Utilidades para procesamiento y optimización de imágenes
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

/**
 * Optimiza una imagen para reducir su tamaño manteniendo una calidad aceptable
 * @param {Buffer} imageBuffer - Buffer con la imagen original
 * @param {Object} options - Opciones de optimización
 * @param {number} options.width - Ancho máximo (default: 1200px)
 * @param {number} options.height - Alto máximo (default: 1200px)
 * @param {number} options.quality - Calidad de compresión (1-100, default: 80)
 * @param {string} options.format - Formato de salida ('webp', 'jpeg', 'png', default: 'webp')
 * @param {number} options.maxSizeKB - Tamaño máximo en KB (si se supera, se reduce más la calidad)
 * @returns {Promise<Object>} Objeto con el buffer optimizado y estadísticas
 */
exports.optimizeImage = async (imageBuffer, options = {}) => {
  try {
    // Valores por defecto para las opciones
    const width = options.width || 1200;
    const height = options.height || 1200;
    const quality = options.quality || 80;
    const format = options.format || "webp";
    const maxSizeKB = options.maxSizeKB || 500; // 500KB por defecto como tamaño máximo

    // Tamaño original
    const originalSize = imageBuffer.length;

    // Procesar la imagen
    let sharpInstance = sharp(imageBuffer).resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
    });

    // Aplicar formato y compresión
    if (format === "webp") {
      sharpInstance = sharpInstance.webp({
        quality,
        lossless: false,
        effort: 4, // Balance entre velocidad y compresión (0-6)
      });
    } else if (format === "jpeg" || format === "jpg") {
      sharpInstance = sharpInstance.jpeg({
        quality,
        progressive: true,
        optimizeScans: true,
      });
    } else if (format === "png") {
      sharpInstance = sharpInstance.png({
        quality,
        compressionLevel: 9, // Máxima compresión (0-9)
        palette: true, // Usar paletas para PNG pequeños
      });
    }

    // Obtener el buffer optimizado
    let optimizedBuffer = await sharpInstance.toBuffer();

    // Si la imagen aún supera el tamaño máximo, reducir calidad progresivamente
    let currentQuality = quality;
    while (optimizedBuffer.length > maxSizeKB * 1024 && currentQuality > 20) {
      currentQuality -= 10;

      if (format === "webp") {
        optimizedBuffer = await sharp(imageBuffer)
          .resize({ width, height, fit: "inside", withoutEnlargement: true })
          .webp({ quality: currentQuality, lossless: false, effort: 4 })
          .toBuffer();
      } else if (format === "jpeg" || format === "jpg") {
        optimizedBuffer = await sharp(imageBuffer)
          .resize({ width, height, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: currentQuality, progressive: true })
          .toBuffer();
      } else if (format === "png") {
        optimizedBuffer = await sharp(imageBuffer)
          .resize({ width, height, fit: "inside", withoutEnlargement: true })
          .png({ quality: currentQuality, compressionLevel: 9, palette: true })
          .toBuffer();
      }
    }

    return {
      success: true,
      buffer: optimizedBuffer,
      originalSize,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: Math.round(
        (1 - optimizedBuffer.length / originalSize) * 100
      ),
      format,
      width,
      height,
      finalQuality: currentQuality,
    };
  } catch (error) {
    console.error("Error al optimizar imagen:", error);
    return {
      success: false,
      error: error.message || "Error desconocido al optimizar imagen",
      originalSize: imageBuffer.length,
    };
  }
};

/**
 * Optimiza una imagen desde un archivo y la guarda en un destino
 * @param {string} inputPath - Ruta del archivo original
 * @param {string} outputPath - Ruta donde guardar el archivo optimizado
 * @param {Object} options - Opciones de optimización (igual que optimizeImage)
 * @returns {Promise<Object>} Resultado de la operación
 */
exports.optimizeImageFile = async (inputPath, outputPath, options = {}) => {
  try {
    const imageBuffer = fs.readFileSync(inputPath);
    const result = await exports.optimizeImage(imageBuffer, options);

    if (!result.success) {
      return result;
    }

    fs.writeFileSync(outputPath, result.buffer);

    return {
      ...result,
      inputPath,
      outputPath,
    };
  } catch (error) {
    console.error("Error al optimizar archivo de imagen:", error);
    return {
      success: false,
      error:
        error.message || "Error desconocido al optimizar archivo de imagen",
      inputPath,
      outputPath,
    };
  }
};

/**
 * Genera un nombre único para un archivo de imagen con el formato deseado
 * @param {string} originalFilename - Nombre original del archivo
 * @param {string} format - Formato deseado ('webp', 'jpeg', 'png')
 * @returns {string} Nombre de archivo único con extensión apropiada
 */
exports.generateUniqueImageName = (originalFilename, format = "webp") => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const baseName = path
    .parse(originalFilename)
    .name.replace(/[^a-z0-9]/gi, "-");

  return `${baseName}-${timestamp}-${randomStr}.${format}`;
};
