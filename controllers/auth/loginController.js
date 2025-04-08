const UserAuth = require("../../models/UserAuth");

// Mostrar página de inicio de sesión
exports.getLogin = (req, res) => {
  res.render("auth/login", {
    title: "Iniciar Sesión",
    user: req.session.user,
  });
};

// Procesar inicio de sesión
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar entradas
    if (!email || !password) {
      req.flash("error_msg", "Por favor rellena todos los campos");
      return res.redirect("/auth/login");
    }

    console.log("Intentando iniciar sesión con email:", email);

    // Intentar iniciar sesión
    const result = await UserAuth.login(email, password);

    console.log("Resultado del login:", {
      success: result.success,
      errorCode: result.errorCode || "no_error",
      userRole: result.user?.role,
      emailConfirmed: result.user?.email_confirmed_at ? "Sí" : "No",
    });

    if (!result.success) {
      // Usar mensajes específicos cuando sea seguro
      if (result.errorCode === "email_not_confirmed") {
        // Permitimos iniciar sesión sin confirmar email
        // Simplemente continuamos el flujo normal
        console.log(
          "Usuario sin confirmar email intenta iniciar sesión, permitimos acceso"
        );
      } else if (
        result.errorCode === "user_not_found" ||
        result.errorCode === "invalid_credentials"
      ) {
        // Para errores de credenciales o usuario inexistente, usamos un mensaje genérico
        // por seguridad (no revelar si el email existe o no)
        req.flash("error_msg", "Credenciales incorrectas");
        return res.redirect("/auth/login");
      } else {
        // Para cualquier otro error
        req.flash("error_msg", result.error || "Error al iniciar sesión");
        return res.redirect("/auth/login");
      }
    }

    // Comprobar si el email está confirmado o no
    const emailNotConfirmed = result.emailNotConfirmed === true;

    // Iniciar sesión exitosa - establecer datos de sesión
    req.session.isLoggedIn = true;
    req.session.user = result.user;
    req.session.userId = result.user.id;
    req.session.userRole = result.user.role;

    console.log("Sesión establecida:", {
      userId: req.session.userId,
      userRole: req.session.userRole,
      emailConfirmed: !emailNotConfirmed,
    });

    // Verificar si el email está confirmado (simplificado)
    req.session.emailConfirmed =
      !emailNotConfirmed && result.user.email_confirmed_at !== null;

    // Guardar la sesión antes de redireccionar
    req.session.save((err) => {
      if (err) {
        console.error("Error al guardar sesión:", err);
        req.flash("error_msg", "Error al iniciar sesión");
        return res.redirect("/auth/login");
      }

      // Redireccionar al dashboard según el rol del usuario
      const userRole = req.session.userRole;
      console.log("Redirigiendo basado en rol:", userRole);

      if (userRole === "paciente") {
        res.redirect("/patient/dashboard");
      } else if (userRole === "medico") {
        res.redirect("/doctor/dashboard");
      } else {
        // Si el rol no está definido o es desconocido, redirigir a la página principal
        console.log(
          "Rol no definido o desconocido, redirigiendo a la página principal"
        );
        res.redirect("/");
      }
    });
  } catch (error) {
    console.error("Error en inicio de sesión:", error);
    req.flash("error_msg", "Error al iniciar sesión");
    res.redirect("/auth/login");
  }
};

// Mostrar confirmación de correo
exports.getEmailConfirmed = (req, res) => {
  res.render("auth/email-confirmed", {
    title: "Correo Confirmado",
    user: req.session.user,
  });
};

// Cerrar sesión
exports.logout = (req, res) => {
  // Limpiar datos sensibles antes de destruir la sesión
  if (req.session.user) {
    req.session.user = null;
  }
  req.session.userId = null;
  req.session.isLoggedIn = false;
  req.session.userRole = null;

  // Destruir la sesión por completo
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.status(500).send("Error al cerrar sesión");
    }

    // Eliminar la cookie de sesión
    res.clearCookie("connect.sid");

    // Redireccionar a la página de inicio
    res.redirect("/");
  });
};
