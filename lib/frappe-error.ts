// Shared parser for Frappe error responses.

/** Frappe puts frappe.throw() text in _server_messages; fall back to exception. */
export function frappeErrorMessage(body: unknown, fallback: string): string {
  const data = (body || {}) as Record<string, unknown>;
  try {
    if (typeof data._server_messages === "string") {
      const messages = (JSON.parse(data._server_messages) as string[])
        .map((raw) => {
          try {
            return String((JSON.parse(raw) as { message?: string }).message ?? raw);
          } catch {
            return raw;
          }
        })
        .map((m) => m.replace(/<[^>]*>/g, "").trim())
        .filter(Boolean);
      if (messages.length) return messages.join("\n");
    }
  } catch {
    /* fall through */
  }
  if (typeof data.exception === "string") {
    return data.exception.replace(/^[\w.]+:\s*/, "");
  }
  return fallback;
}
