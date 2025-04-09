// WhatYouEat - Script principal optimizado
// Aplicación para seguimiento nutricional vía fotografías
// Versión 2.1

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  console.log("main.js cargado correctamente");

  // Configurar otros componentes después
  setupButtons();
  // setupDateSelector(); // Movido a dateSelector.js
  // setupAnimations(); // Movido a animations.js

  // Inicializar tooltips de Bootstrap
  initTooltips();

  // Escuchar el botón de reenvío de confirmación de correo
  setupResendConfirmationButton();

  // Debug para formulario de registro
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
      // Obtener todos los valores del formulario
      const formData = new FormData(registerForm);
      const formValues = {};

      // Convertir FormData a objeto para logging
      for (const [key, value] of formData.entries()) {
        formValues[key] = value;
      }

      // Mostrar los valores en la consola
      console.log("Valores del formulario de registro:", formValues);
    });
  }

  // Configurar tema para cualquier elemento nuevo que se haya añadido después
  // de la inicialización del tema, o que pueda agregarse en el futuro
  setupThemeObserver();
});

/**
 * Configurar animaciones y efectos visuales
 */
/*
function setupAnimations() {
  // Añadir clase fade-in a elementos principales para animación
  document
    .querySelectorAll(".card, section > .container > *:first-child")
    .forEach((el) => {
      if (!el.classList.contains("fade-in")) {
        el.classList.add("fade-in");
      }
    });
}
*/

/**
 * Configuración de botones
 */
function setupButtons() {
  // Seleccionamos todos los botones de la aplicación
  const allButtons = document.querySelectorAll(
    'button, .btn, [role="button"], input[type="submit"]'
  );

  // Para cada botón, verificamos su funcionalidad
  allButtons.forEach((button) => {
    // Añadimos el listener para todos los botones
    button.addEventListener("click", function (e) {
      // Si el botón está dentro de un form y no tiene type="submit", prevenimos el envío
      if (
        button.closest("form") &&
        button.type !== "submit" &&
        !button.classList.contains("submit-form")
      ) {
        e.preventDefault();
      }

      // Efecto de hover mejorado
      this.classList.add("button-clicked");
      setTimeout(() => {
        this.classList.remove("button-clicked");
      }, 300);
    });
  });
}

// Inicializar tooltips de Bootstrap
function initTooltips() {
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Configurar botón de reenvío de confirmación de correo
function setupResendConfirmationButton() {
  const resendBtn = document.getElementById("resendConfirmationBtn");
  if (resendBtn) {
    resendBtn.addEventListener("click", async function () {
      try {
        // Cambiar estado del botón
        const originalText = resendBtn.innerHTML;
        resendBtn.disabled = true;
        resendBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';

        // Realizar la petición
        const response = await fetch("/auth/resend-confirmation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        const data = await response.json();

        // Mostrar mensaje según el resultado
        if (data.success) {
          // Crea un nuevo div para el mensaje
          const messageDiv = document.createElement("div");
          messageDiv.className = "alert alert-success mt-2";

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
          const closeButton = messageDiv.querySelector(".btn-close");
          if (closeButton) {
            closeButton.addEventListener("click", () => {
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
          const messageDiv = document.createElement("div");

          // Analizar el error para detectar si es un rate limit
          let errorMessage = data.message || "Error al reenviar el correo";
          let alertClass = "alert-danger";
          let iconClass = "fa-exclamation-circle";

          // Comprobar si es un error de limitación de tasa
          if (
            data.code === "over_email_send_rate_limit" ||
            errorMessage.includes("only request this after")
          ) {
            alertClass = "alert-warning";
            iconClass = "fa-clock";
            // Extraer el tiempo de espera del mensaje si está disponible
            const waitTimeMatch = errorMessage.match(/after (\d+) seconds/);
            const waitTime = waitTimeMatch ? waitTimeMatch[1] : "60";

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
          const closeButton = messageDiv.querySelector(".btn-close");
          if (closeButton) {
            closeButton.addEventListener("click", () => {
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
        console.error("Error al reenviar correo de confirmación:", error);

        // Mostrar error genérico
        const messageDiv = document.createElement("div");
        let errorMessage = "Error al reenviar el correo de confirmación";
        let alertClass = "alert-danger";
        let iconClass = "fa-exclamation-circle";

        // Intentar detectar error de limitación de tasa
        if (
          error.message &&
          (error.message.includes("rate limit") ||
            error.message.includes("after"))
        ) {
          alertClass = "alert-warning";
          iconClass = "fa-clock";
          errorMessage =
            "Por razones de seguridad, debes esperar antes de solicitar otro correo.";
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
        const closeButton = messageDiv.querySelector(".btn-close");
        if (closeButton) {
          closeButton.addEventListener("click", () => {
            messageDiv.remove();
          });
        }

        // Restaurar el botón inmediatamente en caso de error
        resendBtn.disabled = false;
        resendBtn.innerHTML = "Reenviar correo de confirmación";
      }
    });
  }

  // Configurar botones de cierre para alertas de correo no confirmado
  const emailAlerts = document.querySelectorAll(
    "#emailConfirmationAlert .btn-close"
  );
  emailAlerts.forEach((btn) => {
    btn.addEventListener("click", function () {
      const alert = this.closest(".alert");
      if (alert) {
        alert.remove();
      }
    });
  });
}

/**
 * Configurar un observador de mutaciones para aplicar el tema a nuevos elementos
 */
function setupThemeObserver() {
  // Crear un nuevo observador que ignore campos de contraseña
  const observer = new MutationObserver((mutationsList) => {
    const currentTheme = localStorage.getItem("theme") || "light";

    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          // Solo procesar nodos que sean elementos DOM y no sean campos de contraseña
          if (node.nodeType === 1 && !isPasswordField(node)) {
            // Aplicar el tema al elemento
            applyThemeToElement(node, currentTheme);

            // Procesar los hijos del elemento nuevo (excepto campos de contraseña)
            if (node.querySelectorAll) {
              node.querySelectorAll("*").forEach((child) => {
                if (!isPasswordField(child)) {
                  applyThemeToElement(child, currentTheme);
                }
              });
            }
          }
        });
      }
    }
  });

  // Iniciar la observación del documento
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Guardar referencia al observador para limpiar si es necesario
  window.themeObserver = observer;
}

/**
 * Aplica el tema a un elemento
 * @param {HTMLElement} element - El elemento al que aplicar el tema
 * @param {string} theme - El tema a aplicar ('light' o 'dark')
 */
function applyThemeToElement(element, theme) {
  // IMPORTANTE: No procesar campos de contraseña o sus contenedores
  if (isPasswordField(element)) {
    return;
  }

  // Para componentes Bootstrap específicos
  if (element.classList) {
    if (
      element.classList.contains("card") ||
      element.classList.contains("navbar") ||
      element.classList.contains("dropdown-menu") ||
      element.classList.contains("modal-content")
    ) {
      element.setAttribute("data-bs-theme", theme);
    }

    // Aplicar correctamente el color a los textos muted
    if (element.classList.contains("text-muted") && theme === "dark") {
      element.style.opacity = "0.8";
    }
  }

  // Recursivamente aplicar a los hijos, excepto a los elementos de contraseña
  if (element.children && element.children.length > 0) {
    Array.from(element.children).forEach((child) => {
      // No procesar hijos si el elemento padre es un contenedor de contraseña
      if (!isPasswordField(child)) {
        applyThemeToElement(child, theme);
      }
    });
  }
}

/**
 * Determina si un elemento es un campo de contraseña o contiene uno
 * @param {HTMLElement} element - El elemento a verificar
 * @returns {boolean} - True si es o contiene un campo de contraseña
 */
function isPasswordField(element) {
  if (!element || !element.nodeType || element.nodeType !== 1) return false;

  // Verificar si es un campo de contraseña directamente
  if (element.tagName === "INPUT" && element.type === "password") {
    return true;
  }

  // Verificar si contiene un campo de contraseña
  if (element.querySelector) {
    return element.querySelector('input[type="password"]') !== null;
  }

  return false;
}
