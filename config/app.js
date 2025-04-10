const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");
const flash = require("connect-flash");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

// Cargar variables de entorno según NODE_ENV
const envPath = path.resolve(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`);
dotenv.config({ path: envPath });

// Si el archivo específico del entorno no existe, cargar el .env por defecto
if (process.env.NODE_ENV && require('fs').existsSync(path.resolve(__dirname, '../.env'))) {
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false }); // No sobrescribir variables ya cargadas
} else if (!process.env.NODE_ENV) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Cargar .env por defecto si NODE_ENV no está definido
}

// Crear aplicación Express
const app = express();

// Exportar la aplicación
module.exports = {
  app,
  PORT: process.env.PORT || 3000,
};
