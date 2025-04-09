// public/js/edit-entry.js
// Funcionalidad específica para la página de edición de entrada

document.addEventListener("DOMContentLoaded", function () {
  console.log("edit-entry.js cargado");

  /**
   * Configura la vista previa para el input de la foto.
   */
  function setupImagePreview() {
    const fileInput = document.getElementById("food_photo");
    const previewContainer = document.getElementById("previewContainer");
    const preview = document.getElementById("preview");

    if (fileInput && previewContainer && preview) {
      fileInput.addEventListener("change", function () {
        if (this.files && this.files[0]) {
          const reader = new FileReader();

          reader.onload = function (e) {
            preview.src = e.target.result;
            previewContainer.classList.remove("d-none");
            console.log("Vista previa de imagen actualizada.");
          };

          reader.onerror = function () {
            console.error("Error al leer archivo para vista previa.");
            // Podríamos mostrar un mensaje de error aquí
            previewContainer.classList.add("d-none");
          };
          reader.readAsDataURL(this.files[0]);
        } else {
          // Si no se selecciona archivo, ocultar preview (o mostrar original?)
          // Depende de la UX deseada. Por ahora, ocultamos.
          previewContainer.classList.add("d-none");
          preview.src = "#"; // Limpiar src
        }
      });
      console.log("Listener para vista previa de imagen configurado.");
    } else {
      console.warn("Elementos para vista previa no encontrados.");
    }
  }

  /**
   * Configura la validación para prevenir el envío si no hay cambios.
   */
  function setupNoChangesValidation() {
    const form = document.querySelector("form.needs-validation"); // Asumiendo que el form tiene esta clase
    const fileInput = document.getElementById("food_photo"); // Necesario para detectar nueva imagen

    if (form) {
      // Guardar los valores originales al cargar la página
      // Seleccionar inputs relevantes por su ID o name
      const nameInput = document.getElementById("name");
      const descriptionInput = document.getElementById("description");
      const mealTypeInput = document.getElementById("mealType");
      const mealDateInput = document.getElementById("mealDate");

      // Asegurarse que los inputs existen antes de leer `value`
      const originalValues = {
        name: nameInput ? nameInput.value : "",
        description: descriptionInput ? descriptionInput.value : "",
        mealType: mealTypeInput ? mealTypeInput.value : "",
        mealDate: mealDateInput ? mealDateInput.value : "",
      };
      console.log("Valores originales guardados:", originalValues);

      // Crear y añadir div de alerta si no existe ya (más robusto)
      let alertDiv = document.getElementById("noChangesAlert");
      if (!alertDiv) {
        alertDiv = document.createElement("div");
        alertDiv.className = "alert alert-warning mt-3 d-none";
        alertDiv.id = "noChangesAlert";
        alertDiv.innerHTML =
          '<i class="fas fa-exclamation-triangle me-2"></i>No se han realizado cambios. Por favor modifica al menos un campo.';
        // Insertar antes del primer elemento del formulario o al principio
        if (form.firstChild) {
          form.insertBefore(alertDiv, form.firstChild);
        } else {
          form.appendChild(alertDiv);
        }
      }

      form.addEventListener(
        "submit",
        function (event) {
          // Ocultar alerta previa
          alertDiv.classList.add("d-none");

          // Verificar si hay una imagen nueva
          const hasNewImage =
            fileInput && fileInput.files && fileInput.files.length > 0;

          // Verificar si algún campo ha cambiado (releer valores actuales)
          const currentValues = {
            name: nameInput ? nameInput.value : "",
            description: descriptionInput ? descriptionInput.value : "",
            mealType: mealTypeInput ? mealTypeInput.value : "",
            mealDate: mealDateInput ? mealDateInput.value : "",
          };

          const hasChanges =
            hasNewImage ||
            currentValues.name !== originalValues.name ||
            currentValues.description !== originalValues.description ||
            currentValues.mealType !== originalValues.mealType ||
            currentValues.mealDate !== originalValues.mealDate;

          console.log(
            "¿Hubo cambios?",
            hasChanges,
            "(Nueva imagen:",
            hasNewImage,
            ")"
          );

          if (!hasChanges) {
            console.log("No hubo cambios. Previniendo envío.");
            event.preventDefault();
            event.stopPropagation(); // Detener también validación Bootstrap?

            alertDiv.classList.remove("d-none");
            alertDiv.scrollIntoView({ behavior: "smooth", block: "center" });

            setTimeout(() => {
              if (document.body.contains(alertDiv)) {
                // Verificar si aún existe
                alertDiv.classList.add("d-none");
              }
            }, 5000);
          } else {
            console.log(
              "Hubo cambios. Permitiendo envío (si pasa validación Bootstrap)."
            );
            // Si hubo cambios, permitir que la validación de Bootstrap continúe (si está activa)
          }
        },
        true
      ); // Usar captura para ejecutar ANTES de la validación de Bootstrap si es necesario?
      // Por ahora, dejar en fase de burbuja (false por defecto)

      console.log("Listener para validación de 'no cambios' configurado.");
    } else {
      console.warn("Formulario para validación de 'no cambios' no encontrado.");
    }
  }

  // Ejecutar las configuraciones
  setupImagePreview();
  setupNoChangesValidation();
});
