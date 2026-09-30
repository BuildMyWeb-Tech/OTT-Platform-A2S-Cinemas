"use client";
import { Select } from "@/components/ui";

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

function isoToParts(iso: string): { year: string; month: string; day: string; hour12: string; minute: string; ampm: "AM" | "PM" } {
  const d = new Date(iso);
  const h24 = d.getHours();
  const ampm: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1),
    day: String(d.getDate()),
    hour12: String(h12),
    minute: pad(d.getMinutes()),
    ampm,
  };
}

function to24Hour(hour12: string, ampm: "AM" | "PM"): number {
  let h = Number(hour12) % 12;
  if (ampm === "PM") h += 12;
  return h;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear + i);
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/**
 * Dropdown year/month/day/hour/minute/AM-PM selects instead of native
 * <input type="date"> and <input type="time">. Both native pickers turned
 * out error-prone in practice (year spinner easy to bump; the time input's
 * AM/PM segment is fiddly to click precisely and behaves inconsistently
 * across browsers/OSes) — explicit dropdowns remove both failure modes.
 *
 * Everything is combined via the numeric `Date(y, m, d, h, min)` constructor,
 * always interpreted as the browser's local time — never string-parsed, so
 * there's no timezone or 12h/24h ambiguity.
 */
export default function ScheduledReleaseField({ value, onChange }: Props) {
  const parts = value ? isoToParts(value) : { year: "", month: "", day: "", hour12: "", minute: "", ampm: "AM" as const };

  const daysInMonth = (year: string, month: string) => {
    if (!year || !month) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
  };

  const combine = (year: string, month: string, day: string, hour12: string, minute: string, ampm: "AM" | "PM") => {
    if (!year || !month || !day || !hour12 || !minute) { onChange(""); return; }
    const maxDay = daysInMonth(year, month);
    const safeDay = Math.min(Number(day), maxDay);
    const h24 = to24Hour(hour12, ampm);
    const local = new Date(Number(year), Number(month) - 1, safeDay, h24, Number(minute));
    onChange(local.toISOString());
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Select
          value={parts.day}
          onChange={(e) => combine(parts.year, parts.month, e.target.value, parts.hour12, parts.minute, parts.ampm)}
        >
          <option value="">Day</option>
          {Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
        <Select
          value={parts.month}
          onChange={(e) => combine(parts.year, e.target.value, parts.day, parts.hour12, parts.minute, parts.ampm)}
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </Select>
        <Select
          value={parts.year}
          onChange={(e) => combine(e.target.value, parts.month, parts.day, parts.hour12, parts.minute, parts.ampm)}
        >
          <option value="">Year</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Select
          value={parts.hour12}
          onChange={(e) => combine(parts.year, parts.month, parts.day, e.target.value, parts.minute || "00", parts.ampm)}
        >
          <option value="">Hour</option>
          {HOURS_12.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </Select>
        <Select
          value={parts.minute}
          onChange={(e) => combine(parts.year, parts.month, parts.day, parts.hour12 || "12", e.target.value, parts.ampm)}
        >
          <option value="">Minute</option>
          {MINUTES.map((m) => (
            <option key={m} value={pad(m)}>{pad(m)}</option>
          ))}
        </Select>
        <Select
          value={parts.ampm}
          onChange={(e) => combine(parts.year, parts.month, parts.day, parts.hour12 || "12", parts.minute || "00", e.target.value as "AM" | "PM")}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </Select>
      </div>
    </div>
  );
}
