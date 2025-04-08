// WhatYouEat - Script principal optimizado
// Aplicación para seguimiento nutricional vía fotografías
// Versión 2.1

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  console.log("main.js cargado correctamente");

  // Inicializar el sistema de temas primero para evitar parpadeos
  initTheme();

  // Configurar otros componentes después
  setupButtons();
  setupAlerts();
  setupPhotoUploadForm();
  setupDateSelector();
  setupAnimations();

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
 * Inicializa el tema basado en preferencias almacenadas o del sistema
 */
function initTheme() {
  try {
    console.log("Inicializando tema...");

    // Obtener tema desde localStorage o preferencia del sistema
    let theme = localStorage.getItem("theme");

    // Si no hay tema almacenado, usar la preferencia del sistema
    if (!theme) {
      const prefersDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      theme = prefersDarkMode ? "dark" : "light";
      localStorage.setItem("theme", theme);
    }

    console.log(`Tema inicial: ${theme}`);

    // Aplicar el tema al documento
    document.documentElement.setAttribute("data-bs-theme", theme);

    // Aplicar a todos los elementos, excepto campos de contraseña
    document.querySelectorAll("body *").forEach((element) => {
      if (!isPasswordField(element)) {
        applyThemeToElement(element, theme);
      }
    });

    // Configurar el observador de temas para nuevos elementos
    setupThemeObserver();

    // Configurar el botón de cambio de tema
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);

      // Actualizar el icono según el tema actual
      themeToggle.innerHTML =
        theme === "light"
          ? '<i class="fas fa-sun"></i>'
          : '<i class="fas fa-moon"></i>';

      // Actualizar aria-label para accesibilidad
      themeToggle.setAttribute(
        "aria-label",
        theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"
      );
    } else {
      console.warn("No se encontró el botón de cambio de tema");
    }

    console.log("Tema inicializado correctamente");
  } catch (error) {
    console.error("Error al inicializar el tema:", error);
    // Fallback a tema claro en caso de error
    document.documentElement.setAttribute("data-bs-theme", "light");
  }
}

/**
 * Implementación de debounce para evitar llamadas excesivas a funciones costosas
 * @param {Function} func - La función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @param {boolean} immediate - Si debe ejecutarse inmediatamente
 * @returns {Function} - Función con debounce
 */
function debounce(func, wait, immediate) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// Versión optimizada de refreshBootstrapComponents con debounce
const debouncedRefreshComponents = debounce(function () {
  refreshBootstrapComponents();
}, 150);

/**
 * Cambia entre temas claro y oscuro
 */
function toggleTheme() {
  const currentTheme = localStorage.getItem("theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";

  // Aplicar animación de transición suave
  document.body.classList.add("theme-transitioning");

  // Actualizar tema en el documento
  document.documentElement.setAttribute("data-bs-theme", newTheme);
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Actualizar el icono del botón
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.innerHTML =
      newTheme === "light"
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';

    // Actualizar aria-label para accesibilidad
    themeToggle.setAttribute(
      "aria-label",
      newTheme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"
    );

    // Añadir efecto de animación al icono
    const icon = themeToggle.querySelector("i");
    if (icon) {
      icon.classList.add("theme-icon-animate");
      setTimeout(() => {
        if (icon && document.body.contains(icon)) {
          icon.classList.remove("theme-icon-animate");
        }
      }, 500);
    }
  }

  // No aplicar cambios a los campos de contraseña
  document.querySelectorAll("body *").forEach((element) => {
    if (!isPasswordField(element)) {
      applyThemeToElement(element, newTheme);
    }
  });

  // Quitar clase de transición después de completarse
  setTimeout(() => {
    document.body.classList.remove("theme-transitioning");
  }, 500);

  // Refrescar componentes Bootstrap
  debouncedRefreshComponents();

  console.log(`Tema cambiado a: ${newTheme}`);
}

/**
 * Actualiza componentes específicos de Bootstrap que pueden necesitar
 * un refresco explícito después de cambiar el tema
 */
function refreshBootstrapComponents() {
  // Tooltips
  if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach((element) => {
      try {
        const tooltip = bootstrap.Tooltip.getInstance(element);
        if (tooltip) {
          tooltip.hide();
        }
      } catch (e) {
        console.warn("Error al actualizar tooltip:", e);
      }
    });
  }

  // Popovers
  if (typeof bootstrap !== "undefined" && bootstrap.Popover) {
    const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
    popovers.forEach((element) => {
      try {
        const popover = bootstrap.Popover.getInstance(element);
        if (popover) {
          popover.hide();
        }
      } catch (e) {
        console.warn("Error al actualizar popover:", e);
      }
    });
  }

  // Dropdowns
  if (typeof bootstrap !== "undefined" && bootstrap.Dropdown) {
    const dropdowns = document.querySelectorAll(".dropdown-toggle");
    dropdowns.forEach((element) => {
      try {
        const dropdown = bootstrap.Dropdown.getInstance(element);
        if (dropdown) {
          dropdown.hide();
        }
      } catch (e) {
        /* Ignorar si no hay instancia */
      }
    });
  }
}

/**
 * Aplica un tema específico (claro u oscuro)
 * @param {string} theme - 'light' o 'dark'
 */
function applyTheme(theme) {
  // Actualizar el atributo de tema del documento
  document.documentElement.setAttribute("data-theme", theme);

  // Actualizar clase en el elemento body para compatibilidad adicional
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
  } else {
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
  }

  // Actualizar el atributo data-bs-theme en el elemento HTML (para Bootstrap 5.3+)
  document.documentElement.setAttribute("data-bs-theme", theme);

  // Actualizar selectivamente elementos importantes de la interfaz
  updateUIForTheme(theme);

  // Actualizar meta theme-color para navegadores móviles
  updateMetaThemeColor(theme);
}

/**
 * Actualiza elementos específicos de la interfaz para el tema seleccionado
 * @param {string} theme - 'light' o 'dark'
 */
function updateUIForTheme(theme) {
  // Actualizar el ícono del botón
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.innerHTML =
      theme === "light"
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';

    // Actualizar el título para accesibilidad
    themeToggle.setAttribute(
      "aria-label",
      theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"
    );

    // Añadir efecto de animación al ícono
    const icon = themeToggle.querySelector("i");
    if (icon) {
      icon.classList.add("theme-icon-animate");
      setTimeout(() => {
        if (icon && document.body.contains(icon)) {
          icon.classList.remove("theme-icon-animate");
        }
      }, 500);
    }
  }

  // Compatibilidad con Bootstrap - actualizar atributos de data-bs-theme
  document.querySelectorAll("[data-bs-theme]").forEach((el) => {
    el.setAttribute("data-bs-theme", theme);
  });

  // Corregir elementos problemáticos específicos
  fixThemeSpecificElements(theme);

  // Aplicar clases específicas para tarjetas y otros componentes
  document
    .querySelectorAll(
      ".card, .navbar, .dropdown-menu, .tooltip, .modal-content"
    )
    .forEach((el) => {
      // Asegurar que estos elementos tengan el atributo data-bs-theme
      el.setAttribute("data-bs-theme", theme);
    });

  // Actualizar los estados de los botones de navegación
  if (document.querySelector(".navbar")) {
    const activeLinks = document.querySelectorAll(".nav-link.active");
    activeLinks.forEach((link) => {
      // Forzar el recálculo de estilos para la clase active
      link.classList.remove("active");
      // Usar setTimeout para asegurar que el DOM se actualice
      setTimeout(() => {
        link.classList.add("active");
      }, 10);
    });
  }
}

/**
 * Actualiza el meta tag theme-color para navegadores móviles
 * @param {string} theme - 'light' o 'dark'
 */
function updateMetaThemeColor(theme) {
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const themeColor = theme === "light" ? "#ffffff" : "#242424";

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", themeColor);
  } else {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = themeColor;
    document.head.appendChild(meta);
  }
}

/**
 * Corrige elementos específicos que pueden tener problemas con el cambio de tema
 * @param {string} theme - 'light' o 'dark'
 */
function fixThemeSpecificElements(theme) {
  // Crear un único fragment para aplicar todos los cambios de una vez
  requestAnimationFrame(() => {
    // Corregir textos "text-muted" para mejor contraste
    document.querySelectorAll(".text-muted").forEach((el) => {
      el.style.opacity = theme === "dark" ? "0.8" : "";
    });

    // Corregir imágenes para mejor visualización en modo oscuro
    document.querySelectorAll('img:not([src*=".svg"])').forEach((img) => {
      img.style.filter = theme === "dark" ? "brightness(0.9)" : "";
    });

    // Corregir iconos específicos que pueden tener colores fijos
    document.querySelectorAll(".fa-heart.text-danger").forEach((el) => {
      el.style.color = theme === "dark" ? "#ef4444" : "";
    });

    // Corregir los botones de navegación y enlaces
    document.querySelectorAll(".navbar-brand, .nav-link").forEach((el) => {
      if (theme === "dark") {
        if (!el.classList.contains("active")) {
          el.style.opacity = "0.9";
        }
      } else {
        el.style.opacity = "";
      }
    });
  });
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

/**
 * Configura un observador de mutaciones para aplicar el tema a nuevos elementos
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
 * Configura animaciones y efectos visuales
 */
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

/**
 * Configuración de alertas y notificaciones
 */
function setupAlerts() {
  console.log("Configurando alertas...");

  // Solo cerrar automáticamente alertas normales (no persistentes)
  const autoCloseAlerts = document.querySelectorAll(
    ".alert:not(.alert-permanent):not(.persistent-alert):not(.flash-messages .alert)"
  );
  console.log("Alertas auto-close:", autoCloseAlerts.length);

  if (autoCloseAlerts.length > 0) {
    setTimeout(() => {
      autoCloseAlerts.forEach((alert) => {
        if (alert && document.body.contains(alert)) {
          alert.style.opacity = "0";
          setTimeout(() => {
            if (alert && document.body.contains(alert)) {
              alert.remove();
            }
          }, 300);
        }
      });
    }, 7000);
  }

  // Configurar solo botones de cierre que no tengan ya event listeners
  const closeButtons = document.querySelectorAll(
    ".alert:not(.flash-messages .alert) .btn-close, .alert:not(.flash-messages .alert) .close-alert"
  );
  console.log("Botones de cierre a configurar:", closeButtons.length);

  closeButtons.forEach((btn) => {
    // Verificar si el botón ya tiene event listener configurado
    if (!btn.hasAttribute("data-alert-handler")) {
      btn.setAttribute("data-alert-handler", "true");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const alert = this.closest(".alert");
        console.log("Cerrando alerta:", alert?.id || "sin ID");

        if (alert) {
          alert.style.opacity = "0";
          setTimeout(() => {
            if (alert && document.body.contains(alert)) {
              alert.remove();
            }
          }, 300);
        }
      });
    }
  });
}

/**
 * Configuración del formulario de subida de fotos
 */
function setupPhotoUploadForm() {
  const photoUploadForm = document.querySelector(
    'form[action="/patient/upload"]'
  );

  if (photoUploadForm) {
    const photoInput = photoUploadForm.querySelector('input[type="file"]');
    const imagePreview = document.getElementById("imagePreview");
    const imagePreviewContainer = document.getElementById(
      "imagePreviewContainer"
    );

    // Vista previa de la imagen seleccionada
    if (photoInput && imagePreview && imagePreviewContainer) {
      photoInput.addEventListener("change", function () {
        if (this.files && this.files[0]) {
          const reader = new FileReader();

          reader.onload = function (e) {
            // Actualizar la imagen con transición suave
            imagePreview.style.opacity = "0";
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove("d-none");

            setTimeout(() => {
              imagePreview.style.transition = "opacity 0.5s ease";
              imagePreview.style.opacity = "1";
            }, 10);
          };

          reader.onerror = function () {
            console.error("Error al leer el archivo seleccionado");
            showErrorMessage("No se pudo cargar la vista previa de la imagen");
          };

          reader.readAsDataURL(this.files[0]);
        }
      });
    }

    // Validación mejorada del formulario antes de enviar
    photoUploadForm.addEventListener("submit", function (e) {
      let valid = true;
      const requiredFields = photoUploadForm.querySelectorAll("[required]");
      let firstErrorField = null;

      requiredFields.forEach(function (field) {
        // Eliminar clases de validación previas
        field.classList.remove("is-invalid", "is-valid");

        // Validar campo
        if (!field.value.trim()) {
          valid = false;
          field.classList.add("is-invalid");

          // Guardar referencia al primer campo con error
          if (!firstErrorField) {
            firstErrorField = field;
          }
        } else {
          field.classList.add("is-valid");
        }
      });

      // Si hay campos inválidos, detener el envío y mostrar errores
      if (!valid) {
        e.preventDefault();

        if (firstErrorField) {
          // Desplazarse al primer campo con error
          firstErrorField.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => firstErrorField.focus(), 500);
        }
      } else {
        // Todo está correcto, mostrar indicador de carga
        const submitBtn = photoUploadForm.querySelector(
          'button[type="submit"]'
        );
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
  const alertElement = document.createElement("div");
  alertElement.className = "alert alert-danger fade-in";
  alertElement.role = "alert";
  alertElement.innerHTML = `
    <strong>Error:</strong> ${message}
    <button type="button" class="close-alert" aria-label="Cerrar">×</button>
  `;

  // Añadir al principio del contenedor principal
  const mainContainer =
    document.querySelector("main .container") || document.body;
  mainContainer.prepend(alertElement);

  // Auto-cerrar después de 5 segundos
  setTimeout(function () {
    if (alertElement.parentNode) {
      alertElement.style.opacity = "0";
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
  const dateInput = document.getElementById("date-selector");

  if (dateInput) {
    dateInput.addEventListener("change", function () {
      const form = this.closest("form");
      if (form) {
        // Añadir efecto de carga
        dateInput.classList.add("loading");
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
 * Asegura que las sugerencias de contraseñas funcionen correctamente
 * eliminando cualquier manipulación de estos campos
 */

/**
 * Asegura que las sugerencias de contraseñas funcionen correctamente
 * eliminando cualquier manipulación de estos campos
 */
function ensurePasswordSuggestionsWork() {
  try {
    // Encontrar todos los campos de contraseña
    const passwordFields = document.querySelectorAll('input[type="password"]');

    passwordFields.forEach((field) => {
      // Eliminar completamente cualquier atributo de estilo
      field.removeAttribute("style");

      // Asegurar que el campo tiene los atributos necesarios para las sugerencias
      field.setAttribute("autocomplete", "on");

      // Eliminar cualquier listener que pueda estar interfiriendo
      const newField = field.cloneNode(true);
      if (field.parentNode) {
        field.parentNode.replaceChild(newField, field);
      }
    });

    console.log(
      "Restauradas funcionalidades nativas en campos de contraseña:",
      passwordFields.length
    );
  } catch (error) {
    console.error("Error al restaurar campos de contraseña:", error);
  }
}
