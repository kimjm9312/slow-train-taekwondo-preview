import { audit } from "../../../../../server/audit";
import { requireAdmin } from "../../../../../server/auth";
import { one, run } from "../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok } from "../../../../../server/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireAdmin(request), { id } = await context.params, body = await jsonBody<{ status?: "available" | "revoked"; expiresAt?: string }>(request), before = await one("SELECT * FROM makeup_tickets WHERE id=?", id); if (!before) throw new ApiError(404, "보강권을 찾을 수 없습니다.", "NOT_FOUND"); const status = body.status === "available" ? "available" : "revoked"; await run("UPDATE makeup_tickets SET status=?,expires_at=COALESCE(?,expires_at),updated_at=CURRENT_TIMESTAMP WHERE id=?", status, body.expiresAt ?? null, id); const after = await one("SELECT * FROM makeup_tickets WHERE id=?", id); await audit(request, actor, "update", "makeup_ticket", id, before, after); return ok({ ticket: after }); }
  catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireAdmin(request), { id } = await context.params, before = await one("SELECT * FROM makeup_tickets WHERE id=?", id); if (!before) throw new ApiError(404, "보강권을 찾을 수 없습니다.", "NOT_FOUND"); await run("DELETE FROM makeup_tickets WHERE id=? AND status NOT IN ('used','reserved')", id); await audit(request, actor, "delete", "makeup_ticket", id, before, null); return new Response(null, { status: 204 }); }
  catch (error) { return handleApiError(error); }
}
