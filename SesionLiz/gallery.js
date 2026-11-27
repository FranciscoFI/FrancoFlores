/*
 * Galería estática para GitHub Pages.
 * Sin APIs y sin archivo JSON: agrega aquí los nombres exactos de tus fotos.
 * Las imágenes deben estar dentro de la carpeta /images.
 */
const IMAGE_FILES = [
  "DSC03329.jpg",
  "DSC03329-2.jpg",
  "DSC03355.jpg",
  "DSC03355-2.jpg",
  "DSC03359.jpg",
  "DSC03359-2.jpg",
  "DSC03364.jpg",
  "DSC03364-2.jpg",
  "DSC03370.jpg",
  "DSC03370-2.jpg",
  "DSC03384.jpg",
  "DSC03384-2.jpg",
  "DSC03406.jpg",
  "DSC03406-2.jpg",
  "DSC03440.jpg",
  "DSC03440-2.jpg",
  "DSC03509.jpg",
  "DSC03519.jpg",
  "DSC03550.jpg",
  "DSC03552.jpg",
  "DSC03556.jpg",
  "DSC03557.jpg",
  "DSC03573.jpg",
  "DSC03575.jpg",
  "DSC03594.jpg",
  "DSC03595.jpg",
  "DSC03602.jpg",
  "DSC03602-2.jpg",
  "DSC03627.jpg",
  "DSC03658.jpg",
  "DSC03671.jpg",
  "DSC03671-2.jpg",
  "DSC03684.jpg",
  "DSC03710.jpg",
  "DSC03715.jpg",
  "DSC03718.jpg",
  "DSC03750.jpg",
  "DSC03852.jpg",
  "DSC03871.jpg",
];

const IMAGE_FOLDER = "images";

const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const selected = new Set();
let photos = [];
let activeIndex = 0;
let selectionMode = false;
let renderedCount = 0;
const BATCH_SIZE = 30;
let loadObserver;

function numberLabel(index) { return String(index + 1).padStart(2, "0"); }

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function updateSelectionUI() {
  document.getElementById("selected-count").textContent =
    `${selected.size} ${selected.size === 1 ? "fotografía seleccionada" : "fotografías seleccionadas"}`;
  document.getElementById("download-selected").disabled = selected.size === 0;
  document.getElementById("toggle-select").textContent = selectionMode ? "Cancelar" : "Seleccionar";
  document.getElementById("selection-tools").hidden = !selectionMode;
  gallery.querySelectorAll(".photo-card").forEach(card => {
    card.classList.toggle("selected", selected.has(Number(card.dataset.index)));
  });
}

function setCardSpan(card, image) {
  const columns = window.innerWidth <= 600 ? 2 : window.innerWidth <= 900 ? 4 : 5;
  const gap = window.innerWidth <= 600 ? 2 : 3;
  const gridWidth = gallery.clientWidth;
  const cellWidth = (gridWidth - gap * (columns - 1)) / columns;
  const ratio = image.naturalWidth / image.naturalHeight || 1;
  const colSpan = ratio > 1.55 ? Math.min(2, columns) : 1;
  const width = cellWidth * colSpan + gap * (colSpan - 1);
  const height = width / ratio;
  const rowHeight = window.innerWidth <= 600 ? 5 : 7;
  const rowSpan = Math.max(12, Math.ceil((height + gap) / (rowHeight + gap)));
  card.style.gridColumn = `span ${colSpan}`;
  card.style.gridRow = `span ${rowSpan}`;
}

function createCard(photo, index) {
  const card = document.createElement("figure");
  card.className = selected.has(index) ? "photo-card selected" : "photo-card";
  card.dataset.index = String(index);
  const image = document.createElement("img");
  image.src = photo.url;
  image.alt = `Fotografía ${index + 1}`;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("load", () => setCardSpan(card, image));
  image.addEventListener("error", () => card.remove());

  const number = document.createElement("span");
  number.className = "photo-number";
  number.textContent = numberLabel(index);
  card.append(image, number);

  card.addEventListener("click", () => {
    if (selectionMode) {
      selected.has(index) ? selected.delete(index) : selected.add(index);
      updateSelectionUI();
    } else {
      openPhoto(index);
    }
  });
  return card;
}

function openPhoto(index) {
  if (!photos.length) return;
  activeIndex = (index + photos.length) % photos.length;
  const photo = photos[activeIndex];
  lightboxImage.src = photo.url;
  lightboxImage.alt = photo.name;
  document.getElementById("lightbox-caption").textContent =
    `${numberLabel(activeIndex)} / ${numberLabel(photos.length - 1)}`;
  const link = document.getElementById("download-one");
  link.href = photo.url;
  link.download = photo.name;
  lightbox.classList.add("open");
}

function closeLightbox() { lightbox.classList.remove("open"); }

function downloadPhotos(indices, button, defaultLabel) {
  const uniqueIndices = [...new Set(indices)].filter(i => photos[i]);
  if (!uniqueIndices.length) {
    showToast("No hay fotografías para descargar.");
    return;
  }

  if (button) button.disabled = true;

  // Inicia una descarga individual por archivo, espaciadas para evitar
  // que el navegador interprete todos los clics como una ráfaga.
  uniqueIndices.forEach((index, position) => {
    setTimeout(() => {
      const photo = photos[index];
      const link = document.createElement("a");
      link.href = photo.url;
      link.download = photo.name;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (position === uniqueIndices.length - 1 && button) {
        button.disabled = false;
        if (button.id === "download-selected") {
          button.textContent = defaultLabel;
          button.disabled = selected.size === 0;
        }
      }
    }, position * 650);
  });

  showToast(`Iniciando ${uniqueIndices.length} descargas individuales…`);
}

function downloadAll() {
  const button = document.getElementById("download-all");
  downloadPhotos(photos.map((_, index) => index), button);
}

function downloadSelected() {
  const button = document.getElementById("download-selected");
  button.textContent = "Descargando…";
  downloadPhotos([...selected].sort((a, b) => a - b), button, "Descargar selección");
}

async function shareGallery() {
  const data = { title: document.title, text: "Te comparto tu galería de fotografías.", url: location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else if (navigator.clipboard) {
      await navigator.clipboard.writeText(location.href);
      showToast("Enlace copiado.");
    } else showToast("Copia el enlace de la barra del navegador para compartirlo.");
  } catch (error) {
    if (error.name !== "AbortError") showToast("No se pudo compartir el enlace.");
  }
}

function updateLoadStatus() {
  const status = document.getElementById("load-more-status");
  if (!status) return;
  status.textContent = renderedCount < photos.length
    ? `Mostrando ${renderedCount} de ${photos.length} fotografías · Desplázate para ver más`
    : `Has llegado al final · ${photos.length} fotografías`;
}

function loadMorePhotos() {
  if (renderedCount >= photos.length) {
    updateLoadStatus();
    return;
  }
  const next = Math.min(renderedCount + BATCH_SIZE, photos.length);
  for (let index = renderedCount; index < next; index++) {
    gallery.appendChild(createCard(photos[index], index));
  }
  renderedCount = next;
  updateLoadStatus();
}

function loadGallery() {
  photos = IMAGE_FILES
    .map(name => String(name).trim())
    .filter(name => name.length > 0)
    .map(name => ({ name, url: `${IMAGE_FOLDER}/${encodeURIComponent(name).replace(/%2F/gi, "/")}` }));

  if (!photos.length) {
    gallery.innerHTML = "";
    const message = document.createElement("p");
    message.className = "error-message";
    message.textContent = "Agrega los nombres de tus fotografías en IMAGE_FILES, dentro de gallery.js.";
    gallery.appendChild(message);
    document.getElementById("photo-count").textContent = "Agrega tus fotografías";
    return;
  }

  document.getElementById("photo-count").textContent = `${photos.length} fotografías`;
  gallery.innerHTML = "";
  renderedCount = 0;
  loadMorePhotos();

  const sentinel = document.getElementById("load-more-sentinel");
  window.removeEventListener("scroll", onScrollLoadMore);
  if (loadObserver) loadObserver.disconnect();
  if ("IntersectionObserver" in window && sentinel) {
    loadObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) loadMorePhotos();
    }, { rootMargin: "700px 0px" });
    loadObserver.observe(sentinel);
  } else {
    // Fallback for browsers without IntersectionObserver.
    window.addEventListener("scroll", onScrollLoadMore, { passive: true });
  }
}

function onScrollLoadMore() {
  const sentinel = document.getElementById("load-more-sentinel");
  if (!sentinel || renderedCount >= photos.length) return;
  if (sentinel.getBoundingClientRect().top < window.innerHeight + 700) loadMorePhotos();
}

document.getElementById("toggle-select").addEventListener("click", () => {
  selectionMode = !selectionMode;
  if (!selectionMode) selected.clear();
  updateSelectionUI();
});
document.getElementById("select-all").addEventListener("click", () => {
  if (selected.size === photos.length) selected.clear();
  else photos.forEach((_, i) => selected.add(i));
  updateSelectionUI();
  document.getElementById("select-all").textContent =
    selected.size === photos.length ? "Quitar selección" : "Seleccionar todas";
});
document.getElementById("download-selected").addEventListener("click", downloadSelected);
document.getElementById("download-all").addEventListener("click", downloadAll);
document.getElementById("menu-download").addEventListener("click", () => {
  document.getElementById("menu-panel").hidden = true;
  downloadAll();
});
document.getElementById("share-gallery").addEventListener("click", shareGallery);
document.getElementById("menu-toggle").addEventListener("click", () => {
  const panel = document.getElementById("menu-panel");
  panel.hidden = !panel.hidden;
});
document.getElementById("menu-about").addEventListener("click", () => {
  document.getElementById("menu-panel").hidden = true;
});
document.getElementById("close-lightbox").addEventListener("click", closeLightbox);
document.getElementById("previous-photo").addEventListener("click", () => openPhoto(activeIndex - 1));
document.getElementById("next-photo").addEventListener("click", () => openPhoto(activeIndex + 1));
lightbox.addEventListener("click", event => { if (event.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", event => {
  if (!lightbox.classList.contains("open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") openPhoto(activeIndex - 1);
  if (event.key === "ArrowRight") openPhoto(activeIndex + 1);
});
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    gallery.querySelectorAll(".photo-card img").forEach(image => {
      if (image.complete && image.naturalWidth) setCardSpan(image.parentElement, image);
    });
  }, 120);
});

loadGallery();
