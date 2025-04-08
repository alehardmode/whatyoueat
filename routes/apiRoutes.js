const express = require("express");
const router = express.Router();
const UserAuth = require("../models/UserAuth");
const { isAuthenticated } = require("../middleware/authMiddleware");

// Ruta para reenviar correo de confirmación
router.post("/resend-confirmation", isAuthenticated, async (req, res) => {
  try {
    // Obtener el email de la sesión del usuario
    const email = req.session.user?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "No se pudo determinar el email",
      });
    }

    // Reenviar correo de confirmación
    const result = await UserAuth.resendConfirmationEmail(email);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message:
          result.error || "No se pudo reenviar el correo de confirmación",
        errorCode: result.errorCode,
      });
    }

    // Devolver respuesta exitosa
    return res.json({
      success: true,
      message:
        "Correo de confirmación reenviado. Por favor, revisa tu bandeja de entrada.",
    });
  } catch (error) {
    console.error("Error al reenviar correo de confirmación:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      errorCode: "server_error",
    });
  }
});

// Verificación de conexión a Supabase
router.get("/check-supabase", async (req, res) => {
  try {
    const { supabase, testSupabaseConnection } = require("../config/supabase");

    const result = {
      success: false,
      database: { connected: false },
    };

    // Comprobar conexión general
    try {
      const connected = await testSupabaseConnection();
      result.success = connected;
    } catch (e) {
      result.connection_error = e.message;
    }

    // Verificar base de datos
    try {
      const { data: tableData, error: tableError } = await supabase
        .from("food_entries")
        .select("id")
        .limit(1);

      result.database.connected = !tableError;

      if (tableError) {
        result.database.error = tableError.message;
        result.database.code = tableError.code;
      } else {
        result.database.has_data = tableData && tableData.length > 0;
      }
    } catch (e) {
      result.database.error = e.message;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para registrar errores del lado del cliente
router.post("/log-error", (req, res) => {
  try {
    const { type, imageId, details } = req.body;
    console.error(`[ERROR CLIENTE] Tipo: ${type}, ID: ${imageId}`);

    if (details) {
      console.error("Detalles:", details);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error al procesar error del cliente:", error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
