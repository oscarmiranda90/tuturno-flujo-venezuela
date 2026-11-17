# v19 → v20

Baseline: native delivery 00d6a8f and its 2:18 walkthrough from 2026-11-16. Authority: v20 guide from 2026-11-17.

| Screen | Before (v19) | After (v20) | Status |
|---|---|---|---|
| 1–3 | Approved Mauricio login/OTP/PIN. | Preserved; same copy, carousel and credential flow. | Preserved |
| 4a | Six trade-specific ideas, Daniela proof and selected-idea panel. | Six new large ideas; proof removed; check, haptic, Tutu reaction and1.5s automatic advance; small referral below. | Implemented |
| 4b | ¿Te sigo explicando? and older permission script. | ¿Seguimos? with the new exact notification script; sheet over4c. | Implemented |
| 4c | Small explainer panel with Cobrar mi turno. | Independent screen, three large numbered cards,290px cloud, guided highlights and back step navigation. | Implemented |
| 5 | Servicio naming and old speech. | Garantía y servicio naming and new exact narration. | Implemented |
| 6 | Three rules and interactive randomized wheel. | Preserved; browser web-port retains spin, repeated spins, confetti and no wheel sound. | Preserved |
| 7 | Tu primer pago, practice warning at bottom. | Practica tu primer pago, large top warning, new guarantee/service invoice and speech. | Implemented |
| 7b | Paid stamp and Listo. | Three bank steps automatically checked, Práctica superada stamp, Siguiente and delayed guide. | Implemented |
| 8 | Checklist first, group below, Empezar. | New title, large group above smaller checklist, nine avatar checks before five list checks and Siguiente. | Implemented |
| 9 | ¡Ya sabes cómo funciona! and existing dispenser. | ¡Ya sabes cómo cobrar tus €100!, new speech, layered dispenser, printer motor and replay. | Implemented |
| 10 | Trade-specific purpose and withdrawal warning. | New purpose mapping, La más elegida on weekly, guarantee/service naming and no withdrawal warning. | Implemented |
| 11 /11b | Read-to-end gating and three consents. | Preserved; consent unlock and gray/green Acepto. | Preserved |
| 12 | Old idea mapping and Servicio. | New idea purpose and Garantía y servicio (con IVA); only authoritative Bs orders outside the guide sample. | Implemented |
| 12c | Retained San after failed payment. | New idea/cost copy with frequency and accepted terms preserved. | Implemented |
| 12d | Reminder sheet on old payment summary. | Same sheet over the new payment summary. | Implemented |
| 13 | External ChinChin reference. | Preserved external ownership; current logo exported as SVG/PNG. | Preserved |
| Voice | 11 clips. | 15 clips:7 reused,4 new and4 re-recorded; only selected approved voice. | Implemented |
| Runtime | Expo native app and Storybook build. | Independent React/Vite browser repository with no Expo dependencies or imports. | Implemented |

## Latest same-version PDF revision

The final v20 PDF replaces abbreviated purposes with the complete selected idea on10/12/12c/12d. Other has no phrase or drawing. Screen10 uses two lines and removes its entire idea heading for Other; payment retains its ticket/€100 heading. The reminder sheet, pricing and all narrations are unchanged. Applied to the isolated runtime and the public Storybook that embeds it. Source SHA256: 8bdd318eb8a0bd575534d2bb595d9e0163853d3cef397e3b8be2eb26eb004515.
