# Cinco personas en el inicio

Por indicación de Oscar, el inicio utiliza cinco historias de [la página venezolana de TuTurno](https://tu-turno.app/ve/). Se conservan las fotografías originales, los nombres, las ciudades y las frases publicadas. Las imágenes se incluyen en el proyecto para que el recorrido funcione sin conexión.

El orden es Mary, Carolina, Deivy, Bernardo y Yenifer. Se muestra una persona cada cinco segundos y, después de Yenifer, vuelve a Mary. La composición y el degradado aprobados se conservan; las fotografías llenan el área manteniendo su proporción.

| Persona | Ciudad | Frase |
| --- | --- | --- |
| Mary Delgado | Caracas | Con mi turno compré el horno y hoy vendo mis postres. |
| Carolina Nieves | Caracas | La receta ya la tenía. Con mi turno armé el kit para mis pizzas. |
| Deivy Márquez | Miranda | Con mi turno reuní para los termos y el café. ¡Listo para acompañar la mañana de mis panas! |
| Bernardo Caldeira | Caracas | ¡Con TuTurno completé para invertir en mi negocio! |
| Yenifer Abreu | Anzoátegui | Con ese SAN pude comprar mi primer kit para hacer manos y pies. |

[Fotografías y procedencia](../assets/registration-v3/testimonios/) · [Código del inicio](../src/screens/auth/RegistrationV3.tsx)

## Transición del carrusel

Las cinco fotos se cargan al mostrar el inicio. Cada cinco segundos, la siguiente aparece con un fundido de 480 ms sobre la fotografía anterior, que permanece opaca durante el relevo para evitar destellos del fondo. El degradado y los controles permanecen fijos. Las máscaras tienen identificadores propios para no interferir con otras vistas del catálogo.

El testimonio anterior sale en 100 ms y el siguiente entra en 180 ms, después de esa salida, para evitar frases superpuestas. Todos ocupan la misma celda, cuya altura contempla la frase más larga. Con movimiento reducido, el fundido de la foto dura 200 ms y el del texto 120 ms, sin desplazamientos.

[Verificación de la transición](verification/transicion-login/README.md).

La fotografía de Mary procede de la web; su frase sigue el texto aprobado de la v20 por indicación del CEO, en lugar de la frase de la web.
