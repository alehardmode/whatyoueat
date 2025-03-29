const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const fileUpload = require('express-fileupload');

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Importar rutas
const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

// ===== MIDDLEWARES =====

// Configuración de seguridad mejorada con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        frameSrc: ["'self'", "https://www.google.com"],
        workerSrc: ["'self'", "blob:"],
        connectSrc: ["'self'", "https://cdn.jsdelivr.net"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Middlewares para parseo de datos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Middleware para CORS
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middleware para subida de archivos
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  useTempFiles: false,
  abortOnLimit: true,
  createParentPath: true,
  debug: false, // Deshabilitado independientemente del entorno
  safeFileNames: true,
  preserveExtension: true
}));

// Verificación de SESSION_SECRET
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'tu_secreto_para_sesiones') {
  console.warn('\x1b[33m%s\x1b[0m', 'ADVERTENCIA: La variable SESSION_SECRET no está configurada correctamente.');
  console.warn('\x1b[33m%s\x1b[0m', 'Ejecuta "node utils/generateSecret.js" y actualiza tu archivo .env');
}

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto-temporal',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Flash messages - debe ir después de session
app.use(flash());

// Variables globales y datos para las vistas
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.errors = req.flash('errors');
  res.locals.user = req.session.user || null;
  res.locals.appName = 'WhatYouEat';
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// ===== CONFIGURACIÓN DE VISTAS =====
app.use(expressLayouts);
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// ===== ARCHIVOS ESTÁTICOS =====
const cacheTime = process.env.NODE_ENV === 'production' ? 86400000 : 0; // 1 día en producción

// Servir archivos estáticos con configuración optimizada
app.use('/css', express.static(path.join(__dirname, 'public/css'), { 
  maxAge: cacheTime,
  setHeaders: function (res, path) {
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

app.use('/js', express.static(path.join(__dirname, 'public/js'), { 
  maxAge: cacheTime,
  setHeaders: function (res, path) {
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      // ETag para validación
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

app.use('/img', express.static(path.join(__dirname, 'public/img'), { 
  maxAge: process.env.NODE_ENV === 'production' ? 604800000 : cacheTime, // 7 días para imágenes en producción
  setHeaders: function (res, path) {
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

// Configuración para servir iconos
app.use('/icons', express.static(path.join(__dirname, 'public/icons'), { 
  maxAge: process.env.NODE_ENV === 'production' ? 604800000 : cacheTime, // 7 días para iconos en producción
  setHeaders: function (res, path) {
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { 
  maxAge: process.env.NODE_ENV === 'production' ? 604800000 : cacheTime,
  setHeaders: function (res, path) {
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

// ===== RUTAS =====
app.use('/', mainRoutes);
app.use('/auth', authRoutes);
app.use('/patient', patientRoutes);
app.use('/doctor', doctorRoutes);

// ===== API ROUTES =====
// Ruta para reenviar correo de confirmación
app.post('/api/resend-confirmation', async (req, res) => {
  try {
    // Solo usuarios autenticados pueden solicitar un reenvío
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Debes iniciar sesión para realizar esta acción'
      });
    }
    
    // Obtener el email del usuario de la sesión
    const email = req.session.user.email;
    
    // Solicitar reenvío de email de confirmación a través de Supabase
    const UserAuth = require('./models/UserAuth');
    const result = await UserAuth.resendConfirmationEmail(email);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: result.error || 'No se pudo reenviar el correo de confirmación',
        code: result.errorCode // Incluir el código de error para que el cliente pueda identificarlo
      });
    }
    
    return res.json({ 
      success: true, 
      message: 'Correo de confirmación reenviado. Por favor, revisa tu bandeja de entrada.'
    });
  } catch (error) {
    console.error('Error al reenviar correo de confirmación:', error);
    
    // Capturar código de error específico para limitación de tasa
    let errorMessage = 'Error al reenviar el correo de confirmación';
    let errorCode = null;
    
    if (error.__isAuthError && error.code) {
      errorCode = error.code;
      if (error.message) {
        errorMessage = error.message;
      }
    }
    
    return res.status(500).json({ 
      success: false, 
      message: errorMessage,
      code: errorCode
    });
  }
});

// ===== DIAGNÓSTICO SUPABASE =====
app.get('/api/check-supabase', async (req, res) => {
  try {
    const { supabase, testSupabaseConnection } = require('./config/supabase');
    
    const result = {
      success: false,
      database: { connected: false }
    };
    
    // Comprobar conexión general
    try {
      const connected = await testSupabaseConnection();
      result.success = connected;
    } catch (e) {
      result.connection_error = e.message;
    }
    
    // Verificar base de datos
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('food_entries')
        .select('id')
        .limit(1);
        
      result.database.connected = !tableError;
      
      if (tableError) {
        result.database.error = tableError.message;
        result.database.code = tableError.code;
      } else {
        result.database.has_data = tableData && tableData.length > 0;
      }
    } catch (e) {
      result.database.error = e.message;
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para registrar errores del lado del cliente
app.post('/api/log-error', (req, res) => {
  try {
    const { type, imageId, details } = req.body;
    console.error(`[ERROR CLIENTE] Tipo: ${type}, ID: ${imageId}`);
    
    if (details) {
      console.error('Detalles:', details);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error al procesar error del cliente:', error);
    res.status(500).json({ success: false });
  }
});

// ===== MANEJO DE ERRORES =====
// Ruta 404 para páginas no encontradas
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Página no encontrada',
    layout: 'layouts/error'
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/500', {
    title: 'Error del Servidor',
    error: process.env.NODE_ENV === 'production' ? {} : err,
    layout: 'layouts/error'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
