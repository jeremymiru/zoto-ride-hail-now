/**
 * Currency formatting utilities for Kenyan Shillings (KSh)
 */

/**
 * Formats a number as Kenyan Shillings
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted currency string
 */
export function formatKSh(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'KSh 0';
  }

  const formatted = showDecimals ? amount.toFixed(2) : amount.toFixed(0);
  
  // Add thousand separators
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `KSh ${parts.join('.')}`;
}

/**
 * Formats a number as Kenyan Shillings with decimal places
 * @param amount - The amount to format
 * @returns Formatted currency string with decimals
 */
export function formatKShWithDecimals(amount: number): string {
  return formatKSh(amount, true);
}

/**
 * Parses a KSh string back to number
 * @param kshString - String like "KSh 1,500.00"
 * @returns Parsed number
 */
export function parseKSh(kshString: string): number {
  const cleaned = kshString.replace(/KSh\s?|,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats currency for display in cards and stats
 * @param amount - The amount to format
 * @returns Formatted currency without decimals
 */
export function formatCurrencyDisplay(amount: number): string {
  return formatKSh(amount, false);
}

/**
 * Formats currency for detailed transactions
 * @param amount - The amount to format
 * @returns Formatted currency with decimals
 */
export function formatCurrencyDetailed(amount: number): string {
  return formatKSh(amount, true);
}