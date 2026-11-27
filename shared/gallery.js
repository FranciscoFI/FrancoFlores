
/*
 * Galería compartida para todas las sesiones.
 * La configuración y las fotografías se cargan desde gallery.config.js.
 *
 * Estructura de imágenes:
 * images/
 *   ceremonia/
 *     DSC00001.jpg
 *   recepcion/
 *     DSC00002.jpg
 */

const CONFIG = window.GALLERY_CONFIG;

if (!CONFIG) {
  throw new Error("No se encontró window.GALLERY_CONFIG. Revisa gallery.config.js.");
}

// --------------------------------------------------
// Configuración y elementos
// --------------------------------------------------

const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");

const selected = new Set();

let photos = [];
let activeIndex = 0;
let activeSection = Object.keys(CONFIG.sections || {})[0];
let selectionMode = false;
let renderedCount = 0;
let loadObserver = null;
let lightboxHistoryEntry = false;

const BATCH_SIZE = 15;
const IMAGE_FOLDER = CONFIG.imageFolder || "images";
console.log("CONFIG:", CONFIG);
console.log("Ruta de prueba:", 
  `${CONFIG.imageFolder}/ceremonia/DSC07607.jpg`
);

const sectionTabs = document.getElementById("section-tabs");

// --------------------------------------------------
// Utilidades
// --------------------------------------------------

function numberLabel(index) {
  return String(index + 1).padStart(2, "0");
}

function imagePath(section, filename) {
  return `${IMAGE_FOLDER}/${section}/${encodeURIComponent(filename)}`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// --------------------------------------------------
// Secciones
// --------------------------------------------------

function renderSectionTabs() {
  document.querySelectorAll("[data-tab]").forEach(button => {
    const sectionKey = button.dataset.tab;

    button.hidden = !CONFIG.sections[sectionKey];

    button.classList.toggle(
      "active",
      sectionKey === activeSection
    );
  });
}

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    renderSection(button.dataset.tab);
  });
});

function renderSection(sectionKey) {
  if (!CONFIG.sections[sectionKey]) return;

  activeSection = sectionKey;
  selected.clear();
  selectionMode = false;

  const section = CONFIG.sections[sectionKey];

  photos = (section.photos || [])
    .map(name => String(name).trim())
    .filter(Boolean)
    .map(name => ({
      name,
      section: sectionKey,
      url: imagePath(sectionKey, name)
    }));

  renderedCount = 0;
  activeIndex = 0;

  if (lightbox.classList.contains("open")) {
    closeLightbox();
  }

  gallery.innerHTML = "";

  renderSectionTabs();
  updateSelectionUI();

  const photoCount = document.getElementById("photo-count");

  if (photoCount) {
    photoCount.textContent = `${photos.length} fotografías`;
  }

  if (!photos.length) {
    const message = document.createElement("p");
    message.className = "error-message";
    message.textContent = "Esta sección todavía no tiene fotografías.";
    gallery.appendChild(message);

    updateLoadStatus();
    return;
  }

  loadMorePhotos();
  setupInfiniteScroll();
  updateLoadStatus();
}

// --------------------------------------------------
// Tarjetas de fotografías
// --------------------------------------------------

function setCardSpan(card, image) {
  const columns = window.innerWidth <= 600
    ? 2
    : window.innerWidth <= 900
      ? 4
      : 5;

  const gap = window.innerWidth <= 600 ? 2 : 3;
  const gridWidth = gallery.clientWidth;
  const cellWidth = (gridWidth - gap * (columns - 1)) / columns;
  const ratio = image.naturalWidth / image.naturalHeight || 1;

  const colSpan = ratio > 1.55 ? Math.min(2, columns) : 1;
  const width = cellWidth * colSpan + gap * (colSpan - 1);
  const height = width / ratio;

  const rowHeight = window.innerWidth <= 600 ? 5 : 7;
  const rowSpan = Math.max(
    12,
    Math.ceil((height + gap) / (rowHeight + gap))
  );

  card.style.gridColumn = `span ${colSpan}`;
  card.style.gridRow = `span ${rowSpan}`;
}

function createCard(photo, index) {
  const card = document.createElement("figure");

  card.className = selected.has(index)
    ? "photo-card selected"
    : "photo-card";

  card.dataset.index = String(index);

  const image = document.createElement("img");

  image.src = photo.url;
  image.alt = `Fotografía ${index + 1}`;
  image.loading = "lazy";
  image.decoding = "async";

  image.addEventListener("load", () => {
    setCardSpan(card, image);
  });

  image.addEventListener("error", () => {
    card.remove();
  });

  const number = document.createElement("span");

  number.className = "photo-number";
  number.textContent = numberLabel(index);

  card.append(image, number);

  card.addEventListener("click", () => {
    if (selectionMode) {
      selected.has(index)
        ? selected.delete(index)
        : selected.add(index);

      updateSelectionUI();
    } else {
      openPhoto(index);
    }
  });

  return card;
}

// --------------------------------------------------
// Lightbox
// --------------------------------------------------

function openPhoto(index, fromHistory = false) {
  if (!photos.length) return;

  // No permite salir de los límites de la sección.
  if (index < 0 || index >= photos.length) return;

  activeIndex = index;

  const photo = photos[activeIndex];

  lightboxImage.src = photo.url;
  lightboxImage.alt = photo.name;

  document.getElementById("lightbox-caption").textContent =
    `${numberLabel(activeIndex)} / ${numberLabel(photos.length)}`;

  const downloadLink = document.getElementById("download-one");

  downloadLink.href = photo.url;
  downloadLink.download = photo.name;

  lightbox.classList.add("open");

  if (!lightboxHistoryEntry && !fromHistory) {
    history.pushState(
      { lightbox: true },
      "",
      location.href
    );

    lightboxHistoryEntry = true;
  }
}

function closeLightbox(fromPopState = false) {
  if (!lightbox.classList.contains("open")) return;

  lightbox.classList.remove("open");

  if (lightboxHistoryEntry) {
    lightboxHistoryEntry = false;

    if (!fromPopState) {
      history.back();
    }
  }
}

window.addEventListener("popstate", () => {
  if (lightbox.classList.contains("open")) {
    closeLightbox(true);
  }
});

// --------------------------------------------------
// Swipe en dispositivos móviles
// --------------------------------------------------

let touchStartX = 0;
let touchStartY = 0;

lightbox.addEventListener("touchstart", event => {
  const touch = event.changedTouches[0];

  touchStartX = touch.screenX;
  touchStartY = touch.screenY;
}, { passive: true });

lightbox.addEventListener("touchend", event => {
  const touch = event.changedTouches[0];

  const deltaX = touch.screenX - touchStartX;
  const deltaY = touch.screenY - touchStartY;

  if (Math.abs(deltaX) < 50) return;
  if (Math.abs(deltaY) > Math.abs(deltaX)) return;

  if (deltaX < 0) {
    openPhoto(activeIndex + 1);
  } else {
    openPhoto(activeIndex - 1);
  }
}, { passive: true });

// --------------------------------------------------
// Selección de fotografías
// --------------------------------------------------

function updateSelectionUI() {
  const count = document.getElementById("selected-count");
  const downloadButton = document.getElementById("download-selected");
  const toggleButton = document.getElementById("toggle-select");
  const tools = document.getElementById("selection-tools");

  if (count) {
    count.textContent =
      `${selected.size} ${
        selected.size === 1
          ? "fotografía seleccionada"
          : "fotografías seleccionadas"
      }`;
  }

  if (downloadButton) {
    downloadButton.disabled = selected.size === 0;
  }

  if (toggleButton) {
    toggleButton.textContent = selectionMode ? "Cancelar" : "Seleccionar";
  }

  if (tools) {
    tools.hidden = !selectionMode;
  }

  gallery.querySelectorAll(".photo-card").forEach(card => {
    card.classList.toggle(
      "selected",
      selected.has(Number(card.dataset.index))
    );
  });

  const selectAllButton = document.getElementById("select-all");

  if (selectAllButton) {
    selectAllButton.textContent =
      selected.size === photos.length && photos.length
        ? "Quitar selección"
        : "Seleccionar todas";
  }
}

// --------------------------------------------------
// Descargas
// --------------------------------------------------

function downloadPhotos(indices, button, defaultLabel) {
  const uniqueIndices = [...new Set(indices)].filter(i => photos[i]);

  if (!uniqueIndices.length) {
    showToast("No hay fotografías para descargar.");
    return;
  }

  if (button) button.disabled = true;

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
  if (!photos.length) {
    showToast("No hay fotografías para descargar.");
    return;
  }

  const modal = document.getElementById("download-confirm-modal");
  const message = document.getElementById("download-modal-message");

  message.textContent =
    `Se descargarán las ${photos.length} fotografías de esta sección. ` +
    "Los archivos se descargarán individualmente.";

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeDownloadModal() {
  const modal = document.getElementById("download-confirm-modal");

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function confirmDownloadAll() {
  closeDownloadModal();

  downloadPhotos(
    photos.map((_, index) => index),
    document.getElementById("download-all"),
    "Descargar todas"
  );
}


function downloadSelected() {
  const button = document.getElementById("download-selected");

  button.textContent = "Descargando…";

  downloadPhotos(
    [...selected].sort((a, b) => a - b),
    button,
    "Descargar selección"
  );
}

// --------------------------------------------------
// Carga progresiva
// --------------------------------------------------

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

  const next = Math.min(
    renderedCount + BATCH_SIZE,
    photos.length
  );

  for (let index = renderedCount; index < next; index++) {
    gallery.appendChild(createCard(photos[index], index));
  }

  renderedCount = next;
  updateLoadStatus();
}

function onScrollLoadMore() {
  const sentinel = document.getElementById("load-more-sentinel");

  if (!sentinel || renderedCount >= photos.length) return;

  if (sentinel.getBoundingClientRect().top < window.innerHeight + 700) {
    loadMorePhotos();
  }
}

function setupInfiniteScroll() {
  const sentinel = document.getElementById("load-more-sentinel");

  window.removeEventListener("scroll", onScrollLoadMore);

  if (loadObserver) {
    loadObserver.disconnect();
    loadObserver = null;
  }

  if (!sentinel) return;

  if ("IntersectionObserver" in window) {
    loadObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        loadMorePhotos();
      }
    }, {
      rootMargin: "700px 0px"
    });

    loadObserver.observe(sentinel);
  } else {
    window.addEventListener("scroll", onScrollLoadMore, {
      passive: true
    });
  }
}

// --------------------------------------------------
// Compartir galería
// --------------------------------------------------

async function shareGallery() {
  const data = {
    title: document.title,
    text: "Te comparto tu galería de fotografías.",
    url: location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(data);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(location.href);
      showToast("Enlace copiado.");
    } else {
      showToast("Copia el enlace de la barra del navegador para compartirlo.");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      showToast("No se pudo compartir el enlace.");
    }
  }
}

// --------------------------------------------------
// Eventos de interfaz
// --------------------------------------------------

document.getElementById("toggle-select").addEventListener("click", () => {
  selectionMode = !selectionMode;

  if (!selectionMode) selected.clear();

  updateSelectionUI();
});

document.getElementById("select-all").addEventListener("click", () => {
  if (selected.size === photos.length) {
    selected.clear();
  } else {
    photos.forEach((_, index) => selected.add(index));
  }

  updateSelectionUI();
});

document.getElementById("close-lightbox")
  .addEventListener("click", () => closeLightbox());

document.getElementById("previous-photo")
  .addEventListener("click", () => openPhoto(activeIndex - 1));

document.getElementById("next-photo")
  .addEventListener("click", () => openPhoto(activeIndex + 1));

lightbox.addEventListener("click", event => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", event => {
  if (!lightbox.classList.contains("open")) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") openPhoto(activeIndex - 1);
  if (event.key === "ArrowRight") openPhoto(activeIndex + 1);
});


document.getElementById("download-all")
  .addEventListener("click", downloadAll);

document.getElementById("confirm-download")
  .addEventListener("click", confirmDownloadAll);

document.getElementById("cancel-download")
  .addEventListener("click", closeDownloadModal);

document.getElementById("cancel-download-x")
  .addEventListener("click", closeDownloadModal);

document.querySelector("[data-close-download-modal]")
  .addEventListener("click", closeDownloadModal);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeDownloadModal();
  }
});


// --------------------------------------------------
// Ajuste de tarjetas al cambiar el tamaño
// --------------------------------------------------

let resizeTimer;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    gallery.querySelectorAll(".photo-card img").forEach(image => {
      if (image.complete && image.naturalWidth) {
        setCardSpan(image.parentElement, image);
      }
    });
  }, 120);
});

// --------------------------------------------------
// Inicialización
// --------------------------------------------------

if (CONFIG.title) {
  document.title = CONFIG.title;
}

const titleElement = document.getElementById("gallery-title");

if (titleElement && CONFIG.title) {
  titleElement.textContent = CONFIG.title;
}

if (activeSection) {
  renderSection(activeSection);
}
