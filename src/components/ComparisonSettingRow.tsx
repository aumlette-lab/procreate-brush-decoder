import { BooleanBadge } from "@/components/BooleanBadge";
import {
  formatDecodedValue,
  formatNotes,
  formatPath,
  formatRawValue,
  resolveDescriptor,
} from "@/lib/valueFormat";
import type { MappingEntry } from "@/types/schema";

export type ComparisonSetting = {
  entry: MappingEntry;
  rawValuesA: unknown[];
  rawValuesB: unknown[];
  decodedValueA: unknown;
  decodedValueB: unknown;
  rawDiff: boolean;
  decodedDiff: boolean;
  differs: boolean;
};

type ComparisonSettingRowProps = {
  data: ComparisonSetting;
  showRaw: boolean;
};

function buildRawLabel(values: unknown[]): unknown {
  return values.length === 1 ? values[0] : values;
}

export function ComparisonSettingRow({ data, showRaw }: ComparisonSettingRowProps) {
  const { entry, rawValuesA, rawValuesB, decodedValueA, decodedValueB, rawDiff, decodedDiff } = data;
  const noteText = formatNotes(entry.notes);

  const rawDisplayA = formatRawValue(buildRawLabel(rawValuesA));
  const rawDisplayB = formatRawValue(buildRawLabel(rawValuesB));

  const decodedDisplayA = formatDecodedValue(entry, decodedValueA);
  const decodedDisplayB = formatDecodedValue(entry, decodedValueB);

  const booleanBadgeA =
    entry.data_type === "bool" ? <BooleanBadge value={decodedValueA} dataType={entry.data_type} /> : null;
  const booleanBadgeB =
    entry.data_type === "bool" ? <BooleanBadge value={decodedValueB} dataType={entry.data_type} /> : null;

  const descriptorA = resolveDescriptor(entry.notes, decodedDisplayA);
  const descriptorB = resolveDescriptor(entry.notes, decodedDisplayB);

  const rawClassName = "font-mono text-sm text-slate-900 dark:text-slate-100";

  const decodedClassName = decodedDiff
    ? "text-slate-900 dark:text-slate-100"
    : "text-slate-600 dark:text-slate-300";

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
        <>
          <td className={`py-3 px-4 align-top break-all ${rawClassName}`}>{rawDisplayA || "—"}</td>
          <td className={`py-3 px-4 align-top break-all ${rawClassName}`}>{rawDisplayB || "—"}</td>
        </>
      ) : null}
      <td className={`py-3 px-4 align-top break-words ${decodedClassName}`}>
        {booleanBadgeA ? <div className="inline-flex items-center gap-2">{booleanBadgeA}</div> : decodedDisplayA || "—"}
        {descriptorA ? (
          <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{descriptorA}</div>
        ) : null}
      </td>
      <td className={`py-3 pl-4 pr-6 align-top break-words ${decodedClassName}`}>
        {booleanBadgeB ? <div className="inline-flex items-center gap-2">{booleanBadgeB}</div> : decodedDisplayB || "—"}
        {descriptorB ? (
          <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{descriptorB}</div>
        ) : null}
      </td>
    </tr>
  );
}
