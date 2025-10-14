import type { DecodedSetting } from "@/lib/decodeEngine";

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2, useGrouping: false });
  }

  const precision = abs >= 1
    ? 3
    : abs >= 0.1
      ? 4
      : abs >= 0.01
        ? 5
        : Math.min(8, Math.ceil(-Math.log10(abs)) + 3);

  const formatted = value.toFixed(precision);
  return formatted.replace(/\.?0+$/, "") || "0";
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

function formatRawNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return value.toString();
}

function formatRawPrimitive(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return formatRawNumber(value);
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatRawValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatRawValue).join(", ");
  }
  return formatRawPrimitive(value);
}

function deriveUnit(entry: DecodedSetting["entry"]): string | null {
  const { gui_values: guiValues } = entry;
  if (!guiValues) return null;

  if (typeof guiValues === "object" && !Array.isArray(guiValues)) {
    if ("unit" in guiValues && typeof guiValues.unit === "string") {
      return guiValues.unit;
    }
    return null;
  }

  const containsPercent = (value: unknown): boolean =>
    typeof value === "string" && value.includes("%");

  if (typeof guiValues === "string") {
    return containsPercent(guiValues) ? "%" : null;
  }

  if (Array.isArray(guiValues)) {
    return guiValues.some(containsPercent) ? "%" : null;
  }

  if (typeof guiValues === "number") {
    return null;
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

function formatNotes(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(item => formatPrimitive(item)).join("; ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return formatPrimitive(value);
}

function formatPath(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(formatPath).join(", ");
  }
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return formatPrimitive(value);
}

function normalizeComparisonValue(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function parseDescriptorMap(notes: unknown): Record<string, string> {
  if (typeof notes !== "string") return {};

  const entries = notes
    .split(/[,;]\s*/)
    .map(item => item.trim())
    .filter(Boolean);

  const map: Record<string, string> = {};

  for (const entry of entries) {
    const match = entry.match(/^([+-]?\d+(?:\.\d+)?%?)\s*=\s*(.+)$/i);
    if (!match) continue;
    const [, value, label] = match;
    const normalized = normalizeComparisonValue(value);
    if (!map[normalized]) {
      map[normalized] = label.trim();
    }
    if (!value.includes("%")) {
      const percentKey = normalizeComparisonValue(`${value}%`);
      if (!map[percentKey]) {
        map[percentKey] = label.trim();
      }
    }
  }

  return map;
}

function resolveDescriptor(notes: unknown, decodedDisplay: string | null): string | null {
  if (!decodedDisplay) return null;
  const map = parseDescriptorMap(notes);
  if (!Object.keys(map).length) return null;
  const normalized = normalizeComparisonValue(decodedDisplay);
  return map[normalized] ?? null;
}

type SettingRowProps = {
  data: DecodedSetting;
  showRaw: boolean;
};

export function SettingRow({ data, showRaw }: SettingRowProps) {
  const { entry, rawValues, decodedValue } = data;
  const rawLabel = rawValues.length === 1 ? rawValues[0] : rawValues;

  const displayRaw = formatRawValue(rawLabel);
  const decoded = formatDecodedValue(entry, decodedValue);
  const noteText = formatNotes(entry.notes);
  const decodedDescriptor = resolveDescriptor(entry.notes, decoded);

  return (
    <tr className="border-b border-slate-200 last:border-transparent">
      <td className="py-3 pl-6 pr-4 align-top">
        <div className="font-medium text-slate-900 dark:text-slate-100">{entry.setting}</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          {entry.paths.map((path, index) => {
            const label = formatPath(path);
            return (
              <span key={`${label}-${index}`} className="block font-mono">
                {label}
              </span>
            );
          })}
          {noteText ? <p className="leading-snug">{noteText}</p> : null}
        </div>
      </td>
      {showRaw ? (
        <td className="py-3 px-4 align-top font-mono text-sm text-slate-700 dark:text-slate-200">
          {displayRaw || "—"}
        </td>
      ) : null}
      <td className="py-3 pl-4 pr-6 align-top font-semibold text-slate-900 dark:text-slate-100">
        {decoded || "—"}
        {decodedDescriptor ? (
          <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{decodedDescriptor}</div>
        ) : null}
      </td>
    </tr>
  );
}
