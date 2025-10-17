import { safeEval } from "@/lib/expr";
import { getValueFromPlist } from "@/lib/plist";
import type { MappingEntry } from "@/types/schema";

export type DecodedSetting = {
  entry: MappingEntry;
  rawValues: unknown[];
  decodedValue: unknown;
};

const EXTENDED_BLEND_KEY_PAIRS = new Set([
  "$top.root.grainBlendMode::$top.root.grainBlendModeExtended",
  "$top.root.blendMode::$top.root.extendedBlend2",
  "$top.root.burntEdgesBlendMode::$top.root.burntEdgesBlendModeExtended",
  "$top.root.dualBlendMode::$top.root.dualBlendModeExtended",
]);

function deriveExtendedBlendValue(base: number): number {
  if (base === 19) return 34;
  if (base === 25) return 0;
  return base;
}

function normalizeDefaultValue(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(item => normalizeDefaultValue(item));
  }
  if (input && typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>).map(([key, val]) => [
      key,
      normalizeDefaultValue(val),
    ]);
    return Object.fromEntries(entries);
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed.length) return input;
    if (trimmed === "$undefined") return undefined;
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed === "null") return null;
    if (!Number.isNaN(Number(trimmed))) return Number(trimmed);
  }
  return input;
}

function parseDefaultValue(value: MappingEntry["default"]): unknown {
  if (typeof value !== "string") return normalizeDefaultValue(value);
  const trimmed = value.trim();
  if (!trimmed.length) return value;
  if (trimmed === "$undefined") return undefined;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (!Number.isNaN(Number(trimmed))) return Number(trimmed);
  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];
  if ((firstChar === "[" && lastChar === "]") || (firstChar === "{" && lastChar === "}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeDefaultValue(parsed);
    } catch {
      return value;
    }
  }
  return value;
}

function matchesPattern(pattern: (boolean | number | null)[], rawValues: unknown[]): boolean {
  if (pattern.length !== rawValues.length) return false;
  return pattern.every((expected, index) => {
    if (expected === null) return true;
    const actual = rawValues[index];
    if (typeof expected === "boolean" && typeof actual === "number") {
      return (actual !== 0) === expected;
    }
    if (typeof expected === "number" && typeof actual === "boolean") {
      return (expected !== 0) === actual;
    }
    return actual === expected;
  });
}

function decodeWithMapping(
  mapping: Record<string, (boolean | number | null)[]>,
  rawValues: unknown[],
): unknown {
  for (const [label, pattern] of Object.entries(mapping)) {
    if (!Array.isArray(pattern)) continue;
    if (matchesPattern(pattern, rawValues)) {
      return label;
    }
  }
  return rawValues.length === 1 ? rawValues[0] : rawValues;
}

function decodeWithFormula(formula: string, rawValues: unknown[]): unknown {
  const envRaw = rawValues.length === 1 ? rawValues[0] : rawValues;
  return safeEval(formula, { raw: envRaw });
}

export function decodeSetting(entry: MappingEntry, plist: unknown): DecodedSetting {
  const rawValues = entry.paths.map(path => getValueFromPlist(plist, path));

  if (entry.paths.length >= 2) {
    const pairKey = `${entry.paths[0]}::${entry.paths[1]}`;
    if (EXTENDED_BLEND_KEY_PAIRS.has(pairKey)) {
      const baseValue = rawValues[0];
      if (typeof baseValue === "number" && rawValues[1] === undefined) {
        rawValues[1] = deriveExtendedBlendValue(baseValue);
      }
    }
  }
  const defaultValue = parseDefaultValue(entry.default);
  const effectiveRawValues = rawValues.map((value, index) => {
    if (value !== undefined) return value;
    if (Array.isArray(defaultValue)) {
      return defaultValue[index];
    }
    return defaultValue;
  });
  const formula = entry.formula;

  if (formula && typeof formula === "object" && !Array.isArray(formula)) {
    const decoded = decodeWithMapping(formula, effectiveRawValues);
    return { entry, rawValues, decodedValue: decoded };
  }

  if (typeof formula === "string" && formula.trim().length > 0) {
    const decoded = decodeWithFormula(formula, effectiveRawValues);
    const fallback = effectiveRawValues.length === 1 ? effectiveRawValues[0] : effectiveRawValues;
    const value = decoded === null || decoded === undefined ? fallback : decoded;
    return { entry, rawValues, decodedValue: value };
  }

  const output = effectiveRawValues.length === 1 ? effectiveRawValues[0] : effectiveRawValues;
  return { entry, rawValues, decodedValue: output };
}

export function decodeEntries(entries: MappingEntry[], plist: unknown): DecodedSetting[] {
  return entries.map(entry => decodeSetting(entry, plist));
}
