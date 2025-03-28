// WhatYouEat - Script principal optimizado
// Aplicación para seguimiento nutricional vía fotografías
// Versión 2.1

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  console.log('main.js cargado correctamente');
  setupButtons();
  setupAlerts();
  setupPhotoUploadForm();
  setupDateSelector();
  // Configurar efectos de animación en elementos
  setupAnimations();
});

/**
 * Configura animaciones y efectos visuales
 */
function setupAnimations() {
  // Añadir clase fade-in a elementos principales para animación
  document.querySelectorAll('.card, section > .container > *:first-child').forEach(el => {
    if (!el.classList.contains('fade-in')) {
      el.classList.add('fade-in');
    }
  });
}

/**
 * Configuración de alertas y notificaciones
 */
function setupAlerts() {
  // Auto-cerrar alertas después de 5 segundos si no tienen .alert-permanent
  const autoCloseAlerts = document.querySelectorAll('.alert:not(.alert-permanent):not(.flash-messages .alert)');
  
  if (autoCloseAlerts.length > 0) {
    setTimeout(function() {
      autoCloseAlerts.forEach(alert => {
        if (alert && !alert.classList.contains('d-none')) {
          alert.style.opacity = '0';
          setTimeout(() => {
            alert.remove();
          }, 300);
        }
      });
    }, 5000);
  }
  
  // Configurar botones de cierre manuales (excepto flash messages)
  document.querySelectorAll('.close-alert:not(.flash-close)').forEach(button => {
    button.addEventListener('click', function() {
      const alert = this.closest('.alert');
      if (alert) {
        alert.style.opacity = '0';
        setTimeout(() => {
          alert.remove();
        }, 300);
      }
    });
  });
}

/**
 * Configuración del formulario de subida de fotos
 */
function setupPhotoUploadForm() {
  const photoUploadForm = document.querySelector('form[action="/patient/upload"]');
  
  if (photoUploadForm) {
    const photoInput = photoUploadForm.querySelector('input[type="file"]');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    
    // Vista previa de la imagen seleccionada
    if (photoInput && imagePreview && imagePreviewContainer) {
      photoInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          
          reader.onload = function(e) {
            // Actualizar la imagen con transición suave
            imagePreview.style.opacity = '0';
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove('d-none');
            
            setTimeout(() => {
              imagePreview.style.transition = 'opacity 0.5s ease';
              imagePreview.style.opacity = '1';
            }, 10);
          }
          
          reader.onerror = function() {
            console.error('Error al leer el archivo seleccionado');
            showErrorMessage('No se pudo cargar la vista previa de la imagen');
          }
          
          reader.readAsDataURL(this.files[0]);
        }
      });
    }
    
    // Validación mejorada del formulario antes de enviar
    photoUploadForm.addEventListener('submit', function(e) {
      let valid = true;
      const requiredFields = photoUploadForm.querySelectorAll('[required]');
      let firstErrorField = null;
      
      requiredFields.forEach(function(field) {
        // Eliminar clases de validación previas
        field.classList.remove('is-invalid', 'is-valid');
        
        // Validar campo
        if (!field.value.trim()) {
          valid = false;
          field.classList.add('is-invalid');
          
          // Guardar referencia al primer campo con error
          if (!firstErrorField) {
            firstErrorField = field;
          }
        } else {
          field.classList.add('is-valid');
        }
      });
      
      // Si hay campos inválidos, detener el envío y mostrar errores
      if (!valid) {
        e.preventDefault();
        
        if (firstErrorField) {
          // Desplazarse al primer campo con error
          firstErrorField.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => firstErrorField.focus(), 500);
        }
      } else {
        // Todo está correcto, mostrar indicador de carga
        const submitBtn = photoUploadForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner"></span> Subiendo...';
        }
      }
    });
  }
}

/**
 * Muestra un mensaje de error temporal
 */
function showErrorMessage(message) {
  // Crear elemento de alerta
  const alertElement = document.createElement('div');
  alertElement.className = 'alert alert-danger fade-in';
  alertElement.role = 'alert';
  alertElement.innerHTML = `
    <strong>Error:</strong> ${message}
    <button type="button" class="close-alert" aria-label="Cerrar">×</button>
  `;
  
  // Añadir al principio del contenedor principal
  const mainContainer = document.querySelector('main .container') || document.body;
  mainContainer.prepend(alertElement);
  
  // Auto-cerrar después de 5 segundos
  setTimeout(function() {
    if (alertElement.parentNode) {
      alertElement.style.opacity = '0';
      setTimeout(() => {
        alertElement.remove();
      }, 300);
    }
  }, 5000);
}

/**
 * Configuración del selector de fechas en el historial
 */
function setupDateSelector() {
  const dateInput = document.getElementById('date-selector');
  
  if (dateInput) {
    dateInput.addEventListener('change', function() {
      const form = this.closest('form');
      if (form) {
        // Añadir efecto de carga
        dateInput.classList.add('loading');
        form.submit();
      }
    });
  }
}

/**
 * Configuración de botones
 */
function setupButtons() {
  // Seleccionamos todos los botones de la aplicación
  const allButtons = document.querySelectorAll('button, .btn, [role="button"], input[type="submit"]');
  
  // Para cada botón, verificamos su funcionalidad
  allButtons.forEach((button) => {
    // Añadimos el listener para todos los botones
    button.addEventListener('click', function(e) {
      // Si el botón está dentro de un form y no tiene type="submit", prevenimos el envío
      if (button.closest('form') && button.type !== 'submit' && !button.classList.contains('submit-form')) {
        e.preventDefault();
      }
      
      // Efecto de hover mejorado
      this.classList.add('button-clicked');
      setTimeout(() => {
        this.classList.remove('button-clicked');
      }, 300);
    });
  });
}