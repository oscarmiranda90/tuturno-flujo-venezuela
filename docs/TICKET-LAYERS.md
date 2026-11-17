# Capas de la tiquera

La tiquera aprobada se reutiliza como componente y conserva sus actores independientes.

| Capa | Recurso o comportamiento |
|---|---|
| Cuerpo | `assets/brand/layers/cuerpo.png` |
| Vidrio | `assets/brand/layers/vidrio.png`, reflejo extraído sin pérdida |
| Rollo | `assets/brand/layers/rollo.svg` y cilindro de papel con giro independiente |
| Boca | `assets/brand/layers/boca.png`, geometría de la ranura y oclusión de `frente.webp` |
| Papel | Papel vectorial animado; referencia estática suministrada en `assets/brand/layers/papelito.png` |
| Confeti | Vista previa vectorial en `assets/brand/layers/confeti.svg`; partículas independientes que respetan el movimiento reducido |
| Tutu | `assets/piggy/tutu_dance.webp` y su imagen estática para movimiento reducido |

[Código completo](../src/components/turn/TurnTicketDispenser.tsx) · [Descargar recursos](https://tuturno-flujo-venezuela.tiamat-agency.workers.dev/entrega/tiquetera.zip)

## Sonido de impresión

`assets/audio/printer.mp3` contiene el fragmento de 6,00 a 7,50 segundos del [video elegido por Oscar](https://www.youtube.com/shorts/ImvTCMCx51E), «Remember This Sound? Dot-Matrix Printer Nostalgia», de We Fix Stupid Computers. Dura 1,5 s y conserva la velocidad y el tono originales; lleva fundidos breves para evitar chasquidos en los cortes. La procedencia y la huella SHA256 están en el [manifiesto de audio](../assets/audio/manifest.json).
