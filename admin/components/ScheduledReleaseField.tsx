"use client";
import { Input } from "@/components/ui";

interface Props {
  /** UTC ISO string (e.g. from the server), or "" when not scheduled. */
  value: string;
  onChange: (isoStringOrEmpty: string) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

function isoToParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/**
 * Separate native date + time inputs instead of a single datetime-local input.
 *
 * Both `<input type="date">` and `<input type="time">` are guaranteed by spec to
 * report their `.value` as a locale-independent "YYYY-MM-DD" / "HH:mm" (24-hour)
 * string, regardless of whatever format (12h/24h) the picker displays to the
 * admin — so this works identically no matter the OS clock setting.
 *
 * The date and time parts are combined using the numeric `Date(y, m, d, h, min)`
 * constructor, which JavaScript always interprets as the browser's local time —
 * never string-parsed, so there's no ambiguity about whose timezone it means.
 */
export default function ScheduledReleaseField({ value, onChange }: Props) {
  const { date, time } = value ? isoToParts(value) : { date: "", time: "" };

  const combine = (newDate: string, newTime: string) => {
    if (!newDate) { onChange(""); return; }
    const [y, m, d] = newDate.split("-").map(Number);
    const [hh, mm] = (newTime || "00:00").split(":").map(Number);
    const local = new Date(y, m - 1, d, hh, mm);
    onChange(local.toISOString());
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Input type="date" value={date} onChange={(e) => combine(e.target.value, time)} />
      <Input type="time" value={time} onChange={(e) => combine(date, e.target.value)} />
    </div>
  );
}
