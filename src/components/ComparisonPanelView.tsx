import { ComparisonSetting, ComparisonSettingRow } from "@/components/ComparisonSettingRow";

type ComparisonPanelViewProps = {
  panel: string;
  settings: ComparisonSetting[];
  showRaw: boolean;
  labelA?: string | null;
  labelB?: string | null;
};

export function ComparisonPanelView({ panel, settings, showRaw, labelA, labelB }: ComparisonPanelViewProps) {
  if (!settings.length) return null;

  const headingA = labelA?.trim() ? labelA : "File A";
  const headingB = labelB?.trim() ? labelB : "File B";

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">{panel}</h2>
      </header>
      <div className="overflow-x-hidden">
        <table className="min-w-full table-fixed divide-y divide-slate-200 dark:divide-slate-700">
          <colgroup>
            <col style={{ width: showRaw ? "26%" : "30%" }} />
            <col style={{ width: showRaw ? "10%" : "12%" }} />
            {showRaw ? (
              <>
                <col style={{ width: "16%" }} />
                <col style={{ width: "16%" }} />
              </>
            ) : null}
            <col style={{ width: showRaw ? "16%" : "23%" }} />
            <col style={{ width: showRaw ? "16%" : "23%" }} />
          </colgroup>
          <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="py-3 pl-6 pr-4">Setting</th>
              <th className="px-4 py-3">Status</th>
              {showRaw ? (
                <>
                  <th className="px-4 py-3 align-bottom">
                    <span className="block">Raw</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-slate-400 dark:text-slate-500">
                      {headingA}
                    </span>
                  </th>
                  <th className="px-4 py-3 align-bottom">
                    <span className="block">Raw</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-slate-400 dark:text-slate-500">
                      {headingB}
                    </span>
                  </th>
                </>
              ) : null}
              <th className="px-4 py-3 align-bottom">
                <span className="block">Decoded</span>
                <span className="mt-0.5 block text-[11px] font-normal text-slate-400 dark:text-slate-500">
                  {headingA}
                </span>
              </th>
              <th className="py-3 pl-4 pr-6 align-bottom">
                <span className="block">Decoded</span>
                <span className="mt-0.5 block text-[11px] font-normal text-slate-400 dark:text-slate-500">
                  {headingB}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm dark:divide-slate-800 dark:bg-slate-900">
            {settings.map(setting => (
              <ComparisonSettingRow key={`${setting.entry.panel}-${setting.entry.setting}`} data={setting} showRaw={showRaw} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
