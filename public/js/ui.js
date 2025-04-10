// public/js/ui.js
// Módulo para mejoras generales de la interfaz de usuario

/**
 * Configura todos los botones de la aplicación:
 * - Previene el envío por defecto para botones dentro de formularios que no sean `type="submit"`.
 * - Añade un efecto visual de clic.
 */
export function setupButtons() {
  console.log("Configurando botones...");
  // Usar delegación de eventos en el body para manejar botones añadidos dinámicamente
  document.body.addEventListener("click", function (event) {
    // Buscar el botón ancestro más cercano o el propio elemento si es un botón
    const button = event.target.closest(
      'button, .btn, [role="button"], input[type="submit"]'
    );

    if (button) {
      console.log(
        "Clic detectado en botón:",
        button.tagName,
        button.id || button.textContent.trim().substring(0, 20)
      );

      // Prevenir envío para botones en formularios sin type="submit" (y sin clase submit-form)
      if (
        button.closest("form") &&
        button.type !== "submit" &&
        !button.classList.contains("submit-form")
      ) {
        console.log("Previniendo envío por defecto para botón sin submit");
        event.preventDefault();
      }

      // Añadir efecto visual de clic (evitar añadir si ya está)
      if (!button.classList.contains("button-clicked")) {
        button.classList.add("button-clicked");
        setTimeout(() => {
          // Verificar si el botón todavía existe en el DOM
          if (document.body.contains(button)) {
            button.classList.remove("button-clicked");
          }
        }, 300); // Duración del efecto
      }
    }
  });

  // Eliminar el listener original que no usaba delegación
  /*
  const allButtons = document.querySelectorAll(
    'button, .btn, [role="button"], input[type="submit"]'
  );
  console.log(`Configurando ${allButtons.length} botones inicialmente.`);

  allButtons.forEach((button) => {
    // Verificar si ya tiene un listener para evitar duplicados (si se llama múltiples veces)
    if (button.hasAttribute('data-button-listener-set')) return;
    button.setAttribute('data-button-listener-set', 'true');

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
        // Verificar si el elemento aún existe
        if (document.body.contains(this)) {
           this.classList.remove("button-clicked");
        }
      }, 300);
    });
  });
  */
}
