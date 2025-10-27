import crypto from "crypto";
let counters: Record<string, number> = {};
export function pregenUuid(namespace: string): string {
  const n = (counters[namespace] = (counters[namespace] ?? 0) + 1);
  const hash = crypto.createHash("sha256").update(`${namespace}:${n}`).digest("hex");
  return [hash.slice(0,8),hash.slice(8,12),hash.slice(12,16),hash.slice(16,20),hash.slice(20,32)].join("-");
}