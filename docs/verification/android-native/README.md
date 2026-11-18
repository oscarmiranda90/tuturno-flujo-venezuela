# Verificación de Android nativo · v20.0.2

El APK se genera desde `8d54d0da0ed0019f18cd14389bc72ac6858b3cf7`. `compilacion.json` registra su tamaño, huella SHA-256 y recursos. Conserva la firma del APK anterior; se instaló como actualización sobre v20.0.1 sin desinstalar.

## Comprobaciones

- Android 17, emulador ARM64, modo avión: ejecución local con React Native, Fabric y Hermes. El APK incluye el paquete Hermes y las bibliotecas nativas; no contiene una entrada HTML.
- Las 15 voces y el sonido de impresión están dentro del APK; sus 16 huellas coinciden con los originales de `assets/audio/`.
- Rotación de las cinco personas del login con movimiento normal, incluidas las fotografías y la frase aprobada de Mary: `carrusel.json` y capturas `login-0.png` a `login-4.png`.
- Inicio automático de los dos reproductores nativos al abrir la pantalla 9: impresión de aproximadamente 1,5 segundos y narración de aproximadamente 2,9 segundos. Al pulsar «Repetir animación», ambos vuelven a reproducirse.
- Registro completo con teclado nativo, código OTP y doble entrada de clave hasta la primera pantalla del paseo: `registro.json`.
- Continuidad del paseo mediante pulsaciones: propósito, avisos, explicaciones, reglas, simulación, pago de práctica, verificación, tiquetera y selección del San conservando el propósito. Resultado en `recorrido.json`.
- El muteo cambia el icono, se mantiene al avanzar y al cerrar/reabrir la aplicación, silencia también la tiquetera y se puede desactivar. Resultado en `muteo.json`.
- El tiquete aparece al terminar la impresión y Tutu se anima con el decodificador WebP nativo. La revisión visual de la animación y el arranque de sonido se hizo con movimiento normal.
- El barrido automatizado de las 33 pantallas usa movimiento reducido para obtener jerarquías de accesibilidad estables. Cada pantalla conserva captura y XML; `pantallas.json` registra los resultados. El script rechaza errores de ejecución, capturas de jerarquía fallidas y cualquier `android.webkit.WebView`.

## Límites

No se ha probado en un teléfono físico ni se ha compilado iOS. La reproducción se verifica mediante los eventos de los reproductores Android; esto no certifica el volumen de los altavoces de la Mac. El registro, los pagos y la verificación conservan los servicios de demostración del repositorio.

Las evidencias de `../android/` corresponden al APK WebView anterior y no validan esta entrega.
