/**
 * Format amount as Rwandan Franc (RWF) with thousands separator, no decimals.
 */
export function formatRwf(amount: number): string {
  return `${Number(amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} RWF`;
}
