const menuButton = document.getElementById("menu-button");
const navigation = document.getElementById("navigation");

menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

navigation.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

/*
 * Agrega aquí tu WhatsApp en formato internacional, solo números.
 * Ejemplo: "5213112345678"
 * Si se deja vacío, el botón abrirá el apartado de contacto de la página.
 */
const WHATSAPP_NUMBER = "3112638635";
const contactButton = document.getElementById("contact-button");

if (WHATSAPP_NUMBER) {
  const message = encodeURIComponent("Hola Franco, me gustaría recibir información sobre tus servicios de fotografía.");
  contactButton.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  contactButton.target = "_blank";
  contactButton.rel = "noopener";
} else {
  contactButton.href = "mailto:";
  contactButton.addEventListener("click", event => {
    event.preventDefault();
    alert("Agrega tu número de WhatsApp en site.js para activar este botón de contacto.");
  });
}
