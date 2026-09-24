"use client";
import { Select, Input } from "@/components/ui";

interface Props {
  /** UTC ISO string (e.g. from the server), or "" when not scheduled. */
  value: string;
  onChange: (isoStringOrEmpty: string) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isoToParts(iso: string): { year: string; month: string; day: string; time: string } {
  const d = new Date(iso);
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1),
    day: String(d.getDate()),
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear + i);

/**
 * Dropdown year/month/day selects instead of a native <input type="date">.
 * The native date picker's year field is a bare spinner/typed number that's
 * error-prone (easy to land on the wrong year by a stray scroll/keystroke) —
 * explicit dropdowns remove that failure mode entirely.
 *
 * Time still uses <input type="time">, whose `.value` is spec-guaranteed to be
 * locale-independent "HH:mm" (24-hour) regardless of the OS's 12h/24h display
 * setting. Everything is combined via the numeric `Date(y, m, d, h, min)`
 * constructor, always interpreted as the browser's local time.
 */
export default function ScheduledReleaseField({ value, onChange }: Props) {
  const parts = value ? isoToParts(value) : { year: "", month: "", day: "", time: "" };

  const daysInMonth = (year: string, month: string) => {
    if (!year || !month) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
  };

  const combine = (year: string, month: string, day: string, time: string) => {
    if (!year || !month || !day) { onChange(""); return; }
    const maxDay = daysInMonth(year, month);
    const safeDay = Math.min(Number(day), maxDay);
    const [hh, mm] = (time || "00:00").split(":").map(Number);
    const local = new Date(Number(year), Number(month) - 1, safeDay, hh, mm);
    onChange(local.toISOString());
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      <Select
        value={parts.day}
        onChange={(e) => combine(parts.year, parts.month, e.target.value, parts.time)}
      >
        <option value="">Day</option>
        {Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </Select>
      <Select
        value={parts.month}
        onChange={(e) => combine(parts.year, e.target.value, parts.day, parts.time)}
      >
        <option value="">Month</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </Select>
      <Select
        value={parts.year}
        onChange={(e) => combine(e.target.value, parts.month, parts.day, parts.time)}
      >
        <option value="">Year</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </Select>
      <Input
        type="time"
        value={parts.time}
        onChange={(e) => combine(parts.year, parts.month, parts.day, e.target.value)}
      />
    </div>
  );
}
