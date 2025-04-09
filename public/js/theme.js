// public/js/theme.js
// Módulo para gestionar el tema claro/oscuro

/**
 * Implementación de debounce para evitar llamadas excesivas a funciones costosas
 * @param {Function} func - La función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @param {boolean} immediate - Si debe ejecutarse inmediatamente
 * @returns {Function} - Función con debounce
 */
function debounce(func, wait, immediate) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// Versión optimizada de refreshBootstrapComponents con debounce
const debouncedRefreshComponents = debounce(function () {
  refreshBootstrapComponents();
}, 150);

/**
 * Determina si un elemento es un campo de contraseña o contiene uno
 * @param {HTMLElement} element - El elemento a verificar
 * @returns {boolean} - True si es o contiene un campo de contraseña
 */
function isPasswordField(element) {
  if (!element || !element.nodeType || element.nodeType !== 1) return false;

  // Verificar si es un campo de contraseña directamente
  if (element.tagName === "INPUT" && element.type === "password") {
    return true;
  }

  // Verificar si contiene un campo de contraseña
  if (element.querySelector) {
    return element.querySelector('input[type="password"]') !== null;
  }

  return false;
}

/**
 * Aplica el tema a un elemento específico y sus hijos (excluyendo campos de contraseña).
 * @param {HTMLElement} element - El elemento al que aplicar el tema.
 * @param {string} theme - El tema a aplicar ('light' o 'dark').
 */
function applyThemeToElement(element, theme) {
  // IMPORTANTE: No procesar campos de contraseña o sus contenedores
  if (isPasswordField(element)) {
    return;
  }

  // Para componentes Bootstrap específicos
  if (element.classList) {
    if (
      element.classList.contains("card") ||
      element.classList.contains("navbar") ||
      element.classList.contains("dropdown-menu") ||
      element.classList.contains("modal-content")
    ) {
      element.setAttribute("data-bs-theme", theme);
    }

    // Aplicar correctamente el color a los textos muted
    if (element.classList.contains("text-muted")) {
      element.style.opacity = theme === "dark" ? "0.8" : "";
    }
  }

  // Recursivamente aplicar a los hijos, excepto a los elementos de contraseña
  if (element.children && element.children.length > 0) {
    Array.from(element.children).forEach((child) => {
      // No procesar hijos si el elemento padre es un contenedor de contraseña
      if (!isPasswordField(child)) {
        applyThemeToElement(child, theme);
      }
    });
  }
}

/**
 * Actualiza componentes específicos de Bootstrap que pueden necesitar
 * un refresco explícito después de cambiar el tema
 */
function refreshBootstrapComponents() {
  // Tooltips
  if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach((element) => {
      try {
        const tooltip = bootstrap.Tooltip.getInstance(element);
        if (tooltip) {
          tooltip.hide(); // Ocultar para forzar redibujado si se abre de nuevo
        }
      } catch (e) {
        console.warn("Error al actualizar tooltip:", e);
      }
    });
  }

  // Popovers
  if (typeof bootstrap !== "undefined" && bootstrap.Popover) {
    const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
    popovers.forEach((element) => {
      try {
        const popover = bootstrap.Popover.getInstance(element);
        if (popover) {
          popover.hide();
        }
      } catch (e) {
        console.warn("Error al actualizar popover:", e);
      }
    });
  }

  // Dropdowns (generalmente no necesitan refresco, pero lo dejamos por si acaso)
  if (typeof bootstrap !== "undefined" && bootstrap.Dropdown) {
    const dropdowns = document.querySelectorAll(".dropdown-toggle");
    dropdowns.forEach((element) => {
      try {
        const dropdown = bootstrap.Dropdown.getInstance(element);
        if (dropdown && element.classList.contains("show")) {
          // dropdown.hide(); // Ocultar puede ser disruptivo, mejor dejar que el usuario lo cierre
        }
      } catch (e) {
        /* Ignorar si no hay instancia */
      }
    });
  }
}

/**
 * Aplica un tema específico (claro u oscuro) a todo el documento y elementos relevantes.
 * @param {string} theme - 'light' o 'dark'
 */
function applyTheme(theme) {
  // Actualizar el atributo de tema del documento
  document.documentElement.setAttribute("data-theme", theme); // Atributo personalizado
  document.documentElement.setAttribute("data-bs-theme", theme); // Atributo Bootstrap 5.3+

  // Actualizar clase en el elemento body para compatibilidad adicional o estilos específicos
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
  } else {
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
  }

  // Aplicar el tema a todos los elementos existentes (excepto contraseñas)
  document.querySelectorAll("body *").forEach((element) => {
    applyThemeToElement(element, theme);
  });

  // Actualizar selectivamente elementos importantes de la interfaz
  updateUIForTheme(theme);

  // Actualizar meta theme-color para navegadores móviles
  updateMetaThemeColor(theme);
}

/**
 * Actualiza elementos específicos de la interfaz para el tema seleccionado
 * (principalmente el botón de cambio de tema y correcciones visuales).
 * @param {string} theme - 'light' o 'dark'
 */
function updateUIForTheme(theme) {
  // Actualizar el ícono y aria-label del botón de cambio de tema
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    const iconClass = theme === "light" ? "fa-sun" : "fa-moon";
    const label =
      theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro";

    themeToggle.innerHTML = `<i class="fas ${iconClass}"></i>`;
    themeToggle.setAttribute("aria-label", label);

    // Añadir efecto de animación al ícono
    const icon = themeToggle.querySelector("i");
    if (icon) {
      icon.classList.add("theme-icon-animate");
      setTimeout(() => {
        // Verificar que el icono aún existe antes de quitar la clase
        if (icon && document.body.contains(icon)) {
          icon.classList.remove("theme-icon-animate");
        }
      }, 500);
    }
  }

  // Corregir elementos problemáticos específicos (contraste, imágenes, etc.)
  fixThemeSpecificElements(theme);

  // Asegurar que los componentes Bootstrap tengan el atributo data-bs-theme
  // Esto ya se hace de forma recursiva en applyThemeToElement, pero una pasada extra
  // para los componentes principales puede ser útil por si acaso.
  document
    .querySelectorAll(".card, .navbar, .dropdown-menu, .modal-content")
    .forEach((el) => {
      el.setAttribute("data-bs-theme", theme);
    });

  // Actualizar los estados :active de los botones de navegación si es necesario
  // (Puede que no sea estrictamente necesario con data-bs-theme)
  if (document.querySelector(".navbar")) {
    const activeLinks = document.querySelectorAll(".nav-link.active");
    activeLinks.forEach((link) => {
      // Forzar re-renderizado si hay problemas (generalmente no necesario)
      // link.style.display = 'none';
      // link.offsetHeight; // trigger reflow
      // link.style.display = '';
    });
  }
}

/**
 * Actualiza el meta tag theme-color para navegadores móviles
 * @param {string} theme - 'light' o 'dark'
 */
function updateMetaThemeColor(theme) {
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  // Usar colores definidos por Bootstrap si están disponibles, o fallback
  const lightColor =
    getComputedStyle(document.documentElement).getPropertyValue(
      "--bs-body-bg"
    ) || "#ffffff";
  const darkColor =
    getComputedStyle(document.documentElement).getPropertyValue(
      "--bs-body-bg"
    ) || "#212529"; // Un gris oscuro común de Bootstrap dark
  const themeColor = theme === "light" ? lightColor.trim() : darkColor.trim();

  if (!themeColorMeta) {
    themeColorMeta = document.createElement("meta");
    themeColorMeta.name = "theme-color";
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.setAttribute("content", themeColor);
}

/**
 * Corrige elementos específicos que pueden tener problemas con el cambio de tema
 * (e.g., contraste, filtros de imagen).
 * @param {string} theme - 'light' o 'dark'
 */
function fixThemeSpecificElements(theme) {
  requestAnimationFrame(() => {
    // Corregir textos "text-muted" para mejor contraste en modo oscuro
    document.querySelectorAll(".text-muted").forEach((el) => {
      el.style.opacity = theme === "dark" ? "0.8" : ""; // Ajustar opacidad si es necesario
    });

    // Aplicar un leve filtro a imágenes no SVG en modo oscuro para reducir brillo
    document.querySelectorAll('img:not([src*=".svg"])').forEach((img) => {
      img.style.filter = theme === "dark" ? "brightness(0.9)" : "";
    });

    // Ejemplo: Corregir iconos específicos si tienen colores fijos problemáticos
    // document.querySelectorAll(".fa-heart.text-danger").forEach((el) => {
    //   el.style.color = theme === "dark" ? "#ff7b7b" : ""; // Un rojo más brillante para oscuro?
    // });

    // Ajustar opacidad de enlaces navbar no activos en modo oscuro
    document.querySelectorAll(".navbar-brand, .nav-link").forEach((el) => {
      if (theme === "dark") {
        if (!el.classList.contains("active")) {
          el.style.opacity = "0.9";
        }
      } else {
        el.style.opacity = ""; // Restaurar opacidad por defecto
      }
    });
  });
}

/**
 * Cambia entre temas claro y oscuro, actualiza UI y guarda preferencia.
 */
function toggleTheme() {
  const currentTheme = localStorage.getItem("theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";

  // Aplicar animación de transición suave al body
  document.body.classList.add("theme-transitioning");

  // Aplicar el nuevo tema (esto actualiza data-bs-theme, data-theme, clases y elementos)
  applyTheme(newTheme);
  localStorage.setItem("theme", newTheme); // Guardar preferencia

  // Quitar clase de transición después de completarse
  setTimeout(() => {
    document.body.classList.remove("theme-transitioning");
  }, 500); // Duración debe coincidir con la transición CSS

  // Refrescar componentes Bootstrap (tooltips, popovers, etc.)
  debouncedRefreshComponents();

  console.log(`Tema cambiado a: ${newTheme}`);
}

/**
 * Configura un observador de mutaciones para aplicar el tema automáticamente
 * a los nuevos elementos añadidos al DOM (excepto campos de contraseña).
 */
export function setupThemeObserver() {
  // Asegurarse de que solo haya un observador activo
  if (window.themeObserver instanceof MutationObserver) {
    window.themeObserver.disconnect(); // Desconectar observador previo si existe
  }

  const observer = new MutationObserver((mutationsList) => {
    const currentTheme = localStorage.getItem("theme") || "light";

    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          // Solo procesar nodos que sean elementos DOM (tipo 1)
          if (node.nodeType === 1) {
            applyThemeToElement(node, currentTheme); // Aplicar al nodo añadido y sus hijos
          }
        });
      }
      // Podríamos observar cambios de atributos si fuera necesario,
      // pero para aplicar el tema inicial a nuevos elementos, childList es suficiente.
      // if (mutation.type === 'attributes') { ... }
    }
  });

  // Iniciar la observación del body y su subárbol
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Guardar referencia global al observador para poder desconectarlo si es necesario
  window.themeObserver = observer;
  console.log("Observador de tema configurado.");
}

/**
 * Inicializa el sistema de temas:
 * - Determina el tema inicial (localStorage o preferencia del sistema).
 * - Aplica el tema inicial a toda la página.
 * - Configura el botón de cambio de tema.
 * - Configura el observador para nuevos elementos.
 */
export function initTheme() {
  try {
    console.log("Inicializando tema...");

    // Obtener tema desde localStorage o preferencia del sistema
    let theme = localStorage.getItem("theme");
    if (!theme) {
      const prefersDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      theme = prefersDarkMode ? "dark" : "light";
      localStorage.setItem("theme", theme); // Guardar preferencia inicial
    }

    console.log(`Tema inicial: ${theme}`);

    // Aplicar el tema inicial a todo el documento
    applyTheme(theme);

    // Configurar el botón de cambio de tema
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      // Asegurarse de no añadir listeners duplicados
      if (!themeToggle.hasAttribute("data-theme-listener-set")) {
        themeToggle.addEventListener("click", toggleTheme);
        themeToggle.setAttribute("data-theme-listener-set", "true");
      }
      // Actualizar el icono y aria-label inicial (ya se hace en applyTheme/updateUI, pero por si acaso)
      const iconClass = theme === "light" ? "fa-sun" : "fa-moon";
      const label =
        theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro";
      themeToggle.innerHTML = `<i class="fas ${iconClass}"></i>`;
      themeToggle.setAttribute("aria-label", label);
    } else {
      console.warn(
        "No se encontró el botón de cambio de tema ('theme-toggle')."
      );
    }

    // Configurar el observador de temas para nuevos elementos
    // Se llama aquí para asegurar que se configure después de aplicar el tema inicial
    setupThemeObserver();

    console.log("Tema inicializado correctamente.");
  } catch (error) {
    console.error("Error crítico al inicializar el tema:", error);
    // Fallback muy básico a tema claro en caso de error grave
    document.documentElement.setAttribute("data-bs-theme", "light");
  }
}
