"use client";

import { ChangeEvent, useState } from "react";
import { BrushDecoder } from "@/components/BrushDecoder";

function formatFileSize(bytes: number | null): string | null {
  if (bytes === null || !Number.isFinite(bytes)) return null;
  const units = ["bytes", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

type ParsedResponse =
  | { success: true; data: unknown }
  | { error: string };

export default function Page() {
  const [plistData, setPlistData] = useState<unknown | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function parseFile(file: File) {
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-plist", { method: "POST", body: fd });
      const json = (await res.json()) as ParsedResponse;
      if (!res.ok || !("success" in json)) {
        const message = "error" in json ? json.error : "Failed to parse file";
        throw new Error(message);
      }

      setPlistData(json.data);
      setFileName(file.name);
      setFileSize(file.size);
    } catch (err) {
      console.error(err);
      setPlistData(null);
      setFileName(null);
      setFileSize(null);
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    void parseFile(file);
    event.target.value = "";
  }

  function reset() {
    setPlistData(null);
    setFileName(null);
    setFileSize(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Procreate Brush Decoder</h1>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Upload a Procreate brush <code>.plist</code> or <code>.archive</code> file. The viewer renders panels and settings from the decoder schema, showing raw plist values alongside human-friendly decoded values.
          </p>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Select a brush file</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">Supports binary or XML plist exports from Procreate&apos;s Brush Studio (.archive).</p>
            </div>
            <label className="inline-flex items-center gap-3 rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
              <input
                type="file"
                accept=".plist,.archive,.json"
                className="hidden"
                onChange={handleFileChange}
              />
              <span>Choose file</span>
            </label>
          </div>

          {loading ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Parsing file...
            </div>
          ) : null}

          {fileName ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-900 dark:text-slate-100">{fileName}</span>
              {formatFileSize(fileSize) ? <span>({formatFileSize(fileSize)})</span> : null}
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-transparent bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Clear
              </button>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/40 dark:text-red-200">
              {error}
            </div>
          ) : null}
        </section>

        <BrushDecoder plist={plistData} />
      </div>
    </main>
  );
}
