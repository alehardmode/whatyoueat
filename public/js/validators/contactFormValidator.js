/**
 * Validador para el formulario de contacto
 * 
 * Este script maneja la validación del formulario de contacto,
 * mostrando mensajes de error solo cuando corresponde y validando
 * campos como el email, asunto, mensaje y tipo de consulta.
 */

// Inicializar validación del formulario cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
  // Obtener referencia al formulario
  const form = document.getElementById('contactForm');
  
  // Si no existe el formulario en la página actual, salir
  if (!form) return;
  
  // Referencias a elementos del formulario
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const subjectInput = document.getElementById('subject');
  const messageInput = document.getElementById('message');
  const typeSelect = document.getElementById('type');
  const privacyCheckbox = document.getElementById('privacy');
  
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
  
  // Asignar eventos de validación a los campos
  form.querySelectorAll('input, select, textarea').forEach(field => {
    // Validar al perder el foco
    field.addEventListener('blur', function() {
      validateField(this);
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
    // Prevenir el envío por defecto para validar primero
    event.preventDefault();
    
    let isValid = true;
    
    // Validar todos los campos
    this.querySelectorAll('input, select, textarea').forEach(field => {
      validateField(field);
      
      // Si el campo no es válido, marcar el formulario como inválido
      if (!field.checkValidity()) {
        console.log(`Campo inválido: ${field.name} - Valor: "${field.value}"`);
        isValid = false;
      } else {
        console.log(`Campo válido: ${field.name} - Valor: "${field.value}"`);
      }
    });
    
    // Validar checkbox de privacidad
    const privacyCheckbox = document.getElementById('privacy');
    if (privacyCheckbox && !privacyCheckbox.checked) {
      isValid = false;
      console.log('Política de privacidad no aceptada');
      
      // Mostrar mensaje de error para el checkbox
      const feedback = privacyCheckbox.parentElement.querySelector('.invalid-feedback');
      if (feedback) {
        feedback.classList.remove('d-none');
      }
      privacyCheckbox.classList.add('is-invalid');
    }
    
    console.log('Formulario válido:', isValid);
    
    // Si es válido, enviar el formulario
    if (isValid) {
      console.log('Enviando formulario...');
      this.submit();
    }
  });
});