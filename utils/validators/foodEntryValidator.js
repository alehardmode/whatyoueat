// utils/validators/foodEntryValidator.js
/**
 * Valida los datos de una entrada de comida
 * @param {Object} data - Datos del formulario
 * @param {Object} file - Archivo de imagen
 * @returns {string|null} - Mensaje de error o null si es válido
 */
exports.validateFoodEntry = (data, file) => {
    // Validar presencia de imagen
    if (!file) {
      return 'Debes seleccionar una foto';
    }
    
    // Validar tipo de archivo
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return 'El archivo debe ser una imagen (jpg, png, webp, etc.)';
    }
    
    // Validar tamaño de archivo (10MB máximo)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return `La foto excede el tamaño máximo permitido (${maxSize / 1024 / 1024}MB)`;
    }
    
    // Validar campos obligatorios
    const { foodName, description } = data;
    
    if (!foodName || foodName.trim() === '') {
      return 'Debes proporcionar un nombre para la comida';
    }
    
    if (!description || description.trim() === '') {
      return 'Debes proporcionar una descripción de la comida';
    }
    
    return null; // Sin errores
  };
  
  /**
   * Valida los datos de actualización de una entrada
   * @param {Object} data - Datos del formulario
   * @returns {string|null} - Mensaje de error o null si es válido
   */
  exports.validateFoodEntryUpdate = (data) => {
    const { name, description } = data;
    
    if (!name || name.trim() === '') {
      return 'El nombre de la comida es obligatorio';
    }
    
    if (!description || description.trim() === '') {
      return 'La descripción es obligatoria';
    }
    
    return null; // Sin errores
  };