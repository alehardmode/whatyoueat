// Script para manejar la subida de fotos de manera optimizada
console.log('Upload.js cargado (versión optimizada)');

// Función para manejar la redirección después de la subida
function handleSuccessfulUpload() {
  // Detectar errores de redirección SSL
  const useForm = true; // Cambiar a true para usar envío de formulario tradicional

  if (useForm) {
    // Crear un formulario invisible y enviarlo (método más compatible)
    console.log('Redireccionando mediante formulario tradicional...');
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = '/patient/dashboard';
    document.body.appendChild(form);
    form.submit();
  } else {
    // Usar redirección segura con timeout
    try {
      console.log('Redireccionando vía location.replace...');
      setTimeout(() => {
        // Forzar HTTP en lugar de HTTPS para evitar SSL_PROTOCOL_ERROR
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.split('/').slice(0, 3).join('/');
        const dashboardUrl = baseUrl + '/patient/dashboard';
        
        // Usar protocolo relativo para evitar mezcla HTTP/HTTPS
        const relativeUrl = dashboardUrl.replace(/^https?:/, '');
        window.location.replace(relativeUrl);
      }, 800); // Aumentar tiempo de espera
    } catch (error) {
      console.error('Error en redirección:', error);
      alert('Imagen subida correctamente. Por favor, regresa manualmente al dashboard.');
    }
  }
}

// Función de inicialización que se ejecutará cuando el DOM esté listo
function initUploadFunctions() {
  console.log('Script de subida cargado e inicializado correctamente');

  // Configurar el cierre de alertas
  document.querySelectorAll('.alert-close').forEach(button => {
    console.log('Botón de cierre de alerta encontrado');
    button.addEventListener('click', function() {
      console.log('Clic en botón de cierre de alerta');
      const alert = this.closest('.alert');
      if (alert) {
        alert.style.opacity = '0';
        setTimeout(() => {
          alert.remove();
        }, 300);
      }
    });
  });

  // Manejar la vista previa de la imagen
  const photoInput = document.getElementById('food_photo');
  const preview = document.getElementById('preview');
  const previewContainer = document.getElementById('previewContainer');

  if (photoInput && preview && previewContainer) {
    console.log('Input de foto encontrado');
    if (!photoInput.hasAttribute('data-preview-configured')) {
      photoInput.setAttribute('data-preview-configured', 'true');
      photoInput.addEventListener('change', function(e) {
        console.log('Cambio detectado en input de foto');
        const file = this.files[0];
        if (file) {
          console.log('Archivo seleccionado:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);
          
          // Validar que sea una imagen
          if (!file.type.startsWith('image/')) {
            console.error('El archivo no es una imagen válida');
            const errorMsg = document.getElementById('photo-error');
            if (errorMsg) {
              errorMsg.textContent = 'Por favor, selecciona un archivo de imagen válido (jpg, png, etc.)';
              errorMsg.style.display = 'block';
            }
            photoInput.value = '';
            return;
          }
          
          // Validar tamaño máximo (10MB)
          const maxSize = 10 * 1024 * 1024;
          if (file.size > maxSize) {
            console.error('El archivo excede el tamaño máximo permitido');
            const errorMsg = document.getElementById('photo-error');
            if (errorMsg) {
              errorMsg.textContent = 'La imagen es demasiado grande. El tamaño máximo es 10MB.';
              errorMsg.style.display = 'block';
            }
            photoInput.value = '';
            return;
          }
          
          // Mostrar vista previa
          const reader = new FileReader();
          reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.classList.remove('d-none');
          }
          reader.onerror = function() {
            console.error('Error al leer el archivo');
            const errorMsg = document.getElementById('photo-error');
            if (errorMsg) {
              errorMsg.textContent = 'Error al procesar la imagen. Inténtalo con otra imagen.';
              errorMsg.style.display = 'block';
            }
          }
          reader.readAsDataURL(file);
        } else {
          // Ocultar preview si se deselecciona el archivo
          preview.src = '#';
          previewContainer.classList.add('d-none');
        }
      });
    }
  } else {
    console.log('ADVERTENCIA: Elementos para vista previa no encontrados');
  }

  // Configurar validación del formulario
  const uploadForm = document.getElementById('uploadForm');
  if (uploadForm) {
    console.log('Formulario de subida encontrado');
    if (!uploadForm.hasAttribute('data-form-configured')) {
      uploadForm.setAttribute('data-form-configured', 'true');
      uploadForm.addEventListener('submit', async function(e) {
        // No prevenir envío para permitir que el backend procese la imagen
        
        let isValid = true;
        
        // Validar archivo de foto
        const photoInput = document.getElementById('food_photo');
        if (!photoInput || !photoInput.files || photoInput.files.length === 0) {
          isValid = false;
          const errorMsg = document.getElementById('photo-error');
          if (errorMsg) {
            errorMsg.textContent = 'Por favor, selecciona una imagen';
            errorMsg.style.display = 'block';
          }
        }
        
        // Validar nombre de la comida
        const foodName = document.getElementById('foodName');
        if (!foodName || !foodName.value.trim()) {
          isValid = false;
          const errorMsg = document.getElementById('foodName-error');
          if (errorMsg) {
            errorMsg.textContent = 'Por favor, indica el nombre de la comida';
            errorMsg.style.display = 'block';
          }
        }
        
        // Validar descripción
        const description = document.getElementById('description');
        if (!description || !description.value.trim()) {
          isValid = false;
          const errorMsg = document.getElementById('description-error');
          if (errorMsg) {
            errorMsg.textContent = 'Por favor, añade una descripción de la comida';
            errorMsg.style.display = 'block';
          }
        }
        
        if (!isValid) {
          e.preventDefault(); // Solo prevenir envío si hay error de validación
          return;
        }
        
        // Mostrar indicador de carga en el botón
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Subiendo...';
        }
      });
    }
  } else {
    console.log('ERROR: Formulario de subida no encontrado');
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initUploadFunctions);