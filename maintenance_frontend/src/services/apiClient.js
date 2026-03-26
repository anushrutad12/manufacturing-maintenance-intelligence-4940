/**
 * Lightweight fetch wrapper for REST APIs.
 * Uses REACT_APP_API_BASE_URL; falls back to same-origin if unset.
 */

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * PUBLIC_INTERFACE
 * @param {string} path API path, e.g. "/equipment"
 * @param {RequestInit & { query?: Record<string, string | number | boolean | undefined> }} options fetch options
 * @returns {Promise<any>} parsed JSON response
 */
export async function apiRequest(path, options = {}) {
  const baseUrl = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");
  const query = options.query || undefined;

  const url = new URL((baseUrl ? baseUrl : window.location.origin) + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined) return;
      url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";

  let body;
  try {
    body = contentType.includes("application/json") && text ? JSON.parse(text) : text;
  } catch (e) {
    body = text;
  }

  if (!res.ok) {
    const message =
      (body && body.detail && typeof body.detail === "string" && body.detail) ||
      (typeof body === "string" && body) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}
