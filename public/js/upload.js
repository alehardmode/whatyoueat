// Script para manejar la subida de fotos
console.log('Upload.js se está cargando');

// Función de inicialización que se ejecutará cuando el DOM esté listo
function initUploadFunctions() {
  console.log('Script de subida cargado e inicializado correctamente');
  
  // Asegurar que las alertas no se cierran automáticamente
  const disableAutoClose = function() {
    // Buscar todas las alertas con clase .alert
    document.querySelectorAll('.alert').forEach(alert => {
      // Eliminar clases que podrían hacer que se cierre automáticamente
      alert.classList.remove('fade', 'show');
      
      // Asegurar que tenga la clase custom-alert
      alert.classList.add('custom-alert');
      
      // Configurar los botones de cierre para cerrar manualmente
      const allCloseButtons = alert.querySelectorAll('.btn-close, .alert-close');
      allCloseButtons.forEach(button => {
        // Evitar múltiples event listeners
        if (!button.hasAttribute('data-manual-close-configured')) {
          button.setAttribute('data-manual-close-configured', 'true');
          
          // Añadir evento click para cerrar manualmente
          button.addEventListener('click', function() {
            const parentAlert = this.closest('.alert');
            if (parentAlert) {
              // Animación suave de cierre
              parentAlert.style.opacity = '0';
              parentAlert.style.transition = 'opacity 0.3s ease';
              
              // Ocultar después de la transición
              setTimeout(() => {
                parentAlert.style.display = 'none';
              }, 300);
            }
          });
        }
      });
    });
  };
  
  // Ejecutar al inicio
  disableAutoClose();
  
  // También ejecutar después de un pequeño retraso para asegurar que funciona después de que Bootstrap inicialice
  setTimeout(disableAutoClose, 500);
  
  // Manejar la vista previa de la imagen
  const photoInput = document.getElementById('photo');
  const preview = document.getElementById('preview');
  const previewContainer = document.getElementById('previewContainer');
  
  if (photoInput && preview && previewContainer) {
    console.log('Input de foto encontrado');
    
    // Evitar múltiples event listeners
    if (!photoInput.hasAttribute('data-preview-configured')) {
      photoInput.setAttribute('data-preview-configured', 'true');
      
      photoInput.addEventListener('change', function(e) {
        console.log('Cambio detectado en input de foto');
        const file = this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.classList.remove('d-none');
            previewContainer.style.display = 'block';
          }
          reader.readAsDataURL(file);
        }
      });
    }
  } else {
    console.log('ADVERTENCIA: Algún elemento necesario para la vista previa no fue encontrado');
  }
  
  // Manejar el botón cancelar
  const cancelButton = document.getElementById('cancelButton');
  if (cancelButton) {
    console.log('Botón cancelar encontrado');
    
    // Evitar múltiples event listeners
    if (!cancelButton.hasAttribute('data-configured')) {
      cancelButton.setAttribute('data-configured', 'true');
      
      cancelButton.addEventListener('click', function(e) {
        console.log('Clic en botón cancelar');
        e.preventDefault();
        const destination = this.getAttribute('href');
        window.location.href = destination;
      });
    }
  } else {
    console.log('ADVERTENCIA: Botón cancelar no encontrado');
  }
}

// Intentar inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initUploadFunctions);

// Backup: Si la página ya está cargada cuando este script se ejecuta
if (document.readyState === 'complete') {
  console.log('Documento ya cargado, inicializando inmediatamente');
  initUploadFunctions();
} 