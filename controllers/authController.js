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
  res.render('auth/login', { 
    title: 'Iniciar Sesión',
    user: req.session.user
  });
};

// Procesar inicio de sesión
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar entradas
    if (!email || !password) {
      req.flash('error_msg', 'Por favor rellena todos los campos');
      return res.redirect('/auth/login');
    }
    
    // Intentar iniciar sesión
    const result = await UserAuth.login(email, password);
    
    if (!result.success) {
      // Usar mensajes específicos cuando sea seguro
      if (result.errorCode === 'email_not_confirmed') {
        // Permitimos iniciar sesión sin confirmar email
        // Simplemente continuamos el flujo normal
        console.log('Usuario sin confirmar email intenta iniciar sesión, permitimos acceso');
      } else if (result.errorCode === 'user_not_found' || result.errorCode === 'invalid_credentials') {
        // Para errores de credenciales o usuario inexistente, usamos un mensaje genérico
        // por seguridad (no revelar si el email existe o no)
        req.flash('error_msg', 'Credenciales incorrectas');
        return res.redirect('/auth/login');
      } else {
        // Para cualquier otro error
        req.flash('error_msg', result.error || 'Error al iniciar sesión');
        return res.redirect('/auth/login');
      }
    }
    
    // Comprobar si el email está confirmado o no
    const emailNotConfirmed = result.emailNotConfirmed === true;
    
    // Iniciar sesión exitosa - establecer datos de sesión
    req.session.isLoggedIn = true;
    req.session.user = result.user;
    req.session.userId = result.user.id;
    req.session.userRole = result.user.role;
    
    // Verificar si el email está confirmado (simplificado)
    req.session.emailConfirmed = !emailNotConfirmed && (result.user.email_confirmed_at !== null);
    
    // Guardar la sesión antes de redireccionar
    req.session.save(err => {
      if (err) {
        console.error('Error al guardar sesión:', err);
        req.flash('error_msg', 'Error al iniciar sesión');
        return res.redirect('/auth/login');
      }
      
      // Redireccionar al dashboard según el rol del usuario
      const userRole = req.session.userRole;
      if (userRole === 'paciente') {
        res.redirect('/patient/dashboard');
      } else if (userRole === 'medico') {
        res.redirect('/doctor/dashboard');
      } else {
        // Si el rol no está definido o es desconocido, redirigir a la página principal
        res.redirect('/');
      }
    });
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
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
    // Depuración - Mostrar todos los campos recibidos
    console.log('Datos recibidos en el registro:');
    console.log('req.body:', req.body);
    console.log('Campos presentes:', Object.keys(req.body));
    
    // Destructuring para obtener datos del cuerpo de la petición
    const { name, email, password, password2, role } = req.body;
    
    // Mostrar valores individuales
    console.log('name:', name);
    console.log('email:', email);
    console.log('password:', password ? 'PRESENT' : 'MISSING');
    console.log('password2:', password2 ? 'PRESENT' : 'MISSING');
    console.log('role:', role);
    
    // Validar entradas
    if (!name || !email || !password || !password2 || !role) {
      console.log('Campos faltantes:');
      if (!name) console.log('- Falta name');
      if (!email) console.log('- Falta email');
      if (!password) console.log('- Falta password');
      if (!password2) console.log('- Falta password2');
      if (!role) console.log('- Falta role');
      
      req.flash('error_msg', 'Por favor rellena todos los campos');
      return res.redirect('/auth/register');
    }
    
    if (password !== password2) {
      req.flash('error_msg', 'Las contraseñas no coinciden');
      return res.redirect('/auth/register');
    }
    
    // Validar role
    if (role !== 'paciente' && role !== 'medico') {
      req.flash('error_msg', 'Rol no válido');
      return res.redirect('/auth/register');
    }
    
    // Registrar usuario a través del servicio de autenticación
    const result = await UserAuth.register(name, email, password, role);
    
    if (!result.success) {
      req.flash('error_msg', result.error || 'Error al registrar el usuario');
      return res.redirect('/auth/register');
    }
    
    // Registro exitoso, redirigir al login
    req.flash('success_msg', '¡Registro completado con éxito! Te hemos enviado un correo de confirmación. Por favor, verifica tu bandeja de entrada.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    req.flash('error_msg', error.message || 'Error al registrar el usuario');
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

// Reenviar email de confirmación
exports.resendConfirmation = async (req, res) => {
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
    const result = await UserAuth.resendConfirmationEmail(email);
    
    if (!result.success) {
      // Extraer código de error si existe
      let errorCode = null;
      if (result.error && typeof result.error === 'object' && result.error.code) {
        errorCode = result.error.code;
      } else if (result.errorCode) {
        errorCode = result.errorCode;
      }

      return res.status(400).json({ 
        success: false, 
        message: result.error || 'No se pudo reenviar el correo de confirmación',
        code: errorCode
      });
    }
    
    return res.json({ 
      success: true, 
      message: 'Correo de confirmación reenviado. Por favor, revisa tu bandeja de entrada.' 
    });
  } catch (error) {
    console.error('Error al reenviar correo de confirmación:', error);
    
    // Capturar código de error específico para limitación de tasa
    let errorCode = null;
    if (error.__isAuthError && error.code) {
      errorCode = error.code;
    }
    
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al reenviar correo de confirmación',
      code: errorCode
    });
  }
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

// Manejar el callback de autenticación (confirmación de correo)
exports.handleAuthCallback = async (req, res) => {
  console.log('====== INICIO handleAuthCallback ======');
  console.log('URL completa:', req.originalUrl);
  console.log('Query params:', req.query);
  
  try {
    // Obtener token y tipo de confirmación de la URL
    const { token_hash, type } = req.query;
    console.log('Token hash:', token_hash);
    console.log('Tipo de confirmación:', type);
    
    if (!token_hash) {
      console.log('ERROR: No se encontró token_hash en la URL');
      req.flash('error_msg', 'Enlace de verificación no válido');
      return res.redirect('/auth/login');
    }
    
    // Verificar si el usuario ya está autenticado
    const { supabase } = require('../config/supabase');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('ERROR al verificar sesión:', sessionError);
      req.flash('error_msg', 'Error al procesar la verificación del correo');
      return res.redirect('/auth/login');
    }
    
    console.log('¿Existe sesión?', sessionData && sessionData.session ? 'SÍ' : 'NO');
    
    // Si la sesión existe y el usuario está autenticado, actualizar la sesión
    if (sessionData && sessionData.session) {
      console.log('RUTA 1: Usuario con sesión activa');
      // Obtener usuario actualizado primero para verificar si se confirmó el correo
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData || !userData.user) {
        console.error('ERROR al obtener usuario:', userError);
        req.flash('error_msg', 'Error al obtener información del usuario');
        return res.redirect('/auth/login');
      }
      
      // Verificar si el correo está confirmado
      const emailConfirmed = userData.user.email_confirmed_at !== null;
      console.log('¿Email confirmado?', emailConfirmed ? 'SÍ' : 'NO');
      console.log('Fecha confirmación:', userData.user.email_confirmed_at);
      
      if (emailConfirmed) {
        console.log('RUTA 1.1: Email confirmado, actualizando sesión');
        // Guardar temporalmente los datos necesarios para la nueva sesión
        const name = userData.user.user_metadata?.name || userData.user.email;
        const role = userData.user.user_metadata?.role || 'paciente';
        const userId = userData.user.id;
        const userEmail = userData.user.email;
        const emailConfirmedAt = userData.user.email_confirmed_at;
        
        // Actualizar la sesión con los datos confirmados
        req.session.user = {
          id: userId,
          email: userEmail,
          name: name,
          role: role,
          email_confirmed_at: emailConfirmedAt
        };
        
        req.session.userId = userId;
        req.session.isLoggedIn = true;
        req.session.userRole = role;
        req.session.emailConfirmed = true;
        
        // Guardar la sesión y redirigir a la página de confirmación
        req.session.save((err) => {
          if (err) {
            console.error('ERROR al guardar sesión:', err);
          }
          console.log('REDIRIGIENDO a /auth/email-confirmed (RUTA 1.1)');
          return res.redirect('/auth/email-confirmed');
        });
      } else {
        console.log('RUTA 1.2: Email NO confirmado, algo salió mal');
        // El correo sigue sin confirmarse (algo salió mal)
        req.flash('error_msg', 'No se pudo verificar tu correo electrónico. Intenta nuevamente.');
        console.log('REDIRIGIENDO a /auth/login (RUTA 1.2)');
        return res.redirect('/auth/login');
      }
    } else {
      console.log('RUTA 2: Usuario sin sesión activa');
      // Si no hay sesión activa pero tenemos token_hash,
      // asumimos que es una confirmación válida y redirigimos a la página de confirmación
      console.log('REDIRIGIENDO a /auth/email-confirmed (RUTA 2)');
      return res.redirect('/auth/email-confirmed');
    }
  } catch (error) {
    console.error('ERROR GENERAL en el callback de autenticación:', error);
    req.flash('error_msg', 'Error al procesar la verificación de correo');
    console.log('REDIRIGIENDO a /auth/login (ERROR)');
    return res.redirect('/auth/login');
  } finally {
    console.log('====== FIN handleAuthCallback ======');
  }
};

// Mostrar la página de correo confirmado
exports.getEmailConfirmed = (req, res) => {
  res.render('auth/email-confirmed', { 
    title: 'Correo Confirmado',
    user: req.session.user
  });
}; 