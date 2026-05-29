"use client";
import { clsx } from "clsx";
import { AlertTriangle, X } from "lucide-react";

// ── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = "green" | "red" | "amber" | "blue" | "gray";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  red: "bg-red-500/10 text-red-400 ring-red-500/20",
  amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  gray: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
};

export function Badge({
  children,
  variant = "gray",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ring-1 ring-inset",
        BADGE_STYLES[variant]
      )}
    >
      {children}
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="border-2 border-[#E50914] border-t-transparent rounded-full animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

// ── PageLoader ────────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div className="w-12 h-12 bg-[#1E1E2E] rounded-full flex items-center justify-center">
        <AlertTriangle size={20} className="text-gray-500" />
      </div>
      <div>
        <p className="text-white font-medium">{title}</p>
        {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "red",
  onConfirm,
  onCancel,
  loading = false,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "red" | "amber";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 w-full max-w-sm">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={clsx(
              "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
              confirmVariant === "red" ? "bg-red-500/10" : "bg-amber-500/10"
            )}
          >
            <AlertTriangle
              size={18}
              className={confirmVariant === "red" ? "text-red-400" : "text-amber-400"}
            />
          </div>
          <div>
            <p className="text-white font-medium">{title}</p>
            <p className="text-gray-500 text-sm mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-[#1E1E2E] hover:bg-[#2E2E3E] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              "px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50",
              confirmVariant === "red"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-amber-600 hover:bg-amber-500"
            )}
          >
            {loading ? <Spinner size={14} /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "gray",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: "red" | "green" | "blue" | "amber" | "gray";
}) {
  const iconColors = {
    red: "bg-red-500/10 text-red-400",
    green: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
    gray: "bg-gray-500/10 text-gray-400",
  };
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-500 text-sm">{label}</p>
        <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center", iconColors[color])}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-white text-2xl font-semibold">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1E1E2E]">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider py-3 px-4 first:pl-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1E1E2E]">{children}</tbody>
      </table>
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({
  label,
  error,
  ...props  // ← this spread passes data-testid through
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm text-gray-400">{label}</label>}
      <input
        {...props}  // ← data-testid is passed here
      className={clsx(
          "w-full bg-[#0A0A0F] border rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#E50914] transition-colors",
          error ? "border-red-500" : "border-[#1E1E2E] hover:border-[#2E2E3E]",
          props.className
        )}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm text-gray-400">{label}</label>}
      <select
        {...props}
        className={clsx(
          "w-full bg-[#0A0A0F] border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#E50914] transition-colors",
          error ? "border-red-500" : "border-[#1E1E2E] hover:border-[#2E2E3E]",
          props.className
        )}
      >
        {children}
      </select>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({
  label,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm text-gray-400">{label}</label>}
      <textarea
        {...props}
        className={clsx(
          "w-full bg-[#0A0A0F] border rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#E50914] resize-none transition-colors",
          error ? "border-red-500" : "border-[#1E1E2E] hover:border-[#2E2E3E]",
          props.className
        )}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "danger" | "ghost";

const BTN_STYLES: Record<BtnVariant, string> = {
  primary: "bg-[#E50914] hover:bg-[#C5070F] text-white",
  secondary: "bg-[#1E1E2E] hover:bg-[#2E2E3E] text-white",
  danger: "bg-red-600 hover:bg-red-500 text-white",
  ghost: "text-gray-400 hover:text-white hover:bg-[#1E1E2E]",
};

export function Button({
  variant = "primary",
  loading = false,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={clsx(
        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        BTN_STYLES[variant],
        className
      )}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────
export function Pagination({
  page,
  pages,
  total,
  onPageChange,
}: {
  page: number;
  pages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1E1E2E]">
      <p className="text-gray-500 text-sm">{total} total</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <span className="text-gray-500 text-sm px-2">
          {page} / {pages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
