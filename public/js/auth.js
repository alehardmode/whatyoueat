/**
 * WhatYouEat - Funcionalidades de autenticación
 * Archivo para manejar la funcionalidad específica de los formularios de autenticación
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('auth.js cargado correctamente');
  setupPasswordToggles();
  setupFormDebug();
});

/**
 * Configura los botones de mostrar/ocultar contraseña
 */
function setupPasswordToggles() {
  // Toggle password para formulario de login y registro
  const togglePassword1 = document.getElementById('togglePassword1');
  const togglePassword2 = document.getElementById('togglePassword2');
  
  if (togglePassword1) {
    const passwordInput = document.getElementById('password');
    const toggleIcon1 = document.getElementById('toggleIcon1');
    
    togglePassword1.addEventListener('click', function() {
      // Cambiar tipo de input
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // Cambiar icono
      toggleIcon1.classList.toggle('fa-eye');
      toggleIcon1.classList.toggle('fa-eye-slash');
    });
  }
  
  if (togglePassword2) {
    const password2Input = document.getElementById('password2');
    const toggleIcon2 = document.getElementById('toggleIcon2');
    
    togglePassword2.addEventListener('click', function() {
      // Cambiar tipo de input
      const type = password2Input.getAttribute('type') === 'password' ? 'text' : 'password';
      password2Input.setAttribute('type', type);
      
      // Cambiar icono
      toggleIcon2.classList.toggle('fa-eye');
      toggleIcon2.classList.toggle('fa-eye-slash');
    });
  }
}

/**
 * Debug para formularios de autenticación
 */
function setupFormDebug() {
  // Debug para formulario de registro
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(event) {
      // Mostrar datos del formulario antes del envío
      const formData = new FormData(registerForm);
      const formValues = {};
      
      for (const [key, value] of formData.entries()) {
        formValues[key] = value;
        console.log(`Campo ${key}:`, value);
      }
      
      console.log('Formulario completo:', formValues);
      console.log('Todos los campos están presentes:', 
        Boolean(formValues.name && formValues.email && formValues.password && 
               formValues.password2 && formValues.role));
    });
  }
  
  // Debug para formulario de login
  const loginForm = document.querySelector('form[action="/auth/login"]');
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      const formData = new FormData(loginForm);
      const formValues = {};
      
      for (const [key, value] of formData.entries()) {
        formValues[key] = value;
        console.log(`Campo ${key}:`, value);
      }
      
      console.log('Datos de login:', 
        Boolean(formValues.email && formValues.password));
    });
  }
}