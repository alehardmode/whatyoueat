// public/js/tooltips.js
// Módulo para inicializar los tooltips de Bootstrap

/**
 * Inicializa todos los tooltips de Bootstrap presentes en el documento
 * utilizando el selector `[data-bs-toggle="tooltip"]`.
 */
export function initTooltips() {
  // Verificar si Bootstrap y Tooltip están disponibles
  if (
    typeof bootstrap === "undefined" ||
    typeof bootstrap.Tooltip === "undefined"
  ) {
    console.warn(
      "Bootstrap Tooltip no está disponible. Saltando inicialización."
    );
    return;
  }

  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );

  // Inicializar cada tooltip
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    // Prevenir doble inicialización
    if (!bootstrap.Tooltip.getInstance(tooltipTriggerEl)) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    }
    return bootstrap.Tooltip.getInstance(tooltipTriggerEl);
  });

  console.log(`Tooltips inicializados: ${tooltipList.filter((t) => t).length}`);

  // Opcional: Escuchar cambios en el DOM para inicializar nuevos tooltips
  // (si se añaden dinámicamente y no se usa el ThemeObserver para esto)
  /*
  const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Es un elemento
                  const newTooltips = node.querySelectorAll('[data-bs-toggle="tooltip"]');
                  newTooltips.forEach(el => {
                      if (!bootstrap.Tooltip.getInstance(el)) {
                          new bootstrap.Tooltip(el);
                      }
                  });
                  // También verificar el nodo raíz añadido
                  if (node.matches('[data-bs-toggle="tooltip"]') && !bootstrap.Tooltip.getInstance(node)) {
                      new bootstrap.Tooltip(node);
                  }
              }
          });
      });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  */
}
