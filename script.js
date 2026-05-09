const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const form = document.querySelector("[data-form]");
const whatsappNumber = "526646105348";

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
  const data = new FormData(form);
  const status = form.querySelector(".form-status");
  const message = [
    "Hola Sonia, quiero solicitar una asesoría.",
    "",
    `Nombre: ${data.get("name") || ""}`,
    `Email: ${data.get("email") || ""}`,
    `Teléfono / WhatsApp: ${data.get("phone") || ""}`,
    `Tipo de servicio: ${data.get("service") || ""}`,
    `Persona o empresa: ${data.get("client_type") || ""}`,
    `¿Qué quiero trabajar?: ${data.get("message") || ""}`,
  ].join("\n");
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  status.textContent = "Abriendo WhatsApp con tu mensaje listo para Sonia.";
  window.open(url, "_blank", "noopener");
});
