# Transición suave de las cinco personas

| Antes | Después | Motivo |
| --- | --- | --- |
| La foto cambiaba de recurso en un solo fotograma, sin transición. | Cinco fotos montadas desde el inicio; la entrante se funde durante 480 ms sobre la anterior opaca. | Suavizar el cambio sin destellos del fondo ni esperar a descargar la siguiente imagen. |
| Frase y nombre se reemplazaban de golpe. | Salida de 100 ms, seguida de entrada de 180 ms, en una celda de altura estable. | Evitar frases superpuestas y movimientos de la cifra o del formulario. |
| Sin tratamiento específico del movimiento reducido para este cambio. | Foto de 200 ms y texto de 120 ms, sin desplazamientos. | Respetar la preferencia del sistema. |
| Máscara SVG con un identificador fijo. | Identificadores por instancia y fotografía. | Evitar cruces de máscaras al mostrar varias pantallas en el catálogo. |

Se conserva el intervalo de cinco segundos, el orden de las personas, los encuadres y los degradados. Solo se anima la opacidad mediante transiciones CSS con `cubic-bezier(0.23,1,0.32,1)`, sin bibliotecas adicionales. Los 480 ms son deliberados para el relevo de una fotografía promocional; ningún control espera a que termine. Se utiliza un fundido sin desplazamiento para conservar el encuadre y facilitar la lectura.

**Revisión: aprobado para web.** Se comprobaron los cinco relevos y el regreso a Mary con tiempos reales en Chromium y WebKit, tanto localmente como dentro del Storybook público. Los resultados registran opacidades intermedias, la foto anterior todavía opaca, cinco imágenes decodificadas, posición estable de la cifra y del campo, preferencia de movimiento reducido y ausencia de errores JavaScript. No se probó en un teléfono físico ni se reconstruyó el APK.

- [Chromium local](chromium-local.json) · [WebKit local](webkit-local.json).
- [Chromium en Storybook](chromium-storybook.json) · [WebKit en Storybook](webkit-storybook.json).
- [Vista de 390 px](chromium-390.png) · [Vista de 320 px](chromium-320.png).
- [Fotograma intermedio](fundido-intermedio.png): fundido detenido a 120 ms de sus 480 ms para inspeccionar el relevo.

También pasan `npm run check`, `npm run build` y la preparación del despliegue. La compilación mantiene la advertencia ya existente sobre el tamaño del paquete.
