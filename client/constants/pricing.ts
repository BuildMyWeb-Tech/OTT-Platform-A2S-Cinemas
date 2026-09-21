import type { Movie } from "./types";

/** Display-only helpers. The server is the authority for the amount actually charged. */
export const formatINR = (n: number): string =>
    Number.isInteger(n) ? `₹${n}` : `₹${n.toFixed(2)}`;

export const getPricing = (movie: Pick<Movie, "price" | "taxPercentage" | "taxAmount" | "totalAmount">) => {
    const taxPercentage = movie.taxPercentage ?? 0;
    const pricePaise = Math.round(movie.price * 100);
    const taxPaise = Math.round((pricePaise * Math.round(taxPercentage * 100)) / 10000);
    return {
        price: movie.price,
        taxPercentage,
        taxAmount: movie.taxAmount ?? taxPaise / 100,
        totalAmount: movie.totalAmount ?? (pricePaise + taxPaise) / 100,
    };
};
