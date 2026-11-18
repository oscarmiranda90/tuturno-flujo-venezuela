# Integración del flujo v20 en React Native

El APK ejecuta componentes nativos con React Native 0.86.3, Fabric y Hermes. No usa WebView ni Expo. La versión de navegador conserva React Native Web para la revisión de Mauricio en Storybook.

## Archivos para Limonbyte

| Archivo o carpeta | Responsabilidad |
| --- | --- |
| `src/flow/` | Las pantallas v20, estados, importes, navegación y composición adaptable. |
| `src/screens/auth/` | Registro y login, con las cinco personas y el texto aprobado de Mary. |
| `src/components/` | Tutu, marca y tiquetera por capas. |
| `src/platform/*.native.ts(x)` | Degradado, transiciones, almacenamiento, portapapeles y barra de estado nativos. Metro elige estas implementaciones automáticamente. |
| `src/onboarding/tutuAudio.native.ts` | Quince voces y sonido de impresión mediante el reproductor nativo; silencio persistente y suspensión al salir de la app. |
| `assets/` | Fotografías, dibujos, fuentes, animaciones y audios locales. |
| `src/NativeApp.tsx`, `index.js` | Entrada nativa de la aplicación de revisión. |
| `android/` | Actividad y aplicación React Native; empaquetado con Gradle. |
| `src/main.tsx`, `src/reviewBridge.ts`, `src/styles.css` | Entrada y herramientas del navegador. No forman parte del APK. |

## Incorporar a la aplicación existente

1. Integra `VenezuelaFlow` dentro del `SafeAreaProvider` de la aplicación. Conserva los recursos y los adaptadores `.native`.
2. Usa las versiones declaradas de Reanimated, Worklets, SVG, Safe Area, AsyncStorage, Clipboard y Sound. El complemento de Worklets debe ser el último de Babel.
3. Registra las fuentes Outfit e Inter. En Android, `npm run android:preparar` copia las fuentes a `assets/fonts` y los audios a `res/raw`.
4. Conecta los contratos `services`, `registrationServices` y las salidas del flujo con los servicios de Limonbyte. La entrada de revisión utiliza `review`: simula registro, verificación y pagos. No envía correos ni cobra dinero.
5. Para iOS, integra los recursos y los audios en el proyecto Xcode de Limonbyte e instala los módulos nativos. Este repositorio entrega y verifica Android; no incluye una compilación iOS validada.

## Compilar Android sin servidor web

Con JDK 21, Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006 y las variables `JAVA_HOME` y `ANDROID_HOME` configuradas:

```sh
npm ci
npm run check
npm run android:apk
```

Gradle genera el paquete de JavaScript con Metro y lo compila para Hermes. El APK de revisión incluye todo lo necesario para abrir las pantallas sin conexión ni servidor Metro. Los enlaces externos siguen necesitando internet.

La firma es de revisión. Para distribución comercial, Limonbyte debe utilizar su firma y conectar sus servicios reales.
