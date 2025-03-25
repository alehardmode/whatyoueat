document.getElementById("contactForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const toast = document.getElementById("toast");

  // Obtener los valores de los campos
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const subject = form.subject.value.trim();
  const message = form.message.value.trim();
  const type = form.type.value;
  const privacy = form.privacy.checked;

  // Validaciones
  // 1. Verificar que los campos no estén vacíos y no contengan solo el placeholder
  if (!name || name === "Nombre completo") {
    showToast("Por favor, introduce un nombre válido.", "error");
    return;
  }
  if (!email || email === "tu@email.com") {
    showToast("Por favor, introduce un correo electrónico válido.", "error");
    return;
  }
  if (!subject || subject === "Escribe el motivo de tu mensaje") {
    showToast("Por favor, introduce un asunto válido.", "error");
    return;
  }
  if (!message || message === "Escribe lo que desees comunicarnos (máx. 280 caracteres)") {
    showToast("Por favor, introduce un mensaje válido.", "error");
    return;
  }
  if (!type) {
    showToast("Por favor, selecciona un tipo de consulta.", "error");
    return;
  }
  if (!privacy) {
    showToast("Debes aceptar la política de privacidad.", "error");
    return;
  }

  // 2. Validar el formato del email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    showToast("Introduce un correo electrónico válido.", "error");
    return;
  }

  // 3. Validar longitudes máximas
  if (name.length > 50) {
    showToast("El nombre no puede superar los 50 caracteres.", "error");
    return;
  }
  if (subject.length > 50) {
    showToast("El asunto no puede superar los 50 caracteres.", "error");
    return;
  }
  if (message.length > 280) {
    showToast("El mensaje no puede superar los 280 caracteres.", "error");
    return;
  }

  // Si todas las validaciones pasan, enviar el formulario
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      showToast("¡Gracias por tu mensaje " + name+ "!", "success");
      // Resetear el formulario
      form.reset();
      // Eliminar la clase 'was-validated' para evitar que el navegador muestre errores
      form.classList.remove("was-validated");
      // Desplazamos la vista hacia el toast
      toast.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Damos foco al toast para que el usuario se centre en el fedback
      toast.focus();
    } else {
      showToast("Hubo un problema al enviar el formulario.", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Error de red o del servidor.", "error");
  }
});

// funcion que gestiona el mensaje que se muestra la div toast del formulario de contacto
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = type === "success" ? `✅ ${message}` : `❌ ${message}`;

  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 400);
  }, 4000);
}