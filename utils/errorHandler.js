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
    23502: "Faltan campos obligatorios",
    23503: "El registro referenciado no existe en la base de datos",
    23505: "Ya existe un registro idéntico",
    42501: "No tienes permisos para esta operación",
    "42P01": "La tabla no existe. Contacta al administrador.",
    PGRST301: "El recurso solicitado no existe",
  };

  // Si tenemos un mensaje específico para este código, usarlo
  if (errorMap[code]) return errorMap[code];

  // Para mensajes de error específicos
  if (message?.includes("foreign key"))
    return "Error de referencia a otro registro";
  if (message?.includes("not-null")) return "Faltan campos obligatorios";
  if (message?.includes("auth")) return "Error de autenticación";
  if (message?.includes("duplicate")) return "Registro duplicado";
  if (message?.includes("permission")) return "No tienes permisos suficientes";

  // Mensaje genérico
  return "Error en la operación con la base de datos";
};

/**
 * Mapea errores de autenticación a mensajes amigables y seguros
 * @param {string} code - Código de error de autenticación
 * @param {string} message - Mensaje de error original
 * @returns {string} Mensaje de error amigable
 */
exports.getAuthErrorMessage = (code, message) => {
  // Mensajes comunes agrupados por tipo
  const errorMessages = {
    // Email ya registrado
    emailTaken: "Ya existe una cuenta con este correo electrónico",
    // Usuario no encontrado
    userNotFound: "No existe ninguna cuenta con ese correo electrónico",
    // Problemas de credenciales
    invalidCredentials: "Credenciales incorrectas",
    // Problemas de contraseña
    passwordError: "La contraseña es incorrecta",
    weakPassword: "La contraseña es demasiado débil",
    // Problemas de token/enlace
    tokenError: "El enlace no es válido o ha expirado",
    // Confirmación de email
    emailNotConfirmed: "El correo electrónico no ha sido confirmado",
    // Límite de tasa
    rateLimit:
      "Demasiados intentos. Por favor, espera un momento antes de volver a intentarlo.",
    // Email no enviado
    emailSendFailed:
      "No se pudo enviar el correo electrónico. Intenta más tarde.",
    // Formato inválido
    invalidFormat: "El formato del correo electrónico no es válido",
    // Registro no permitido
    signupNotAllowed: "El registro está deshabilitado actualmente",
  };

  // Mapeo de códigos de error a categorías
  const errorMap = {
    // Email ya registrado
    email_taken: errorMessages.emailTaken,
    user_already_registered: errorMessages.emailTaken,
    "user-already-exists": errorMessages.emailTaken,
    "duplicate-user": errorMessages.emailTaken,
    too_many_identities: errorMessages.emailTaken,
    identities_empty: errorMessages.emailTaken,

    // Usuario no encontrado
    user_not_found: errorMessages.userNotFound,
    identity_not_found: errorMessages.userNotFound,

    // Credenciales inválidas
    invalid_credentials: errorMessages.invalidCredentials,

    // Problemas de contraseña
    invalid_password: errorMessages.passwordError,
    weak_password: errorMessages.weakPassword,

    // Problemas de token
    expired_token: errorMessages.tokenError,
    invalid_token: errorMessages.tokenError,

    // Email no confirmado
    email_not_confirmed: errorMessages.emailNotConfirmed,

    // Email no enviado
    email_send_failed: errorMessages.emailSendFailed,

    // Límite de tasa
    rate_limit_error: errorMessages.rateLimit,
    auth_api_rate_limit_error: errorMessages.rateLimit,

    // Recuperación de contraseña
    password_recovery_too_soon:
      "Ya has solicitado un restablecimiento de contraseña recientemente",

    // Formato inválido
    invalid_email: errorMessages.invalidFormat,

    // Registro no permitido
    signup_not_allowed: errorMessages.signupNotAllowed,
  };

  // Si tenemos un mensaje específico para este código, usarlo
  if (errorMap[code]) return errorMap[code];

  // Para mensajes de error basados en el contenido del mensaje
  if (message) {
    // Problemas de contraseña
    if (message.includes("password")) return errorMessages.passwordError;

    // Credenciales inválidas
    if (
      message.includes("invalid login") ||
      message.includes("invalid credentials")
    )
      return errorMessages.invalidCredentials;

    // Usuario no encontrado
    if (message.includes("user not found") || message.includes("no user found"))
      return errorMessages.userNotFound;

    // Email duplicado o ya registrado
    if (
      message.includes("already registered") ||
      message.includes("already exists") ||
      message.includes("duplicate") ||
      (message.includes("identities") && message.includes("empty"))
    )
      return errorMessages.emailTaken;

    // Problemas con el email
    if (message.includes("email")) return "Error en el email";

    // Problemas de token
    if (message.includes("token")) return errorMessages.tokenError;

    // Límite de tasa
    if (message.includes("rate limit") || message.includes("too many requests"))
      return errorMessages.rateLimit;

    // Registro no permitido
    if (message.includes("signup not allowed"))
      return errorMessages.signupNotAllowed;
  }

  // Mensaje genérico (por seguridad, no exponemos detalles específicos)
  return "Error de autenticación";
};

/**
 * Maneja un error HTTP y establece el código de estado adecuado
 * @param {Error} error - Error capturado
 * @param {Object} res - Objeto de respuesta Express
 * @param {Object} req - Objeto de solicitud Express
 * @param {string} defaultMessage - Mensaje predeterminado si no hay error específico
 */
exports.handleHttpError = (
  error,
  res,
  req,
  defaultMessage = "Error del servidor"
) => {
  console.error("Error HTTP:", error);

  // Verificar que los parámetros sean válidos
  if (!res || typeof res.status !== "function") {
    console.error(
      "Error: handleHttpError recibió un objeto de respuesta inválido"
    );
    return;
  }

  if (!req) {
    console.error(
      "Error: handleHttpError recibió un objeto de solicitud inválido"
    );
    return res.status(500).send("Error interno del servidor");
  }

  // Determinar el código de estado según el tipo de error
  let statusCode = 500;
  let errorMessage = defaultMessage;

  if (error.code === "auth/invalid-credentials") {
    statusCode = 401;
    errorMessage = "Credenciales no válidas";
  } else if (error.code === "auth/insufficient-permissions") {
    statusCode = 403;
    errorMessage = "No tienes permisos para esta acción";
  } else if (error.code?.includes("not_found")) {
    statusCode = 404;
    errorMessage = "El recurso solicitado no existe";
  } else if (error.code?.includes("validation")) {
    statusCode = 400;
    errorMessage = error.message || "Datos no válidos";
  } else if (error.code?.includes("rate_limit")) {
    statusCode = 429;
    errorMessage = "Demasiadas solicitudes. Intenta más tarde.";
  }

  // Si los headers ya fueron enviados, no podemos enviar otra respuesta
  if (res.headersSent) {
    return console.error("No se puede enviar respuesta, headers ya enviados");
  }

  // Para solicitudes AJAX o API
  if (
    req.xhr ||
    (req.headers && req.headers.accept?.includes("application/json"))
  ) {
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }

  // Para respuestas de vista
  try {
    // Intentar usar flash si está disponible
    if (req.flash && typeof req.flash === "function") {
      req.flash("error_msg", errorMessage);
    }

    // Usar una redirección segura
    if (req.headers && req.headers.referer) {
      // Si tenemos un referrer, redirigir a él
      return res.redirect(req.headers.referer);
    } else if (req.session && req.session.lastUrl) {
      // Si tenemos una URL guardada en sesión, usarla
      return res.redirect(req.session.lastUrl);
    } else {
      // En último caso, redireccionar a la página principal
      return res.redirect("/");
    }
  } catch (redirectError) {
    // Si todo falla, enviar una respuesta de error simple
    console.error("Error adicional durante manejo de error:", redirectError);
    return res.status(statusCode).send(`Error: ${errorMessage}`);
  }
};

/**
 * Formatea un error para registro en log
 * @param {Error} error - Error a formatear
 * @param {string} context - Contexto donde ocurrió el error
 * @returns {string} Error formateado para log
 */
exports.formatErrorForLog = (error, context = "") => {
  const timestamp = new Date().toISOString();
  const contextInfo = context ? `[${context}] ` : "";
  const errorCode = error.code ? `(${error.code}) ` : "";
  const errorMessage = error.message || "Error sin mensaje";
  const stack = error.stack ? `\nStack: ${error.stack}` : "";

  return `${timestamp} ${contextInfo}${errorCode}${errorMessage}${stack}`;
};

/**
 * Presenta un mensaje de error de forma segura, sin exponer información sensible
 * @param {Error} error - Error original
 * @param {boolean} isAuthenticated - Si el usuario está autenticado
 * @param {string} defaultMessage - Mensaje por defecto
 * @returns {string} Mensaje seguro para mostrar al usuario
 */
exports.getSafeErrorMessage = (
  error,
  isAuthenticated = false,
  defaultMessage = "Ha ocurrido un error"
) => {
  // Si no hay error, devolver mensaje por defecto
  if (!error) return defaultMessage;

  // Si el usuario está autenticado, podemos dar algo más de detalle
  if (isAuthenticated) {
    if (error.code) {
      return this.getAuthErrorMessage(error.code, error.message);
    }

    // Dar un mensaje un poco más detallado pero sin información sensible
    return error.message || defaultMessage;
  }

  // Para usuarios no autenticados, usar mensajes más genéricos por seguridad
  if (error.code === "user_not_found" || error.code === "invalid_credentials") {
    return "Credenciales incorrectas";
  }

  // Mensaje genérico para otros errores
  return defaultMessage;
};
