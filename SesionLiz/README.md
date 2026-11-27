# A Birthday to Remember — Galería

Galería fotográfica de estilo minimalista: fondo blanco, navegación superior, título centrado y mosaico fotográfico de distintas proporciones. La identidad visual muestra **Franco Flores · Fotografía**.

## Estructura

```text
birthday-gallery/
├── index.html
├── styles.css
├── gallery.js
└── images/
    ├── DSC01234.jpg
    ├── IMG_2026.jpg
    └── ...
```

## Agregar fotografías

1. Copia tus fotografías dentro de la carpeta `images/`.
2. Abre `gallery.js`.
3. La lista de tus 31 fotografías ya está cargada en el arreglo `IMAGE_FILES`. Si agregas más, escribe el nombre exacto de cada archivo, incluyendo su extensión:

```js
const IMAGE_FILES = [
  "DSC01234.jpg",
  "IMG_2026.jpg",
  "foto-abc.webp",
];
```

No necesitas renombrar las fotos. Puedes usar nombres aleatorios u originales de cámara. No se utiliza ningún archivo JSON, API ni servicio externo para descubrir las imágenes: el navegador carga cada archivo desde la ruta relativa `images/nombre-del-archivo`.

Formatos admitidos: `.jpg`, `.jpeg`, `.png`, `.webp` y `.avif`.

## Publicar en GitHub Pages

1. Sube `index.html`, `styles.css`, `gallery.js` y la carpeta `images/` a la raíz de un repositorio.
2. En GitHub abre **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**, selecciona `main` y la carpeta `/(root)`.
4. Guarda y espera a que GitHub publique el sitio.

## Funciones

- Mosaico adaptable a escritorio y móvil.
- Visor de fotografías con navegación por flechas y teclado.
- Descarga individual.
- Modo **Seleccionar** para elegir fotografías y descargar solo esa selección en ZIP.
- Descarga de todas las fotografías como archivos individuales (sin ZIP).
- Compartir enlace de la galería.

Las descargas múltiples se realizan como archivos individuales; el navegador puede pedir permiso para permitir varias descargas. La visualización de las fotografías no requiere API.

## Carga progresiva

La galería usa scroll infinito: muestra hasta 30 fotografías por lote y agrega el siguiente lote al acercarte al final. Las imágenes usan carga diferida. Las descargas siguen incluyendo todos los archivos de la galería o sección, no solo los que ya aparecen en pantalla.
