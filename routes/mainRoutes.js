const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const Profile = require('../models/Profile');
const contactController = require('../controllers/contactController');
const { handleHttpError } = require('../utils/errorHandler');

// Página de inicio
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Inicio',
    user: req.session.user
  });
});

// Página de contacto
router.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contacto',
    user: req.session.user
  });
});

// Ruta POST para procesar el formulario de contacto
router.post('/contact', contactController.sendMessage);

// Ruta de perfil (solo usuarios autenticados)
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = await Profile.getById(userId);
    
    if (!result.success) {
      req.flash('error_msg', 'No se pudo cargar la información completa del perfil.');
      return res.render('profile', {
        title: 'Mi Perfil',
        user: req.session.user,
        profile: null
      });
    }
    
    res.render('profile', {
      title: 'Mi Perfil',
      user: req.session.user,
      profile: result.profile
    });
  } catch (error) {
    handleHttpError(error, res, req, 'Ocurrió un error al cargar tu perfil');
  }
});

// Páginas informativas
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'Acerca de',
    user: req.session.user
  });
});

router.get('/privacy', (req, res) => {
  res.render('privacy', { 
    title: 'Política de Privacidad',
    user: req.session.user
  });
});

router.get('/terms', (req, res) => {
  res.render('terms', { 
    title: 'Términos y Condiciones',
    user: req.session.user
  });
});

module.exports = router;