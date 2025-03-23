// controllers/authController.js
const UserAuth = require('../models/UserAuth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configurar transporte de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Mostrar página de inicio de sesión
exports.getLogin = (req, res) => {
  const registered = req.query.registered === 'true';
  
  res.render('auth/login', { 
    title: 'Iniciar Sesión',
    user: req.session.user,
    registered: registered
  });
};

// Procesar inicio de sesión
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validación básica
    if (!email || !password) {
      req.flash('error_msg', 'Por favor ingresa todos los campos');
      return res.redirect('/auth/login');
    }
    
    // Intentar iniciar sesión usando el servicio de autenticación de Supabase
    // const result = await User.login(email, password);
    const result = await UserAuth.login(email, password);
    
    if (!result.success) {
      req.flash('error_msg', result.error);
      return res.redirect('/auth/login');
    }
    
    // Guardar usuario en sesión con información mejorada de seguridad
    req.session.user = result.user;
    req.session.userId = result.user.id;
    req.session.isLoggedIn = true;
    req.session.userRole = result.user.role;
    
    // Registrar la hora de inicio de sesión
    req.session.loginTime = new Date().toISOString();
    
    // Regenerar el ID de sesión por seguridad para prevenir session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Error al regenerar la sesión:', err);
        req.flash('error_msg', 'Error de seguridad al iniciar sesión');
        return res.redirect('/auth/login');
      }
      
      // Restaurar los datos de usuario después de regenerar la sesión
      req.session.user = result.user;
      req.session.userId = result.user.id;
      req.session.isLoggedIn = true;
      req.session.userRole = result.user.role;
      req.session.loginTime = new Date().toISOString();
      
      // Redirigir según rol
      if (result.user.role === 'paciente') {
        return res.redirect('/patient/dashboard');
      } else if (result.user.role === 'medico') {
        return res.redirect('/doctor/dashboard');
      } else {
        return res.redirect('/');
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    req.flash('error_msg', 'Error al iniciar sesión');
    res.redirect('/auth/login');
  }
};

// Mostrar página de registro
exports.getRegister = (req, res) => {
  res.render('auth/register', { 
    title: 'Registrarse',
    user: req.session.user
  });
};

// Procesar registro
exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, password2, role } = req.body;
    const errors = [];
    
    // Validación
    if (!name || !email || !password || !password2 || !role) {
      errors.push({ msg: 'Por favor rellena todos los campos' });
    }
    
    if (password !== password2) {
      errors.push({ msg: 'Las contraseñas no coinciden' });
    }
    
    if (password.length < 6) {
      errors.push({ msg: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    if (errors.length > 0) {
      return res.render('auth/register', {
        title: 'Registrarse',
        errors,
        name,
        email,
        role
      });
    }
    
    // Intentar registrar usando el servicio de autenticación de Supabase
    // Comentamos la versión anterior y usamos el nuevo modelo
    // const result = await User.register(name, email, password, role);
    const result = await UserAuth.register(name, email, password, role);
    
    if (!result.success) {
      req.flash('error_msg', result.error);
      return res.redirect('/auth/register');
    }
    
    // Almacenar el mensaje flash antes de redirigir
    req.flash('success_msg', '¡Registro completado con éxito! Por favor, inicia sesión con tus nuevas credenciales.');
    
    // Redirigir a la página de login con un parámetro para indicar registro exitoso
    return res.redirect('/auth/login?registered=true');
  } catch (error) {
    console.error('Error en registro:', error);
    req.flash('error_msg', 'Error al registrarse');
    res.redirect('/auth/register');
  }
};

// Cerrar sesión
exports.logout = (req, res) => {
  // Limpiar datos sensibles antes de destruir la sesión
  if (req.session.user) {
    req.session.user = null;
  }
  req.session.userId = null;
  req.session.isLoggedIn = false;
  req.session.userRole = null;
  
  // Destruir la sesión por completo
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.status(500).send('Error al cerrar sesión');
    }
    
    // Eliminar la cookie de sesión
    res.clearCookie('connect.sid');
    
    // Redireccionar a la página de inicio de sesión
    res.redirect('/auth/login');
  });
};

// Mostrar página de recuperación de contraseña
exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { 
    title: 'Recuperar Contraseña',
    user: req.session.user
  });
};

// Procesar solicitud de recuperación de contraseña
exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      req.flash('error_msg', 'Por favor ingresa tu correo electrónico');
      return res.redirect('/auth/forgot-password');
    }
    
    // Generar token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Actualizar token en la base de datos usando UserAuth en lugar de User
    const result = await UserAuth.resetPassword(email);
    
    if (!result.success) {
      req.flash('error_msg', 'No se encontró ninguna cuenta con ese correo electrónico');
      return res.redirect('/auth/forgot-password');
    }
    
    // Enviar correo
    const resetUrl = `http://${req.headers.host}/auth/reset-password/${token}`;
    
    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Recuperación de Contraseña - WhatYouEat',
      html: `
        <h1>Recuperación de Contraseña</h1>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para continuar:</p>
        <a href="${resetUrl}">Restablecer contraseña</a>
        <p>Si no solicitaste esto, puedes ignorar este correo.</p>
        <p>El enlace expirará en 1 hora.</p>
      `
    };
    
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error al enviar correo:', error);
        req.flash('error_msg', 'Error al enviar correo de recuperación');
        return res.redirect('/auth/forgot-password');
      }
      
      req.flash('success_msg', 'Se ha enviado un correo con instrucciones para recuperar tu contraseña');
      res.redirect('/auth/login');
    });
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    res.redirect('/auth/forgot-password');
  }
};

// Mostrar página de restablecimiento de contraseña
exports.getResetPassword = (req, res) => {
  res.render('auth/reset-password', { 
    title: 'Restablecer Contraseña',
    token: req.params.token,
    user: req.session.user
  });
};

// Procesar restablecimiento de contraseña
exports.postResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, password2 } = req.body;
    
    // Validación
    if (!password || !password2) {
      req.flash('error_msg', 'Por favor rellena todos los campos');
      return res.redirect(`/auth/reset-password/${token}`);
    }
    
    if (password !== password2) {
      req.flash('error_msg', 'Las contraseñas no coinciden');
      return res.redirect(`/auth/reset-password/${token}`);
    }
    
    if (password.length < 6) {
      req.flash('error_msg', 'La contraseña debe tener al menos 6 caracteres');
      return res.redirect(`/auth/reset-password/${token}`);
    }
    
    // Restablecer contraseña usando UserAuth en lugar de User
    const result = await UserAuth.updatePassword(token, password);
    
    if (!result.success) {
      req.flash('error_msg', result.error);
      return res.redirect(`/auth/reset-password/${token}`);
    }
    
    req.flash('success_msg', 'Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    req.flash('error_msg', 'Error al restablecer contraseña');
    res.redirect('/auth/login');
  }
}; 