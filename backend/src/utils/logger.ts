export function redact(url: string): string {
  try {
    const u = new URL(url);
    if (u.searchParams.has("X-Amz-Signature")) {
      u.search = "";
    }
    return u.toString();
  } catch { return url; }
}