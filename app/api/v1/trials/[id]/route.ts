import { audit } from "../../../../../server/audit";
import { requireAdmin } from "../../../../../server/auth";
import { one, run } from "../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok } from "../../../../../server/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request), { id } = await context.params, body = await jsonBody<{ status?: string; assignedTo?: string | null; note?: string }>(request), before = await one("SELECT * FROM trial_applications WHERE id=?", id);
    if (!before) throw new ApiError(404, "체험 신청을 찾을 수 없습니다.", "NOT_FOUND");
    const allowed = ["new", "contacted", "scheduled", "completed", "cancelled"], status = allowed.includes(body.status ?? "") ? body.status : "new";
    await run("UPDATE trial_applications SET status=?,assigned_to=?,note=COALESCE(?,note),updated_at=CURRENT_TIMESTAMP WHERE id=?", status, body.assignedTo ?? null, body.note?.trim() ?? null, id);
    const after = await one("SELECT * FROM trial_applications WHERE id=?", id); await audit(request, actor, "update", "trial_application", id, before, after); return ok({ application: after });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireAdmin(request), { id } = await context.params, before = await one("SELECT * FROM trial_applications WHERE id=?", id); if (!before) throw new ApiError(404, "체험 신청을 찾을 수 없습니다.", "NOT_FOUND"); await run("DELETE FROM trial_applications WHERE id=?", id); await audit(request, actor, "delete", "trial_application", id, before, null); return new Response(null, { status: 204 }); }
  catch (error) { return handleApiError(error); }
}
