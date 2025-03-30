const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/authMiddleware');

// Middleware para procesar hash de autenticación
const processAuthHash = (req, res, next) => {
  // Este middleware solo aplica a la ruta /login
  if (req.path !== '/login') return next();
  
  // Verificar si hay un hash en la URL que fue incluido por Supabase
  // Esto lo detectamos en el cliente con JavaScript
  const fullUrl = req.originalUrl;
  if (fullUrl.includes('#access_token=') || req.query.access_token) {
    console.log('Detectada redirección de confirmación con token por hash, redirigiendo a /email-confirmed');
    return res.redirect('/auth/email-confirmed');
  }
  
  next();
};

// Rutas públicas (solo accesibles cuando no está autenticado)
// Ruta de inicio de sesión
router.get('/login', processAuthHash, isNotAuthenticated, authController.getLogin);
router.post('/login', isNotAuthenticated, authController.postLogin);

// Ruta de registro
router.get('/register', isNotAuthenticated, authController.getRegister);
router.post('/register', isNotAuthenticated, authController.postRegister);

// Ruta de recuperación de contraseña
router.get('/forgot-password', isNotAuthenticated, authController.getForgotPassword);
router.post('/forgot-password', isNotAuthenticated, authController.postForgotPassword);

// Ruta de restablecimiento de contraseña
router.get('/reset-password/:token', isNotAuthenticated, authController.getResetPassword);
router.post('/reset-password/:token', isNotAuthenticated, authController.postResetPassword);

// Ruta para reenviar correo de confirmación
router.post('/resend-confirmation', isAuthenticated, authController.resendConfirmation);

// Ruta de callback para la confirmación de correo electrónico
router.get('/callback', authController.handleAuthCallback);

// Ruta para mostrar la página de correo confirmado
router.get('/email-confirmed', authController.getEmailConfirmed);

// Ruta protegida (requiere autenticación)
// Ruta de cierre de sesión
router.get('/logout', isAuthenticated, authController.logout);

module.exports = router; 