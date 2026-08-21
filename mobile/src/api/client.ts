import * as SecureStore from "expo-secure-store";

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "slowtrain_session_token";

export async function setSessionToken(token: string) { await SecureStore.setItemAsync(TOKEN_KEY, token); }
export async function clearSessionToken() { await SecureStore.deleteItemAsync(TOKEN_KEY); }

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE) throw new Error("EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  const token = await SecureStore.getItemAsync(TOKEN_KEY), headers = new Headers(init.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "요청을 처리하지 못했습니다.");
  return body as T;
}

export function json(method: string, body?: unknown): RequestInit { return { method, body: body === undefined ? undefined : JSON.stringify(body) }; }
