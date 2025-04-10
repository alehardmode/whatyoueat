const UserAuth = require("../../models/UserAuth");

/**
 * Maneja el callback de autenticación de Supabase
 */
exports.handleAuthCallback = async (req, res) => {
  try {
    // Obtener token y tipo de la URL
    const { token_hash, type } = req.query;

    if (!token_hash) {
      req.flash("error_msg", "Token no válido o expirado");
      return res.redirect("/auth/login");
    }

    console.log(
      `Callback de autenticación recibido: type=${type}, token_hash=${token_hash.slice(
        0,
        10
      )}...`
    );

    // Procesar token según el tipo
    const result = await UserAuth.handleAuthCallback(token_hash, type);

    if (!result.success) {
      req.flash(
        "error_msg",
        result.error || "Error en la verificación del email"
      );
      return res.redirect("/auth/login");
    }

    // Redirect según el resultado
    if (result.action === "email_confirmed") {
      req.flash(
        "success_msg",
        "¡Email verificado con éxito! Ya puedes iniciar sesión."
      );
      return res.redirect("/auth/login");
    } else {
      // Caso genérico, redireccionar a la página de confirmación
      return res.redirect("/auth/email-confirmed");
    }
  } catch (error) {
    console.error("Error en callback de autenticación:", error);
    req.flash("error_msg", "Error en la verificación del email");
    res.redirect("/auth/login");
  }
};

/**
 * Reenvía el correo de confirmación
 */
exports.resendConfirmation = async (req, res) => {
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
};
