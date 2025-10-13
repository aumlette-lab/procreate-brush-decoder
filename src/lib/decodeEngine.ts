import { safeEval } from "@/lib/expr";
import { getValueFromPlist } from "@/lib/plist";
import type { MappingEntry } from "@/types/schema";

export type DecodedSetting = {
  entry: MappingEntry;
  rawValues: unknown[];
  decodedValue: unknown;
};

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
  const formula = entry.formula;

  if (formula && typeof formula === "object" && !Array.isArray(formula)) {
    const decoded = decodeWithMapping(formula, rawValues);
    return { entry, rawValues, decodedValue: decoded };
  }

  if (typeof formula === "string" && formula.trim().length > 0) {
    const decoded = decodeWithFormula(formula, rawValues);
    const fallback = rawValues.length === 1 ? rawValues[0] : rawValues;
    const value = decoded === null || decoded === undefined ? fallback : decoded;
    return { entry, rawValues, decodedValue: value };
  }

  const output = rawValues.length === 1 ? rawValues[0] : rawValues;
  return { entry, rawValues, decodedValue: output };
}

export function decodeEntries(entries: MappingEntry[], plist: unknown): DecodedSetting[] {
  return entries.map(entry => decodeSetting(entry, plist));
}
