/*
 * Galería de XV años.
 * Las vistas previas se muestran desde images/<sección>/preview/.
 * Las descargas originales se obtienen desde downloads/<sección>/.
 * Agrega cada pareja de nombres en los arreglos correspondientes.
 */
const GALLERY_SECTIONS = {
  ceremonia: {
    label: "Ceremonia",
    photos: [
      // { name: "DSC00001.jpg", preview: "DSC00001.webp" },
    ],
  },
  recepcion: {
    label: "Recepción",
    photos: [
      // { name: "DSC00002.jpg", preview: "DSC00002.webp" },
    ],
  },
};

const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const selected = new Set();
let activeSection = "ceremonia";
let photos = [];
let activeIndex = 0;
let selectionMode = false;
let renderedCount = 0;
const BATCH_SIZE = 30;
let loadObserver;

function previewPath(section, photo) {
  return `images/${section}/preview/${encodeURIComponent(photo.preview || photo.name)}`;
}
function downloadPath(section, photo) {
  return `downloads/${section}/${encodeURIComponent(photo.name)}`;
}
function numberLabel(index) { return String(index + 1).padStart(2, "0"); }

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
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
  const cellWidth = (gallery.clientWidth - gap * (columns - 1)) / columns;
  const ratio = image.naturalWidth / image.naturalHeight || 1;
  const colSpan = ratio > 1.55 ? Math.min(2, columns) : 1;
  const width = cellWidth * colSpan + gap * (colSpan - 1);
  const height = width / ratio;
  const rowHeight = window.innerWidth <= 600 ? 5 : 7;
  card.style.gridColumn = `span ${colSpan}`;
  card.style.gridRow = `span ${Math.max(12, Math.ceil((height + gap) / (rowHeight + gap)))}`;
}

function createCard(photo, index) {
  const card = document.createElement("figure");
  card.className = selected.has(index) ? "photo-card selected" : "photo-card";
  card.dataset.index = String(index);
  const image = document.createElement("img");
  image.src = previewPath(activeSection, photo);
  image.alt = `Fotografía ${index + 1}`;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("load", () => setCardSpan(card, image));
  image.addEventListener("error", () => {
    card.classList.add("missing-image");
    image.alt = `No se encontró la vista previa: ${photo.preview || photo.name}`;
  });
  const number = document.createElement("span");
  number.className = "photo-number";
  number.textContent = numberLabel(index);
  card.append(image, number);
  card.addEventListener("click", () => {
    if (selectionMode) {
      selected.has(index) ? selected.delete(index) : selected.add(index);
      updateSelectionUI();
    } else openPhoto(index);
  });
  return card;
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

function onScrollLoadMore() {
  const sentinel = document.getElementById("load-more-sentinel");
  if (!sentinel || renderedCount >= photos.length) return;
  if (sentinel.getBoundingClientRect().top < window.innerHeight + 700) loadMorePhotos();
}

function setupInfiniteScroll() {
  const sentinel = document.getElementById("load-more-sentinel");
  window.removeEventListener("scroll", onScrollLoadMore);
  if (loadObserver) loadObserver.disconnect();
  if ("IntersectionObserver" in window && sentinel) {
    loadObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) loadMorePhotos();
    }, { rootMargin: "700px 0px" });
    loadObserver.observe(sentinel);
  } else {
    window.addEventListener("scroll", onScrollLoadMore, { passive: true });
  }
}

function renderSection(section) {
  activeSection = section;
  photos = GALLERY_SECTIONS[section].photos;
  selected.clear();
  document.getElementById("select-all").textContent = "Seleccionar todas";
  updateSelectionUI();
  document.querySelectorAll(".section-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.tab === section));
  document.getElementById("photo-count").textContent =
    `${photos.length} ${photos.length === 1 ? "fotografía" : "fotografías"} · ${GALLERY_SECTIONS[section].label}`;

  gallery.innerHTML = "";
  if (!photos.length) {
    const empty = document.createElement("p");
    empty.className = "error-message";
    empty.textContent = `Todavía no hay fotografías cargadas en ${GALLERY_SECTIONS[section].label.toLowerCase()}.`;
    gallery.appendChild(empty);
    return;
  }
  renderedCount = 0;
  loadMorePhotos();
  setupInfiniteScroll();
}

function openPhoto(index) {
  if (!photos.length) return;
  activeIndex = (index + photos.length) % photos.length;
  const photo = photos[activeIndex];
  lightboxImage.src = previewPath(activeSection, photo);
  lightboxImage.alt = photo.name;
  document.getElementById("lightbox-caption").textContent = `${numberLabel(activeIndex)} / ${numberLabel(photos.length - 1)}`;
  const link = document.getElementById("download-one");
  link.href = downloadPath(activeSection, photo);
  link.download = photo.name;
  lightbox.classList.add("open");
}
function closeLightbox() { lightbox.classList.remove("open"); }

function downloadPhotos(indices, button, defaultLabel) {
  const sectionAtStart = activeSection;
  const photosAtStart = [...photos];
  const unique = [...new Set(indices)].filter(index => photosAtStart[index]);
  if (!unique.length) { showToast("No hay fotografías para descargar."); return; }
  if (button) button.disabled = true;

  unique.forEach((index, position) => {
    setTimeout(() => {
      const photo = photosAtStart[index];
      const link = document.createElement("a");
      link.href = downloadPath(sectionAtStart, photo);
      link.download = photo.name;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (position === unique.length - 1 && button) {
        button.disabled = false;
        if (button.id === "download-selected") {
          button.textContent = defaultLabel;
          button.disabled = selected.size === 0;
        }
      }
    }, position * 650);
  });
  showToast(`Iniciando ${unique.length} descargas en alta calidad…`);
}

function downloadAll() {
  downloadPhotos(photos.map((_, index) => index), document.getElementById("download-all"));
}
function downloadSelected() {
  const button = document.getElementById("download-selected");
  button.textContent = "Descargando…";
  downloadPhotos([...selected].sort((a, b) => a - b), button, "Descargar selección");
}
async function shareGallery() {
  const data = { title: document.title, text: "Te comparto la galería de XV años.", url: location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else if (navigator.clipboard) { await navigator.clipboard.writeText(location.href); showToast("Enlace copiado."); }
    else showToast("Copia el enlace de la barra del navegador para compartirlo.");
  } catch (error) { if (error.name !== "AbortError") showToast("No se pudo compartir el enlace."); }
}

document.querySelectorAll(".section-tab").forEach(tab => tab.addEventListener("click", () => renderSection(tab.dataset.tab)));
document.getElementById("toggle-select").addEventListener("click", () => {
  selectionMode = !selectionMode;
  if (!selectionMode) selected.clear();
  updateSelectionUI();
});
document.getElementById("select-all").addEventListener("click", () => {
  if (selected.size === photos.length) selected.clear();
  else photos.forEach((_, index) => selected.add(index));
  updateSelectionUI();
  document.getElementById("select-all").textContent = selected.size === photos.length ? "Quitar selección" : "Seleccionar todas";
});
document.getElementById("download-selected").addEventListener("click", downloadSelected);
document.getElementById("download-all").addEventListener("click", downloadAll);
document.getElementById("share-gallery").addEventListener("click", shareGallery);
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
  resizeTimer = setTimeout(() => gallery.querySelectorAll(".photo-card img").forEach(image => {
    if (image.complete && image.naturalWidth) setCardSpan(image.parentElement, image);
  }), 120);
});

renderSection("ceremonia");
