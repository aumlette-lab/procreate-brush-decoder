export function coerceBooleanDisplay(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (Number.isNaN(value)) return null;
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if (["true", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["false", "no", "off", "disabled"].includes(normalized)) return false;
    const numeric = Number(normalized);
    if (!Number.isNaN(numeric)) {
      return numeric !== 0;
    }
  }
  return null;
}

type BooleanBadgeProps = {
  value: boolean;
};

export function BooleanBadge({ value }: BooleanBadgeProps) {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide";

  const stateClasses = value
    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-300"
    : "border-slate-300 bg-slate-200 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return <span className={`${baseClasses} ${stateClasses}`}>{value ? "Enabled" : "Disabled"}</span>;
}
