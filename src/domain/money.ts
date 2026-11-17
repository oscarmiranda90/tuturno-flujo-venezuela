/** Tu Turno: formato de importes. Centraliza los importes visibles y evita escribir el símbolo manualmente en cada pantalla. Los cambios de país deben respetar la configuración de moneda del producto. */

/** Símbolo que ve el usuario, definido por el país y las reglas del producto. */
const SYMBOL = '€';

/** Importe entero, por ejemplo €100. Se utiliza para tamaños del SAN, cobros y límites que son enteros por regla del producto. */
export function money(amount: number): string {
  return `${SYMBOL}${amount}`;
}

/** Importe exacto con céntimos, por ejemplo €11,74. Los cobros que el usuario va a transferir no se redondean. Se utiliza la coma decimal que muestran las aplicaciones bancarias venezolanas. */
export function moneyExact(amount: number): string {
  return `${SYMBOL}${amount.toFixed(2).replace('.', ',')}`;
}

/** Símbolo de moneda para los componentes que construyen su propio texto. */
export const CURRENCY_SYMBOL = SYMBOL;

/** Los ejemplos de práctica v3 dependen del país; se conserva el formato de la cuenta anterior. */
export function practiceMoney(amount: number, country: 'VE' | 'CO'): string {
  const [whole, fraction] = amount
    .toFixed(country === 'CO' || Number.isInteger(amount) ? 0 : 2)
    .split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${grouped}${fraction ? `,${fraction}` : ''}`;
}

/** Céntimos exactos para las pantallas de revisión de cada país, incluido el nuevo inicio. */
export function practiceMoneyExact(amount: number, country: 'VE' | 'CO'): string {
  if (country === 'CO') return practiceMoney(amount, country);
  return `$${amount.toFixed(2).replace('.', ',')}`;
}

/** La guía del CEO para Venezuela v19 utiliza euros; los bolívares provienen de la orden del proveedor de pagos. */
export function v19Money(amount: number, exact = false): string {
  return `€${exact ? amount.toFixed(2).replace('.', ',') : String(amount).replace('.', ',')}`;
}
