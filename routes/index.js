const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/authMiddleware');

// Ruta principal
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Bienvenido',
    user: req.session.user
  });
});

// Ruta de contacto
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contacto',
    user: req.session.user
  });
});

// Ruta de perfil (solo usuarios autenticados)
router.get('/profile', isAuth, (req, res) => {
  res.render('profile', {
    title: 'Mi Perfil',
    user: req.session.user
  });
});

module.exports = router; 