const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const form = document.querySelector("[data-form]");

navToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const status = form.querySelector(".form-status");
  status.textContent =
    "Solicitud lista. Para producción, conecta este formulario a WhatsApp Business, email o CRM.";
  form.reset();
});
