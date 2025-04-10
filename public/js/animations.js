// public/js/animations.js
// Módulo para configurar animaciones y efectos visuales

/**
 * Añade clases de animación inicial (ej. 'fade-in') a elementos seleccionados.
 */
export function setupPageLoadAnimations() {
  // Añadir clase fade-in a elementos principales para animación inicial
  document
    .querySelectorAll(".card, section > .container > *:first-child")
    .forEach((el) => {
      // Asegurarse de que la clase de animación no se añada múltiples veces
      if (!el.classList.contains("fade-in")) {
        el.classList.add("fade-in");
        console.log(
          "Añadida clase fade-in a:",
          el.tagName,
          el.id ? `#${el.id}` : el.className.split(" ")[0]
        );
      }
    });
  console.log("Animaciones de carga de página configuradas.");
}

// Podríamos añadir aquí también la lógica de IntersectionObserver de history.js
// si quisiéramos centralizar todas las animaciones.
/*
export function setupScrollAnimations() {
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  
  if (animateElements.length === 0) return; // No hacer nada si no hay elementos

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Dejar de observar una vez visible
      }
    });
  }, {
    threshold: 0.1 // El elemento debe ser visible al menos en un 10%
  });
  
  animateElements.forEach(el => {
    // Añadir clase base para la animación (si no la tiene ya)
    if (!el.classList.contains('fade-in-up')) { // Ejemplo, podría ser otra clase
       el.classList.add('fade-in-up'); 
    }
    observer.observe(el);
  });
  console.log("Animaciones de scroll configuradas para", animateElements.length, "elementos.");
}
*/

// Función principal de setup que llama a las demás
export function setupAnimations() {
  setupPageLoadAnimations();
  // setupScrollAnimations(); // Descomentar si movemos la lógica de scroll aquí
}
