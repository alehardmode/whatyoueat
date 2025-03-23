const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const fs = require('fs');
const expressLayouts = require('express-ejs-layouts');

// Cargar variables de entorno
dotenv.config();

// Importar rutas
const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de seguridad - permitiendo archivos estáticos de forma segura
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"], //"https://cdn.jsdelivr.net" para aloja librerías populares como Bootstrap, jQuery, Font Awesome (iconos de nuestra WEB)
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        frameSrc: ["'self'", "https://www.google.com"] // Permite iframes de Google Maps
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Middlewares generales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Verificación de SESSION_SECRET
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'tu_secreto_para_sesiones') {
  console.warn('\x1b[33m%s\x1b[0m', 'ADVERTENCIA: La variable SESSION_SECRET no está configurada correctamente.');
  console.warn('\x1b[33m%s\x1b[0m', 'Ejecuta "node utils/generateSecret.js" y actualiza tu archivo .env');
}

// Configuración mejorada de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto-temporal',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Flash messages
app.use(flash());

// Configuración de vistas y layouts
app.use(expressLayouts);
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Configuración optimizada de archivos estáticos
const cacheTime = process.env.NODE_ENV === 'production' ? 86400000 : 0; // 1 día en producción

// Servir archivos CSS con cache
app.use('/css', express.static(path.join(__dirname, 'public/css'), {
  maxAge: cacheTime
}));

// Servir archivos JS con cache desactivada para desarrollo
app.use('/js', express.static(path.join(__dirname, 'public/js'), {
  maxAge: 0,
  setHeaders: function (res) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Servir imágenes con cache
app.use('/img', express.static(path.join(__dirname, 'public/img'), {
  maxAge: cacheTime
}));

// Variables globales
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.appName = 'WhatYouEat';
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// Rutas
app.use('/', mainRoutes);
app.use('/auth', authRoutes);
app.use('/patient', patientRoutes);
app.use('/doctor', doctorRoutes);

// Manejador de errores 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página no encontrada' });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error del servidor',
    message: process.env.NODE_ENV === 'production' ? 'Ocurrió un error inesperado' : err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'desarrollo'}`);
});