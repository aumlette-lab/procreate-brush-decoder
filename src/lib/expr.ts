/* eslint-disable no-new-func */
const FN_MAP = {
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  abs: Math.abs,
  sqrt: Math.sqrt,
  clamp: (x: number, a: number, b: number) => Math.min(Math.max(x, a), b),
} as const;

type FnMap = typeof FN_MAP;

type Env = {
  raw: unknown;
};

function sanitizeExpression(expr: string): string {
  return expr.replace(/\^/g, "**");
}

export function safeEval(expr: string, env: Env): unknown {
  if (!expr || typeof expr !== "string") {
    return null;
  }

  try {
    const normalized = sanitizeExpression(expr);
    const argNames = ["raw", ...Object.keys(FN_MAP)] as (keyof Env | keyof FnMap)[];
    const argValues = [env.raw, ...Object.values(FN_MAP)] as unknown[];
    const body = '"use strict"; return (' + normalized + ");";
    const fn = new Function(...(argNames as string[]), body);
    return fn(...argValues);
  } catch (error) {
    console.error(`Failed to evaluate expression: ${expr}`, error);
    return null;
  }
}
