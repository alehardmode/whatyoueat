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
  
  // Inicializar tooltips de Bootstrap
  initTooltips();
  
  // Escuchar el botón de reenvío de confirmación de correo
  setupResendConfirmationButton();

  // Debug para formulario de registro
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(event) {
      // Obtener todos los valores del formulario
      const formData = new FormData(registerForm);
      const formValues = {};
      
      // Convertir FormData a objeto para logging
      for (const [key, value] of formData.entries()) {
        formValues[key] = value;
      }
      
      // Mostrar los valores en la consola
      console.log('Valores del formulario de registro:', formValues);
    });
  }
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
  console.log('Configurando alertas...');
  
  // Solo cerrar automáticamente alertas normales (no persistentes)
  const autoCloseAlerts = document.querySelectorAll('.alert:not(.alert-permanent):not(.persistent-alert):not(.flash-messages .alert)');
  console.log('Alertas auto-close:', autoCloseAlerts.length);
  
  if (autoCloseAlerts.length > 0) {
    setTimeout(() => {
      autoCloseAlerts.forEach(alert => {
        if (alert && document.body.contains(alert)) {
          alert.style.opacity = '0';
          setTimeout(() => {
            if (alert && document.body.contains(alert)) {
              alert.remove();
            }
          }, 300);
        }
      });
    }, 7000);
  }
  
  // Configurar todos los botones de cierre (para alertas normales y persistentes)
  const closeButtons = document.querySelectorAll('.alert .btn-close, .alert .close-alert');
  console.log('Botones de cierre configurados:', closeButtons.length);
  
  closeButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const alert = this.closest('.alert');
      console.log('Cerrando alerta:', alert?.id || 'sin ID');
      
      if (alert) {
        alert.style.opacity = '0';
        setTimeout(() => {
          if (alert && document.body.contains(alert)) {
            alert.remove();
          }
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

// Inicializar tooltips de Bootstrap
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Configurar botón de reenvío de confirmación de correo
function setupResendConfirmationButton() {
  const resendBtn = document.getElementById('resendConfirmationBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', async function() {
      try {
        // Cambiar estado del botón
        const originalText = resendBtn.innerHTML;
        resendBtn.disabled = true;
        resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';
        
        // Realizar la petición
        const response = await fetch('/auth/resend-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        // Mostrar mensaje según el resultado
        if (data.success) {
          // Crea un nuevo div para el mensaje
          const messageDiv = document.createElement('div');
          messageDiv.className = 'alert alert-success mt-2';
          
          // Crear estructura del mensaje con botón de cierre
          messageDiv.innerHTML = `
            <div class="position-relative">
              <div class="mb-2">
                <i class="fas fa-check-circle me-2"></i>Correo de confirmación enviado. Por favor revisa tu bandeja de entrada.
              </div>
              <button type="button" class="btn-close position-absolute top-0 end-0" aria-label="Cerrar"></button>
            </div>
          `;
          
          // Inserta el mensaje después del botón
          resendBtn.parentNode.insertBefore(messageDiv, resendBtn.nextSibling);
          
          // Configurar el botón de cierre
          const closeButton = messageDiv.querySelector('.btn-close');
          if (closeButton) {
            closeButton.addEventListener('click', () => {
              messageDiv.remove();
            });
          }
          
          // Restaurar el botón después de 1 segundo
          setTimeout(() => {
            resendBtn.disabled = false;
            resendBtn.innerHTML = originalText;
          }, 1000);
        } else {
          // Mostrar error
          const messageDiv = document.createElement('div');
          
          // Analizar el error para detectar si es un rate limit
          let errorMessage = data.message || 'Error al reenviar el correo';
          let alertClass = 'alert-danger';
          let iconClass = 'fa-exclamation-circle';
          
          // Comprobar si es un error de limitación de tasa
          if (data.code === 'over_email_send_rate_limit' || errorMessage.includes('only request this after')) {
            alertClass = 'alert-warning';
            iconClass = 'fa-clock';
            // Extraer el tiempo de espera del mensaje si está disponible
            const waitTimeMatch = errorMessage.match(/after (\d+) seconds/);
            const waitTime = waitTimeMatch ? waitTimeMatch[1] : '60';
            
            errorMessage = `Por razones de seguridad, debes esperar ${waitTime} segundos antes de solicitar otro correo.`;
          }
          
          messageDiv.className = `alert ${alertClass} mt-2`;
          
          // Crear estructura del mensaje con botón de cierre
          messageDiv.innerHTML = `
            <div class="position-relative">
              <div class="mb-2">
                <i class="fas ${iconClass} me-2"></i>${errorMessage}
              </div>
              <button type="button" class="btn-close position-absolute top-0 end-0" aria-label="Cerrar"></button>
            </div>
          `;
          
          // Inserta el mensaje después del botón
          resendBtn.parentNode.insertBefore(messageDiv, resendBtn.nextSibling);
          
          // Configurar el botón de cierre
          const closeButton = messageDiv.querySelector('.btn-close');
          if (closeButton) {
            closeButton.addEventListener('click', () => {
              messageDiv.remove();
            });
          }
          
          // Restaurar el botón después de 1 segundo
          setTimeout(() => {
            resendBtn.disabled = false;
            resendBtn.innerHTML = originalText;
          }, 1000);
        }
      } catch (error) {
        console.error('Error al reenviar correo de confirmación:', error);
        
        // Mostrar error genérico
        const messageDiv = document.createElement('div');
        let errorMessage = 'Error al reenviar el correo de confirmación';
        let alertClass = 'alert-danger';
        let iconClass = 'fa-exclamation-circle';
        
        // Intentar detectar error de limitación de tasa
        if (error.message && (error.message.includes('rate limit') || error.message.includes('after'))) {
          alertClass = 'alert-warning';
          iconClass = 'fa-clock';
          errorMessage = 'Por razones de seguridad, debes esperar antes de solicitar otro correo.';
        }
        
        messageDiv.className = `alert ${alertClass} mt-2`;
        
        // Crear estructura del mensaje con botón de cierre
        messageDiv.innerHTML = `
          <div class="position-relative">
            <div class="mb-2">
              <i class="fas ${iconClass} me-2"></i>${errorMessage}
            </div>
            <button type="button" class="btn-close position-absolute top-0 end-0" aria-label="Cerrar"></button>
          </div>
        `;
        
        // Inserta el mensaje después del botón
        resendBtn.parentNode.insertBefore(messageDiv, resendBtn.nextSibling);
        
        // Configurar el botón de cierre
        const closeButton = messageDiv.querySelector('.btn-close');
        if (closeButton) {
          closeButton.addEventListener('click', () => {
            messageDiv.remove();
          });
        }
        
        // Restaurar el botón inmediatamente en caso de error
        resendBtn.disabled = false;
        resendBtn.innerHTML = 'Reenviar correo de confirmación';
      }
    });
  }
  
  // Configurar botones de cierre para alertas de correo no confirmado
  const emailAlerts = document.querySelectorAll('#emailConfirmationAlert .btn-close');
  emailAlerts.forEach(btn => {
    btn.addEventListener('click', function() {
      const alert = this.closest('.alert');
      if (alert) {
        alert.remove();
      }
    });
  });
}