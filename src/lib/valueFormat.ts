import type { MappingEntry } from "@/types/schema";

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2, useGrouping: false });
  }

  const precision =
    abs >= 1 ? 3 : abs >= 0.1 ? 4 : abs >= 0.01 ? 5 : Math.min(8, Math.ceil(-Math.log10(abs)) + 3);

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

export function formatValue(value: unknown): string {
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

export function formatRawValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatRawValue).join(", ");
  }
  return formatRawPrimitive(value);
}

function formatCurveCoordinate(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const fixed = value.toFixed(4);
  const trimmed = fixed.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, ".0");
  return trimmed;
}

function formatCurvePoint(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Array.isArray(value) && value.length === 2) {
    const [x, y] = value;
    if (typeof x === "number" && typeof y === "number") {
      return `{${formatCurveCoordinate(x)}, ${formatCurveCoordinate(y)}}`;
    }
  }
  if (typeof value === "object" && value !== null) {
    const maybeX = (value as Record<string, unknown>).x;
    const maybeY = (value as Record<string, unknown>).y;
    if (typeof maybeX === "number" && typeof maybeY === "number") {
      return `{${formatCurveCoordinate(maybeX)}, ${formatCurveCoordinate(maybeY)}}`;
    }
  }
  return formatValue(value);
}

function formatCurveValue(value: unknown): string {
  if (!Array.isArray(value)) {
    return formatValue(value);
  }
  return value.map(item => formatCurvePoint(item)).join(", ");
}

function deriveUnit(entry: MappingEntry): string | null {
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

function notesIndicateDegrees(notes: string | null | undefined): boolean {
  if (!notes) return false;
  return /degree/i.test(notes);
}

export function formatDecodedValue(entry: MappingEntry, value: unknown): string {
  let rendered = entry.data_type === "curve" ? formatCurveValue(value) : formatValue(value);
  const unit = deriveUnit(entry);
  if (unit && rendered) {
    rendered = unit.trim() === "%" ? `${rendered}${unit}` : `${rendered} ${unit}`;
  }
  if (!unit && rendered && notesIndicateDegrees(entry.notes) && !rendered.trim().endsWith("°")) {
    rendered = `${rendered}°`;
  }
  return rendered;
}

export function formatNotes(value: unknown): string | null {
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

export function formatPath(value: unknown): string {
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

export function resolveDescriptor(notes: unknown, decodedDisplay: string | null): string | null {
  if (!decodedDisplay) return null;
  const map = parseDescriptorMap(notes);
  if (!Object.keys(map).length) return null;
  const normalized = normalizeComparisonValue(decodedDisplay);
  return map[normalized] ?? null;
}
