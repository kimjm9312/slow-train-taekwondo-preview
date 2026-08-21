import { audit } from "../../../../../server/audit";
import { hashPassword, requireAdmin } from "../../../../../server/auth";
import { many, one, run } from "../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../../server/http";
import { newId } from "../../../../../server/ids";

export async function GET(request: Request) {
  try { await requireAdmin(request); return ok({ users: await many("SELECT id,username,role,name,phone,status,created_at AS createdAt FROM users ORDER BY role DESC,created_at DESC") }); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try { const actor = await requireAdmin(request), body = await jsonBody<{ username?: string; password?: string; name?: string; phone?: string; role?: string }>(request), username = requiredText(body.username, "아이디"); if (await one("SELECT id FROM users WHERE username=?", username)) throw new ApiError(409, "이미 사용 중인 아이디입니다.", "DUPLICATE_USERNAME"); const id = newId("usr"), role = body.role === "admin" ? "admin" : "parent", name = requiredText(body.name, "이름"), phone = requiredText(body.phone, "연락처"); await run("INSERT INTO users(id,username,password_hash,role,name,phone) VALUES(?,?,?,?,?,?)", id, username, await hashPassword(requiredText(body.password, "비밀번호")), role, name, phone); await run("INSERT INTO notification_settings(user_id) VALUES(?)", id); await audit(request, actor, "create", "user", id, null, { username, role, name, phone }); return ok({ user: { id, username, role, name, phone, status: "active" } }, { status: 201 }); }
  catch (error) { return handleApiError(error); }
}
