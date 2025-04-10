// public/js/entry-detail.js
// Funcionalidad específica para la página de detalle de entrada

document.addEventListener("DOMContentLoaded", function () {
  console.log("entry-detail.js cargado");

  /**
   * Implementa lazy loading simple para la imagen principal de detalle.
   */
  function setupLazyLoadDetailImage() {
    const img = document.querySelector("img.lazy-image"); // Asumimos que solo hay una imagen principal
    if (!img) {
      console.log("No se encontró imagen lazy-image en detalle de entrada.");
      return;
    }

    const src = img.getAttribute("data-src");
    const defaultImageSrc = "/img/empty-plate.svg"; // Imagen por defecto

    // Cargar la imagen real si no es la imagen por defecto y tiene data-src
    if (src && src !== defaultImageSrc) {
      console.log(`Iniciando carga lazy para: ${src}`);
      const tempImage = new Image();

      tempImage.onload = function () {
        img.src = src;
        img.classList.add("loaded");
        console.log("Imagen lazy cargada exitosamente.");
      };

      tempImage.onerror = function () {
        console.error(
          `Error cargando imagen lazy: ${src}. Mostrando imagen por defecto.`
        );
        img.src = defaultImageSrc;
        img.style.padding = "20px";
        img.style.backgroundColor = "#f8f9fa"; // Fondo claro para la imagen por defecto
        img.classList.add("loaded", "load-error"); // Marcar como cargada con error
      };

      // Iniciar carga de la imagen temporal
      tempImage.src = src;
    } else if (img.src !== defaultImageSrc) {
      // Si la imagen ya tiene un src (y no es el por defecto), marcar como cargada
      // Esto puede pasar si el navegador la carga antes o si no usa data-src
      img.classList.add("loaded");
      console.log("Imagen ya cargada o sin data-src, marcada como loaded.");
    } else {
      // Si es la imagen por defecto desde el inicio
      img.classList.add("loaded");
      console.log("Imagen es la por defecto, marcada como loaded.");
    }
  }

  // Ejecutar la configuración
  setupLazyLoadDetailImage();

  // Aquí podrían ir otras funcionalidades específicas de esta página en el futuro
  // setupDeleteConfirmationModal();
  // etc.
});
