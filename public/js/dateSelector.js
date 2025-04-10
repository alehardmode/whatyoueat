// public/js/dateSelector.js
// Módulo para configurar el selector de fechas del historial

/**
 * Configura el input `#date-selector` para que envíe el formulario
 * al cambiar la fecha.
 */
export function setupDateSelector() {
  const dateInput = document.getElementById("date-selector");

  if (dateInput) {
    // Asegurarse de no añadir listeners duplicados
    if (!dateInput.hasAttribute("data-selector-listener-set")) {
      dateInput.addEventListener("change", function () {
        const form = this.closest("form");
        if (form) {
          // Añadir efecto visual de carga al input
          this.classList.add("loading");
          // Enviar el formulario que contiene el input
          form.submit();
        }
      });
      dateInput.setAttribute("data-selector-listener-set", "true");
      console.log("Selector de fecha (#date-selector) configurado.");
    }
  } else {
    // console.log("No se encontró el selector de fecha (#date-selector) en esta página.");
    // No es necesariamente un error, puede que no esté en todas las páginas
  }
}
