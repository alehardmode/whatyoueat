// public/js/utils.js
// Funciones de utilidad generales para el frontend

/**
 * Implementación de debounce para evitar llamadas excesivas a funciones costosas.
 * Retrasa la ejecución de una función hasta que haya pasado un tiempo `wait` sin que se llame de nuevo.
 * @param {Function} func - La función a ejecutar con debounce.
 * @param {number} wait - Tiempo de espera en milisegundos.
 * @param {boolean} [immediate=false] - Si es true, ejecuta la función inmediatamente la primera vez.
 * @returns {Function} - La función con debounce aplicada.
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const context = this;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * Determina si un elemento HTML es un campo de contraseña (input[type="password"])
 * o si contiene algún campo de contraseña dentro de él.
 * @param {HTMLElement} element - El elemento a verificar.
 * @returns {boolean} - True si es o contiene un campo de contraseña, false en caso contrario.
 */
export function isPasswordField(element) {
  // Validar que el input sea un elemento HTML válido
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  // Verificar si el elemento es directamente un campo de contraseña
  if (element.tagName === "INPUT" && element.type === "password") {
    return true;
  }

  // Verificar si el elemento contiene un campo de contraseña descendiente
  // Usar `querySelector` es más eficiente que `querySelectorAll` si solo necesitamos saber si existe al menos uno.
  if (element.querySelector) {
    return element.querySelector('input[type="password"]') !== null;
  }

  return false;
}

// Otras posibles utilidades futuras:
// - throttle
// - deepClone
// - formatCurrency
// - etc.
