import { ChangeEvent } from "react";

type ToolbarProps = {
  panelOptions: string[];
  selectedPanel: string;
  onPanelChange: (panel: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showRaw: boolean;
  onToggleRaw: (show: boolean) => void;
};

export function Toolbar({
  panelOptions,
  selectedPanel,
  onPanelChange,
  searchTerm,
  onSearchChange,
  showRaw,
  onToggleRaw,
}: ToolbarProps) {
  function handlePanelChange(event: ChangeEvent<HTMLSelectElement>) {
    onPanelChange(event.target.value);
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    onSearchChange(event.target.value);
  }

  function handleShowRawChange(event: ChangeEvent<HTMLInputElement>) {
    onToggleRaw(event.target.checked);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={showRaw}
          onChange={handleShowRawChange}
          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
        />
        Show raw values
      </label>
      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <span className="font-medium">Panel</span>
        <select
          value={selectedPanel}
          onChange={handlePanelChange}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="__all">All panels</option>
          {panelOptions.map(panel => (
            <option key={panel} value={panel}>
              {panel}
            </option>
          ))}
        </select>
      </div>
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="search"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search settings"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
    </div>
  );
}
