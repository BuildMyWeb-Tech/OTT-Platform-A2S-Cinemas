/**
 * Money-safe pricing helpers.
 *
 * Convention: Movie.price is stored in rupees (as before). All arithmetic is done in
 * integer paise, and tax is applied in basis points (taxPercentage * 100), so no
 * floating-point rounding errors reach Razorpay.
 */

export interface PriceBreakdown {
    price: number;          // rupees, base price
    taxPercentage: number;  // e.g. 18
    taxAmount: number;      // rupees
    totalAmount: number;    // rupees
    pricePaise: number;
    taxPaise: number;
    totalPaise: number;     // amount to send to Razorpay
}

export const MAX_TAX_PERCENTAGE = 100;

/** Returns a safe tax percentage (0 if missing / invalid) — used for legacy documents. */
export const normalizeTax = (value: unknown): number => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n < 0 || n > MAX_TAX_PERCENTAGE) return 0;
    return Math.round(n * 100) / 100; // max 2 decimal places
};

export const calculatePricing = (price: number, taxPercentage?: number | null): PriceBreakdown => {
    const pricePaise = Math.round(Number(price) * 100);
    const taxBps = Math.round(normalizeTax(taxPercentage ?? 0) * 100);
    const taxPaise = Math.round((pricePaise * taxBps) / 10000);
    const totalPaise = pricePaise + taxPaise;
    return {
        price: pricePaise / 100,
        taxPercentage: taxBps / 100,
        taxAmount: taxPaise / 100,
        totalAmount: totalPaise / 100,
        pricePaise,
        taxPaise,
        totalPaise,
    };
};

/**
 * Validates an incoming taxPercentage from an admin request.
 * Returns { value } on success or { error } on failure. `undefined`/"" => not provided.
 */
export const parseTaxInput = (raw: unknown): { value?: number; error?: string } => {
    if (raw === undefined || raw === null || raw === "") return {};
    if (typeof raw === "string" && !/^\d+(\.\d{1,2})?$/.test(raw.trim())) {
        return { error: "Tax must be a non-negative number (max 2 decimals)" };
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return { error: "Tax must be a non-negative number" };
    if (n > MAX_TAX_PERCENTAGE) return { error: `Tax cannot exceed ${MAX_TAX_PERCENTAGE}%` };
    return { value: Math.round(n * 100) / 100 };
};

/** Adds derived pricing fields to a plain movie object for API responses. */
export const withPricing = <T extends { price: number; taxPercentage?: number }>(movie: T) => {
    const p = calculatePricing(movie.price, movie.taxPercentage);
    return { ...movie, taxPercentage: p.taxPercentage, taxAmount: p.taxAmount, totalAmount: p.totalAmount };
};
