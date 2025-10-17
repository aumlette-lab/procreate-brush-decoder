"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { BrushDecoder, type ActiveView } from "@/components/BrushDecoder";

type Slot = "A" | "B";

type ParsedResponse =
  | { success: true; data: unknown }
  | { error: string };

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

export default function Page() {
  const [plistA, setPlistA] = useState<unknown | null>(null);
  const [nameA, setNameA] = useState<string | null>(null);
  const [sizeA, setSizeA] = useState<number | null>(null);
  const [errorA, setErrorA] = useState<string | null>(null);

  const [plistB, setPlistB] = useState<unknown | null>(null);
  const [nameB, setNameB] = useState<string | null>(null);
  const [sizeB, setSizeB] = useState<number | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  const [loadingSlot, setLoadingSlot] = useState<Slot | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("A");
  const [dragOverSlot, setDragOverSlot] = useState<Slot | null>(null);

  const hasFileA = useMemo(() => plistA !== null, [plistA]);
  const hasFileB = useMemo(() => plistB !== null, [plistB]);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const toolbarContainerRef = useRef<HTMLDivElement>(null);
  const [stickyContainerHeight, setStickyContainerHeight] = useState(0);
  const [isScrolledPastHeader, setIsScrolledPastHeader] = useState(false);

  useEffect(() => {
    const node = stickyContainerRef.current;
    if (!node) return;

    const updateHeight = () => {
      setStickyContainerHeight(node.offsetHeight);
    };

    updateHeight();

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => updateHeight());
      observer.observe(node);
    } else {
      window.addEventListener("resize", updateHeight);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener("resize", updateHeight);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 12;
      setIsScrolledPastHeader(prev => (prev === scrolled ? prev : scrolled));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  async function parseFile(file: File, slot: Slot) {
    setLoadingSlot(slot);
    if (slot === "A") {
      setErrorA(null);
    } else {
      setErrorB(null);
    }

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-plist", { method: "POST", body: fd });
      const json = (await res.json()) as ParsedResponse;
      if (!res.ok || !("success" in json)) {
        const message = "error" in json ? json.error : "Failed to parse file";
        throw new Error(message);
      }

      if (slot === "A") {
        setPlistA(json.data);
        setNameA(file.name);
        setSizeA(file.size);
        if (!hasFileB) {
          setActiveView("A");
        }
      } else {
        setPlistB(json.data);
        setNameB(file.name);
        setSizeB(file.size);
        if (!hasFileA) {
          setActiveView("B");
        }
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to parse file";
      if (slot === "A") {
        setPlistA(null);
        setNameA(null);
        setSizeA(null);
        setErrorA(message);
      } else {
        setPlistB(null);
        setNameB(null);
        setSizeB(null);
        setErrorB(message);
      }
    } finally {
      setLoadingSlot(current => (current === slot ? null : current));
    }
  }

  function handleFileChange(slot: Slot) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      void parseFile(file, slot);
      event.target.value = "";
    };
  }

  function handleDragEnter(slot: Slot) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
      if (dragOverSlot !== slot) {
        setDragOverSlot(slot);
      }
    };
  }

  function handleDragOver(slot: Slot) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    };
  }

  function handleDragLeave(slot: Slot) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const related = event.relatedTarget;
      if (related && event.currentTarget.contains(related as Node)) {
        return;
      }
      if (dragOverSlot === slot) {
        setDragOverSlot(null);
      }
    };
  }

  function handleDrop(slot: Slot) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragOverSlot(null);
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      void parseFile(file, slot);
    };
  }

  function clearSlot(slot: Slot) {
    const otherHasFile = slot === "A" ? hasFileB : hasFileA;

    if (slot === "A") {
      setPlistA(null);
      setNameA(null);
      setSizeA(null);
      setErrorA(null);
    } else {
      setPlistB(null);
      setNameB(null);
      setSizeB(null);
      setErrorB(null);
    }

    setActiveView(prev => {
      if (prev === "compare") {
        return otherHasFile ? (slot === "A" ? "B" : "A") : slot;
      }
      if (prev === slot) {
        return otherHasFile ? (slot === "A" ? "B" : "A") : slot;
      }
      return prev;
    });
  }

  function isButtonActive(target: ActiveView): boolean {
    return activeView === target;
  }

  function getButtonClasses(target: ActiveView, disabled: boolean): string {
    const base = "rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-500";
    if (disabled) {
      return `${base} cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500`;
    }
    if (isButtonActive(target)) {
      return `${base} border border-slate-900 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900`;
    }
    return `${base} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800`;
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-[110rem] flex-col gap-8 px-6 md:px-10 lg:px-16">
        <div
          ref={stickyContainerRef}
          className={`sticky top-0 z-30 border-b border-transparent bg-slate-100 transition-all duration-200 dark:border-transparent dark:bg-slate-950 ${
            isScrolledPastHeader
              ? "space-y-4 py-3"
              : "space-y-6 py-5"
          }`}
        >
          <header className="space-y-2">
            <h1 className="text-3xl font-medium text-slate-900 dark:text-slate-100">Procreate Brush Decoder</h1>
            <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Upload one or two Procreate brush files (<code>.archive</code> or <code>.plist</code>) to decode their settings.
              Switch between individual views or compare the brushes side by side to see what changed.
            </p>
          </header>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/40">
            <div className="grid gap-4 md:grid-cols-2">
            {(["A", "B"] as const).map(slot => {
              const hasFile = slot === "A" ? hasFileA : hasFileB;
              const name = slot === "A" ? nameA : nameB;
              const size = slot === "A" ? sizeA : sizeB;
              const error = slot === "A" ? errorA : errorB;
              const inputId = `brush-upload-${slot.toLowerCase()}`;
              const isLoading = loadingSlot === slot;

              return (
                <div
                  key={slot}
                  className={`flex h-full flex-col justify-between rounded-lg border p-4 transition
                  ${
                    dragOverSlot === slot
                      ? "border-slate-400 bg-slate-100 dark:border-slate-500 dark:bg-slate-800/60"
                      : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40"
                  }`}
                  onDragEnter={handleDragEnter(slot)}
                  onDragOver={handleDragOver(slot)}
                  onDragLeave={handleDragLeave(slot)}
                  onDrop={handleDrop(slot)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">File {slot}</p>
                        {hasFile ? (
                          <p className="text-sm text-slate-700 dark:text-slate-200">{name}</p>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400">No file selected</p>
                        )}
                        {hasFile && formatFileSize(size) ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Size: {formatFileSize(size)}</p>
                        ) : null}
                      </div>
                      {hasFile ? (
                        <button
                          type="button"
                          onClick={() => clearSlot(slot)}
                          className="rounded-md border border-transparent bg-red-100 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    {isLoading ? (
                      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        Parsing file…
                      </div>
                    ) : null}

                    {error ? (
                      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-600 dark:bg-red-900/40 dark:text-red-200">
                        {error}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <label
                      htmlFor={inputId}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <span>{hasFile ? "Replace file" : "Choose file"}</span>
                    </label>
                    <input
                      id={inputId}
                      type="file"
                      accept=".plist,.archive,.json"
                      className="hidden"
                      onChange={handleFileChange(slot)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Max file size: 10 MB per upload. Drag and drop files onto either card or use the picker.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveView("A")}
              disabled={!hasFileA}
              className={getButtonClasses("A", !hasFileA)}
            >
              View File A
            </button>
            <button
              type="button"
              onClick={() => setActiveView("B")}
              disabled={!hasFileB}
              className={getButtonClasses("B", !hasFileB)}
            >
              View File B
            </button>
            <button
              type="button"
              onClick={() => setActiveView("compare")}
              disabled={!hasFileA || !hasFileB}
              className={getButtonClasses("compare", !hasFileA || !hasFileB)}
            >
              Compare A &amp; B
            </button>
          </div>

          <div ref={toolbarContainerRef} className="mt-6" />
          </section>
        </div>

        <div className="mt-4">
          <BrushDecoder
            plistA={plistA}
            plistB={plistB}
            activeView={activeView}
            labelA={nameA}
            labelB={nameB}
            stickyOffset={stickyContainerHeight + 12}
            toolbarContainer={toolbarContainerRef.current}
          />
        </div>
      </div>
    </main>
  );
}
