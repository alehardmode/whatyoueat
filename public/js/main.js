// WhatYouEat - Script principal optimizado
// Aplicación para seguimiento nutricional vía fotografías
// Versión 2.1

import { initTheme } from "./theme.js"; // Solo necesitamos initTheme aquí
import { setupAlerts } from "./alerts.js";
import { setupAnimations } from "./animations.js";
import { setupDateSelector } from "./dateSelector.js";
import { setupButtons } from "./ui.js";
import { initTooltips } from "./tooltips.js";
import { setupResendConfirmationButton } from "./resendConfirmation.js";
import { initAuthFeatures } from "./auth.js"; // Importar la inicialización de auth
// Nota: No importamos upload.js explícitamente aquí porque ya se carga globalmente
// y su inicialización está dentro de su propio listener DOMContentLoaded.
// Si quisiéramos cambiar eso, importaríamos una función initUpload() aquí.

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  console.log("main.js refactorizado inicializando módulos...");

  // 1. Inicializar sistema de temas (importante hacerlo primero)
  initTheme(); // Llama a setupThemeObserver internamente

  // 2. Configurar funcionalidades de autenticación (incluye password fix)
  initAuthFeatures();

  // 3. Configurar componentes y funcionalidades generales
  setupAlerts(); // Configura cierre automático y botones de cierre
  setupButtons(); // Configura comportamiento de botones (delegación de eventos)
  setupAnimations(); // Aplica animaciones iniciales
  initTooltips(); // Inicializa tooltips de Bootstrap

  // 4. Configurar funcionalidades específicas de página
  setupDateSelector(); // Configura el selector de fecha del historial
  setupResendConfirmationButton(); // Configura el botón de reenvío de email

  // Eliminar bloque de debug del formulario de registro
  /*
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
      const formData = new FormData(registerForm);
      const formValues = {};
      for (const [key, value] of formData.entries()) {
        formValues[key] = value;
      }
      console.log("Valores del formulario de registro:", formValues);
    });
  }
  */

  // La llamada a setupThemeObserver() ahora está dentro de initTheme()
  // setupThemeObserver();

  console.log("Inicialización de módulos completada.");
});

// Eliminar funciones huérfanas que ya están en otros módulos
/*
function setupThemeObserver() { ... }
function applyThemeToElement(element, theme) { ... }
function isPasswordField(element) { ... }
*/
