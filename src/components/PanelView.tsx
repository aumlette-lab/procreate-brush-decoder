import { SettingRow } from "@/components/SettingRow";
import type { DecodedSetting } from "@/lib/decodeEngine";

type PanelViewProps = {
  panel: string;
  settings: DecodedSetting[];
  showRaw: boolean;
  fileLabel?: string | null;
};

export function PanelView({ panel, settings, showRaw, fileLabel }: PanelViewProps) {
  if (!settings.length) return null;

  const heading = fileLabel?.trim() ? fileLabel : null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">{panel}</h2>
      </header>
      <div className="overflow-x-hidden">
        <table className="min-w-full table-fixed divide-y divide-slate-200 dark:divide-slate-700">
          <colgroup>
            <col style={{ width: showRaw ? "45%" : "50%" }} />
            {showRaw ? <col style={{ width: "20%" }} /> : null}
            <col style={{ width: showRaw ? "35%" : "50%" }} />
          </colgroup>
          <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="py-3 pl-6 pr-4">Setting</th>
              {showRaw ? (
                <th className="px-4 py-3 align-bottom">
                  <span className="block">Raw</span>
                  {heading ? (
                    <span className="mt-0.5 block text-[11px] font-normal text-slate-400 dark:text-slate-500">
                      {heading}
                    </span>
                  ) : null}
                </th>
              ) : null}
              <th className="py-3 pl-4 pr-6 align-bottom">
                <span className="block">Decoded</span>
                {heading ? (
                  <span className="mt-0.5 block text-[11px] font-normal text-slate-400 dark:text-slate-500">
                    {heading}
                  </span>
                ) : null}
              </th>
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
