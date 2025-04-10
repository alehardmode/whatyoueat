// public/js/resendConfirmation.js
// Módulo para manejar el botón de reenvío de correo de confirmación

// Importar la función para mostrar mensajes de error si es necesario
// import { showErrorMessage } from './alerts.js'; // Descomentar si se usa showErrorMessage

/**
 * Configura el botón `#resendConfirmationBtn` para:
 * - Enviar una petición POST a `/auth/resend-confirmation`.
 * - Mostrar mensajes de éxito o error.
 * - Manejar errores de limitación de tasa (rate limiting).
 * - Configurar el cierre de las alertas generadas.
 */
export function setupResendConfirmationButton() {
  const resendBtn = document.getElementById("resendConfirmationBtn");
  if (!resendBtn) {
    // No es un error si el botón no está en la página actual
    // console.log("Botón de reenvío de confirmación no encontrado.");
    return;
  }

  // Asegurarse de no añadir listeners duplicados
  if (resendBtn.hasAttribute("data-resend-listener-set")) {
    return;
  }
  resendBtn.setAttribute("data-resend-listener-set", "true");

  resendBtn.addEventListener("click", async function () {
    const originalText = resendBtn.innerHTML;
    let messageDiv = null; // Para almacenar la referencia al mensaje mostrado

    // Limpiar mensajes previos generados por este botón
    const previousMessages =
      resendBtn.parentNode.querySelectorAll(".resend-message");
    previousMessages.forEach((msg) => msg.remove());

    try {
      // Cambiar estado del botón a "cargando"
      resendBtn.disabled = true;
      resendBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';

      // Realizar la petición al backend
      const response = await fetch("/auth/resend-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Podríamos añadir CSRF token si es necesario
        },
        body: JSON.stringify({}), // Cuerpo vacío o con datos necesarios
      });

      const data = await response.json();

      // Crear contenedor del mensaje
      messageDiv = document.createElement("div");
      messageDiv.className = "mt-2 resend-message"; // Clase para identificar estos mensajes
      let alertClass = "alert-danger";
      let iconClass = "fa-exclamation-circle";
      let messageText = "Error desconocido al reenviar el correo.";

      if (data.success) {
        // Éxito
        alertClass = "alert-success";
        iconClass = "fa-check-circle";
        messageText =
          data.message ||
          "Correo de confirmación enviado. Por favor revisa tu bandeja de entrada.";

        // Restaurar el botón después de un breve retraso en caso de éxito
        setTimeout(() => {
          if (resendBtn && resendBtn.disabled) {
            // Verificar si todavía está deshabilitado
            resendBtn.disabled = false;
            resendBtn.innerHTML = originalText;
          }
        }, 1000);
      } else {
        // Error (incluyendo rate limit)
        messageText = data.message || "Error al reenviar el correo";

        // Comprobar si es un error de limitación de tasa
        if (
          data.code === "over_email_send_rate_limit" ||
          messageText.includes("only request this after")
        ) {
          alertClass = "alert-warning";
          iconClass = "fa-clock";
          const waitTimeMatch = messageText.match(/after (\d+) seconds/);
          const waitTime = waitTimeMatch ? waitTimeMatch[1] : "60";
          messageText = `Por razones de seguridad, debes esperar ${waitTime} segundos antes de solicitar otro correo.`;
        }

        // Restaurar el botón inmediatamente en caso de error de backend
        resendBtn.disabled = false;
        resendBtn.innerHTML = originalText;
      }

      // Construir y mostrar el mensaje de alerta
      messageDiv.className = `alert ${alertClass} ${messageDiv.className}`; // Añadir clase de alerta
      messageDiv.innerHTML = `
          <div class="position-relative">
            <div class="mb-0"> <!-- Reducido margen inferior -->
              <i class="fas ${iconClass} me-2"></i>${messageText}
            </div>
            <button type="button" class="btn-close position-absolute top-0 end-0 p-2" aria-label="Cerrar"></button> <!-- Ajustado padding -->
          </div>
      `;

      // Insertar el mensaje después del botón
      resendBtn.parentNode.insertBefore(messageDiv, resendBtn.nextSibling);

      // Configurar el botón de cierre para el mensaje recién creado
      const closeButton = messageDiv.querySelector(".btn-close");
      if (closeButton) {
        closeButton.addEventListener("click", () => {
          messageDiv.remove();
          // Si el botón aún estaba deshabilitado (caso éxito), habilitarlo al cerrar
          if (resendBtn.disabled) {
            resendBtn.disabled = false;
            resendBtn.innerHTML = originalText;
          }
        });
      }
    } catch (error) {
      console.error("Error en la petición fetch para reenviar correo:", error);

      // Mostrar error genérico de red/fetch
      messageDiv = document.createElement("div");
      messageDiv.className = "alert alert-danger mt-2 resend-message";
      let errorMessage = "Error de conexión al intentar reenviar el correo.";
      let iconClass = "fa-exclamation-triangle"; // Icono diferente para error de red

      // Usar showErrorMessage si se importa desde alerts.js?
      // showErrorMessage("Error de conexión al intentar reenviar el correo.");

      messageDiv.innerHTML = `
          <div class="position-relative">
            <div class="mb-0">
              <i class="fas ${iconClass} me-2"></i>${errorMessage}
            </div>
            <button type="button" class="btn-close position-absolute top-0 end-0 p-2" aria-label="Cerrar"></button>
          </div>
      `;
      resendBtn.parentNode.insertBefore(messageDiv, resendBtn.nextSibling);
      const closeButton = messageDiv.querySelector(".btn-close");
      if (closeButton) {
        closeButton.addEventListener("click", () => messageDiv.remove());
      }

      // Restaurar el botón inmediatamente en caso de error de fetch
      resendBtn.disabled = false;
      resendBtn.innerHTML = originalText;
    }
  });

  // Eliminar la configuración específica para #emailConfirmationAlert .btn-close
  // ya que ahora el módulo alerts.js maneja todos los .btn-close en alertas vía delegación.
  /*
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
  */
  console.log("Botón de reenvío de confirmación configurado.");
}
