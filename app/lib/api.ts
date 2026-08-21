export class ApiClientError extends Error {
  constructor(message: string, public status: number, public code = "API_ERROR") {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
  const response = await fetch(path, { ...init, headers, credentials: "include" });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({})) as T & { error?: string; code?: string };
  if (!response.ok) throw new ApiClientError(data.error || "요청을 처리하지 못했습니다.", response.status, data.code);
  return data;
}

export function json(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}

export function mediaUrl(key?: string | null) {
  if (!key) return "";
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/api/v1/media/${encodeURIComponent(key)}`;
}

export function localIsoDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
