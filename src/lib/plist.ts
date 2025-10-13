import { isKeyedArchive, resolveArchiveTop } from "@/lib/utils";

type KeyedArchive = {
  $objects?: unknown[];
  $top?: Record<string, unknown>;
};

function ensureLookupRoot(root: unknown): unknown {
  if (isKeyedArchive(root)) {
    return resolveArchiveTop(root as KeyedArchive);
  }
  return root;
}

export function normalisePlist(input: unknown): unknown {
  return ensureLookupRoot(input);
}

export function getValueFromPlist(root: unknown, path: string): unknown {
  if (!path) return undefined;

  const lookupRoot = ensureLookupRoot(root);
  const startsWithTop = path.startsWith("$top");
  const clean = path.replace(/^\$top\.*/, "");
  const segments = clean ? clean.split(".") : [];
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
