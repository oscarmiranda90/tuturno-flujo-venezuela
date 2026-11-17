# Cinco personas en el inicio

Se comprobó el carrusel en la vista local y en el [Storybook público](https://tuturno-storybook.pages.dev/?path=/story/venezuela-v20-flujo-aprobado--start), con una ventana de 390 × 844 para el flujo.

| Antes | Después | Motivo |
| --- | --- | --- |
| Dos testimonios y el inicio congelado en la vista de revisión. | Cinco personas, con cambio cada cinco segundos y regreso a Mary después de Yenifer. | Indicación de Oscar de usar cinco historias de la web venezolana y revisar el recorrido en tiempo real. |
| Encuadre único para todas las fotos y altura variable del texto. | Encuadre por retrato sin deformar la foto y altura reservada para la frase. | Mantener los rostros visibles y la cifra estable al cambiar de persona. |

La comprobación recorre las cinco personas y el regreso al inicio con los intervalos reales, comprueba cinco imágenes diferentes y su carga correcta, y verifica que no aparezcan errores JavaScript ni desbordamiento horizontal. También se revisó el inicio a 320 × 568. `npm run check`, `npm run build` y la preparación del despliegue pasan.

- [Resultado local](local.json).
- [Resultado del Storybook público](storybook.json).
- [Fotos y frases de origen](../../TESTIMONIOS-INICIO.md).

| Mary | Carolina | Deivy | Bernardo | Yenifer |
| --- | --- | --- | --- | --- |
| ![Mary](1.png) | ![Carolina](2.png) | ![Deivy](3.png) | ![Bernardo](4.png) | ![Yenifer](5.png) |
