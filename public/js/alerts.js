// public/js/alerts.js
// Módulo para gestionar alertas y notificaciones

/**
 * Configuración de alertas y notificaciones
 * - Cierra automáticamente alertas no persistentes después de 7 segundos.
 * - Añade listeners a los botones de cierre de alertas.
 */
export function setupAlerts() {
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

  // Configurar botones de cierre dinámicamente para CUALQUIER alerta
  // Usar delegación de eventos en el body para manejar alertas que se añaden dinámicamente
  document.body.addEventListener("click", function (event) {
    const closeButton = event.target.closest(
      ".alert .btn-close, .alert .close-alert"
    );
    if (closeButton) {
      event.preventDefault();
      const alert = closeButton.closest(".alert");
      console.log("Cerrando alerta vía delegación:", alert?.id || "sin ID");

      if (alert) {
        alert.style.opacity = "0";
        setTimeout(() => {
          if (alert && document.body.contains(alert)) {
            alert.remove();
          }
        }, 300);
      }
    }
  });

  // Eliminar la configuración anterior basada en querySelectorAll al inicio
  /*
  const closeButtons = document.querySelectorAll(
    ".alert:not(.flash-messages .alert) .btn-close, .alert:not(.flash-messages .alert) .close-alert"
  );
  console.log("Botones de cierre a configurar:", closeButtons.length);

  closeButtons.forEach((btn) => {
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
  */
}

/**
 * Muestra un mensaje de error temporal en la parte superior del contenedor principal.
 * @param {string} message - El mensaje de error a mostrar.
 */
export function showErrorMessage(message) {
  // Crear elemento de alerta
  const alertElement = document.createElement("div");
  alertElement.className = "alert alert-danger fade-in alert-dismissible"; // Añadido alert-dismissible
  alertElement.role = "alert";
  alertElement.innerHTML = `
    <div><strong>Error:</strong> ${message}</div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
  `; // Usar botón estándar de Bootstrap

  // Añadir al principio del contenedor principal
  const mainContainer =
    document.querySelector("main .container") || document.body;
  mainContainer.prepend(alertElement);

  // Auto-cerrar después de 5 segundos
  setTimeout(function () {
    if (alertElement.parentNode) {
      // Usar API de Bootstrap para cerrar si está disponible
      if (typeof bootstrap !== "undefined" && bootstrap.Alert) {
        const alertInstance = bootstrap.Alert.getOrCreateInstance(alertElement);
        if (alertInstance) {
          alertInstance.close();
          return; // Salir si Bootstrap maneja el cierre
        }
      }
      // Fallback si Bootstrap no está o falla
      alertElement.style.opacity = "0";
      setTimeout(() => {
        alertElement.remove();
      }, 300);
    }
  }, 5000);
}
