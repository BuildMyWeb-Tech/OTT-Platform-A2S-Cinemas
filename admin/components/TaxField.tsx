"use client";
import { Input } from "@/components/ui";
import { calcBreakdown, formatINR, sanitizeTaxInput, validateTax } from "@/lib/pricing";

interface Props {
  price: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/** Numeric-only Tax (%) input with a live Subtotal / GST / Total preview. */
export default function TaxField({ price, value, onChange, error }: Props) {
  const err = error || validateTax(value);
  const b = calcBreakdown(Number(price), err ? 0 : Number(value || 0));
  return (
    <div className="space-y-2">
      <Input
        label="Tax (%)"
        type="text"
        inputMode="decimal"
        placeholder="18"
        value={value}
        onChange={(e) => onChange(sanitizeTaxInput(e.target.value))}
        error={err}
        data-testid="movie-tax-input"
      />
      {Number(price) > 0 && !err && (
        <div className="text-xs text-gray-400 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 space-y-0.5">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(b.price)}</span></div>
          <div className="flex justify-between"><span>GST/Tax ({Number(value || 0)}%)</span><span>{formatINR(b.tax)}</span></div>
          <div className="flex justify-between text-white font-medium border-t border-[#1E1E2E] pt-1 mt-1">
            <span>Customer Total</span><span>{formatINR(b.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
