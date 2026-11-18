import { v19Money } from "../domain/money";

export const C = {
  blue: "#0023D1",
  green: "#20D672",
  sky: "#359BFF",
  gray: "#EDEDED",
  ink: "#0B1340",
  money: "#0A9F55",
  bubble: "#E6EFFF",
  veil: "#060C34",
} as const;
export const IDEAS = ["Montar mi negocio", "Hacer crecer mi negocio", "Comprar algo que necesito", "Salir de una deuda", "Resolver una emergencia", "Otra cosa"] as const;
export const PURPOSES = ["montar tu negocio", "hacer crecer tu negocio", "comprar algo que necesitas", "salir de una deuda", "resolver una emergencia", null] as const;
export const VOICE = {
 "4a":["¡Increíble!","Lo vas a lograr."],
 "4b":["¿Quieres recibir avisos?","Activa los avisos y te acompaño paso a paso, hasta el día que te toca cobrar."],
 "4c-1":["Todos ponen lo mismo","€10 cada semana."],
 "4c-2":["Uno cobra todo junto","Los €100 de una vez."],
 "4c-3":["Después le toca al siguiente","Todos cobran. Tú también."],
 "5":["Todo a una cuenta","Garantía y servicio ya van en tu cuota."],
 "6-1":["De una sola cuenta","TuTurno te manda los €100."],
 "6-2":["Es por el grupo","Así todos cobran completo."],
 "6-3":["¡Pruébalo tú!","Toca y mira cómo llega tu turno."],
 "7":["Lo que pagas hoy","Tu primera cuota, con garantía y servicio."],
 "7b":["¡Así de fácil!","Prepárate, que ya casi vas con el de verdad."],
 "8":["Solo una vez","Falta lo mejor: tu turno."],
 "9":["¡Ya sabes cómo cobrar tus €100!",""],
 "10":["¡Ahora sí, el de verdad!",""],
 "11":["¡Ya casi tienes tu turno!",""],
} as const;
export const ACKNOWLEDGEMENTS = [
  "He leído y acepto los Términos Generales de TU TURNO y los Términos y Condiciones para Venezuela, y autorizo el tratamiento de mis datos personales conforme a la Cláusula Octava, incluida su transferencia a servidores en Estados Unidos.",
  "Autorizo el uso de mis datos biométricos (selfie y prueba de vida) para verificar mi identidad.",
  "Acepto que el servicio empieza de inmediato.",
] as const;
export const GUARANTEE = "Tu turno está garantizado";
