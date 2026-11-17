# Tiquetera en Storybook

Corrección del 17 de noviembre de 2026, publicada en el flujo web que integra Storybook. Código de la corrección de audio: `2afaef0`.

| Antes | Después | Motivo |
| --- | --- | --- |
| El papel no salía en la versión web publicada. | El tiquete se imprime, sale y queda visible. | Se publicó la adaptación ESM de los estilos DOM de Reanimated, ya presente en el repositorio. |
| «Repetir animación» interrumpía la impresora y la voz al volver a seleccionar la narración. | Cambiar la narración detiene solo la voz; el botón repite la impresión sin reiniciar el efecto que selecciona la narración. | La limpieza del efecto pausaba los dos audios antes de que se reprodujeran. |

**Veredicto: aprobado para los casos comprobados en Chrome.** Se conserva la coreografía de la guía v20 y su soporte de movimiento reducido. No se cambiaron los tiempos ni el diseño.

La comprobación usa el Storybook público, incluyendo su iframe del flujo aislado, con reproducción automática restringida. Un clic real en «Repetir animación» produce el sonido completo de la impresora (1,5 s) y la voz (2,8 s). También se comprueba repetir otra vez y volver de la pantalla 8 a la 9. El tiquete pasa de oculto a visible y no aparecen excepciones JavaScript.

Al abrir directamente una pantalla sin haber interactuado, el navegador puede bloquear la reproducción automática. «Repetir animación» inicia la animación y su sonido mediante una pulsación.

- [Resultado de la prueba](resultado.json).
- [Captura del Storybook público](tiquetera.png).
- [Prueba reproducible](../../../scripts/test-storybook-printer.mjs): requiere una instancia de Chrome de pruebas con `--remote-debugging-port=9234` y un perfil separado; no debe usarse una opción que desactive las restricciones de reproducción automática. `CHROME_DEBUG_URL` permite cambiar la dirección del depurador.

El sonido vigente es el fragmento **6,00–7,50 s** del [video elegido por Oscar](https://www.youtube.com/shorts/ImvTCMCx51E), de We Fix Stupid Computers. La prueba comprueba también que el archivo publicado tenga la misma huella SHA256 que el [manifiesto de audio](../../../assets/audio/manifest.json).
