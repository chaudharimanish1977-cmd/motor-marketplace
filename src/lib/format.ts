/**
 * Indian-locale formatters.
 */

/**
 * Format a number as Indian Rupees with the South-Asian numbering system.
 * 140000 → "₹1,40,000"
 */
export function formatINR(amount: number, withSymbol = true): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  });
  const formatted = formatter.format(Math.round(amount));
  return withSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format an ISO date string like "2026-03-31" → "31 Mar 2026"
 */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format an ISO date range "2026-03-31" + "2027-03-30" → "31 Mar 2026 – 30 Mar 2027"
 */
export function formatDateRange(startIso: string, endIso: string): string {
  return `${formatDateShort(startIso)} – ${formatDateShort(endIso)}`;
}
