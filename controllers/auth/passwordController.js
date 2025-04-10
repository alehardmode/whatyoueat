const UserAuth = require("../../models/UserAuth");
const crypto = require("crypto");

// Mostrar página de recuperación de contraseña
exports.getForgotPassword = (req, res) => {
  res.render("auth/forgot-password", {
    title: "Recuperar Contraseña",
    user: req.session.user,
  });
};

// Procesar solicitud de recuperación de contraseña
exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash(
        "error_msg",
        "Por favor ingresa tu dirección de correo electrónico"
      );
      return res.redirect("/auth/forgot-password");
    }

    // Solicitar recuperación de contraseña
    const result = await UserAuth.requestPasswordReset(email);

    // Siempre mostrar el mismo mensaje por seguridad, independientemente del resultado
    req.flash(
      "success_msg",
      "Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña."
    );
    res.redirect("/auth/login");
  } catch (error) {
    console.error(
      "Error al procesar solicitud de recuperación de contraseña:",
      error
    );
    req.flash("error_msg", "Error al procesar la solicitud");
    res.redirect("/auth/forgot-password");
  }
};

// Mostrar página de restablecimiento de contraseña
exports.getResetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      req.flash("error_msg", "Token de restablecimiento no válido");
      return res.redirect("/auth/login");
    }

    // Verificar validez del token
    const result = await UserAuth.verifyResetToken(token);

    if (!result.success) {
      req.flash("error_msg", "El enlace ha expirado o no es válido");
      return res.redirect("/auth/login");
    }

    res.render("auth/reset-password", {
      title: "Restablecer Contraseña",
      token,
      user: null,
    });
  } catch (error) {
    console.error("Error al mostrar página de restablecimiento:", error);
    req.flash("error_msg", "Error al procesar la solicitud");
    res.redirect("/auth/login");
  }
};

// Procesar cambio de contraseña
exports.postResetPassword = async (req, res) => {
  try {
    const { token, password, password2 } = req.body;

    // Validaciones
    if (!token || !password || !password2) {
      req.flash("error_msg", "Todos los campos son obligatorios");
      return res.redirect(`/auth/reset-password/${token}`);
    }

    if (password !== password2) {
      req.flash("error_msg", "Las contraseñas no coinciden");
      return res.redirect(`/auth/reset-password/${token}`);
    }

    // Cambiar contraseña
    const result = await UserAuth.resetPassword(token, password);

    if (!result.success) {
      req.flash(
        "error_msg",
        result.error || "Error al restablecer la contraseña"
      );
      return res.redirect(`/auth/reset-password/${token}`);
    }

    // Éxito
    req.flash(
      "success_msg",
      "Contraseña restablecida con éxito. Ahora puedes iniciar sesión."
    );
    res.redirect("/auth/login");
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    req.flash("error_msg", "Error al procesar la solicitud");
    res.redirect("/auth/login");
  }
};

// Mostrar página de cambio de contraseña (usuario autenticado)
exports.getChangePassword = (req, res) => {
  res.render("auth/change-password", {
    title: "Cambiar Contraseña",
    user: req.session.user,
  });
};

// Procesar cambio de contraseña (usuario autenticado)
exports.postChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.userId;

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash("error_msg", "Todos los campos son obligatorios");
      return res.redirect("/auth/change-password");
    }

    if (newPassword !== confirmPassword) {
      req.flash("error_msg", "Las nuevas contraseñas no coinciden");
      return res.redirect("/auth/change-password");
    }

    // Cambiar contraseña
    const result = await UserAuth.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      req.flash("error_msg", result.error || "Error al cambiar la contraseña");
      return res.redirect("/auth/change-password");
    }

    // Éxito
    req.flash("success_msg", "Contraseña cambiada con éxito");
    res.redirect(
      req.session.userRole === "paciente"
        ? "/patient/dashboard"
        : "/doctor/dashboard"
    );
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    req.flash("error_msg", "Error al procesar la solicitud");
    res.redirect("/auth/change-password");
  }
};
