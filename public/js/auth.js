//Funciones e interacciones de frontEnd o cliente, como gestiona vistas se ejecutan del lado cliente, estan en public y no forman parte del codigo de authController.js
// Función para mostrar/ocultar contraseña
function togglePassword(inputId, iconId) {
    console.log("Función togglePassword ejecutada para input:", inputId, "e icono:", iconId);
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
  
    if (!input || !icon) {
      console.error("No se encontró el input o el icono:", { input, icon });
      return;
    }
  
    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  }
  
  // Validación de formularios con Bootstrap
  function formValidation() {
    'use strict';
    window.addEventListener('load', function() {
      const forms = document.getElementsByClassName('needs-validation');
      Array.prototype.filter.call(forms, function(form) {
        form.addEventListener('submit', function(event) {
          if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
          }
          form.classList.add('was-validated');
        }, false);
      });
    }, false);
  }
  
  // Comprobación de confirmación de contraseña (solo para el formulario de registro)
  function passwordConfirmation() {
    const form = document.querySelector('form.needs-validation');
    if (form && document.getElementById('password2')) { // Solo aplica si existe el campo password2 (es decir, en register)
      form.addEventListener('submit', function(event) {
        const passwordInput = document.getElementById('password');
        const password2Input = document.getElementById('password2');
        if (form.checkValidity() === false || passwordInput.value !== password2Input.value) {
          event.preventDefault();
          event.stopPropagation();
          if (passwordInput.value !== password2Input.value) {
            alert("Las contraseñas no coinciden");
          }
          form.classList.add('was-validated');
        }
      }, false);
    }
  }
  
  // Inicializar eventos al cargar el DOM
  document.addEventListener('DOMContentLoaded', function() {
    // Inicializar togglePassword para los botones de mostrar contraseña
    const togglePassword1 = document.getElementById('togglePassword1');
    const togglePassword2 = document.getElementById('togglePassword2');
  
    if (togglePassword1) {
      togglePassword1.addEventListener('click', function() {
        togglePassword('password', 'toggleIcon1');
      });
    }
  
    if (togglePassword2) {
      togglePassword2.addEventListener('click', function() {
        togglePassword('password2', 'toggleIcon2');
      });
    }
  
    // Inicializar validación de formularios
    formValidation();
  
    // Inicializar comprobación de confirmación de contraseña (solo para register)
    passwordConfirmation();
  });