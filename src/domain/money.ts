/**
 * Tu Turno — Money formatting
 *
 * Every amount the user reads passes through here. Before this file the symbol
 * was typed by hand in thirty-odd places, which is why changing currency used
 * to mean touching thirty-odd files and hoping none were missed.
 *
 * Integrators changing country: change CURRENCY, and nothing else.
 */

/** The symbol shown to the user. Country parameter, not a design choice. */
const SYMBOL = '€';

/**
 * A whole amount: €100. Used for SAN sizes, payouts and tier ceilings, which
 * are always round numbers by product rule.
 */
export function money(amount: number): string {
  return `${SYMBOL}${amount}`;
}

/**
 * An exact amount with cents: €11,74. Used wherever the figure is a real
 * charge the user is about to transfer, where rounding would be a lie.
 *
 * The decimal separator is a comma, which is what a Venezuelan reader expects
 * and what their banking app shows them.
 */
export function moneyExact(amount: number): string {
  return `${SYMBOL}${amount.toFixed(2).replace('.', ',')}`;
}

/** The bare symbol, for the few places that compose their own string. */
export const CURRENCY_SYMBOL = SYMBOL;

/** v3 practice examples are per country; legacy account formatting is unchanged. */
export function practiceMoney(amount: number, country: 'VE' | 'CO'): string {
  const [whole, fraction] = amount
    .toFixed(country === 'CO' || Number.isInteger(amount) ? 0 : 2)
    .split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${grouped}${fraction ? `,${fraction}` : ''}`;
}

/** Exact cents for country-scoped review surfaces, including the new Home. */
export function practiceMoneyExact(amount: number, country: 'VE' | 'CO'): string {
  if (country === 'CO') return practiceMoney(amount, country);
  return `$${amount.toFixed(2).replace('.', ',')}`;
}

/** CEO Venezuela v19 deliberately uses euros; Bs come from the PSP order. */
export function v19Money(amount: number, exact = false): string {
  return `€${exact ? amount.toFixed(2).replace('.', ',') : String(amount).replace('.', ',')}`;
}
