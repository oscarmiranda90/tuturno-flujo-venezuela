# Plugin de Figma del flujo Venezuela v20

Se entrega un plugin local de Figma Design con 37 pantallas y estados de 360 × 800 px, incluidas las cinco personas del inicio. El catálogo corresponde al código `d759b7c`, con la frase de Mary corregida según la v20.

| Antes | Después | Motivo |
| --- | --- | --- |
| Pantallas disponibles en el código y en Storybook. | Plugin con selector de pantalla, catálogo completo y grupo de login con paseo guiado. | Crear las pantallas como capas de Figma. |
| Sin importación repetible al lienzo. | Cada ejecución crea un lote propio; progreso y cancelación conservan las capas anteriores. | Poder generar y revisar pantallas sin sustituir el trabajo del diseñador. |
| Fuentes dependientes del entorno. | Comprobación previa de Outfit e Inter y archivos originales con sus licencias incluidos. | Conservar las medidas y evitar sustituciones silenciosas. |

## Verificaciones realizadas

- Extracción de los 37 estados desde Chromium con el código actual, fuentes cargadas y movimiento reducido; sin errores JavaScript. Se incluyen cinco referencias visuales del origen.
- `npm run figma:compilar`: JavaScript válido y ZIP con manifiesto, código, panel, instrucciones y fuentes; sin llamadas de red ni claves.
- `npm run figma:verificar`: contrato con un anfitrión simulado de la API. Comprueba 37 pantallas, 879 capas de texto, 327 importaciones SVG, pinturas normalizadas, imágenes PNG válidas, repetición, validación, fuentes ausentes, fallos y cancelación.
- Comprobación de tipos del runtime contra las declaraciones oficiales de `figma/plugin-typings` y revisión del panel en Chromium.
- `npm run check` y `npm run build` de la aplicación. Se conserva la advertencia existente sobre el tamaño del paquete web.

**Límite de la verificación:** no se ejecutó dentro del editor de Figma. La herramienta oficial rechazó la creación en la biblioteca por permisos de la cuenta conectada; el paquete local permite importarlo en Figma Desktop. Las pruebas del anfitrión simulado y las capturas de la aplicación no certifican identidad visual píxel a píxel en Figma. Los textos se generan por línea; los recursos que ya son imágenes se conservan como rellenos, y los SVG se importan como vectores.

[Contrato y resultados](contrato.json) · [Panel probado](panel.json) · [Vista del panel](panel.png) · [Instalación](../../../figma-plugin/LEEME.md).

Referencias oficiales: [importar un plugin desde el manifiesto](https://help.figma.com/hc/en-us/articles/38457121114263-Create-a-Figma-Design-plugin-with-the-Figma-MCP-server-and-agentic-tools), [manifiesto](https://developers.figma.com/docs/plugins/manifest/), [API de plugins](https://developers.figma.com/docs/plugins/api/figma/).
