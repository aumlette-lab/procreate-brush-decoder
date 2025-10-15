import { BooleanBadge } from "@/components/BooleanBadge";
import type { DecodedSetting } from "@/lib/decodeEngine";
import {
  formatDecodedValue,
  formatNotes,
  formatPath,
  formatRawValue,
  resolveDescriptor,
} from "@/lib/valueFormat";

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

  const booleanBadge =
    entry.data_type === "bool" ? <BooleanBadge value={decodedValue} dataType={entry.data_type} /> : null;
  const decodedFallback = decoded || "—";

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
        <td className="py-3 px-4 align-top break-all font-mono text-sm text-slate-900 dark:text-slate-100">
          {displayRaw || "—"}
        </td>
      ) : null}
      <td className="py-3 pl-4 pr-6 align-top break-words text-slate-900 dark:text-slate-100">
        {booleanBadge ? <div className="inline-flex items-center gap-2">{booleanBadge}</div> : decodedFallback}
        {decodedDescriptor ? (
          <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{decodedDescriptor}</div>
        ) : null}
      </td>
    </tr>
  );
}
