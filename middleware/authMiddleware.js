/**
 * Middleware para verificar si un usuario está autenticado
 * Protege rutas que requieren inicio de sesión
 */
exports.isAuthenticated = (req, res, next) => {
  // Verificar si el usuario está autenticado mediante la sesión
  if (req.session.isLoggedIn && req.session.userId) {
    return next();
  }
  
  // Guardar la URL original para redireccionar después del login
  req.session.returnTo = req.originalUrl;
  
  // Usuario no autenticado, redireccionar a la página de login
  req.flash('error_msg', 'Por favor inicia sesión para acceder a esta página');
  res.redirect('/auth/login');
};

/**
 * Middleware para verificar si un usuario es paciente
 * Protege rutas específicas para pacientes
 */
exports.isPatient = (req, res, next) => {
  // Primero verificar si está autenticado
  if (!req.session.isLoggedIn || !req.session.userId) {
    req.flash('error_msg', 'Por favor inicia sesión para acceder a esta página');
    return res.redirect('/auth/login');
  }
  
  // Luego verificar si es paciente
  if (req.session.userRole === 'paciente') {
    return next();
  }
  
  // Usuario no autorizado
  req.flash('error_msg', 'No tienes permiso para acceder a esta página');
  res.redirect('/');
};

/**
 * Middleware para verificar si un usuario es médico
 * Protege rutas específicas para médicos
 */
exports.isDoctor = (req, res, next) => {
  // Primero verificar si está autenticado
  if (!req.session.isLoggedIn || !req.session.userId) {
    req.flash('error_msg', 'Por favor inicia sesión para acceder a esta página');
    return res.redirect('/auth/login');
  }
  
  // Luego verificar si es médico
  if (req.session.userRole === 'medico') {
    return next();
  }
  
  // Usuario no autorizado
  req.flash('error_msg', 'No tienes permiso para acceder a esta página');
  res.redirect('/');
};

/**
 * Middleware para verificar si un usuario ya está autenticado
 * Redirige a usuarios ya logueados que intenten acceder a páginas de login/registro
 */
exports.isNotAuthenticated = (req, res, next) => {
  if (req.session.isLoggedIn) {
    // Si ya está autenticado, redirigir según rol
    if (req.session.userRole === 'paciente') {
      return res.redirect('/patient/dashboard');
    } else if (req.session.userRole === 'medico') {
      return res.redirect('/doctor/dashboard');
    } else {
      return res.redirect('/');
    }
  }
  
  // No está autenticado, continuar
  next();
}; 