/**
 * Utilidades para validación de correos electrónicos
 */

/**
 * Valida si un correo electrónico tiene un formato válido
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} - true si el correo es válido, false en caso contrario
 */
exports.isValidEmail = (email) => {
  if (!email) return false;

  // Expresión regular para validar correo electrónico conforme a RFC 5322
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return emailRegex.test(email);
};

/**
 * Valida si un correo pertenece a un dominio específico
 * @param {string} email - Correo electrónico
 * @param {string|Array<string>} domains - Dominio o lista de dominios permitidos
 * @returns {boolean} - true si el correo pertenece a uno de los dominios, false en caso contrario
 */
exports.isFromDomain = (email, domains) => {
  if (!email || !domains) return false;

  // Extraer el dominio del correo
  const emailDomain = email.split("@")[1]?.toLowerCase();
  if (!emailDomain) return false;

  // Si es un solo dominio
  if (typeof domains === "string") {
    return emailDomain === domains.toLowerCase();
  }

  // Si es un array de dominios
  if (Array.isArray(domains)) {
    return domains.some((domain) => emailDomain === domain.toLowerCase());
  }

  return false;
};

/**
 * Normaliza un correo electrónico (lo convierte a minúsculas y elimina espacios)
 * @param {string} email - Correo electrónico a normalizar
 * @returns {string} - Correo electrónico normalizado
 */
exports.normalizeEmail = (email) => {
  if (!email) return "";
  return email.trim().toLowerCase();
};
