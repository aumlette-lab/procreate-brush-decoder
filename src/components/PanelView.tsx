import { SettingRow } from "@/components/SettingRow";
import type { DecodedSetting } from "@/lib/decodeEngine";

type PanelViewProps = {
  panel: string;
  settings: DecodedSetting[];
  showRaw: boolean;
};

export function PanelView({ panel, settings, showRaw }: PanelViewProps) {
  if (!settings.length) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{panel}</h2>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-slate-200 dark:divide-slate-700">
          <colgroup>
            <col className="w-1/2" />
            {showRaw ? <col className="w-1/4" /> : null}
            <col className={showRaw ? "w-1/4" : "w-1/2"} />
          </colgroup>
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="py-3 pl-6 pr-4">Setting</th>
              {showRaw ? <th className="px-4 py-3">Raw</th> : null}
              <th className="py-3 pl-4 pr-6">Decoded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm dark:divide-slate-800 dark:bg-slate-900">
            {settings.map(setting => (
              <SettingRow key={`${setting.entry.panel}-${setting.entry.setting}`} data={setting} showRaw={showRaw} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
