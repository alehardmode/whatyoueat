document.getElementById("contactForm").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const form = e.target;
  
    const email = form.email.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const message = form.message.value.trim();
    const name = form.name.value.trim();
    const subject = form.subject.value.trim();
  
    if (!emailRegex.test(email)) {
      showToast("Introduce un correo electrónico válido.", "error");
      return;
    }
    if (message.length > 280) {
      showToast("El mensaje no puede superar los 280 caracteres.", "error");
      return;
    }
    if (name.length > 50) {
      showToast("El nombre no puede superar los 50 caracteres.", "error");
      return;
    }
    if (subject.length > 50) {
      showToast("El asunto no puede superar los 50 caracteres.", "error");
      return;
    }
  
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
  
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
  
      if (result.success) {
        showToast(result.message, "success");
        form.reset();
      } else {
        showToast("Hubo un problema al enviar el formulario.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error de red o del servidor.", "error");
    }
  });
  
  function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = type === "success" ? `✅ ${message}` : `❌ ${message}`;
  
    toast.classList.remove("hidden");
    toast.classList.add("show");
  
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.classList.add("hidden");
      }, 400);
    }, 4000);
  }