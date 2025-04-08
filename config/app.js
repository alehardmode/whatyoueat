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

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// Exportar la aplicación
module.exports = {
  app,
  PORT: process.env.PORT || 3000,
};
