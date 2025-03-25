// Funcionalidad para la página de historial
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar animaciones para elementos que aparecen en scroll
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });
  
  animateElements.forEach(el => {
    observer.observe(el);
    // Añadir clase base para la animación
    el.classList.add('fade-in-up');
  });
  
  // Manejar filtros de fecha
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  
  if (dateFromInput && dateToInput) {
    // Si se selecciona una fecha "desde", la fecha "hasta" no puede ser anterior
    dateFromInput.addEventListener('change', function() {
      dateToInput.min = this.value;
      if (dateToInput.value && dateToInput.value < this.value) {
        dateToInput.value = this.value;
      }
    });
    
    // Si se selecciona una fecha "hasta", la fecha "desde" no puede ser posterior
    dateToInput.addEventListener('change', function() {
      dateFromInput.max = this.value;
      if (dateFromInput.value && dateFromInput.value > this.value) {
        dateFromInput.value = this.value;
      }
    });
  }
  
  // Efectos hover en las tarjetas de entrada
  const entryCards = document.querySelectorAll('.entry-card');
  
  entryCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.classList.add('shadow-lg');
      this.style.transform = 'translateY(-5px)';
      this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    });
    
    card.addEventListener('mouseleave', function() {
      this.classList.remove('shadow-lg');
      this.style.transform = 'translateY(0)';
    });
  });
}); 