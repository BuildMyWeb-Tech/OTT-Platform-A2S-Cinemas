/**
 * Pricing sanity tests (no DB / network). Run: cd server && npx tsx scripts/testPricing.ts
 */
import assert from "node:assert/strict";
import { calculatePricing, parseTaxInput } from "../utils/pricing.js";

const cases: [string, number, number, number, number][] = [
    // name, price, tax%, expected tax ₹, expected total paise
    ["TEST 1", 100, 18, 18, 11800],
    ["TEST 2", 100, 0, 0, 10000],
    ["TEST 3", 200, 5, 10, 21000],
    ["TEST 4", 150, 12, 18, 16800],
];
for (const [name, price, tax, expTax, expPaise] of cases) {
    const r = calculatePricing(price, tax);
    assert.equal(r.taxAmount, expTax, `${name} tax`);
    assert.equal(r.totalPaise, expPaise, `${name} paise`);
    assert.equal(r.totalAmount, expPaise / 100, `${name} total`);
    console.log(`PASS ${name}: ₹${price} + ${tax}% = ₹${r.totalAmount} (${r.totalPaise} paise)`);
}

// TEST 10 — legacy movie without a tax field
assert.equal(calculatePricing(100, undefined).totalPaise, 10000);
assert.equal(calculatePricing(49, null).totalPaise, 4900);
console.log("PASS TEST 10: missing tax defaults to 0");

// Floating-point traps
assert.equal(calculatePricing(19.99, 18).totalPaise, 2359); // 1999 + 360 (359.82 rounded)
assert.equal(calculatePricing(0.1, 5).totalPaise, 11);       // 10 + 1 (0.5 rounded)
console.log("PASS float-safety cases");

// TEST 11 / 12 — validation
assert.ok(parseTaxInput("abc").error, "abc must be rejected");
assert.ok(parseTaxInput("-18").error, "-18 must be rejected");
assert.ok(parseTaxInput(-18).error, "numeric -18 must be rejected");
assert.ok(parseTaxInput("1e2").error, "exponent notation must be rejected");
assert.ok(parseTaxInput("101").error, ">100 must be rejected");
assert.equal(parseTaxInput("18").value, 18);
assert.equal(parseTaxInput("2.5").value, 2.5);
assert.deepEqual(parseTaxInput(""), {});
assert.deepEqual(parseTaxInput(undefined), {});
console.log("PASS TEST 11/12: tax input validation");

console.log("\nAll pricing tests passed");
