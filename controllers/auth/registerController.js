const UserAuth = require("../../models/UserAuth");

// Mostrar página de registro
exports.getRegister = (req, res) => {
  res.render("auth/register", {
    title: "Registrarse",
    user: req.session.user,
  });
};

// Procesar registro
exports.postRegister = async (req, res) => {
  try {
    // Depuración - Mostrar todos los campos recibidos
    console.log("Datos recibidos en el registro:");
    console.log("req.body:", req.body);
    console.log("Campos presentes:", Object.keys(req.body));

    // Destructuring para obtener datos del cuerpo de la petición
    const { name, email, password, password2, role } = req.body;

    // Mostrar valores individuales
    console.log("name:", name);
    console.log("email:", email);
    console.log("password:", password ? "PRESENT" : "MISSING");
    console.log("password2:", password2 ? "PRESENT" : "MISSING");
    console.log("role:", role);

    // Validar entradas
    if (!name || !email || !password || !password2 || !role) {
      console.log("Campos faltantes:");
      if (!name) console.log("- Falta name");
      if (!email) console.log("- Falta email");
      if (!password) console.log("- Falta password");
      if (!password2) console.log("- Falta password2");
      if (!role) console.log("- Falta role");

      req.flash("error_msg", "Por favor rellena todos los campos");
      return res.redirect("/auth/register");
    }

    if (password !== password2) {
      req.flash("error_msg", "Las contraseñas no coinciden");
      return res.redirect("/auth/register");
    }

    // Validar role
    if (role !== "paciente" && role !== "medico") {
      req.flash("error_msg", "Rol no válido");
      return res.redirect("/auth/register");
    }

    // Registrar usuario a través del servicio de autenticación
    const result = await UserAuth.register(name, email, password, role);

    if (!result.success) {
      req.flash("error_msg", result.error || "Error al registrar el usuario");
      return res.redirect("/auth/register");
    }

    // Registro exitoso, redirigir al login
    req.flash(
      "success_msg",
      "¡Registro completado con éxito! Te hemos enviado un correo de confirmación. Por favor, verifica tu bandeja de entrada."
    );
    res.redirect("/auth/login");
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    req.flash("error_msg", error.message || "Error al registrar el usuario");
    res.redirect("/auth/register");
  }
};

// Verificar email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      req.flash("error_msg", "Token de verificación no válido");
      return res.redirect("/auth/login");
    }

    // Verificar el token
    const result = await UserAuth.verifyEmailConfirmation(token);

    if (!result.success) {
      req.flash(
        "error_msg",
        result.error || "Error al verificar el correo electrónico"
      );
      return res.redirect("/auth/login");
    }

    // Verificación exitosa
    req.flash(
      "success_msg",
      "¡Correo electrónico verificado con éxito! Ahora puedes iniciar sesión."
    );
    res.redirect("/auth/login");
  } catch (error) {
    console.error("Error al verificar correo electrónico:", error);
    req.flash("error_msg", "Error al verificar el correo electrónico");
    res.redirect("/auth/login");
  }
};
