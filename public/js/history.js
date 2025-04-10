// Funcionalidad para la página de historial

/**
 * Configura animaciones para elementos que aparecen al hacer scroll.
 */
function setupScrollAnimations() {
  const animateElements = document.querySelectorAll(".animate-on-scroll");
  if (animateElements.length === 0) return; // No hacer nada si no hay elementos

  const observer = new IntersectionObserver(
    (entries, obs) => {
      // Renombrado observer a obs
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target); // Usar obs
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  animateElements.forEach((el) => {
    // Añadir clase base para la animación (ej. 'fade-in-up')
    if (!el.classList.contains("fade-in-up")) {
      el.classList.add("fade-in-up");
    }
    observer.observe(el);
  });
  console.log("Animaciones de scroll configuradas.");
}

/**
 * Configura los filtros de fecha para asegurar rangos válidos.
 */
function setupDateFilters() {
  const dateFromInput = document.getElementById("date-from");
  const dateToInput = document.getElementById("date-to");

  if (dateFromInput && dateToInput) {
    dateFromInput.addEventListener("change", function () {
      dateToInput.min = this.value;
      if (dateToInput.value && dateToInput.value < this.value) {
        dateToInput.value = this.value;
      }
    });

    dateToInput.addEventListener("change", function () {
      dateFromInput.max = this.value;
      if (dateFromInput.value && dateFromInput.value > this.value) {
        dateFromInput.value = this.value;
      }
    });
    console.log("Filtros de fecha configurados.");
  }
}

/**
 * Añade efectos hover a las tarjetas de historial.
 */
function setupEntryCardHover() {
  const entryCards = document.querySelectorAll(".entry-card");
  if (entryCards.length === 0) return;

  entryCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transition = "transform 0.3s ease, box-shadow 0.3s ease"; // Asegurar transición
      this.classList.add("shadow-lg");
      this.style.transform = "translateY(-5px)";
    });

    card.addEventListener("mouseleave", function () {
      this.classList.remove("shadow-lg");
      this.style.transform = "translateY(0)";
    });
  });
  console.log("Efectos hover en tarjetas configurados.");
}

/**
 * Configura el lazy loading para imágenes con clase 'lazy-image'.
 * Usa IntersectionObserver y una cola para carga secuencial.
 */
function setupLazyLoading() {
  const imagesToLoad = document.querySelectorAll("img.lazy-image");
  if (imagesToLoad.length === 0) return; // Salir si no hay imágenes lazy

  console.log(
    `Configurando lazy loading para ${imagesToLoad.length} imágenes.`
  );
  const loadQueue = [];
  let isLoading = false;
  const defaultImageSrc = "/img/empty-plate.svg"; // Imagen por defecto en caso de error

  function processQueue() {
    if (loadQueue.length === 0 || isLoading) return;

    isLoading = true;
    const nextItem = loadQueue.shift();
    if (!nextItem) {
      isLoading = false;
      return;
    }

    const imgElement = nextItem.element;
    const targetSrc = nextItem.src;

    const tempImage = new Image();

    tempImage.onload = () => {
      imgElement.src = targetSrc;
      imgElement.classList.add("loaded");
      isLoading = false;
      setTimeout(processQueue, 50); // Procesar siguiente con retraso
    };

    tempImage.onerror = () => {
      console.warn(
        `Error cargando imagen: ${targetSrc}. Usando imagen por defecto.`
      );
      imgElement.src = defaultImageSrc;
      imgElement.style.padding = "20px"; // Añadir padding a imagen por defecto
      imgElement.classList.add("loaded", "load-error"); // Marcar como cargada y con error
      isLoading = false;
      setTimeout(processQueue, 50);
    };

    tempImage.src = targetSrc; // Inicia la carga
  }

  function queueImageLoad(imgElement, src) {
    // Evitar añadir si ya está en la cola o cargada
    if (
      !imgElement.classList.contains("loaded") &&
      !loadQueue.some((item) => item.element === imgElement)
    ) {
      loadQueue.push({ element: imgElement, src: src });
      processQueue();
    }
  }

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const img = entry.target;
        const src = img.getAttribute("data-src");

        if (src && src !== defaultImageSrc) {
          queueImageLoad(img, src);
        } else {
          // Si no hay data-src o es la imagen por defecto, marcar como cargada
          img.classList.add("loaded");
        }

        observer.unobserve(img); // Dejar de observar
      });
    },
    {
      rootMargin: "100px 0px", // Precargar imágenes 100px antes de entrar en viewport
      threshold: 0.01, // Iniciar tan pronto como 1% sea visible
    }
  );

  imagesToLoad.forEach((img) => {
    imageObserver.observe(img);
  });
}

// Ejecutar todas las configuraciones de la página de historial cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  console.log("Inicializando funcionalidades de history.js...");
  setupScrollAnimations();
  setupDateFilters();
  setupEntryCardHover();
  setupLazyLoading();
});
