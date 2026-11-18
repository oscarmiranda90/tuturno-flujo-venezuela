# Recorrido adaptable sin scroll exterior · Android 20.0.4

El login adapta tamaños y espacios al alto disponible. Al abrir el teclado prioriza el formulario. Las pantallas de registro siguientes encajan proporcionalmente en el área segura. El contenedor compartido de las 33 pantallas calcula su escala con ancho y alto y no permite desplazamiento exterior. Solo el panel de términos conserva su lectura interna.

## Comprobaciones

- Android 17: login en 360 × 640 dp y aproximadamente 411 × 914 dp. Capturas en este directorio.
- Android 17: catálogo completo de 33 pantallas en 320 × 568 dp, con jerarquías nativas y capturas en ../compacto-320.
- Android 9: catálogo completo, recorte superior simulado y navegación de tres botones, con 1536 MB de memoria. Evidencia en ../android9/adaptable.
- Navegador: 99 estados (33 pantallas en 320 × 568, 360 × 640 y 390 × 844), sin scroll exterior. Privacidad del login dentro del viewport. Resultados en web.json.
- Registro: correos «cualquiercosa», vacío y «test@ejemplo.com»; códigos 123456, 000000 y 987654; clave 111111 repetida. Llegan al paseo.

Las pruebas detectan vistas desplazables fuera de los términos. `npm run check` también comprueba el encaje geométrico en una matriz de tamaños. El APK final solo añade, respecto al barrido completo, un marcador de testimonio dibujado como vista simple para evitar una anomalía del borde en la pantalla más estrecha.

La franja azul exacta de la fotografía del teléfono físico no se reprodujo. Se reforzó la configuración de borde a borde y se comprobó el login con y sin recorte en Android 9; no se afirma haber probado todas las capas de fabricantes. Las comprobaciones nativas se hicieron en emuladores.
