/** Admin-side display helpers. The server recalculates everything authoritatively. */

/** Keeps digits and a single dot, max 2 decimals, so letters and "-" can never be typed. */
export function sanitizeTaxInput(raw: string): string {
  let v = raw.replace(/[^\d.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
  }
  return v;
}

/** Returns an error message, or "" when the value is acceptable (empty = 0%). */
export function validateTax(value: string): string {
  if (value === "" || value === ".") return "";
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return "Enter a valid number";
  if (Number(value) > 100) return "Tax cannot exceed 100%";
  return "";
}

export function calcBreakdown(price: number, taxPercentage: number) {
  const pricePaise = Math.round((Number.isFinite(price) ? price : 0) * 100);
  const bps = Math.round((Number.isFinite(taxPercentage) ? taxPercentage : 0) * 100);
  const taxPaise = Math.round((pricePaise * bps) / 10000);
  return { price: pricePaise / 100, tax: taxPaise / 100, total: (pricePaise + taxPaise) / 100 };
}

export const formatINR = (n: number) => (Number.isInteger(n) ? `₹${n}` : `₹${n.toFixed(2)}`);
