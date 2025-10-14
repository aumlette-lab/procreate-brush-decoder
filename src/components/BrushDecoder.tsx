import { useMemo, useState } from "react";
import { ComparisonPanelView } from "@/components/ComparisonPanelView";
import { PanelView } from "@/components/PanelView";
import { Toolbar } from "@/components/Toolbar";
import schemaData from "@/data/procreate-brush-decoder-v1.7.json";
import { decodeEntries, type DecodedSetting } from "@/lib/decodeEngine";
import { normalisePlist } from "@/lib/plist";
import type { MappingEntry } from "@/types/schema";
import type { ComparisonSetting } from "@/components/ComparisonSettingRow";

const SCHEMA = schemaData as MappingEntry[];
const ALL_PANELS = "__all";

export type ActiveView = "A" | "B" | "compare";

type BrushDecoderProps = {
  plistA: unknown | null;
  plistB: unknown | null;
  activeView: ActiveView;
  labelA?: string | null;
  labelB?: string | null;
};

function getPanelNames(entries: MappingEntry[]): string[] {
  const seen = new Set<string>();
  for (const entry of entries) {
    seen.add(entry.panel);
  }
  return Array.from(seen);
}

function getViewLabel(view: ActiveView, labelA?: string | null, labelB?: string | null): string {
  if (view === "A") return labelA?.trim() || "File A";
  if (view === "B") return labelB?.trim() || "File B";
  return "Comparison";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => valuesEqual(item, b[index]));
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => valuesEqual(a[key], b[key]));
  }

  return false;
}

function arraysEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => valuesEqual(item, b[index]));
}

function buildComparisonDataset(a: DecodedSetting[], b: DecodedSetting[]): ComparisonSetting[] {
  return SCHEMA.map((entry, index) => {
    const entryA = a[index];
    const entryB = b[index];

    const rawValuesA = entryA ? entryA.rawValues : Array(entry.paths.length).fill(undefined);
    const rawValuesB = entryB ? entryB.rawValues : Array(entry.paths.length).fill(undefined);

    const decodedValueA = entryA ? entryA.decodedValue : undefined;
    const decodedValueB = entryB ? entryB.decodedValue : undefined;

    const rawDiff = !arraysEqual(rawValuesA, rawValuesB);
    const decodedDiff = !valuesEqual(decodedValueA, decodedValueB);
    const differs = rawDiff || decodedDiff;

    return {
      entry,
      rawValuesA,
      rawValuesB,
      decodedValueA,
      decodedValueB,
      rawDiff,
      decodedDiff,
      differs,
    };
  });
}

function groupByPanel(settings: DecodedSetting[]): Map<string, DecodedSetting[]> {
  const groups = new Map<string, DecodedSetting[]>();
  for (const item of settings) {
    const bucket = groups.get(item.entry.panel);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(item.entry.panel, [item]);
    }
  }
  return groups;
}

function groupComparisonByPanel(settings: ComparisonSetting[]): Map<string, ComparisonSetting[]> {
  const groups = new Map<string, ComparisonSetting[]>();
  for (const item of settings) {
    const bucket = groups.get(item.entry.panel);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(item.entry.panel, [item]);
    }
  }
  return groups;
}

export function BrushDecoder({ plistA, plistB, activeView, labelA, labelB }: BrushDecoderProps) {
  const [showRaw, setShowRaw] = useState(true);
  const [panelFilter, setPanelFilter] = useState<string>(ALL_PANELS);
  const [searchTerm, setSearchTerm] = useState("");

  const panelOptions = useMemo(() => getPanelNames(SCHEMA), []);

  const normalisedPlistA = useMemo(() => {
    if (!plistA) return null;
    return normalisePlist(plistA);
  }, [plistA]);

  const normalisedPlistB = useMemo(() => {
    if (!plistB) return null;
    return normalisePlist(plistB);
  }, [plistB]);

  const decodedA = useMemo(() => {
    if (!normalisedPlistA) return [];
    return decodeEntries(SCHEMA, normalisedPlistA);
  }, [normalisedPlistA]);

  const decodedB = useMemo(() => {
    if (!normalisedPlistB) return [];
    return decodeEntries(SCHEMA, normalisedPlistB);
  }, [normalisedPlistB]);

  const searchNeedle = searchTerm.trim().toLowerCase();

  const filteredSingle = useMemo(() => {
    const dataset = activeView === "A" ? decodedA : decodedB;
    if (activeView === "compare" || !dataset.length) return [];
    return dataset.filter(item => {
      const matchesPanel = panelFilter === ALL_PANELS || item.entry.panel === panelFilter;
      if (!matchesPanel) return false;
      if (!searchNeedle) return true;
      const haystack = [
        item.entry.setting,
        item.entry.panel,
        item.entry.notes ?? "",
        String(item.decodedValue ?? ""),
        ...item.entry.paths,
      ];
      return haystack.some(value => value.toLowerCase().includes(searchNeedle));
    });
  }, [activeView, decodedA, decodedB, panelFilter, searchNeedle]);

  const groupedSingle = useMemo(() => {
    if (!filteredSingle.length) return new Map<string, DecodedSetting[]>();
    return groupByPanel(filteredSingle);
  }, [filteredSingle]);

  const comparisonData = useMemo(() => {
    if (!decodedA.length || !decodedB.length) return [];
    return buildComparisonDataset(decodedA, decodedB);
  }, [decodedA, decodedB]);

  const filteredComparison = useMemo(() => {
    if (activeView !== "compare" || !comparisonData.length) return [];
    return comparisonData.filter(item => {
      if (!item.differs) return false;
      const matchesPanel = panelFilter === ALL_PANELS || item.entry.panel === panelFilter;
      if (!matchesPanel) return false;
      if (!searchNeedle) return true;
      const haystack = [
        item.entry.setting,
        item.entry.panel,
        item.entry.notes ?? "",
        String(item.decodedValueA ?? ""),
        String(item.decodedValueB ?? ""),
        ...item.entry.paths,
      ];
      return haystack.some(value => value.toLowerCase().includes(searchNeedle));
    });
  }, [activeView, comparisonData, panelFilter, searchNeedle]);

  const groupedComparison = useMemo(() => {
    if (!filteredComparison.length) return new Map<string, ComparisonSetting[]>();
    return groupComparisonByPanel(filteredComparison);
  }, [filteredComparison]);

  const visiblePanels =
    panelFilter === ALL_PANELS ? panelOptions : panelOptions.filter(panel => panel === panelFilter);

  const activeLabel = getViewLabel(activeView, labelA, labelB);

  const renderEmptyState = (message: string) => (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
      {message}
    </div>
  );

  const renderSingleView = () => {
    const hasSource = activeView === "A" ? !!plistA : !!plistB;
    if (!hasSource) {
      return renderEmptyState(`Upload ${activeLabel} to view decoded settings.`);
    }

    if (!filteredSingle.length) {
      return renderEmptyState("No settings match the current filters.");
    }

    return visiblePanels.map(panel => (
      <PanelView
        key={panel}
        panel={panel}
        settings={groupedSingle.get(panel) ?? []}
        showRaw={showRaw}
        fileLabel={activeLabel}
      />
    ));
  };

  const renderComparisonView = () => {
    if (!plistA || !plistB) {
      return renderEmptyState("Upload two brush files to compare their settings.");
    }

    if (!filteredComparison.length) {
      return renderEmptyState("No differences found for the current filters.");
    }

    return visiblePanels.map(panel => (
      <ComparisonPanelView
        key={panel}
        panel={panel}
        settings={groupedComparison.get(panel) ?? []}
        showRaw={showRaw}
        labelA={labelA}
        labelB={labelB}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <Toolbar
        panelOptions={panelOptions}
        selectedPanel={panelFilter}
        onPanelChange={setPanelFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showRaw={showRaw}
        onToggleRaw={setShowRaw}
      />

      {activeView === "compare" ? renderComparisonView() : renderSingleView()}
    </div>
  );
}
