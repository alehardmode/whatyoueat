/**
 * Validador para el formulario de contacto
 * 
 * Este script maneja la validación del formulario de contacto,
 * procesando los datos ingresados y mostrando mensajes de feedback
 * al usuario a través de toasts.
 */

// Inicializar validación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  
  // Si no existe el formulario en la página actual, salir
  if (!contactForm) return;
  
  // Escuchar el evento de envío del formulario
  contactForm.addEventListener('submit', handleFormSubmit);
});

/**
 * Maneja el envío del formulario de contacto
 * @param {Event} e - Evento de submit del formulario
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const toast = document.getElementById('toast');

  // Obtener los valores de los campos
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const subject = form.subject.value.trim();
  const message = form.message.value.trim();
  const type = form.type.value;
  const privacy = form.privacy.checked;

  // Realizar todas las validaciones
  const validationError = validateFormFields(name, email, subject, message, type, privacy);
  
  // Si hay error de validación, mostrar y salir
  if (validationError) {
    showToast(validationError, 'error');
    return;
  }

  // Si todas las validaciones pasan, enviar el formulario
  await submitContactForm(form, name, toast);
}

/**
 * Valida todos los campos del formulario
 * @returns {string|null} Mensaje de error o null si todo es válido
 */
function validateFormFields(name, email, subject, message, type, privacy) {
  // 1. Verificar que los campos no estén vacíos y no contengan solo el placeholder
  if (!name || name === 'Nombre completo') {
    return 'Por favor, introduce un nombre válido.';
  }
  if (!email || email === 'tu@email.com') {
    return 'Por favor, introduce un correo electrónico válido.';
  }
  if (!subject || subject === 'Escribe el motivo de tu mensaje') {
    return 'Por favor, introduce un asunto válido.';
  }
  if (!message || message === 'Escribe lo que desees comunicarnos (máx. 280 caracteres)') {
    return 'Por favor, introduce un mensaje válido.';
  }
  if (!type) {
    return 'Por favor, selecciona un tipo de consulta.';
  }
  if (!privacy) {
    return 'Debes aceptar la política de privacidad.';
  }

  // 2. Validar el formato del email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return 'Introduce un correo electrónico válido.';
  }

  // 3. Validar longitudes máximas
  if (name.length > 50) {
    return 'El nombre no puede superar los 50 caracteres.';
  }
  if (subject.length > 50) {
    return 'El asunto no puede superar los 50 caracteres.';
  }
  if (message.length > 280) {
    return 'El mensaje no puede superar los 280 caracteres.';
  }
  
  // Si no hay errores, retornar null
  return null;
}

/**
 * Envía el formulario mediante fetch API
 * @param {HTMLFormElement} form - El formulario a enviar
 * @param {string} name - Nombre del usuario para el mensaje de éxito
 * @param {HTMLElement} toast - Elemento toast para notificaciones
 */
async function submitContactForm(form, name, toast) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      showToast('¡Gracias por tu mensaje ' + name + '!', 'success');
      // Resetear el formulario
      form.reset();
      // Eliminar la clase 'was-validated' para evitar que el navegador muestre errores
      form.classList.remove('was-validated');
      // Desplazamos la vista hacia el toast
      toast.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Damos foco al toast para que el usuario se centre en el feedback
      toast.focus();
    } else {
      showToast('Hubo un problema al enviar el formulario.', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error de red o del servidor.', 'error');
  }
}

/**
 * Muestra un mensaje toast al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje ('success' o 'error')
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = type === 'success' ? `✅ ${message}` : `❌ ${message}`;

  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 400);
  }, 4000);
} 