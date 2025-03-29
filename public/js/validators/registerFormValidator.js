/**
 * Validador para el formulario de registro
 * 
 * Este script maneja la validación del formulario de registro,
 * mostrando mensajes de error solo cuando corresponde y validando
 * campos como el email, contraseña y coincidencia de contraseñas.
 */

// Inicializar validación del formulario cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
  // Obtener referencia al formulario
  const form = document.getElementById('registerForm');
  
  // Si no existe el formulario en la página actual, salir
  if (!form) return;
  
  // Referencias a elementos del formulario
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const roleSelect = document.getElementById('role');
  const passwordInput = document.getElementById('password');
  const password2Input = document.getElementById('password2');
  const termsCheckbox = document.getElementById('terms');
  
  // Ocultar todos los mensajes de error inicialmente
  const feedbackElements = form.querySelectorAll('.invalid-feedback');
  feedbackElements.forEach(element => {
    element.classList.add('d-none');
  });
  
  /**
   * Función para validar un campo individual
   * @param {HTMLElement} field - Campo a validar
   */
  const validateField = function(field) {
    // Buscar el elemento de feedback que corresponde a este campo
    let feedback = field.nextElementSibling;
    
    // Si el siguiente elemento no es el feedback, buscar dentro del grupo
    if (!feedback || !feedback.classList.contains('invalid-feedback')) {
      const parent = field.closest('.input-group, .form-check');
      if (parent) {
        feedback = parent.querySelector('.invalid-feedback');
      }
    }
    
    // Si hay un elemento de feedback, actualizar su visibilidad
    if (feedback) {
      if (field.checkValidity()) {
        // Campo válido
        feedback.classList.add('d-none');
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
      } else {
        // Campo inválido
        feedback.classList.remove('d-none');
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
      }
    }
  };
  
  /**
   * Función para validar la coincidencia de contraseñas
   */
  const validatePasswordMatch = function() {
    if (passwordInput && password2Input) {
      const feedback = password2Input.parentElement.querySelector('.invalid-feedback');
      
      if (passwordInput.value && password2Input.value) {
        if (passwordInput.value !== password2Input.value) {
          // Contraseñas no coinciden
          password2Input.classList.add('is-invalid');
          password2Input.classList.remove('is-valid');
          
          if (feedback) {
            feedback.textContent = 'Las contraseñas no coinciden';
            feedback.classList.remove('d-none');
          }
          
          return false;
        } else {
          // Contraseñas coinciden
          password2Input.classList.remove('is-invalid');
          password2Input.classList.add('is-valid');
          
          if (feedback) {
            feedback.classList.add('d-none');
          }
          
          return true;
        }
      }
    }
    
    return true; // Si no hay campos de contraseña, considerar válido
  };
  
  // Asignar eventos de validación a los campos
  form.querySelectorAll('input, select').forEach(field => {
    // Validar al perder el foco
    field.addEventListener('blur', function() {
      validateField(this);
      
      // Si es campo de contraseña, validar coincidencia
      if (this.id === 'password' || this.id === 'password2') {
        validatePasswordMatch();
      }
    });
    
    // Validar al cambiar (para select y checkbox)
    if (field.tagName === 'SELECT' || field.type === 'checkbox') {
      field.addEventListener('change', function() {
        validateField(this);
      });
    }
  });
  
  // Validar todo el formulario al enviar
  form.addEventListener('submit', function(event) {
    let isValid = true;
    
    // Validar todos los campos
    this.querySelectorAll('input, select').forEach(field => {
      validateField(field);
      
      if (!field.checkValidity()) {
        isValid = false;
      }
    });
    
    // Validar coincidencia de contraseñas
    if (!validatePasswordMatch()) {
      isValid = false;
    }
    
    // Si no es válido, detener el envío
    if (!isValid) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}); 