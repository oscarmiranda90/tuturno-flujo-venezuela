# Plugin TuTurno · Pantallas editables v20

Genera 37 pantallas y estados del catálogo actual, incluidos los cinco testimonios del inicio. Cada pantalla mide 360 × 800 px, como la referencia base del código. Los textos son capas de texto, los iconos e ilustraciones SVG son vectores, y tarjetas, bordes y degradados son capas independientes. Las fotografías y las ilustraciones que ya son imágenes en la aplicación se conservan como rellenos de imagen reemplazables.

## Instalar en Figma Desktop

1. Descomprime `TuTurno-Plugin-Figma-v20.zip`.
2. Abre un archivo de Figma Design donde puedas editar.
3. Ve a **Plugins → Development → Import plugin from manifest…** y selecciona `figma-plugin/manifest.json`.
4. Ejecuta **TuTurno · Pantallas editables v20** desde **Plugins → Development**.
5. Elige todo el catálogo, el login con el paseo guiado o una pantalla concreta. Pulsa **Generar pantallas editables**.

El plugin funciona sin conexión y no requiere claves. Puedes volver a ejecutarlo: cada ejecución añade un lote independiente y conserva el contenido existente. **Cancelar generación** retira únicamente el lote en curso.

Si Figma informa que falta Outfit o Inter, instala los archivos de `Fuentes` con Catálogo Tipográfico, reinicia Figma y vuelve a ejecutar el plugin. Las licencias originales de las fuentes se incluyen en esa carpeta. Se exige la fuente correcta para conservar las medidas; no se sustituye silenciosamente.

## Qué se entrega

- `manifest.json`: entrada para importar el plugin local.
- `code.js`: plugin listo para ejecutar, con el catálogo y las imágenes incorporados.
- `ui.html`: selector de pantallas, columnas, progreso y cancelación.
- `Fuentes/`: tipografías originales y sus licencias.

Las pantallas representan estados estáticos del flujo. El plugin crea capas editables; las animaciones y el audio continúan en la [aplicación web](https://tuturno-flujo-venezuela.tiamat-agency.workers.dev) y el [Storybook](https://tuturno-storybook.pages.dev/?path=/story/venezuela-v20-flujo-aprobado--start).

El catálogo se obtiene de la geometría y los estilos renderizados del código del repositorio. No se utilizan capturas de pantalla como fondo de las pantallas. Los textos se conservan por línea para respetar los saltos del diseño. Las fotografías tienen incorporado su recorte y la máscara de transparencia del login.

Este es un plugin local de desarrollo. La herramienta oficial de Figma rechazó su creación en la biblioteca de la cuenta conectada por permisos; por eso se entrega el paquete importable. No es una publicación en Figma Community.
