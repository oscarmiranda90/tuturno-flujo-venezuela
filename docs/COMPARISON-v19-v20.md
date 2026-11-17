# Comparación entre v19 y v20

Referencia anterior: entrega nativa `00d6a8f` y su video de 2:18 del 16 de noviembre de 2026. Documento vigente: guía v20 del 17 de noviembre de 2026.

| Pantalla | Antes (v19) | Ahora (v20) | Estado |
|---|---|---|---|
| 1–3 | Inicio de sesión, código y clave aprobados por Mauricio. | Se conservan los textos, el carrusel y el registro. | Conservado |
| 4a | Seis ideas por oficio, testimonio de Daniela y panel de la idea elegida. | Seis ideas nuevas con dibujos grandes; sin testimonio; selección, vibración, reacción de Tutu y avance automático a los 1,5 s; referido pequeño al pie. | Implementado |
| 4b | «¿Te sigo explicando?» y guion anterior de permisos. | «¿Seguimos?» y nuevo texto exacto de avisos; ventana sobre 4c. | Implementado |
| 4c | Panel explicativo pequeño con «Cobrar mi turno». | Pantalla independiente, tres tarjetas numeradas grandes, nube de 290 px, resaltados y retroceso por pasos. | Implementado |
| 5 | Concepto «Servicio» y voz anterior. | Concepto «Garantía y servicio» y nuevo texto exacto de voz. | Implementado |
| 6 | Tres reglas y rueda interactiva aleatoria. | Se conservan los giros, la repetición y el confeti, sin sonido de rueda. | Conservado |
| 7 | «Tu primer pago» y advertencia de práctica al pie. | «Practica tu primer pago», advertencia grande arriba y nuevos conceptos y narración. | Implementado |
| 7b | Sello de pago y «Listo». | Tres pasos bancarios que se completan solos, sello «Práctica superada», «Siguiente» y guía posterior. | Implementado |
| 8 | Lista de verificación primero, grupo debajo y «Empezar». | Nuevo título, grupo grande arriba, lista más pequeña, nueve verificaciones de avatares antes de las cinco de la lista y «Siguiente». | Implementado |
| 9 | «¡Ya sabes cómo funciona!» y tiquera existente. | «¡Ya sabes cómo cobrar tus €100!», nueva voz, tiquera por capas, motor de impresora y repetición. | Implementado |
| 10 | Idea por oficio y advertencia de retiro. | Idea completa, «La más elegida» en el semanal, «Garantía y servicio» y sin advertencia de retiro. «Otra cosa» elimina el encabezado de idea. | Implementado |
| 11 / 11b | Lectura hasta el final y tres consentimientos. | Se conservan el desbloqueo de los consentimientos y los estados gris y verde de «Acepto». | Conservado |
| 12 | Ideas anteriores y concepto «Servicio». | Idea completa y «Garantía y servicio (con IVA)»; «Otra cosa» omite su fila. Los bolívares fuera del ejemplo requieren una orden válida. | Implementado |
| 12c | San conservado al fallar el pago. | Nueva frase de idea y conceptos, conservando frecuencia y términos aceptados. | Implementado |
| 12d | Ventana de recordatorio sobre el resumen de pago anterior. | La misma ventana sobre el nuevo resumen del pago. | Implementado |
| 13 | Referencia externa de ChinChin. | Se conserva la responsabilidad del proveedor; logo actual en SVG y PNG. | Conservado |
| Voz | 11 audios. | 15 audios: 7 reutilizados, 4 nuevos y 4 regrabados, con la voz elegida. | Implementado |
| Ejecución | App nativa con Expo y compilación de Storybook. | Repositorio web independiente con React y Vite, sin dependencias ni importaciones de Expo. Storybook muestra el mismo flujo publicado. | Implementado |

## Última revisión del PDF v20

La revisión final sustituye las frases abreviadas por la idea completa en 10, 12, 12c y 12d. «Otra cosa» no lleva frase ni dibujo. La 10 utiliza dos líneas y elimina todo el encabezado de idea en ese caso; el pago conserva el tiquete y el título de €100. La ventana de recordatorio, los precios y las narraciones se conservan. Está aplicado al repositorio aislado y al Storybook público. Huella SHA256 del documento: `8bdd318eb8a0bd575534d2bb595d9e0163853d3cef397e3b8be2eb26eb004515`.
