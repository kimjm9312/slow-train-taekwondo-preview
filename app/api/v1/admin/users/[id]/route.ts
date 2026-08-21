import { audit } from "../../../../../../server/audit";
import { requireAdmin } from "../../../../../../server/auth";
import { one, run } from "../../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok } from "../../../../../../server/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireAdmin(request), { id } = await context.params, body = await jsonBody<{ role?: string; status?: string; name?: string; phone?: string }>(request), before = await one<Record<string, unknown>>("SELECT id,username,role,name,phone,status FROM users WHERE id=?", id); if (!before) throw new ApiError(404, "회원을 찾을 수 없습니다.", "NOT_FOUND"); if (id === "usr_admin" && (body.role === "parent" || body.status === "withdrawn")) throw new ApiError(400, "대표 관리자 권한은 제거할 수 없습니다.", "PROTECTED_ACCOUNT"); const role = body.role === "admin" ? "admin" : body.role === "parent" ? "parent" : before.role, status = ['active','suspended','withdrawn'].includes(String(body.status)) ? body.status : before.status, name = typeof body.name === "string" ? body.name.trim() : before.name, phone = typeof body.phone === "string" ? body.phone.trim() : before.phone; await run("UPDATE users SET role=?,status=?,name=?,phone=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", role, status, name, phone, id); const after = await one("SELECT id,username,role,name,phone,status FROM users WHERE id=?", id); await audit(request, actor, "update", "user", id, before, after); return ok({ user: after }); }
  catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireAdmin(request), { id } = await context.params; if (id === "usr_admin") throw new ApiError(400, "대표 관리자 계정은 삭제할 수 없습니다.", "PROTECTED_ACCOUNT"); const before = await one("SELECT id,username,role,name,phone,status FROM users WHERE id=?", id); if (!before) throw new ApiError(404, "회원을 찾을 수 없습니다.", "NOT_FOUND"); await run("UPDATE users SET status='withdrawn',updated_at=CURRENT_TIMESTAMP WHERE id=?", id); await run("DELETE FROM auth_sessions WHERE user_id=?", id); await audit(request, actor, "delete", "user", id, before, { status: "withdrawn" }); return ok({ success: true }); }
  catch (error) { return handleApiError(error); }
}
