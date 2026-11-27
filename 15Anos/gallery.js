
/*
 * Galería de XV años.
 * Las vistas previas se muestran desde images/<sección>/preview/.
 * Las descargas originales se obtienen desde downloads/<sección>/.
 */

const GALLERY_SECTIONS = {
  ceremonia: {
    label: "Ceremonia",
    photos: [
      "DSC07607.jpg",
      "DSC07631.jpg",
      "DSC07632.jpg",
      "DSC07634.jpg",
      "DSC07638.jpg",
      "DSC07640.jpg",
      "DSC07641.jpg",
      "DSC07642.jpg",
      "DSC07648.jpg",
      "DSC07652.jpg",
      "DSC07654.jpg",
      "DSC07655.jpg",
      "DSC07660.jpg",
      "DSC07661.jpg",
      "DSC07663.jpg",
      "DSC07664.jpg",
      "DSC07667.jpg",
      "DSC07668.jpg",
      "DSC07669.jpg",
      "DSC07673.jpg",
      "DSC07685.jpg",
      "DSC07691.jpg",
      "DSC07693.jpg",
      "DSC07694.jpg",
      "DSC07705.jpg",
      "DSC07707.jpg",
      "DSC07713.jpg",
      "DSC07714.jpg",
      "DSC07718.jpg",
      "DSC07722.jpg",
      "DSC07729.jpg",
      "DSC07729-2.jpg",
      "DSC07732.jpg",
      "DSC07746.jpg",
      "DSC07752.jpg",
      "DSC07753.jpg",
      "DSC07757.jpg",
      "DSC07762.jpg",
      "DSC07764.jpg",
      "DSC07766.jpg",
      "DSC07766-2.jpg",
      "DSC07771.jpg",
      "DSC07773.jpg",
      "DSC07778.jpg",
      "DSC07780.jpg",
      "DSC07782.jpg",
      "DSC07784.jpg",
      "DSC07786.jpg",
      "DSC07787.jpg",
      "DSC07790.jpg",
      "DSC07792.jpg",
      "DSC07796.jpg",
      "DSC07797.jpg",
      "DSC07800.jpg",
      "DSC07802.jpg",
      "DSC07812.jpg",
      "DSC07820.jpg",
      "DSC07828.jpg",
      "DSC07831.jpg",
      "DSC07836.jpg",
      "DSC07843.jpg",
      "DSC07846.jpg",
      "DSC07847.jpg",
      "DSC07849.jpg",
      "DSC07850.jpg",
      "DSC07852.jpg",
      "DSC07871.jpg"
    ]
  },

  recepcion: {
    label: "Recepción",
    photos: []
  }
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

const BATCH_SIZE = 20;
let loadObserver;

// Rutas
function imagePath(section, photo) {
  return `images/${section}/${encodeURIComponent(photo)}`;
}

function numberLabel(index) {
  return String(index + 1).padStart(2, "0");
}

// Notificaciones
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// Selección
function updateSelectionUI() {
  document.getElementById("selected-count").textContent =
    `${selected.size} ${selected.size === 1 ? "fotografía seleccionada" : "fotografías seleccionadas"}`;

  document.getElementById("download-selected").disabled =
    selected.size === 0;

  document.getElementById("toggle-select").textContent =
    selectionMode ? "Cancelar" : "Seleccionar";

  document.getElementById("selection-tools").hidden =
    !selectionMode;

  gallery.querySelectorAll(".photo-card").forEach(card => {
    card.classList.toggle(
      "selected",
      selected.has(Number(card.dataset.index))
    );
  });
}

// Distribución masonry
function setCardSpan(card, image) {
  const columns =
    window.innerWidth <= 600 ? 2 :
    window.innerWidth <= 900 ? 4 : 5;

  const gap = window.innerWidth <= 600 ? 2 : 3;

  const cellWidth =
    (gallery.clientWidth - gap * (columns - 1)) / columns;

  const ratio = image.naturalWidth / image.naturalHeight || 1;

  const colSpan = ratio > 1.55 ? Math.min(2, columns) : 1;

  const width = cellWidth * colSpan + gap * (colSpan - 1);
  const height = width / ratio;

  const rowHeight = window.innerWidth <= 600 ? 5 : 7;

  card.style.gridColumn = `span ${colSpan}`;

  card.style.gridRow =
    `span ${Math.max(12, Math.ceil((height + gap) / (rowHeight + gap)))}`;
}

// Crear tarjeta
function createCard(photo, index) {
  const card = document.createElement("figure");

  card.className = selected.has(index)
    ? "photo-card selected"
    : "photo-card";

  card.dataset.index = String(index);

  const image = document.createElement("img");

  image.src = imagePath(activeSection, photo);
  image.alt = `Fotografía ${index + 1}`;
  image.loading = "lazy";
  image.decoding = "async";

  image.addEventListener("load", () => {
    setCardSpan(card, image);
  });

  image.addEventListener("error", () => {
    card.classList.add("missing-image");
    image.alt = `No se encontró la vista previa: ${photo}`;
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

// Scroll infinito
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
  }

  if ("IntersectionObserver" in window && sentinel) {
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

// Cambiar sección
function renderSection(section) {
  if (lightbox.classList.contains("open")) {
    closeLightbox();
  }

  activeSection = section;
  photos = GALLERY_SECTIONS[section].photos;

  selected.clear();

  document.getElementById("select-all").textContent =
    "Seleccionar todas";

  updateSelectionUI();

  document.querySelectorAll(".section-tab").forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.tab === section
    );
  });

  document.getElementById("photo-count").textContent =
    `${photos.length} ${photos.length === 1 ? "fotografía" : "fotografías"} · ${GALLERY_SECTIONS[section].label}`;

  gallery.innerHTML = "";

  if (!photos.length) {
    const empty = document.createElement("p");

    empty.className = "error-message";

    empty.textContent =
      `Todavía no hay fotografías cargadas en ${GALLERY_SECTIONS[section].label.toLowerCase()}.`;

    gallery.appendChild(empty);

    renderedCount = 0;
    updateLoadStatus();

    return;
  }

  renderedCount = 0;

  loadMorePhotos();
  setupInfiniteScroll();
}

// Historial del visor
let lightboxHistoryEntry = false;

// Abrir fotografía
function openPhoto(index) {
  if (!photos.length) return;

  // Agregar una entrada al historial únicamente al abrir el visor.
  if (!lightbox.classList.contains("open") && !lightboxHistoryEntry) {
    history.pushState(
      {
        ...(history.state || {}),
        galleryLightbox: true
      },
      "",
      location.href
    );

    lightboxHistoryEntry = true;
  }

  activeIndex = (index + photos.length) % photos.length;

  const photo = photos[activeIndex];

  lightboxImage.src = imagePath(activeSection, photo);
  lightboxImage.alt = photo;

  document.getElementById("lightbox-caption").textContent =
    `${numberLabel(activeIndex)} / ${numberLabel(photos.length - 1)}`;

  const link = document.getElementById("download-one");

  link.href = imagePath(activeSection, photo);
  link.download = photo;

  lightbox.classList.add("open");
}

// Cerrar visor
function closeLightbox(fromPopState = false) {
  if (!lightbox.classList.contains("open")) return;

  lightbox.classList.remove("open");

  if (fromPopState) {
    lightboxHistoryEntry = false;
    return;
  }

  if (lightboxHistoryEntry) {
    lightboxHistoryEntry = false;
    history.back();
  }
}

// Botón Atrás del celular
window.addEventListener("popstate", () => {
  if (lightbox.classList.contains("open")) {
    closeLightbox(true);
  } else {
    lightboxHistoryEntry = false;
  }
});

// Gestos táctiles
let touchStartX = 0;
let touchStartY = 0;

lightboxImage.addEventListener("touchstart", event => {
  if (!lightbox.classList.contains("open") || !event.touches.length) {
    return;
  }

  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}, {
  passive: true
});

lightboxImage.addEventListener("touchend", event => {
  if (!lightbox.classList.contains("open") || !event.changedTouches.length) {
    return;
  }

  const deltaX = event.changedTouches[0].clientX - touchStartX;
  const deltaY = event.changedTouches[0].clientY - touchStartY;

  // Evitar confundir el desplazamiento vertical con un gesto horizontal.
  if (
    Math.abs(deltaX) < 50 ||
    Math.abs(deltaX) < Math.abs(deltaY) * 1.2
  ) {
    return;
  }

  if (deltaX < 0) {
    openPhoto(activeIndex + 1);
  } else {
    openPhoto(activeIndex - 1);
  }
}, {
  passive: true
});

// Descargas
function downloadPhotos(indices, button, defaultLabel) {
  const sectionAtStart = activeSection;
  const photosAtStart = [...photos];

  const unique = [...new Set(indices)].filter(index =>
    photosAtStart[index]
  );

  if (!unique.length) {
    showToast("No hay fotografías para descargar.");
    return;
  }

  if (button) button.disabled = true;

  unique.forEach((index, position) => {
    setTimeout(() => {
      const photo = photosAtStart[index];

      const link = document.createElement("a");

      link.href = imagePath(sectionAtStart, photo);
      link.download = photo;
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

  showToast(
    `Iniciando ${unique.length} descargas en alta calidad…`
  );
}

function downloadAll() {
  downloadPhotos(
    photos.map((_, index) => index),
    document.getElementById("download-all")
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

// Compartir galería
async function shareGallery() {
  const data = {
    title: document.title,
    text: "Te comparto la galería de XV años.",
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

// Eventos
document.querySelectorAll(".section-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    renderSection(tab.dataset.tab);
  });
});

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

  document.getElementById("select-all").textContent =
    selected.size === photos.length
      ? "Quitar selección"
      : "Seleccionar todas";
});

document.getElementById("download-selected").addEventListener(
  "click",
  downloadSelected
);

document.getElementById("download-all").addEventListener(
  "click",
  downloadAll
);

document.getElementById("share-gallery").addEventListener(
  "click",
  shareGallery
);

document.getElementById("close-lightbox").addEventListener(
  "click",
  () => closeLightbox()
);

document.getElementById("previous-photo").addEventListener(
  "click",
  () => openPhoto(activeIndex - 1)
);

document.getElementById("next-photo").addEventListener(
  "click",
  () => openPhoto(activeIndex + 1)
);

lightbox.addEventListener("click", event => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", event => {
  if (!lightbox.classList.contains("open")) return;

  if (event.key === "Escape") {
    closeLightbox();
  }

  if (event.key === "ArrowLeft") {
    openPhoto(activeIndex - 1);
  }

  if (event.key === "ArrowRight") {
    openPhoto(activeIndex + 1);
  }
});

// Recalcular distribución al cambiar tamaño
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

// Inicializar
renderSection("ceremonia");
