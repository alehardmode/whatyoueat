/**
 * Utilidades para el formateo de fechas
 */

/**
 * Analiza una cadena de fecha en varios formatos comunes
 * @param {string} dateStr - Cadena de fecha a analizar
 * @returns {Date} - Objeto Date o null si no se pudo analizar
 */
function parseAnyDateFormat(dateStr) {
  if (!dateStr) return null;

  // Intentar parsear directamente (ISO y formatos reconocidos por JS)
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  // Intentar con formato DD/MM/YYYY
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      date = new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0])
      );
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Intentar con formato DD-MM-YYYY
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      // Comprobar si es ISO (YYYY-MM-DD)
      if (parts[0].length === 4) {
        date = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        );
      } else {
        // Asumir formato DD-MM-YYYY
        date = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0])
        );
      }
      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
}

/**
 * Formatea una fecha para mostrar en la interfaz de usuario (DD/MM/YYYY)
 * @param {Date|string|number} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
exports.formatDateToDisplay = (date) => {
  if (!date) return "";

  let dateObj;
  if (typeof date === "string") {
    dateObj = parseAnyDateFormat(date);
  } else {
    dateObj = new Date(date);
  }

  if (!dateObj || isNaN(dateObj.getTime())) return "";

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Formatea una fecha para almacenar en la base de datos (YYYY-MM-DD)
 * @param {Date|string|number} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
exports.formatDateForDatabase = (date) => {
  if (!date) return "";

  let dateObj;
  if (typeof date === "string") {
    dateObj = parseAnyDateFormat(date);
  } else {
    dateObj = new Date(date);
  }

  if (!dateObj || isNaN(dateObj.getTime())) return "";

  return dateObj.toISOString().split("T")[0];
};

/**
 * Formatea la hora para mostrar en la interfaz (HH:MM)
 * @param {Date|string|number} date - Fecha y hora a formatear
 * @returns {string} - Hora formateada
 */
exports.formatTimeToDisplay = (date) => {
  if (!date) return "";

  let dateObj;
  if (typeof date === "string") {
    dateObj = parseAnyDateFormat(date);
  } else {
    dateObj = new Date(date);
  }

  if (!dateObj || isNaN(dateObj.getTime())) return "";

  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {Date|string|number} startDate - Fecha inicial
 * @param {Date|string|number} endDate - Fecha final
 * @returns {number} - Número de días entre las fechas
 */
exports.daysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  let start;
  let end;

  if (typeof startDate === "string") {
    start = parseAnyDateFormat(startDate);
  } else {
    start = new Date(startDate);
  }

  if (typeof endDate === "string") {
    end = parseAnyDateFormat(endDate);
  } else {
    end = new Date(endDate);
  }

  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()))
    return 0;

  // Normalizar las fechas eliminando la hora
  const normalizedStart = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const normalizedEnd = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  // Calcular la diferencia en milisegundos y convertir a días
  const diffTime = Math.abs(normalizedEnd - normalizedStart);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};
