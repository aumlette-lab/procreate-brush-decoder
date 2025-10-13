import type { DecodedSetting } from "@/lib/decodeEngine";

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1000 || abs < 0.01) {
    return value.toExponential(3);
  }
  const decimals = abs >= 10 ? 2 : abs >= 1 ? 3 : 4;
  return Number(value.toFixed(decimals)).toString();
}

function formatPrimitive(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatValue).join(", ");
  }
  return formatPrimitive(value);
}

function deriveUnit(entry: DecodedSetting["entry"]): string | null {
  const { gui_values: guiValues } = entry;
  if (!guiValues || typeof guiValues !== "object") return null;
  if (Array.isArray(guiValues)) return null;
  if ("unit" in guiValues && typeof guiValues.unit === "string") {
    return guiValues.unit;
  }
  return null;
}

function formatDecodedValue(entry: DecodedSetting["entry"], value: unknown): string {
  const rendered = formatValue(value);
  const unit = deriveUnit(entry);
  if (!unit) return rendered;
  if (!rendered) return rendered;
  return unit.trim() === "%" ? `${rendered}${unit}` : `${rendered} ${unit}`;
}

type SettingRowProps = {
  data: DecodedSetting;
  showRaw: boolean;
};

export function SettingRow({ data, showRaw }: SettingRowProps) {
  const { entry, rawValues, decodedValue } = data;
  const rawLabel = rawValues.length === 1 ? rawValues[0] : rawValues;

  const displayRaw = formatValue(rawLabel);
  const decoded = formatDecodedValue(entry, decodedValue);

  return (
    <tr className="border-b border-slate-200 last:border-transparent">
      <td className="py-3 pr-4 align-top">
        <div className="font-medium text-slate-900 dark:text-slate-100">{entry.setting}</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          {entry.paths.map(path => (
            <span key={path} className="block font-mono">{path}</span>
          ))}
          {entry.notes ? <p className="leading-snug">{entry.notes}</p> : null}
        </div>
      </td>
      {showRaw ? (
        <td className="py-3 px-4 align-top font-mono text-sm text-slate-700 dark:text-slate-200">
          {displayRaw || "—"}
        </td>
      ) : null}
      <td className="py-3 pl-4 align-top font-semibold text-slate-900 dark:text-slate-100">
        {decoded || "—"}
      </td>
    </tr>
  );
}
