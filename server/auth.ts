import { d1, one, run } from "./database";
import { ApiError } from "./http";
import { newId } from "./ids";

const COOKIE_NAME = "slowtrain_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();

export type AuthUser = {
  id: string;
  username: string;
  role: "parent" | "admin";
  name: string;
  phone: string;
  status: string;
  profileImageKey?: string | null;
};

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(size: number) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function sha256(value: string) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function hashPassword(password: string, salt = randomHex(16)) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 120_000 }, key, 256);
  return `${salt}:${bytesToHex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt] = stored.split(":");
  return (await hashPassword(password, salt)) === stored;
}

function cookieValue(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1) ?? null;
}

function requestToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  return cookieValue(request);
}

export async function currentUser(request: Request) {
  const token = requestToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  return one<AuthUser>(`SELECT u.id,u.username,u.role,u.name,u.phone,u.status,u.profile_image_key AS profileImageKey
    FROM auth_sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP AND u.status='active'`, tokenHash);
}

export async function requireUser(request: Request) {
  const user = await currentUser(request);
  if (!user) throw new ApiError(401, "로그인이 필요합니다.", "UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (user.role !== "admin") throw new ApiError(403, "관리자 권한이 필요합니다.", "FORBIDDEN");
  return user;
}

export async function createSession(userId: string) {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await run("INSERT INTO auth_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)", newId("ses"), userId, tokenHash, expiresAt);
  return { token, expiresAt };
}

export async function deleteSession(request: Request) {
  const token = requestToken(request);
  if (token) await run("DELETE FROM auth_sessions WHERE token_hash=?", await sha256(token));
}

export function sessionCookie(token: string, expiresAt: string) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function ownsChild(user: AuthUser, childId: string) {
  if (user.role === "admin") return true;
  return Boolean(await one("SELECT id FROM children WHERE id=? AND parent_id=? AND status='active'", childId, user.id));
}

export async function cleanupExpiredSessions() {
  await d1().prepare("DELETE FROM auth_sessions WHERE expires_at<=CURRENT_TIMESTAMP").run();
}
