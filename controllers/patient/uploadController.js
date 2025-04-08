// controllers/patient/uploadController.js
const { checkSupabaseConnection } = require("../../config/supabase");
const FoodEntry = require("../../models/FoodEntry");
const {
  validateFoodEntry,
} = require("../../utils/validators/foodEntryValidator");
const imageProcessor = require("../../utils/imageProcessor");
const StorageService = require("../../models/StorageService");

/**
 * Muestra el formulario para subir una nueva foto de comida
 */
exports.getUploadForm = async (req, res) => {
  try {
    // Verificar la conexión a Supabase (recursos específicos)
    const connectionCheck = await checkSupabaseConnection();
    if (!connectionCheck.success) {
      console.error(
        "Error de conexión/permisos Supabase:",
        connectionCheck.error
      );
      return res.render("patient/upload", {
        title: "Subir Foto de Comida",
        user: req.user,
        connection_error: connectionCheck.error,
      });
    }

    // Renderizar formulario de carga
    res.render("patient/upload", {
      title: "Subir Foto de Comida",
      user: req.user,
      connection_error: null,
    });
  } catch (error) {
    console.error("Error al mostrar formulario de carga:", error);
    res.render("patient/upload", {
      title: "Subir Foto de Comida",
      user: req.user,
      connection_error: "Error inesperado al preparar el formulario.",
    });
  }
};

/**
 * Procesa la subida de una nueva foto de comida
 */
exports.postUpload = async (req, res) => {
  try {
    console.log("Iniciando proceso de carga de foto...");

    // Datos del formulario
    const userId = req.user.id;
    const { foodName, description, mealType, mealDate } = req.body;
    const file = req.files?.food_photo;

    console.log(
      `Datos recibidos: userId=${userId}, nombre=${foodName}, descripción=${description?.length} chars`
    );

    // Validar datos del formulario
    const validationError = validateFoodEntry({ foodName, description }, file);
    if (validationError) {
      req.flash("error_msg", validationError);
      return res.redirect("/patient/upload");
    }

    try {
      // Validar el tipo MIME para asegurarse que es una imagen
      const validMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validMimeTypes.includes(file.mimetype)) {
        req.flash(
          "error_msg",
          "Formato de archivo no válido. Solo se permiten JPG, PNG, GIF y WebP."
        );
        return res.redirect("/patient/upload");
      }

      // Optimizar la imagen usando la nueva utilidad
      const optimizationResult = await imageProcessor.optimizeImage(file.data, {
        width: 1200,
        height: 1200,
        quality: 80,
        format: "webp",
        maxSizeKB: 500, // Máximo 500KB
      });

      if (!optimizationResult.success) {
        console.error("Error al optimizar imagen:", optimizationResult.error);
        req.flash(
          "error_msg",
          "Error al procesar la imagen. Por favor, intenta nuevamente."
        );
        return res.redirect("/patient/upload");
      }

      console.log(
        "Imagen optimizada: Original",
        Math.round(file.data.length / 1024),
        "KB →",
        Math.round(optimizationResult.buffer.length / 1024),
        "KB (WebP) - Compresión:",
        optimizationResult.compressionRatio + "%"
      );

      // Subir a Supabase Storage
      const storageResult = await StorageService.uploadFoodImageOptimized(
        userId,
        file.data,
        file.name,
        { format: "webp", maxSizeKB: 500 }
      );

      if (!storageResult.success) {
        console.error(
          "Error al subir a Supabase Storage:",
          storageResult.error
        );
        // Continuamos con el flujo para guardar en base64
      } else {
        console.log(
          "Imagen subida a Supabase Storage con éxito. Path:",
          storageResult.path
        );
        // Podríamos guardar la referencia en vez de la imagen completa
      }

      // Convertir imagen optimizada a base64
      const imageData = `data:image/webp;base64,${optimizationResult.buffer.toString(
        "base64"
      )}`;

      // Crear entrada en la base de datos con la imagen optimizada en base64
      const result = await FoodEntry.create(userId, {
        name: foodName || "Comida sin nombre",
        description: description || "",
        date: mealDate || new Date().toISOString(),
        mealType: mealType || "other",
        imageData: imageData,
        // Si queremos guardar la referencia a Storage en vez de la imagen completa:
        // storagePath: storageResult?.success ? storageResult.path : null,
      });

      if (!result.success) {
        console.error("Error al crear entrada de comida:", result.error);
        req.flash(
          "error_msg",
          "Error al guardar la entrada de comida. Por favor, intenta nuevamente."
        );
        return res.redirect("/patient/upload");
      }

      console.log(
        "⭐ Subida completada con éxito. ID de entrada:",
        result.entry.id
      );
      req.flash("success_msg", "¡Tu comida ha sido registrada exitosamente!");
      return res.redirect("/patient/dashboard");
    } catch (error) {
      console.error("Error durante el proceso de subida:", error);
      req.flash(
        "error_msg",
        "Error al procesar la imagen. Por favor, intenta nuevamente."
      );
      return res.redirect("/patient/upload");
    }
  } catch (outerError) {
    console.error("Error general en controlador de subida:", outerError);
    req.flash("error_msg", "Error general al procesar la solicitud.");
    return res.redirect("/patient/upload");
  }
};
