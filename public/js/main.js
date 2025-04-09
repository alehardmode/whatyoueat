// WhatYouEat - Script principal optimizado
// Aplicación para seguimiento nutricional vía fotografías
// Versión 2.1

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  console.log("main.js cargado correctamente");

  // Configurar otros componentes después
  // setupButtons(); // Movido a ui.js
  // setupDateSelector(); // Movido a dateSelector.js
  // setupAnimations(); // Movido a animations.js

  // Inicializar tooltips de Bootstrap
  // initTooltips(); // Movido a tooltips.js

  // Escuchar el botón de reenvío de confirmación de correo
  // setupResendConfirmationButton(); // Movido a resendConfirmation.js

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
