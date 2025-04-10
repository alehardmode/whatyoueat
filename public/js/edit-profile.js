// public/js/edit-profile.js
// Funcionalidad específica para la página de edición de perfil

document.addEventListener("DOMContentLoaded", function () {
  console.log("edit-profile.js cargado");

  /**
   * Configura el botón de cancelar para redirigir a la página de perfil.
   */
  function setupCancelButton() {
    const cancelButton = document.getElementById("cancelEditButton");
    if (cancelButton) {
      // Evitar listeners duplicados si el script se carga varias veces
      if (cancelButton.hasAttribute("data-cancel-listener-set")) return;
      cancelButton.setAttribute("data-cancel-listener-set", "true");

      cancelButton.addEventListener("click", function (event) {
        event.preventDefault(); // Prevenir cualquier acción por defecto del botón
        console.log("Botón Cancelar presionado, redirigiendo a /profile...");
        window.location.href = "/profile"; // Redirigir al perfil
      });
      console.log("Botón Cancelar configurado.");
    } else {
      console.warn("Botón Cancelar (#cancelEditButton) no encontrado.");
    }
  }

  // Ejecutar la configuración
  setupCancelButton();

  // Aquí podrían ir otras funcionalidades específicas de esta página en el futuro
});
