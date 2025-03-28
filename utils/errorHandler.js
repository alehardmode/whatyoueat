/**
 * Utilidad para manejo de errores en toda la aplicación
 */

/**
 * Mapea códigos de error de Supabase a mensajes amigables
 * @param {string} code - Código de error de Supabase
 * @param {string} message - Mensaje de error original
 * @returns {string} Mensaje de error amigable
 */
exports.getDatabaseErrorMessage = (code, message) => {
  const errorMap = {
    '23502': 'Faltan campos obligatorios',
    '23503': 'El registro referenciado no existe en la base de datos',
    '23505': 'Ya existe un registro idéntico',
    '42501': 'No tienes permisos para esta operación',
    '42P01': 'La tabla no existe. Contacta al administrador.',
    'PGRST301': 'El recurso solicitado no existe'
  };
  
  // Si tenemos un mensaje específico para este código, usarlo
  if (errorMap[code]) return errorMap[code];
  
  // Para mensajes de error específicos
  if (message?.includes('foreign key')) return 'Error de referencia a otro registro';
  if (message?.includes('not-null')) return 'Faltan campos obligatorios';
  if (message?.includes('auth')) return 'Error de autenticación';
  if (message?.includes('duplicate')) return 'Registro duplicado';
  if (message?.includes('permission')) return 'No tienes permisos suficientes';
  
  // Mensaje genérico
  return 'Error en la operación con la base de datos';
};

/**
 * Mapea errores de autenticación a mensajes amigables
 * @param {string} code - Código de error de autenticación
 * @param {string} message - Mensaje de error original
 * @returns {string} Mensaje de error amigable
 */
exports.getAuthErrorMessage = (code, message) => {
  const errorMap = {
    'user_not_found': 'Usuario no encontrado',
    'invalid_credentials': 'Credenciales no válidas',
    'email_taken': 'El email ya está registrado',
    'weak_password': 'La contraseña es demasiado débil',
    'expired_token': 'El enlace ha expirado, solicita uno nuevo',
    'invalid_token': 'El enlace no es válido'
  };
  
  // Si tenemos un mensaje específico para este código, usarlo
  if (errorMap[code]) return errorMap[code];
  
  // Para mensajes de error específicos
  if (message?.includes('password')) return 'Error en la contraseña';
  if (message?.includes('email')) return 'Error en el email';
  if (message?.includes('token')) return 'Error en el token de autenticación';
  
  // Mensaje genérico
  return 'Error de autenticación';
};

/**
 * Maneja un error HTTP y establece el código de estado adecuado
 * @param {Error} error - Error capturado
 * @param {Object} res - Objeto de respuesta Express
 * @param {Object} req - Objeto de solicitud Express  
 * @param {string} defaultMessage - Mensaje predeterminado si no hay error específico
 */
exports.handleHttpError = (error, res, req, defaultMessage = 'Error del servidor') => {
  console.error('Error HTTP:', error);
  
  // Determinar el código de estado según el tipo de error
  let statusCode = 500;
  let errorMessage = defaultMessage;
  
  if (error.code === 'auth/invalid-credentials') {
    statusCode = 401;
    errorMessage = 'Credenciales no válidas';
  } else if (error.code === 'auth/insufficient-permissions') {
    statusCode = 403;
    errorMessage = 'No tienes permisos para esta acción';
  } else if (error.code?.includes('not_found')) {
    statusCode = 404;
    errorMessage = 'El recurso solicitado no existe';
  } else if (error.code?.includes('validation')) {
    statusCode = 400;
    errorMessage = error.message || 'Datos no válidos';
  }
  
  // Para respuestas API
  if (res.headersSent) {
    return console.error('No se puede enviar respuesta, headers ya enviados');
  }
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(statusCode).json({ 
      success: false, 
      error: errorMessage 
    });
  }
  
  // Para respuestas de vista
  req.flash('error_msg', errorMessage);
  return res.status(statusCode).redirect('back');
};

/**
 * Formatea un error para registro en log
 * @param {Error} error - Error a formatear
 * @param {string} context - Contexto donde ocurrió el error
 * @returns {string} Error formateado para log
 */
exports.formatErrorForLog = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const contextInfo = context ? `[${context}] ` : '';
  const errorCode = error.code ? `(${error.code}) ` : '';
  const errorMessage = error.message || 'Error sin mensaje';
  const stack = error.stack ? `\nStack: ${error.stack}` : '';
  
  return `${timestamp} ${contextInfo}${errorCode}${errorMessage}${stack}`;
}; 