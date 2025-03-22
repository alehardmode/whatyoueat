const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Ruta específica para servir el archivo CSS
router.get('/css/styles.css', (req, res) => {
  const cssPath = path.join(__dirname, '../public/css/styles.css');
  
  fs.readFile(cssPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo CSS:', err);
      return res.status(500).send('Error al cargar el archivo CSS');
    }
    
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('Sirviendo archivo CSS desde ruta específica');
    res.send(data);
  });
});

// Ruta específica para servir el archivo CSS básico
router.get('/css/basic.css', (req, res) => {
  const cssPath = path.join(__dirname, '../public/css/basic.css');
  
  fs.readFile(cssPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo CSS básico:', err);
      return res.status(500).send('Error al cargar el archivo CSS básico');
    }
    
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('Sirviendo archivo CSS básico desde ruta específica');
    res.send(data);
  });
});

// Página de prueba para CSS
router.get('/test-css', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/test.html'));
});

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

// Procesar formulario de contacto (simulado)
/*router.post('/contact', (req, res) => {
  // En un entorno real, aquí procesaríamos el formulario
  // Enviando un correo, guardando en base de datos, etc.
  res.json({ success: true, message: 'Mensaje recibido correctamente' });
});*/
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  // En un entorno real, podrías guardar el mensaje o enviarlo por correo a 

  res.json({
    success: true,
    message: `Mensaje recibido: "${message}"`
  });
});


module.exports = router; 