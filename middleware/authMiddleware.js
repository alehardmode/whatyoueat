/**
 * Middleware para verificar si un usuario está autenticado
 * Protege rutas que requieren inicio de sesión
 */
exports.isAuthenticated = (req, res, next) => {
  // Verificar si el usuario está autenticado mediante la sesión y tiene formato válido
  if (req.session && req.session.user && req.session.user.id) {
    // Asignar req.session.user a req.user para mantener consistencia
    req.user = req.session.user;
    return next();
  }

  // Si la sesión existe pero está corrupta (sin id), limpiarla
  if (req.session && req.session.user && !req.session.user.id) {
    console.warn("Sesión corrupta detectada, limpiando datos");
    delete req.session.user;
  }

  // Guardar la URL original para redireccionar después del login
  if (req.session) {
    req.session.returnTo = req.originalUrl;
  }

  // Usuario no autenticado, redireccionar a la página de login
  req.flash("error_msg", "Por favor inicia sesión para acceder a esta página");
  res.redirect("/auth/login");
};

/**
 * Middleware para verificar si un usuario tiene un rol específico
 * @param {String} role - Rol requerido ('paciente' o 'medico')
 * @returns {Function} Middleware
 */
const checkRole = (role) => (req, res, next) => {
  // Primero verificar si está autenticado y tiene formato válido
  if (!req.session || !req.session.user || !req.session.user.id) {
    // Si la sesión existe pero está corrupta (sin id), limpiarla
    if (req.session && req.session.user && !req.session.user.id) {
      console.warn("Sesión corrupta detectada en checkRole, limpiando datos");
      delete req.session.user;
    }

    if (req.session) {
      req.session.returnTo = req.originalUrl;
    }

    req.flash(
      "error_msg",
      "Por favor inicia sesión para acceder a esta página"
    );
    return res.redirect("/auth/login");
  }

  // Luego verificar si tiene el rol requerido
  if (req.session.user.role === role) {
    req.user = req.session.user;
    return next();
  }

  // Usuario no autorizado
  req.flash("error_msg", "No tienes permiso para acceder a esta página");
  res.redirect("/");
};

/**
 * Middleware para verificar si un usuario es paciente
 * Protege rutas específicas para pacientes
 */
exports.isPatient = checkRole("paciente");

/**
 * Middleware para verificar si un usuario es médico
 * Protege rutas específicas para médicos
 */
exports.isDoctor = checkRole("medico");

/**
 * Middleware para verificar si un usuario ya está autenticado
 * Redirige a usuarios ya logueados que intenten acceder a páginas de login/registro
 */
exports.isNotAuthenticated = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.id) {
    // Si ya está autenticado, redirigir según rol o a la página guardada en returnTo
    const returnUrl =
      req.session.returnTo ||
      (req.session.user.role === "paciente"
        ? "/patient/dashboard"
        : req.session.user.role === "medico"
        ? "/doctor/dashboard"
        : "/");

    delete req.session.returnTo;
    return res.redirect(returnUrl);
  }

  // Si la sesión existe pero está corrupta (sin id), limpiarla
  if (req.session && req.session.user && !req.session.user.id) {
    console.warn(
      "Sesión corrupta detectada en isNotAuthenticated, limpiando datos"
    );
    delete req.session.user;
  }

  // No está autenticado, continuar
  next();
};
