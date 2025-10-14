import { isKeyedArchive, resolveArchiveTop } from "@/lib/utils";

type KeyedArchive = {
  $objects?: unknown[];
  $top?: Record<string, unknown>;
};

function tokenizePath(path: string): string[] {
  const segments: string[] = [];
  let current = "";
  let bracketDepth = 0;

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === "\\") {
      const next = path[i + 1];
      if (next !== undefined) {
        current += next;
        i++;
        continue;
      }
      current += char;
      continue;
    }

    if (char === "[") {
      bracketDepth++;
      current += char;
      continue;
    }

    if (char === "]") {
      bracketDepth = Math.max(bracketDepth - 1, 0);
      current += char;
      continue;
    }

    if (char === "." && bracketDepth === 0) {
      if (current.length > 0) {
        segments.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    segments.push(current);
  }

  return segments;
}

function ensureLookupRoot(root: unknown): unknown {
  if (isKeyedArchive(root)) {
    return resolveArchiveTop(root as KeyedArchive);
  }
  return root;
}

export function normalisePlist(input: unknown): unknown {
  return ensureLookupRoot(input);
}

export function getValueFromPlist(root: unknown, path: unknown): unknown {
  if (typeof path !== "string" || path.length === 0) {
    return undefined;
  }

  const lookupRoot = ensureLookupRoot(root);
  const startsWithTop = path.startsWith("$top");
  const clean = path.replace(/^\$top\.*/, "");
  const segments = clean ? tokenizePath(clean) : [];
  let current: any = startsWithTop ? lookupRoot : ensureLookupRoot(root);

  for (const segment of segments) {
    if (!segment) continue;
    const match = segment.match(/(.+?)\[(\d+)\]$/);
    if (match) {
      const [, key, indexStr] = match;
      const index = Number(indexStr);
      current = current?.[key]?.[index];
    } else {
      current = current?.[segment];
    }
    if (current === undefined || current === null) {
      break;
    }
  }

  return current;
}
