# XV años de Emireth — Franco Flores

Galería con dos pestañas: **Ceremonia** y **Recepción**. Conserva el estilo blanco y minimalista de la galería de Liz.

## Estructura de carpetas

```text
15Anos/
├── index.html
├── styles.css
├── gallery.js
├── images/
│   ├── ceremonia/preview/   # Imágenes ligeras para mostrar
│   └── recepcion/preview/   # Imágenes ligeras para mostrar
└── downloads/
    ├── ceremonia/           # Originales en alta resolución
    └── recepcion/           # Originales en alta resolución
```

## Cómo agregar cada fotografía

En `gallery.js`, agrega una entrada en la pestaña correspondiente:

```js
const GALLERY_SECTIONS = {
  ceremonia: {
    label: "Ceremonia",
    photos: [
      { name: "DSC00001.jpg", preview: "DSC00001.webp" },
    ],
  },
  recepcion: {
    label: "Recepción",
    photos: [
      { name: "DSC00002.jpg", preview: "DSC00002.webp" },
    ],
  },
};
```

- `name`: nombre del archivo original de alta resolución. Debe existir en `downloads/<sección>/`.
- `preview`: nombre del archivo ligero que se mostrará. Debe existir en `images/<sección>/preview/`.
- Los dos archivos pueden tener extensiones distintas. Si ambos tienen el mismo nombre, `preview` puede omitirse.

Ejemplo de pareja:
- Vista previa: `images/ceremonia/preview/DSC00001.webp`
- Descarga original: `downloads/ceremonia/DSC00001.jpg`

La galería muestra y abre la versión ligera. El botón de descarga individual, la descarga de todas y la selección descargan los originales de alta resolución. Las descargas son individuales, no ZIP.

## Publicación

Sube la carpeta `15Anos` completa a `FrancoFlores/15Anos/` dentro del mismo repositorio de GitHub Pages.

URL esperada:
`https://TU-USUARIO.github.io/FrancoFlores/15Anos/`

El navegador puede pedir permiso para permitir varias descargas al descargar una selección o toda una pestaña.

## Carga progresiva

La galería usa scroll infinito: muestra hasta 30 fotografías por lote y agrega el siguiente lote al acercarte al final. Las imágenes usan carga diferida. Las descargas siguen incluyendo todos los archivos de la galería o sección, no solo los que ya aparecen en pantalla.
