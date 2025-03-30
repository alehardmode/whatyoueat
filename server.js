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

// Importar middleware de autenticación
const { isAuthenticated, isNotAuthenticated } = require('./middleware/authMiddleware');

// Importar modelo de autenticación
const UserAuth = require('./models/UserAuth');

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

// Middleware para interceptar posibles redirecciones de Supabase
// Nota: los fragmentos de URL (después de #) no llegan al servidor
app.use((req, res, next) => {
  // Log para depuración
  console.log('URL solicitada:', req.originalUrl);
  
  // Verificar si es una redirección a /auth/login con referrer de Supabase
  if (req.path === '/auth/login' && req.headers.referer && 
      req.headers.referer.includes('supabase.co/auth/v1/verify')) {
    console.log('Detectada redirección desde Supabase a login');
    return res.redirect('/auth/email-confirmed');
  }
  
  // Verificar los parámetros de consulta
  if (req.query.access_token || req.query.type === 'signup') {
    console.log('Token o parámetro de confirmación detectado en la URL');
    return res.redirect('/auth/email-confirmed');
  }
  
  // Verificar la ruta callback
  if (req.path === '/auth/callback' && !req.query.token_hash) {
    console.log('Detectada ruta callback sin token, posible redirección incorrecta');
    return res.redirect('/auth/email-confirmed');
  }
  
  // Continuar con el siguiente middleware
  next();
});

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
app.post('/auth/resend-confirmation', isAuthenticated, async (req, res) => {
  try {
    // Obtener el email de la sesión del usuario
    const email = req.session.user?.email;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo determinar el email'
      });
    }
    
    // Reenviar correo de confirmación
    const result = await UserAuth.resendConfirmationEmail(email);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'No se pudo reenviar el correo de confirmación',
        errorCode: result.errorCode
      });
    }
    
    // Devolver respuesta exitosa
    return res.json({
      success: true,
      message: 'Correo de confirmación reenviado. Por favor, revisa tu bandeja de entrada.'
    });
  } catch (error) {
    console.error('Error al reenviar correo de confirmación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      errorCode: 'server_error'
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
