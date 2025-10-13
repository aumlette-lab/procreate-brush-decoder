"use client";

import { useMemo, useState } from "react";
import { PanelView } from "@/components/PanelView";
import { Toolbar } from "@/components/Toolbar";
import schemaData from "@/data/procreate-brush-decoder-v1.7.json";
import { decodeEntries, type DecodedSetting } from "@/lib/decodeEngine";
import { normalisePlist } from "@/lib/plist";
import type { MappingEntry } from "@/types/schema";

const SCHEMA = schemaData as MappingEntry[];
const ALL_PANELS = "__all";

function getPanelNames(entries: MappingEntry[]): string[] {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!seen.has(entry.panel)) {
      seen.add(entry.panel);
    }
  }
  return Array.from(seen);
}

type BrushDecoderProps = {
  plist: unknown | null;
};

export function BrushDecoder({ plist }: BrushDecoderProps) {
  const [showRaw, setShowRaw] = useState(true);
  const [panelFilter, setPanelFilter] = useState<string>(ALL_PANELS);
  const [searchTerm, setSearchTerm] = useState("");

  const panelOptions = useMemo(() => getPanelNames(SCHEMA), []);

  const normalisedPlist = useMemo(() => {
    if (!plist) return null;
    return normalisePlist(plist);
  }, [plist]);

  const decoded = useMemo(() => {
    if (!normalisedPlist) return [];
    return decodeEntries(SCHEMA, normalisedPlist);
  }, [normalisedPlist]);

  const filtered = useMemo(() => {
    if (!decoded.length) return [];
    const term = searchTerm.trim().toLowerCase();
    return decoded.filter(item => {
      const matchesPanel = panelFilter === ALL_PANELS || item.entry.panel === panelFilter;
      if (!matchesPanel) return false;
      if (!term) return true;
      const haystack = [
        item.entry.setting,
        item.entry.panel,
        item.entry.notes ?? "",
        String(item.decodedValue ?? ""),
        ...item.entry.paths,
      ];
      return haystack.some(value => value.toLowerCase().includes(term));
    });
  }, [decoded, panelFilter, searchTerm]);

  const groupedByPanel = useMemo(() => {
    const groups = new Map<string, DecodedSetting[]>();
    for (const item of filtered) {
      const bucket = groups.get(item.entry.panel);
      if (bucket) {
        bucket.push(item);
      } else {
        groups.set(item.entry.panel, [item]);
      }
    }
    return groups;
  }, [filtered]);

  if (!plist) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
        Upload a Procreate brush <code>.plist</code> or <code>.archive</code> file to see decoded settings.
      </div>
    );
  }

  const visiblePanels =
    panelFilter === ALL_PANELS ? panelOptions : panelOptions.filter(panel => panel === panelFilter);
  const anyMatches = filtered.length > 0;

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

      {!anyMatches ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
          No settings match the current filters.
        </div>
      ) : (
        visiblePanels.map(panel => (
          <PanelView key={panel} panel={panel} settings={groupedByPanel.get(panel) ?? []} showRaw={showRaw} />
        ))
      )}
    </div>
  );
}
