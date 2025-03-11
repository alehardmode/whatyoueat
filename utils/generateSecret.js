/**
 * Utilidad para generar un valor seguro para SESSION_SECRET
 * Para ejecutar: node utils/generateSecret.js
 */

const crypto = require('crypto');

// Generar un string aleatorio de 64 bytes en formato hexadecimal
const generateSessionSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Ejecutar y mostrar el resultado
const sessionSecret = generateSessionSecret();
console.log('==========================================================');
console.log('SESSION_SECRET generado:');
console.log(sessionSecret);
console.log('==========================================================');
console.log('Copia este valor y reemplaza "tu_secreto_para_sesiones" en el archivo .env');
console.log('Ejemplo:');
console.log('SESSION_SECRET=' + sessionSecret);
console.log('==========================================================');
console.log('¡IMPORTANTE! Nunca compartas este valor y asegúrate de que el archivo .env');
console.log('esté incluido en .gitignore para no subirlo al control de versiones.');
console.log('==========================================================');

module.exports = { generateSessionSecret }; 