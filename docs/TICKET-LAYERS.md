# Ticket dispenser layers

The approved dispenser is reused as code, never as a flattened full-screen capture.

| Layer | Source / actor |
|---|---|
| Body | `assets/brand/layers/cuerpo.png` |
| Glass | `assets/brand/layers/vidrio.png` lossless specular layer |
| Roll | `assets/brand/layers/rollo.svg` and independently rotating paper-roll actor |
| Mouth | `assets/brand/layers/boca.png`, slot geometry and `frente.webp` occlusion |
| Paper | Runtime vector paper; supplied still `assets/brand/layers/papelito.png` |
| Confetti | `assets/brand/layers/confeti.svg` preview; independent finite particles, reduced-motion aware |
| Tutu | `assets/piggy/tutu_dance.webp` and static reduced-motion poster |

[Full source](../src/components/turn/TurnTicketDispenser.tsx) · [Download assets](https://tuturno-flujo-venezuela.tiamat-agency.workers.dev/entrega/tiquetera.zip)
